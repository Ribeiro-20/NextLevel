import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaShoppingCart, FaHeart, FaRegHeart } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

export default function GameCard({ game, user, setCart }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const navigate = useNavigate();

  
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !game?.id) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setIsFavorite(snap.data().favoritos?.includes(String(game.id)) || false);
        }
      } catch (err) {
        console.error("Erro ao verificar favorito:", err);
      }
    };
    checkFavorite();
  }, [user, game?.id]);

  // ✅ Adicionar ao carrinho (com useCallback e feedback)
  const handleAddToCart = useCallback(async () => {
    if (!user) {
      toast.error("Faça login para adicionar ao carrinho!");
      return;
    }
    if (!game?.id) return;

    setCartLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { carrinho: arrayUnion(String(game.id)) });
      setCart(prev => [...new Set([...prev, String(game.id)])]); // Evita duplicatas
      toast.success(`${game.title} adicionado ao carrinho!`);
      // Disparar evento customizado para atualizar FloatingCart
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error("Erro ao adicionar ao carrinho:", err);
      toast.error("Erro ao adicionar ao carrinho.");
    } finally {
      setCartLoading(false);
    }
  }, [user, game, setCart]);

  // ✅ Alternar favorito (com useCallback e feedback)
  const handleToggleFavorite = useCallback(async () => {
    if (!user) {
      toast.error("Faça login para favoritar!");
      return;
    }
    if (!game?.id) return;

    setFavoriteLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      if (isFavorite) {
        await updateDoc(userRef, { favoritos: arrayRemove(String(game.id)) });
        toast.success("Removido dos favoritos!");
      } else {
        await updateDoc(userRef, { favoritos: arrayUnion(String(game.id)) });
        toast.success("Adicionado aos favoritos!");
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error("Erro ao atualizar favoritos:", err);
      toast.error("Erro ao atualizar favoritos.");
    } finally {
      setFavoriteLoading(false);
    }
  }, [user, game, isFavorite]);

  // Função para navegar (com suporte a teclado)
  const handleNavigate = () => navigate(`/game/${game.id}`);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNavigate();
    }
  };

  // helper para transformar URL do YouTube em embed autoplay (muted)
  const getYouTubeEmbed = (url) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
    const id = ytMatch ? ytMatch[1] : null;
    if (id) return `https://www.youtube.com/embed/${id}?rel=0&autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${id}`;
    return null;
  };

  return (
    <>
      <Toaster position="top-right" /> {/* Para toasts */}
      <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-purple-500/30 relative cursor-pointer border border-gray-700 flex flex-col h-full"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`Ver detalhes de ${game.title}`}
      >
        {/* Imagem com overlay sutil */}
        <div
          onClick={handleNavigate}
          className="relative overflow-hidden"
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
        >
          {/* imagem estática por baixo */}
          <img
            src={game.banner}
            alt={`Banner de ${game.title}`}
            className="w-full h-56 sm:h-52 md:h-56 lg:h-60 object-cover transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />

          {/* Trailer preview ao passar o rato (YouTube embed ou vídeo direto) */}
          {isHover && game.trailer && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              {game.trailer && getYouTubeEmbed(game.trailer) ? (
                <iframe
                  src={getYouTubeEmbed(game.trailer)}
                  title={`Trailer de ${game.title}`}
                  className="w-full h-full object-cover"
                  frameBorder="0"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : game.trailer && typeof game.trailer === 'string' && (game.trailer.endsWith('.mp4') || game.trailer.endsWith('.webm')) ? (
                <video className="w-full h-full object-cover" src={game.trailer} autoPlay muted loop playsInline />
              ) : null}
              <div className="absolute inset-0" />
            </div>
          )}

          {game.promo > 0 && (
            <motion.div
              className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              -{game.promo}%
            </motion.div>
          )}
        </div>

        {/* Conteúdo */}
        <div onClick={handleNavigate} className="p-4 flex-1">
          <h3 className="font-bold text-2xl md:text-3xl text-white mb-2 line-clamp-1">{game.title}</h3>
          {game.category && (
            <span className="text-xs bg-purple-600 px-3 py-1 rounded-full text-white uppercase font-semibold mb-2 inline-block">
              {game.category}
            </span>
          )}
          {Array.isArray(game.platform) && (
            <div className="flex flex-wrap gap-1 mb-3">
              {game.platform.map((p) => (
                <span
                  key={p}
                  className="text-xs bg-gray-700 px-2 py-1 rounded-full text-gray-200 border border-gray-600"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
          <div className="text-xl font-bold">
            {game.promo > 0 ? (
              <div className="flex items-baseline gap-3">
                <span className="text-2xl md:text-3xl text-white font-extrabold">
                  € {(game.price * (1 - game.promo / 100)).toFixed(2)}
                </span>
                <span className="line-through text-gray-400 text-sm">
                  € {game.price.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-2xl text-white font-extrabold">€ {game.price.toFixed(2)}</span>
            )}
          </div>
        </div>

  {/* Botões (fixados no rodapé do card) */}
  <div className="p-4 flex gap-3 mt-auto">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            disabled={cartLoading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-2 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Adicionar ao carrinho"
          >
            <FaShoppingCart />
            {cartLoading ? "Adicionando..." : "Carrinho"}
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorite();
            }}
            disabled={favoriteLoading}
            className={`w-12 h-12 flex justify-center items-center rounded-xl transition shadow-lg ${
              isFavorite
                ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                : "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900"
            } disabled:opacity-50`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            {favoriteLoading ? "..." : (isFavorite ? <FaHeart className="text-red-300" /> : <FaRegHeart />)}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
