import { useEffect, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import GameCard from "../components/GameCard";
import Footer from "../components/Footer";
import { Heart, Loader2, LogIn } from "lucide-react";
import toast from "react-hot-toast";

export default function Favorites({ user }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      if (!user) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        const favoriteIds = (userData.favoritos || []).filter(id => typeof id === "string");

        const gamesData = [];
        for (const gameId of favoriteIds) {
          try {
            const gameRef = doc(db, "games", gameId);
            const gameSnap = await getDoc(gameRef);
            if (gameSnap.exists()) {
              gamesData.push({ id: gameId, ...gameSnap.data() });
            }
          } catch (err) {
            console.warn(`Erro ao buscar jogo ${gameId}:`, err);
          }
        }

        setFavorites(gamesData);
      } catch (err) {
        console.error("Erro ao buscar favoritos:", err);
        toast.error("Erro ao carregar favoritos.");
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [user]);

  // Skeleton loader para cards
  const SkeletonCard = () => (
    <div className="bg-gray-800 p-4 rounded-xl shadow-lg animate-pulse">
      <div className="w-full h-40 bg-gray-700 rounded-lg mb-3"></div>
      <div className="h-6 bg-gray-700 rounded mb-2"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-5 bg-gray-700 rounded w-1/3"></div>
    </div>
  );

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
        <main className="flex-1 flex items-center justify-center p-6">
          <Motion.div
            className="text-center bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Heart className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-4">Favoritos</h2>
            <p className="text-gray-400 mb-6">
              Faça login para ver seus jogos favoritos e gerenciá-los!
            </p>
            <Motion.button
              onClick={() => window.location.href = "/login"}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Fazer login"
            >
              <LogIn className="w-5 h-5" />
              Entrar
            </Motion.button>
          </Motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <main className="flex-1 p-6">
        <Motion.h2
          className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Heart className="text-red-500" />
          Seus Favoritos
        </Motion.h2>

        {loading ? (
          <Motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </Motion.div>
        ) : favorites.length === 0 ? (
          <Motion.div
            className="text-center py-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">Nenhum favorito ainda</h3>
            <p className="text-gray-400">Adicione jogos aos seus favoritos para vê-los aqui! 💔</p>
          </Motion.div>
        ) : (
          <Motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AnimatePresence>
              {favorites.map((game, i) => (
                <Motion.div
                  key={game.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 30 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
                  className="relative group"
                  whileHover={{ y: -5 }}
                >
                  <GameCard game={game} user={user} />
                </Motion.div>
              ))}
            </AnimatePresence>
          </Motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
