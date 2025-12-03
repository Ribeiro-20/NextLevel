import { loadStripe } from '@stripe/stripe-js';

// Vite exposes env variables via import.meta.env and requires the VITE_ prefix.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const isDev = import.meta.env.DEV;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gamehub-c02df';
const devEndpoint = `http://localhost:5001/${projectId}/us-central1/createCheckoutSession`;

// items: [{ id, name, price, quantity, image }]
export async function redirectToCheckout(items, email, endpoint) {
  const target = endpoint || (isDev ? devEndpoint : '/create-checkout-session');
  const res = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, email }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create checkout session');
  }
  const { id } = await res.json();
  const stripe = await stripePromise;
  return stripe.redirectToCheckout({ sessionId: id });
}
