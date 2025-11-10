import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { createUserDocument } from "../utils/firestoreUtils";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, Chrome } from "lucide-react";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Validação básica de email
  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  // 🔹 Login com Email/Senha
  async function handleEmailLogin(e) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error("Por favor, insira um email válido!");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres!");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await createUserDocument(userCredential.user);
      
      // Carregar dados do Firestore incluindo role
      const userRef = doc(db, "users", userCredential.user.uid);
      const snap = await getDoc(userRef);
      const userData = snap.exists() ? snap.data() : {};
      
      setUser({ ...userCredential.user, ...userData });
      toast.success("Login realizado com sucesso!");
      navigate("/");
    } catch (error) {
      toast.error("Erro no login: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Login com Google
  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await createUserDocument(user);
      
      // Carregar dados do Firestore incluindo role
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const userData = snap.exists() ? snap.data() : {};
      
      setUser({ ...user, ...userData });
      toast.success("Login com Google realizado!");
      navigate("/");
    } catch (error) {
      toast.error("Erro ao logar com Google: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4 relative overflow-hidden">
      {/* Fundo animado sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse"></div>

      <motion.form
        onSubmit={handleEmailLogin}
        className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-6 relative z-10 border border-gray-700"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h2
          className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          Login
        </motion.h2>

        {/* Campo Email */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 bg-gray-700 rounded-xl border border-gray-600 px-3 py-1">
            <Mail className="text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pr-4 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-0"
              required
              disabled={loading}
              aria-label="Email"
            />
          </div>
        </motion.div>

        {/* Campo Senha */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 bg-gray-700 rounded-xl border border-gray-600 px-3 py-1">
            <Lock className="text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pr-4 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-0"
              required
              disabled={loading}
              aria-label="Senha"
            />
          </div>
        </motion.div>

        {/* Botão Email/Senha */}
        <motion.button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg"
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Entrar com Email e Senha"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Mail className="w-5 h-5" />}
          {loading ? "Carregando..." : "Entrar com Email/Senha"}
        </motion.button>

        <motion.div
          className="text-center text-gray-400 my-4 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex-1 h-px bg-gray-600"></div>
          ou
          <div className="flex-1 h-px bg-gray-600"></div>
        </motion.div>

        {/* Botão Google */}
        <motion.button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Entrar com Google"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Chrome className="w-5 h-5" />}
          Entrar com Google
        </motion.button>

        <motion.p
          className="text-sm mt-6 text-center text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Não tem conta?{" "}
          <Link
            to="/signup"
            className="text-purple-400 hover:text-purple-300 hover:underline transition"
            aria-label="Ir para cadastro"
          >
            Cadastre-se
          </Link>
        </motion.p>
      </motion.form>
    </div>
  );
}
