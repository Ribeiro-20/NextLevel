// src/components/Cart.jsx
import { useNavigate } from "react-router-dom";

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
            <button
              onClick={() => navigate("/checkout")}
              className="mt-2 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Finalizar Compra
            </button>
          </div>
        </>
      )}
    </div>
  );
}
