// src/components/Cart.jsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { redirectToCheckout } from "../utils/stripe";
import { auth } from "../firebase";

export default function Cart({ cart, removeFromCart, closeCart }) {
  const navigate = useNavigate();
  const total = cart.reduce((sum, game) => sum + game.price, 0).toFixed(2);

  return (
    <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg p-6 overflow-y-auto z-50">
      <button onClick={closeCart} className="absolute top-4 right-4 text-red-600 font-bold">X</button>
      <h2 className="text-2xl font-bold mb-4">Carrinho</h2>

      {cart.length === 0 ? (  
        <p className="text-gray-500">Seu carrinho está vazio.</p>
      ) : (
        <>
          <ul>
            {cart.map((game, index) => (
              <li key={index} className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold">{game.title}</h3>
                  <p className="text-gray-600">€ {game.price}</p>
                </div>
                <button
                  onClick={() => removeFromCart(index)}
                  className="text-red-600 font-bold hover:text-red-800"
                >
                  X
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t pt-4">
            <p className="text-xl font-bold">Total: € {total}</p>
            <CheckoutButtons
              cart={cart}
              navigate={navigate}
            />
          </div>
        </>
      )}
    </div>
  );
}

function CheckoutButtons({ cart, navigate }) {
  const [loading, setLoading] = useState(false);

  const handleStripe = async () => {
    if (!cart || cart.length === 0) return;
    setLoading(true);
    try {
      const items = cart.map(g => ({ id: g.id || g.title, name: g.title, price: g.price, quantity: g.quantity || 1 }));
      const email = auth.currentUser ? auth.currentUser.email : null;
      await redirectToCheckout(items, email, '/create-checkout-session');
    } catch (err) {
      console.error('Checkout error', err);
      alert('Erro ao iniciar o checkout: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleStripe}
        disabled={loading}
        className="mt-2 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'A processar...' : 'Pagar com Stripe'}
      </button>
      <button
        onClick={() => navigate('/checkout')}
        className="mt-2 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        Finalizar Compra (Métodos alternativos)
      </button>
    </div>
  );
}
