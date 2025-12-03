const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

// Load local runtime config (functions/.runtimeconfig.json)
const rcPath = path.join(__dirname, '.runtimeconfig.json');
let stripeSecret;
try {
  const rcRaw = fs.readFileSync(rcPath, 'utf8');
  const rc = JSON.parse(rcRaw);
  stripeSecret = rc && rc.stripe && rc.stripe.secret;
} catch (err) {
  console.error('Could not read runtime config at', rcPath, err && err.message ? err.message : err);
  process.exit(1);
}

if (!stripeSecret) {
  console.error('Stripe secret not found in runtime config.');
  process.exit(1);
}

const stripe = Stripe(stripeSecret);

(async () => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Teste Jogo (local test)' },
            unit_amount: 199,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:5173/',
    });

    console.log('Created checkout session:', session.id);
    console.log('Checkout URL (for browser): https://checkout.stripe.com/pay/' + session.id);
  } catch (err) {
    console.error('Error creating checkout session:', err && err.message ? err.message : err);
    if (err && err.raw && err.raw.message) console.error('Stripe raw message:', err.raw.message);
    process.exit(1);
  }
})();
