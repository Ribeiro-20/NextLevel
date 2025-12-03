import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, Trash2, Package } from "lucide-react";
import { doc, getDoc, collection, getDocs, updateDoc, arrayRemove } from "firebase/firestore";
import { db, auth } from "../firebase";
import { redirectToCheckout } from "../utils/stripe";
import toast from "react-hot-toast";

export default function FloatingCart({ user }) {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [allGames, setAllGames] = useState([]);
  const [removingId, setRemovingId] = useState(null);

  // Buscar todos os jogos do Firestore uma vez
  useEffect(() => {
    const fetchAllGames = async () => {
      try {
        const gamesCol = collection(db, "games");
        const gameSnapshot = await getDocs(gamesCol);
        const gameList = gameSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllGames(gameList);
      } catch (err) {
        console.error("Erro ao carregar jogos:", err);
      }
    };
    fetchAllGames();
  }, []);

  // Função para buscar carrinho com useCallback
  const fetchCart = useCallback(async () => {
    if (!user || allGames.length === 0) {
      setCartCount(0);
      setCartItems([]);
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const cartIds = snap.data().carrinho || [];
        setCartCount(cartIds.length);
        
        // Buscar dados completos dos jogos do Firestore
        const fullCartItems = cartIds
          .map(id => allGames.find(g => String(g.id) === String(id)))
          .filter(Boolean);
        
        setCartItems(fullCartItems);
      }
    } catch (err) {
      console.error("Erro ao buscar carrinho:", err);
    }
  }, [user, allGames]);

  // Fetch inicial e quando user muda
  useEffect(() => {
    fetchCart();
  }, [fetchCart, refreshTrigger]);

  // Listener para eventos customizados de atualização do carrinho
  useEffect(() => {
    const handleCartUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  // Polling quando o carrinho está aberto (atualiza a cada 2 segundos)
  useEffect(() => {
    if (!isOpen || !user) return;

    const interval = setInterval(() => {
      fetchCart();
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, user, fetchCart]);

  // Função para remover item do carrinho
  const handleRemoveFromCart = async (gameId) => {
    if (!user) return;

    setRemovingId(gameId);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        carrinho: arrayRemove(String(gameId))
      });
      
      toast.success("Jogo removido do carrinho!");
      
      // Atualizar estado local imediatamente
      setCartItems(prev => prev.filter(item => item.id !== gameId));
      setCartCount(prev => prev - 1);
      
      // Disparar evento para outras partes atualizarem
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error("Erro ao remover do carrinho:", err);
      toast.error("Erro ao remover item.");
    } finally {
      setRemovingId(null);
    }
  };
  // Calcular total do carrinho (preço * quantidade)
  const total = cartItems.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + price * qty;
  }, 0);
  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-70"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-full p-4 shadow-2xl shadow-green-500/50 hover:shadow-green-500/70 transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={cartCount > 0 ? { y: [0, -10, 0] } : {}}
          transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
        >
          <ShoppingCart className="w-7 h-7" />
          
          {/* Badge de contagem */}
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.div
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                key={cartCount}
              >
                <motion.span
                  key={cartCount}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                >
                  {cartCount}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse ring quando tem itens */}
          {cartCount > 0 && (
            <motion.div
              className="absolute inset-0 rounded-full bg-green-400"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </motion.button>
      </motion.div>

      {/* Cart Preview Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="fixed right-0 top-0 h-full w-full md:w-96 bg-gray-900/95 backdrop-blur-xl border-l border-gray-800 shadow-2xl z-70 flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-green-900/30 to-emerald-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Carrinho</h2>
                      <p className="text-sm text-gray-400">{cartCount} {cartCount === 1 ? "item" : "itens"}</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-gray-800"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {cartItems.length === 0 ? (
                  <motion.div
                    className="flex flex-col items-center justify-center h-full text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="bg-gray-800/50 rounded-full p-8 mb-4">
                      <Package className="w-16 h-16 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Carrinho vazio</h3>
                    <p className="text-sm text-gray-500 mb-6">Adiciona jogos incríveis ao teu carrinho!</p>
                    <motion.button
                      onClick={() => {
                        setIsOpen(false);
                        navigate("/");
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 py-2.5 rounded-lg text-white text-sm font-medium transition shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Explorar Jogos
                    </motion.button>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {cartItems.map((item, index) => (
                        <motion.div
                          key={item.id || index}
                          className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50 hover:border-green-500/50 transition group"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0, padding: 0 }}
                          transition={{ delay: index * 0.05 }}
                          layout
                        >
                        <div className="flex gap-3">
                          <img
                            src={item.banner || item.img || item.image || (item.images && item.images[0]) || "/placeholder-game.png"}
                            alt={item.title || item.name}
                            className="w-24 h-24 rounded-lg object-cover shadow-lg"
                            onError={(e) => {
                              e.target.src = "/placeholder-game.png";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                              {item.title || item.name}
                            </h4>
                            <p className="text-gray-400 text-xs mb-1">{item.category || item.genre || "Jogo"}</p>
                            {item.promotion && (
                              <span className="inline-block bg-red-600 text-white text-xs px-2 py-0.5 rounded-full mb-2">
                                Promoção
                              </span>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-green-400 font-bold text-base">
                                {item.price?.toFixed(2)}€
                              </span>
                              <motion.button
                                onClick={() => handleRemoveFromCart(item.id)}
                                disabled={removingId === item.id}
                                className={`text-gray-500 hover:text-red-400 transition p-1.5 rounded hover:bg-gray-700/50 ${removingId === item.id ? "opacity-50 cursor-wait" : ""}`}
                                whileHover={{ scale: removingId === item.id ? 1 : 1.1 }}
                                whileTap={{ scale: removingId === item.id ? 1 : 0.9 }}
                                title="Remover do carrinho"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer com total e botão checkout */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-gray-800 bg-gray-950/50 space-y-4">
                  {/* Total */}
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-gray-400 font-medium">Total:</span>
                    <span className="text-white font-bold text-2xl">
                      {total.toFixed(2)}€
                    </span>
                  </div>

                  {/* Botão Checkout */}
                      <motion.button
                        onClick={async () => {
                          setIsOpen(false);
                          // Compose items with image when available
                          const items = cartItems.map(i => ({
                            id: i.id || i.title,
                            name: i.title || i.name,
                            price: i.price || 0,
                            quantity: i.quantity || 1,
                            image: i.img || (i.images && i.images[0]) || i.banner || null,
                          }));
                          const email = auth && auth.currentUser ? auth.currentUser.email : null;

                          // Show a loading toast while we attempt to open Stripe
                          const loadingToastId = toast.loading('A iniciar checkout...');
                          try {
                            await redirectToCheckout(items, email);
                            // If redirectToCheckout resolves, Stripe will navigate away. Dismiss loader just in case.
                            toast.dismiss(loadingToastId);
                          } catch (err) {
                            toast.dismiss(loadingToastId);
                            console.error('Stripe redirect failed', err);
                            // Show a clear error message to the user instead of navigating away
                            const msg = (err && err.message) ? err.message : 'Falha ao iniciar o pagamento.';
                            toast.error('Falha ao iniciar o pagamento: ' + msg);
                            // Leave user on page so they can retry or inspect
                          }
                        }}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Finalizar Compra
                      </motion.button>
                  {/* Dev-only test button removed — checkout uses real cart items now */}

                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-xl transition"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continuar Comprando
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
