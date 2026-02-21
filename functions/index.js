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

// Helper to provide a server timestamp in a way that's tolerant to SDK differences
function getServerTimestamp() {
  try {
    if (admin && admin.firestore) {
      if (admin.firestore.FieldValue && typeof admin.firestore.FieldValue.serverTimestamp === 'function') {
        return admin.firestore.FieldValue.serverTimestamp();
      }
      if (admin.firestore.Timestamp && typeof admin.firestore.Timestamp.now === 'function') {
        return admin.firestore.Timestamp.now();
      }
    }
  } catch (e) {
    // ignore and fall through
  }
  return new Date();
}

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

        // If originalPrice/promo_percent is provided (promotion), include it in metadata for later reference
        if (item.originalPrice != null) {
          priceData.product_data.metadata = priceData.product_data.metadata || {};
          priceData.product_data.metadata.original_price = String(item.originalPrice);
        }
        if (item.promo_percent != null) {
          priceData.product_data.metadata = priceData.product_data.metadata || {};
          priceData.product_data.metadata.promo_percent = String(item.promo_percent);
        }
        // include product id so webhook can identify purchased items
        if (item.id != null) {
          priceData.product_data.metadata = priceData.product_data.metadata || {};
          priceData.product_data.metadata.product_id = String(item.id);
        }

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
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
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
      // Ensure we have expanded line items (so product metadata is available)
      const rawSession = event.data ? event.data.object : event;
      let session = rawSession;
      try {
        session = await stripe.checkout.sessions.retrieve(rawSession.id || rawSession.session_id || rawSession, { expand: ['line_items.data.price.product'] });
      } catch (e) {
        console.warn('Could not expand session line_items, falling back to raw event object', e && e.message ? e.message : e);
        session = rawSession;
      }

      // Build a simplified line_items array for easier display/storage
      const simplifiedItems = [];
      try {
        if (session.line_items && session.line_items.data) {
          session.line_items.data.forEach(li => {
            const price = li.price || {};
            const prod = price.product || {};
            const metadata = prod.metadata || {};
            simplifiedItems.push({
              product_id: metadata.product_id || null,
              name: prod.name || li.description || price.nickname || 'Item',
              quantity: li.quantity || 1,
              unit_amount: price.unit_amount || li.amount_subtotal || null,
              currency: price.currency || 'eur',
              original_price: metadata.original_price ? Number(metadata.original_price) : null,
              promo_percent: metadata.promo_percent ? Number(metadata.promo_percent) : null,
            });
          });
        }
      } catch (siErr) {
        console.warn('Failed to build simplifiedItems:', siErr);
      }

      const order = {
        customer_email: session.customer_email || (session.customer_details && session.customer_details.email) || null,
        amount_total: session.amount_total,
        payment_status: session.payment_status,
        created: getServerTimestamp(),
        line_items: simplifiedItems,
      };

      try {
        await admin.firestore().collection('orders').doc(session.id).set(order);
        console.log('Order persisted for session', session.id);

        // Remove purchased items from the buyer's cart if we can identify the user
        try {
          const email = order.customer_email;
          if (email) {
            const usersSnap = await admin.firestore().collection('users').where('email', '==', email).limit(1).get();
            if (!usersSnap.empty) {
              const userDoc = usersSnap.docs[0];
              const userRef = admin.firestore().collection('users').doc(userDoc.id);
              const userData = userDoc.data() || {};
              const currentCart = Array.isArray(userData.carrinho) ? userData.carrinho.map(String) : [];
              // Extract purchased product ids from expanded line_items
              const purchased = [];
              if (session.line_items && session.line_items.data) {
                session.line_items.data.forEach(li => {
                  const prod = li.price && li.price.product;
                  const pid = prod && prod.metadata && prod.metadata.product_id;
                  if (pid) purchased.push(String(pid));
                });
              }
              if (purchased.length > 0) {
                const newCart = currentCart.filter(i => !purchased.includes(String(i)));
                await userRef.update({ carrinho: newCart });
                console.log('Removed purchased items from user cart', userDoc.id, purchased);
              }
            }
          }
        } catch (uErr) {
          console.warn('Failed to remove purchased items from user cart:', uErr);
        }
      } catch (err) {
        console.error('Error persisting order:', err);
      }
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

// Retrieve a Checkout Session from Stripe (used as a fallback when webhook hasn't persisted the order yet)
exports.getCheckoutSession = functions.https.onRequest((req, res) => {
  // Allow CORS
  cors(req, res, async () => {
    try {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      const sessionId = req.query.session_id || req.body && req.body.session_id;
      if (!sessionId) return res.status(400).json({ error: 'Missing session_id' });

      if (!stripe) {
        return res.status(500).json({ error: 'Stripe not configured on server' });
      }

      // Retrieve the session and expand line items to provide richer info
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items.data.price.product']
      });

      // Return the session object (safe-ish for client usage; do not expose secret fields)
      res.set('Access-Control-Allow-Origin', '*');
      return res.json({ session });
    } catch (err) {
      console.error('getCheckoutSession error:', err && err.message ? err.message : err);
      res.set('Access-Control-Allow-Origin', '*');
      return res.status(500).json({ error: err && err.message ? err.message : String(err) });
    }
  });
});

// Persist a Checkout Session into Firestore (idempotent). Useful as a manual/dev fallback
exports.persistCheckoutSession = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      const sessionId = req.query.session_id || (req.body && req.body.session_id);
      if (!sessionId) return res.status(400).json({ error: 'Missing session_id' });

      if (!stripe) return res.status(500).json({ error: 'Stripe not configured on server' });

      // Retrieve the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items.data.price.product'] });

      const orderRef = admin.firestore().collection('orders').doc(sessionId);
      const existing = await orderRef.get();
      if (!existing.exists) {
        const simplifiedItems = [];
        try {
          if (session.line_items && session.line_items.data) {
            session.line_items.data.forEach(li => {
              const price = li.price || {};
              const prod = price.product || {};
              const metadata = prod.metadata || {};
              simplifiedItems.push({
                product_id: metadata.product_id || null,
                name: prod.name || li.description || price.nickname || 'Item',
                quantity: li.quantity || 1,
                unit_amount: price.unit_amount || li.amount_subtotal || null,
                currency: price.currency || 'eur',
                original_price: metadata.original_price ? Number(metadata.original_price) : null,
                promo_percent: metadata.promo_percent ? Number(metadata.promo_percent) : null,
              });
            });
          }
        } catch (siErr) {
          console.warn('Failed to build simplifiedItems (persist):', siErr);
        }

        const order = {
          customer_email: session.customer_email || (session.customer_details && session.customer_details.email) || null,
          amount_total: session.amount_total || null,
          payment_status: session.payment_status || null,
          created: getServerTimestamp(),
          stripe_session: session,
          line_items: simplifiedItems,
        };
        await orderRef.set(order);
        console.log('Persisted session to orders/', sessionId);
      } else {
        console.log('Order already exists for', sessionId);
      }

      // After persisting, attempt to remove purchased items from the buyer's cart
      try {
        const email = session.customer_email || (session.customer_details && session.customer_details.email) || null;
        if (email) {
          const usersSnap = await admin.firestore().collection('users').where('email', '==', email).limit(1).get();
          if (!usersSnap.empty) {
            const userDoc = usersSnap.docs[0];
            const userRef = admin.firestore().collection('users').doc(userDoc.id);
            const userData = userDoc.data() || {};
            const currentCart = Array.isArray(userData.carrinho) ? userData.carrinho.map(String) : [];
            const purchased = [];
            if (session.line_items && session.line_items.data) {
              session.line_items.data.forEach(li => {
                const prod = li.price && li.price.product;
                const pid = prod && prod.metadata && prod.metadata.product_id;
                if (pid) purchased.push(String(pid));
              });
            }
            if (purchased.length > 0) {
              const newCart = currentCart.filter(i => !purchased.includes(String(i)));
              await userRef.update({ carrinho: newCart });
              console.log('Removed purchased items from user cart', userDoc.id, purchased);
            }
          }
        }
      } catch (uErr) {
        console.warn('Failed to remove purchased items from user cart (persist):', uErr);
      }

      const snap = await orderRef.get();
      res.set('Access-Control-Allow-Origin', '*');
      return res.json({ order: { id: snap.id, ...snap.data() } });
    } catch (err) {
        console.error('persistCheckoutSession error:', err && err.message ? err.message : err, err && err.stack ? err.stack : '');
        res.set('Access-Control-Allow-Origin', '*');
        const payload = { error: err && err.message ? err.message : String(err) };
        if (process.env.NODE_ENV !== 'production') payload.stack = err && err.stack ? err.stack : null;
        return res.status(500).json(payload);
    }
  });
});
