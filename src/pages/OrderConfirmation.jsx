import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Nenhum ID de sessão encontrado na URL.");
      setLoading(false);
      return;
    }

    // Strategy:
    // 1) Poll Firestore document `orders/<sessionId>` for a short period (webhook may be delayed)
    // 2) If not found after retries, call the server endpoint `/getCheckoutSession` to retrieve the session from Stripe
    async function pollForOrder(maxAttempts = 10, intervalMs = 1500) {
      setLoading(true);
      try {
        for (let i = 0; i < maxAttempts; i++) {
          const ref = doc(db, "orders", sessionId);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const o = { id: snap.id, ...snap.data() };
            setOrder(o);
            // Attempt to clear cart for the current user if this order belongs to them
            tryClearCartForOrder(o);
            setLoading(false);
            return;
          }
          // wait
          await new Promise((r) => setTimeout(r, intervalMs));
        }

        // If not found in Firestore, try retrieving from Stripe via functions endpoint
        try {
          // Use emulator host in dev if applicable
          const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? `http://localhost:5001/gamehub-c02df/us-central1/getCheckoutSession`
            : `/getCheckoutSession`;
          const url = `${host}?session_id=${encodeURIComponent(sessionId)}`;
          const res = await fetch(url, { method: 'GET' });
          if (!res.ok) {
            const body = await res.text();
            console.warn('getCheckoutSession response not ok', res.status, body);
            setError('Pedido não encontrado.');
            return;
          }
          const json = await res.json();
          if (json && json.session) {
            const s = json.session;
            // Try to persist the session server-side so the Firestore `orders` doc is created
            try {
              const persistHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? `http://localhost:5001/gamehub-c02df/us-central1/persistCheckoutSession`
                : `/persistCheckoutSession`;
              const pRes = await fetch(`${persistHost}?session_id=${encodeURIComponent(sessionId)}`, { method: 'GET' });
              if (pRes.ok) {
                const pJson = await pRes.json();
                if (pJson && pJson.order) {
                    const o = pJson.order;
                    setOrder(o);
                    // Attempt to clear cart for the current user if this order belongs to them
                    tryClearCartForOrder(o);
                    setLoading(false);
                    return;
                  }
              } else {
                console.warn('persistCheckoutSession returned not ok', pRes.status);
              }
            } catch (pErr) {
              console.warn('persistCheckoutSession failed:', pErr);
            }

            // Fallback display using session payload when persisting didn't work
            const fallback = {
              id: s.id,
              customer_email: s.customer_email,
              amount_total: s.amount_total,
              payment_status: s.payment_status,
              created: s.created ? { toDate: () => new Date(s.created * 1000) } : null,
              stripe_session: s,
            };
            setOrder(fallback);
            tryClearCartForOrder(fallback);
          } else {
            setError('Pedido não encontrado.');
          }
        } catch (err) {
          console.error('Erro ao recuperar session do servidor:', err);
          setError('Erro ao buscar pedido.');
        }
      } catch (err) {
        console.error(err);
        setError("Erro ao buscar pedido.");
      } finally {
        setLoading(false);
      }
    }

    pollForOrder();
  }, [sessionId]);

  // Try to clear the current user's cart if the order belongs to them
  const tryClearCartForOrder = (order) => {
    if (!order || !order.customer_email) return;

    const attemptClear = async () => {
      try {
        const current = auth.currentUser;
        if (!current || !current.email) return;
        if (current.email !== order.customer_email) return;

        const userRef = doc(db, 'users', current.uid);
        await updateDoc(userRef, { carrinho: [] });
        // notify other components
        window.dispatchEvent(new Event('cartUpdated'));
        console.log('Carrinho limpo para usuário', current.uid);
      } catch (err) {
        console.warn('Erro ao limpar carrinho:', err);
      }
    };

    // If user already available, run immediately; otherwise wait for auth state
    if (auth.currentUser) {
      attemptClear();
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        attemptClear();
        unsubscribe();
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {loading ? (
          <div className="text-gray-400">Carregando confirmação...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">Obrigado pela sua compra!</h1>
            <p className="text-gray-300 mb-6">Seu pagamento foi processado com sucesso.</p>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400">ID do Pedido</div>
                <div className="font-mono text-sm text-gray-200 break-all">{order.id}</div>
              </div>

              <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400">Email</div>
                <div className="text-gray-200">{order.customer_email || '—'}</div>
              </div>

              <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400">Total</div>
                <div className="text-lg font-semibold">{order.amount_total ? (order.amount_total / 100).toFixed(2) + '€' : '—'}</div>
              </div>

              <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400">Status do Pagamento</div>
                <div className="text-gray-200">{order.payment_status || '—'}</div>
              </div>

              {/* Order items listing (use persisted line_items when available, otherwise try stripe_session) */}
              {(order.line_items && order.line_items.length) || (order.stripe_session && order.stripe_session.line_items && order.stripe_session.line_items.data) ? (
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <div className="text-sm text-gray-400 mb-3">Itens do Pedido</div>
                  <div className="space-y-3">
                    {(order.line_items && order.line_items.length ? order.line_items : (order.stripe_session.line_items.data.map(li => {
                      const price = li.price || {};
                      const prod = price.product || {};
                      const metadata = prod.metadata || {};
                      return {
                        product_id: metadata.product_id || null,
                        name: prod.name || li.description || price.nickname || 'Item',
                        quantity: li.quantity || 1,
                        unit_amount: price.unit_amount || li.amount_subtotal || null,
                        currency: price.currency || 'eur',
                        original_price: metadata.original_price ? Number(metadata.original_price) : null,
                        promo_percent: metadata.promo_percent ? Number(metadata.promo_percent) : null,
                      };
                    }))).map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{it.name}</div>
                          <div className="text-sm text-gray-400">{it.product_id ? `#${it.product_id}` : ''}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-300">Qtd: {it.quantity}</div>
                          <div className="font-semibold">{it.unit_amount ? `${(it.unit_amount/100).toFixed(2)}€` : '—'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex gap-3 mt-4">
                <Link to="/profile" className="px-4 py-2 bg-purple-600 text-white rounded-lg">Ver perfil</Link>
                <Link to="/" className="px-4 py-2 bg-gray-700 text-white rounded-lg">Voltar à loja</Link>
              </div>

              
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
