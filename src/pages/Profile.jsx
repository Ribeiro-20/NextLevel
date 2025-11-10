import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateEmail, updatePassword } from "firebase/auth";
import Footer from "../components/Footer";
import GameCard from "../components/GameCard";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Camera,
  Settings,
  Heart,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function Profile({ user, setUser }) {
  const [favorites, setFavorites] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!user) return;

    async function fetchProfile() {
      setLoading(true);
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return;

        const userData = snap.data();
        setAvatarUrl(userData.avatar || "https://i.pravatar.cc/150");
        setNewAvatarUrl(userData.avatar || "");

        const favoriteIds = (userData.favoritos || []).filter(Boolean);
        const favGames = [];
        for (let id of favoriteIds) {
          const docRef = doc(db, "games", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) favGames.push({ id: docSnap.id, ...docSnap.data() });
        }
        setFavorites(favGames);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar perfil.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  const handleAvatarSave = async () => {
    if (!newAvatarUrl.trim()) {
      toast.error("Insira uma URL válida para o avatar!");
      return;
    }
    setUpdating(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { avatar: newAvatarUrl });
      setAvatarUrl(newAvatarUrl);
      setUser(prev => ({ ...prev, avatar: newAvatarUrl }));
      toast.success("Avatar atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar avatar.");
    } finally {
      setUpdating(false);
    }
  };

  const handleEmailUpdate = async () => {
    if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail)) {
      toast.error("Insira um email válido!");
      return;
    }
    setUpdating(true);
    try {
      await updateEmail(auth.currentUser, newEmail);
      toast.success("Email atualizado com sucesso!");
      setNewEmail("");
    } catch (err) {
      toast.error("Erro ao atualizar email: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres!");
      return;
    }
    setUpdating(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast.success("Senha atualizada com sucesso!");
      setNewPassword("");
    } catch (err) {
      toast.error("Erro ao atualizar senha: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Skeleton loader para favoritos
  const SkeletonCard = () => (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg animate-pulse">
      <div className="w-full h-40 bg-gray-700 rounded mb-2"></div>
      <div className="h-6 bg-gray-700 rounded mb-1"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2 mb-1"></div>
      <div className="h-5 bg-gray-700 rounded w-1/3"></div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <Toaster position="top-right" />
      <main className="flex-1 p-6">
        {loading ? (
          <motion.div
            className="flex justify-center items-center min-h-[50vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
            <span className="ml-2 text-gray-400">Carregando perfil...</span>
          </motion.div>
        ) : (
          <>
            {/* Seção Avatar */}
            <motion.section
              className="mb-12 flex flex-col items-center gap-6 bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
              >
                <img
                  src={avatarUrl}
                  alt="Avatar do usuário"
                  className="w-32 h-32 rounded-full object-cover border-4 border-purple-500 shadow-lg"
                />
                <Camera className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full text-white shadow-lg" />
              </motion.div>
              <div className="flex flex-col items-center gap-4 w-full max-w-md">
                <input
                  type="text"
                  placeholder="Cole a URL do avatar"
                  value={newAvatarUrl}
                  onChange={(e) => setNewAvatarUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  aria-label="URL do avatar"
                />
                <motion.button
                  onClick={handleAvatarSave}
                  disabled={updating}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 rounded-xl transition flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Salvar avatar"
                >
                  {updating ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  {updating ? "Salvando..." : "Salvar Avatar"}
                </motion.button>
              </div>
            </motion.section>
            <motion.section
              className="mb-12 bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                <Settings className="text-purple-500" />
                Configurações
              </h3>

              {/* Atualizar Email */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-200 mb-2">Novo Email</label>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full min-w-0">
                    
                    <input
                      type="email"
                      
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      aria-label="Novo email"
                    />
                  </div>
                  <motion.button
                    onClick={handleEmailUpdate}
                    disabled={updating}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Atualizar email"
                  >
                    {updating ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    Atualizar
                  </motion.button>
                </div>
              </div>

              {/* Atualizar Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Nova Senha</label>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full min-w-0">
                    
                    <input
                      type="password"
                      placeholder=""
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-14 pr-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      aria-label="Nova senha"
                    />
                  </div>
                  <motion.button
                    onClick={handlePasswordUpdate}
                    disabled={updating}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Atualizar senha"
                  >
                    {updating ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    Atualizar
                  </motion.button>
                </div>
              </div>
            </motion.section>

            {/* Seção Favoritos */}
            <motion.section
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                <Heart className="text-red-500" />
                Favoritos
              </h3>
              {favorites.length === 0 ? (
                <motion.div
                  className="text-center text-gray-400 py-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-lg">Nenhum favorito ainda 💔</p>
                  <p className="text-sm">Adicione jogos aos seus favoritos para vê-los aqui!</p>
                </motion.div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {favorites.map((game, index) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <GameCard game={game} user={user} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
