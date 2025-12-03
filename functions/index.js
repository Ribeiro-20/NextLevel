const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');
// CORS helper to allow requests from the dev frontend (Vite)
const cors = require('cors')({ origin: true });

admin.initializeApp();
// Prefer Firebase functions config for secrets, fall back to process.env
const stripeSecret = (functions.config && functions.config().stripe && functions.config().stripe.secret) || process.env.STRIPE_SECRET_KEY;
const stripe = Stripe(stripeSecret);
// Read success/cancel URLs from functions config when available. Provide safe localhost
// defaults for local development when not configured.
const successUrl = (functions.config && functions.config().app && functions.config().app.success_url) || process.env.SUCCESS_URL || 'http://localhost:5173/success';
const cancelUrl = (functions.config && functions.config().app && functions.config().app.cancel_url) || process.env.CANCEL_URL || 'http://localhost:5173/';

// Create a Checkout Session
exports.createCheckoutSession = functions.https.onRequest((req, res) => {
  // Allow CORS preflight and requests from the dev server (and others)
  cors(req, res, async () => {
    try {
      // Only accept POST
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

      const { items, email } = req.body || {};
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Invalid items' });
      }

      const line_items = items.map(item => {
        // Build price_data with optional product image if provided
        const priceData = {
          currency: 'eur',
          product_data: { name: item.name },
        };

        // Add image if present (Stripe expects absolute URLs). Prefer `image`, then `images[0]`.
        const imageUrl = item.image || (item.images && item.images[0]);
        if (imageUrl) priceData.product_data.images = [imageUrl];

        // Ensure unit amount is integer cents and at least 1 (Stripe requires > 0)
        priceData.unit_amount = Math.max(1, Math.round((Number(item.price) || 0) * 100));

        return {
          price_data: priceData,
          quantity: item.quantity || 1,
        };
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: email,
        line_items,
        mode: 'payment',
        success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: cancelUrl,
      });

      // Explicit CORS header for older clients
      res.set('Access-Control-Allow-Origin', '*');
      res.json({ id: session.id });
    } catch (error) {
      console.error('createCheckoutSession error:', error);
      res.set('Access-Control-Allow-Origin', '*');
      res.status(500).json({ error: error.message });
    }
  });
});

// Webhook handler
exports.stripeWebhook = functions.https.onRequest((req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  const webhookSecret = (functions.config && functions.config().stripe && functions.config().stripe.webhook) || process.env.STRIPE_WEBHOOK_SECRET;

  try {
    if (webhookSecret) {
      // Verify signature when secret is available
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } else {
      // No webhook secret configured (dev). Fallback: trust the parsed body but log a warning.
      console.warn('No Stripe webhook secret configured; falling back to trusting request body (development only).');
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed.', err && err.message ? err.message : err);
    // If verification fails and we don't have a secret, attempt to proceed with body (dev), otherwise return 400
    if (!webhookSecret) {
      console.warn('Proceeding with unverified webhook payload because no webhook secret is configured.');
      event = req.body;
    } else {
      return res.status(400).send(`Webhook Error: ${err && err.message ? err.message : err}`);
    }
  }

  try {
    const eventType = event.type || (event && event.type) || 'unknown';
    const eventId = event.id || (event && event.id) || 'no-id';
    console.log(`Received Stripe webhook: id=${eventId} type=${eventType}`);

    if (eventType === 'checkout.session.completed') {
      const session = event.data ? event.data.object : event;
      const order = {
        customer_email: session.customer_email,
        amount_total: session.amount_total,
        payment_status: session.payment_status,
        created: admin.firestore.FieldValue.serverTimestamp(),
      };
      admin.firestore().collection('orders').doc(session.id).set(order).then(() => {
        console.log('Order persisted for session', session.id);
      }).catch(err => console.error('Error persisting order:', err));
    } else {
      console.log('Webhook event ignored (type):', eventType);
    }
  } catch (procErr) {
    console.error('Error processing webhook event:', procErr);
    // Return 200 to prevent retries only in development fallback mode; otherwise return 500 so Stripe will retry.
    if (!webhookSecret) {
      console.warn('Returning 200 despite processing error because no webhook secret is configured (dev).');
      return res.json({ received: true });
    }
    return res.status(500).send('Internal webhook handler error');
  }

  res.json({ received: true });
});
