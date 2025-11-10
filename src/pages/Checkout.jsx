import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import { FaCreditCard, FaTrash, FaSpinner, FaShoppingCart } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

export default function Checkout({ user, setUser, setCart }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState(null);
  // Multi-step wizard state
  const steps = ["Carrinho", "Seus Dados", "Pagamento", "Confirmar"];
  const [step, setStep] = useState(0);

  // User details (prefill from auth)
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
  });

  const [paymentData, setPaymentData] = useState({
    name: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const navigate = useNavigate();

  // 🔹 Carregar carrinho do Firebase
  useEffect(() => {
    if (!user) return;
    async function loadCart() {
      try {
        setLoading(true);
        setError(null);
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return;
        const userData = snap.data();
        const cartIds = Array.isArray(userData.carrinho)
          ? userData.carrinho.map(String)
          : [];
        if (cartIds.length === 0) {
          setCartItems([]);
          return;
        }
        const gamesData = [];
        for (const id of cartIds) {
          const gameSnap = await getDoc(doc(db, "games", String(id)));
          if (gameSnap.exists()) {
            gamesData.push({ id: String(id), quantity: 1, ...gameSnap.data() });
          }
        }
        setCartItems(gamesData);
        // Prefill user details
        setUserDetails({
          name: userData?.displayName || user?.displayName || "",
          email: userData?.email || user?.email || "",
        });
        setPaymentData(prev => ({ ...prev, name: userData?.displayName || user?.displayName || prev.name }));
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar o carrinho.");
      } finally {
        setLoading(false);
      }
    }
    loadCart();
  }, [user]);

  // 🔹 Atualizar quantidade
  const handleQuantityChange = (id, value) => {
    setCartItems(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity: Math.max(1, value) } : item))
    );
  };

  // 🔹 Remover item do carrinho
  const handleRemoveItem = async id => {
    setCartItems(prev => prev.filter(item => item.id !== id));

    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return;

      const newCart = (snap.data().carrinho || []).filter(i => String(i) !== id);
      await updateDoc(userRef, { carrinho: newCart });

      // Atualizar carrinho global
      setCart(newCart);

      // Atualizar Header
      window.dispatchEvent(new Event("cartUpdated"));
      toast.success("Item removido do carrinho!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover item.");
    }
  };

  // 🔹 Subtotal, desconto e total
  const subtotal = cartItems.reduce((sum, g) => sum + g.price * g.quantity, 0);
  const discount = cartItems.reduce(
    (sum, g) => sum + (g.price * (g.promo || 0) * g.quantity) / 100,
    0
  );
  const total = subtotal - discount;

  // 🔹 Validadores por etapa
  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validateStep = () => {
    if (step === 0) {
      return cartItems.length > 0;
    }
    if (step === 1) {
      return userDetails.name.trim().length > 1 && isValidEmail(userDetails.email);
    }
    if (step === 2) {
      return (
        paymentData.name.trim().length > 1 &&
        paymentData.cardNumber.trim().replace(/\s+/g, "").length >= 12 &&
        /^(0[1-9]|1[0-2])\/?\d{2}$/.test(paymentData.expiry.trim()) &&
        /^\d{3,4}$/.test(paymentData.cvv.trim())
      );
    }
    if (step === 3) {
      return acceptedTerms;
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) {
      toast.error("Complete os campos obrigatórios nesta etapa.");
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // 🔹 Finalizar compra
  const handleCheckout = async () => {
    if (!user) {
      toast.error("Faça login para finalizar a compra!");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Seu carrinho está vazio!");
      return;
    }
    if (!validateStep() || step !== 3) {
      toast.error("Complete as etapas antes de finalizar!");
      return;
    }

    try {
      setCheckoutLoading(true);
      await addDoc(collection(db, "purchases"), {
        userId: user.uid,
        games: cartItems.map(g => ({ id: g.id, quantity: g.quantity })),
        subtotal,
        discount,
        total,
        date: serverTimestamp(),
        status: "Concluída",
      });

      await updateDoc(doc(db, "users", user.uid), { carrinho: [] });
      setCartItems([]);
      setPaymentData({ name: "", cardNumber: "", expiry: "", cvv: "" });

      // Atualizar carrinho global
      setCart([]);

      // Atualizar Header
      window.dispatchEvent(new Event("cartUpdated"));

      toast.success("Compra concluída com sucesso!");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao finalizar a compra.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Skeleton loader para itens do carrinho
  const SkeletonItem = () => (
    <div className="flex items-center bg-gray-800 rounded-2xl p-4 shadow-lg animate-pulse">
      <div className="w-24 h-24 bg-gray-700 rounded-lg mr-4"></div>
      <div className="flex-1">
        <div className="h-6 bg-gray-700 rounded mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="w-16 h-8 bg-gray-700 rounded"></div>
        <div className="w-16 h-4 bg-gray-700 rounded"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <Toaster position="top-right" />
        <div className="flex justify-center items-center flex-1">
          <div className="space-y-4 w-full max-w-4xl px-4">
            <div className="h-8 bg-gray-700 rounded animate-pulse mx-auto w-1/3"></div>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonItem key={i} />)}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <Toaster position="top-right" />
        <motion.div
          className="flex flex-col items-center justify-center flex-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FaShoppingCart className="text-gray-500 text-6xl mb-4" />
          <p className="text-gray-400 text-xl mb-6">Seu carrinho está vazio!</p>
          <motion.button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl transition shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Voltar à loja
          </motion.button>
        </motion.div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Toaster position="top-right" />
      <main className="max-w-6xl mx-auto my-10 px-4 flex-1">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 md:gap-8">
            {steps.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i <= step ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`hidden sm:block text-sm ${i === step ? "text-white" : "text-gray-400"}`}>
                  {label}
                </span>
                {i < steps.length - 1 && <div className="w-8 md:w-16 h-[2px] bg-gray-700 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <motion.div
            className="bg-red-600 text-white p-4 rounded-xl mb-6 shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Etapas (coluna esquerda) */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Etapa 0: Carrinho */}
            {step === 0 && (
              <>
                {cartItems.map((game, index) => (
                  <motion.div
                    key={game.id}
                    className="flex items-center bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl hover:shadow-purple-500/30 transition"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <img
                      src={game.banner}
                      alt={`Banner de ${game.title}`}
                      className="w-24 h-24 object-cover rounded-xl mr-6 shadow-lg"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{game.title}</h3>
                      <p className="text-gray-300">€ {game.price.toFixed(2)}</p>
                      {game.promo > 0 && (
                        <motion.p
                          className="text-green-400 text-sm font-semibold"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          Promoção: -{game.promo}%
                        </motion.p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-4">
                      <input
                        type="number"
                        min="1"
                        value={game.quantity}
                        onChange={e => handleQuantityChange(game.id, parseInt(e.target.value))}
                        className="w-20 p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
                        aria-label={`Quantidade de ${game.title}`}
                      />
                      <motion.button
                        onClick={() => handleRemoveItem(game.id)}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 transition"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={`Remover ${game.title} do carrinho`}
                      >
                        <FaTrash /> Remover
                      </motion.button>
                    </div>
                  </motion.div>
                ))}

                <div className="flex justify-end mt-4">
                  <motion.button
                    onClick={next}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg"
                    whileHover={{ scale: 1.03 }}
                  >
                    Continuar
                  </motion.button>
                </div>
              </>
            )}

            {/* Etapa 1: Seus Dados */}
            {step === 1 && (
              <motion.div
                className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-2xl font-bold text-white mb-6">Seus Dados</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={userDetails.name}
                    onChange={e => setUserDetails({ ...userDetails, name: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none transition"
                    aria-label="Nome completo"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={userDetails.email}
                    onChange={e => setUserDetails({ ...userDetails, email: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none transition"
                    aria-label="Email"
                  />
                </div>
                <div className="flex justify-between gap-4 mt-6">
                  <motion.button onClick={back} className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600" whileHover={{ scale: 1.03 }}>
                    Voltar
                  </motion.button>
                  <motion.button onClick={next} className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700" whileHover={{ scale: 1.03 }}>
                    Continuar
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Etapa 2: Pagamento */}
            {step === 2 && (
              <motion.div
                className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <FaCreditCard className="text-purple-400" /> Pagamento
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nome no cartão"
                    value={paymentData.name}
                    onChange={e => setPaymentData({ ...paymentData, name: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none transition"
                    aria-label="Nome no cartão"
                  />
                  <input
                    type="text"
                    placeholder="Número do cartão"
                    value={paymentData.cardNumber}
                    onChange={e => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none transition"
                    aria-label="Número do cartão"
                  />
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="MM/AA"
                      value={paymentData.expiry}
                      onChange={e => setPaymentData({ ...paymentData, expiry: e.target.value })}
                      className="flex-1 p-3 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none transition"
                      aria-label="Data de expiração"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      value={paymentData.cvv}
                      onChange={e => setPaymentData({ ...paymentData, cvv: e.target.value })}
                      className="flex-1 p-3 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none transition"
                      aria-label="CVV"
                    />
                  </div>
                </div>
                <div className="flex justify-between gap-4 mt-6">
                  <motion.button onClick={back} className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600" whileHover={{ scale: 1.03 }}>
                    Voltar
                  </motion.button>
                  <motion.button onClick={next} className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700" whileHover={{ scale: 1.03 }}>
                    Continuar
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Etapa 3: Confirmar */}
            {step === 3 && (
              <motion.div
                className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-2xl font-bold text-white mb-6">Confirmar</h3>
                <div className="space-y-2 text-gray-300 mb-4">
                  <p><span className="text-gray-400">Nome:</span> {userDetails.name || paymentData.name}</p>
                  <p><span className="text-gray-400">Email:</span> {userDetails.email}</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input type="checkbox" className="accent-purple-600 w-5 h-5" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
                  <span className="text-sm text-gray-300">Concordo com os termos e condições.</span>
                </label>
                <div className="flex justify-between gap-4 mt-6">
                  <motion.button onClick={back} className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600" whileHover={{ scale: 1.03 }}>
                    Voltar
                  </motion.button>
                  <motion.button
                    onClick={handleCheckout}
                    disabled={checkoutLoading || !acceptedTerms}
                    className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-600 flex items-center gap-2"
                    whileHover={{ scale: 1.03 }}
                    aria-label="Finalizar compra"
                  >
                    {checkoutLoading ? <FaSpinner className="animate-spin" /> : <FaCreditCard />}
                    {checkoutLoading ? "Processando..." : "Finalizar Compra"}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Resumo */}
          <motion.div
            className="bg-gradient-to-r from-gray-900 to-black p-8 rounded-2xl shadow-xl h-fit"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">Resumo</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal:</span>
                <span>€ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>Desconto:</span>
                <span>- € {discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-2xl border-t border-gray-700 pt-3">
                <span>Total:</span>
                <span>€ {total.toFixed(2)}</span>
              </div>
            </div>
            {/* CTA altera conforme a etapa */}
            {step < steps.length - 1 ? (
              <motion.button
                onClick={next}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 rounded-xl transition shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Continuar
              </motion.button>
            ) : (
              <motion.button
                onClick={handleCheckout}
                disabled={checkoutLoading || !acceptedTerms}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Finalizar compra"
              >
                {checkoutLoading ? <FaSpinner className="animate-spin" /> : <FaCreditCard />}
                {checkoutLoading ? "Processando..." : "Finalizar Compra"}
              </motion.button>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
