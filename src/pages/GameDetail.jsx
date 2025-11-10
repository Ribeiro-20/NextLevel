import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { Share2, Star, ChevronLeft, ChevronRight, ShoppingCart, Heart, Home, ArrowLeft } from "lucide-react";

// Hook personalizado para buscar jogo e relacionados
const useGameData = (id) => {
  const [game, setGame] = useState(null);
  const [relatedGames, setRelatedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        setError(null);
        const gameRef = doc(db, "games", id);
        const snap = await getDoc(gameRef);
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setGame(data);

          // Buscar jogos relacionados (otimizado com useMemo)
          const gamesCol = collection(db, "games");
          const all = await getDocs(gamesCol);
          const related = all.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(g => g.category === data.category && g.id !== data.id)
            .slice(0, 4);
          setRelatedGames(related);
        } else {
          setGame(null);
          setError("Jogo não encontrado.");
        }
      } catch (err) {
        console.error("Erro ao buscar o jogo:", err);
        setError("Erro ao carregar o jogo. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchGame();
  }, [id]);

  return { game, relatedGames, loading, error };
};

// Hook para verificar favorito
const useFavoriteStatus = (user, gameId) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !gameId) return;
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setIsFavorite(snap.data().favoritos?.includes(gameId) || false);
        }
      } catch (err) {
        console.error("Erro ao verificar favorito:", err);
      }
    };
    checkFavorite();
  }, [user, gameId]);

  return { isFavorite, setIsFavorite };
};

export default function GameDetail({ user, setCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { game, relatedGames, loading, error } = useGameData(id);
  const { isFavorite, setIsFavorite } = useFavoriteStatus(user, game?.id);
  const [currentImage, setCurrentImage] = useState(0);
  const [actionLoading, setActionLoading] = useState(false); // Para botões de ação
  const [activeTab, setActiveTab] = useState("descricao");
  const tabsRef = useRef(null);

  // Preço calculado com promoção (otimizado com useMemo)
  const calculatedPrice = useMemo(() => {
    if (!game) return null;
    const discounted = game.promo > 0 ? game.price * (1 - game.promo / 100) : game.price;
    return { original: game.price, discounted };
  }, [game]);

  // Normalizar rating para evitar erros se vier como string ou null
  const rating = useMemo(() => {
    if (!game) return null;
    const r = parseFloat(game.rating);
    return Number.isFinite(r) ? r : null;
  }, [game]);

  // Função para adicionar ao carrinho (com useCallback)
  const handleAddToCart = useCallback(async () => {
    if (!user) {
      toast.error("Você precisa estar logado para adicionar ao carrinho!");
      return;
    }
    if (!game) return;

    setActionLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { carrinho: arrayUnion(game.id) });
      setCart(prev => [...new Set([...prev, game.id])]); // Evita duplicatas
      toast.success(`${game.title} adicionado ao carrinho!`);
      // Disparar evento customizado para atualizar FloatingCart
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error(err);
      toast.error("Erro ao adicionar ao carrinho.");
    } finally {
      setActionLoading(false);
    }
  }, [user, game, setCart]);

  

  // Função para alternar favorito (com useCallback)
  const handleToggleFavorite = useCallback(async () => {
    if (!user) {
      toast.error("Você precisa estar logado para favoritar!");
      return;
    }
    if (!game) return;

    setActionLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      if (isFavorite) {
        await updateDoc(userRef, { favoritos: arrayRemove(game.id) });
      } else {
        await updateDoc(userRef, { favoritos: arrayUnion(game.id) });
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar favorito.");
    } finally {
      setActionLoading(false);
    }
  }, [user, game, isFavorite, setIsFavorite]);

  // Normalizar trailer (aceita URL do Youtube ou id)
  const getEmbedUrl = (url) => {
    if (!url) return null;
    try {
      // Se já for embed, retorna
      if (url.includes("youtube.com/embed") || url.includes("player.vimeo")) return url;
      // Youtube short
      const ytMatch = url.match(/(?:youtu\.be\/|v=)([A-Za-z0-9_-]{11})/);
      if (ytMatch && ytMatch[1]) return `https://www.youtube.com/embed/${ytMatch[1]}`;
      // Se for apenas um id (11 chars), usa como id
      if (/^[A-Za-z0-9_-]{11}$/.test(url)) return `https://www.youtube.com/embed/${url}`;
      return url; // fallback
    } catch {
      return url;
    }
  };

  // Compartilhar / copiar link
  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: game.title, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copiado para a área de transferência");
      }
    } catch {
      toast.error("Erro ao compartilhar");
    }
  };

  // Navegação de imagens (próxima/anterior) - inclui banner como primeira
  const prevImage = () => {
    const totalImages = 1 + (game?.images?.length || 0); // banner + images
    setCurrentImage((i) => (i - 1 + totalImages) % totalImages);
  };

  const nextImage = () => {
    const totalImages = 1 + (game?.images?.length || 0); // banner + images
    setCurrentImage((i) => (i + 1) % totalImages);
  };

  if (loading) {
    // Skeleton loader melhorado e mais detalhado
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
        <div className="max-w-6xl mx-auto animate-pulse">
          {/* Botão voltar skeleton */}
          <div className="h-10 bg-gray-700 rounded-lg w-32 mb-6"></div>
          <div className="flex flex-col md:flex-row gap-10">
            {/* Imagem skeleton */}
            <div className="md:w-2/3 h-80 bg-gray-700 rounded-2xl"></div>
            {/* Buy box skeleton */}
            <div className="md:w-1/3 bg-gray-800 rounded-2xl p-5 space-y-4">
              <div className="h-8 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              <div className="h-6 bg-gray-700 rounded w-1/3"></div>
              <div className="h-12 bg-gray-700 rounded"></div>
              <div className="flex gap-3">
                <div className="flex-1 h-10 bg-gray-700 rounded-lg"></div>
                <div className="w-24 h-10 bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          </div>
          {/* Tabs skeleton */}
          <div className="mt-10 space-y-4">
            <div className="flex gap-2">
              <div className="h-10 bg-gray-700 rounded w-20"></div>
              <div className="h-10 bg-gray-700 rounded w-20"></div>
              <div className="h-10 bg-gray-700 rounded w-20"></div>
            </div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-xl mb-4">{error}</p>
        <Link to="/" className="text-purple-400 hover:underline">Voltar para Home</Link>
      </div>
    </div>
  );
  if (!game) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6 flex items-center justify-center">
      <div className="text-center">
        <p className="text-white text-xl mb-4">Jogo não encontrado.</p>
        <Link to="/" className="text-purple-400 hover:underline">Voltar para Home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <Toaster position="top-right" />
        
        {/* Botão de voltar melhorado */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            aria-label="Voltar para Home"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Home
          </Link>
        </motion.div>

        {/* Topo: imagem + buy box */}
        <div className="flex flex-col md:flex-row gap-10">
          {/* Imagem destacada */}
          <motion.div
            className="md:w-2/3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={currentImage === 0 ? game.banner : (game.images?.[currentImage - 1] || game.banner)}
              alt={`Imagem principal de ${game.title}`}
              className="w-full h-96 md:h-[560px] object-cover rounded-2xl shadow-lg"
              loading="lazy"
              decoding="async"
            />
          </motion.div>

          {/* Buy box */}
          <motion.aside
            className="md:w-1/3 md:sticky md:top-24 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 h-fit shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="text-2xl font-bold leading-tight">{game.title}</h1>
              <motion.button
                onClick={handleShare}
                className="bg-gray-800/60 hover:bg-gray-700/60 p-2 rounded-lg transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Compartilhar"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Rating + plataformas */}
            <div className="flex flex-wrap items-center gap-2 text-gray-400 text-xs mb-3">
              {rating != null && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(rating) ? "text-yellow-400" : "text-gray-600"}`} />
                  ))}
                  <span className="ml-1">{rating.toFixed(1)}</span>
                </div>
              )}
              {Array.isArray(game.platform) && game.platform.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {game.platform.map((p) => (
                    <span key={p} className="bg-gray-700 text-gray-200 px-2 py-0.5 rounded-full">{p}</span>
                  ))}
                </div>
              )}
              {game.category && <span className="uppercase bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded">{game.category}</span>}
            </div>

            {/* Preço */}
            <div className="flex items-center gap-3 text-2xl font-bold mb-4">
              {calculatedPrice && (
                <>
                  <span className="text-green-400">€ {calculatedPrice.discounted.toFixed(2)}</span>
                  {game.promo > 0 && (
                    <span className="text-gray-500 line-through text-lg">€ {calculatedPrice.original.toFixed(2)}</span>
                  )}
                </>
              )}
            </div>
            {game.promo > 0 && (
              <p className="text-red-400 font-semibold mb-3" aria-live="polite">Promoção: -{game.promo}% 🔥</p>
            )}

            {/* Ações */}
            <div className="flex gap-3">
              <motion.button
                onClick={handleAddToCart}
                disabled={actionLoading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                whileTap={{ scale: 0.98 }}
                aria-label="Adicionar ao carrinho"
              >
                <ShoppingCart className="w-5 h-5" />
                {actionLoading ? "Adicionando..." : "Adicionar"}
              </motion.button>
              {/* Comprar agora removido - manter apenas 'Adicionar' */}
              <motion.button
                onClick={handleToggleFavorite}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  isFavorite ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
                } disabled:opacity-50`}
                whileTap={{ scale: 0.98 }}
                aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                {actionLoading ? "..." : isFavorite ? "Favorito" : "Favoritar"}
              </motion.button>
            </div>

            {/* Resumo / ver mais */}
            {game.description && (
              <div className="mt-4 text-sm text-gray-300">
                <p className="line-clamp-3">{game.description}</p>
                <button
                  className="mt-2 text-purple-400 hover:underline"
                  onClick={() => { setActiveTab("descricao"); tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                >
                  Ler descrição completa
                </button>
              </div>
            )}
          </motion.aside>
        </div>

        {/* Tabs de conteúdo */}
        <motion.div
          ref={tabsRef}
          className="mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-2">
            {[
              { key: "descricao", label: "Descrição" },
              { key: "galeria", label: "Galeria" },
              { key: "trailer", label: "Trailer" },
            ].map((t) => (
              <motion.button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-t-lg transition-all ${activeTab === t.key ? "bg-gray-800 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700/50"}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-selected={activeTab === t.key}
                role="tab"
              >
                {t.label}
              </motion.button>
            ))}
          </div>

          {/* Conteúdos */}
          {activeTab === "descricao" && (
            <motion.div
              className="mt-4 text-gray-300 leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {game.description || "Sem descrição."}
            </motion.div>
          )}

          {activeTab === "galeria" && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                {(game.banner || game.images?.length) ? (
                  <>
                    <img
                      src={currentImage === 0 ? game.banner : (game.images?.[currentImage - 1] || game.banner)}
                      alt={`Screenshot ${currentImage + 1} de ${game.title}`}
                      className="w-full h-[520px] md:h-[640px] object-cover rounded-xl"
                      loading="lazy"
                      decoding="async"
                    />
                    {(game.images?.length > 0 || game.banner) && (
                      <>
                        <motion.button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full z-10"
                          whileHover={{ scale: 1.05 }}
                          aria-label="Imagem anterior"
                        >
                          <ChevronLeft className="text-white" />
                        </motion.button>
                        <motion.button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full z-10"
                          whileHover={{ scale: 1.05 }}
                          aria-label="Próxima imagem"
                        >
                          <ChevronRight className="text-white" />
                        </motion.button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-40 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">Sem imagens</div>
                )}
              </div>
              {(game.banner || game.images?.length > 0) && (
                <div className="flex gap-2 overflow-x-auto pb-2 mt-3">
                  {/* Banner como primeira thumbnail */}
                  {game.banner && (
                    <motion.img
                      src={game.banner}
                      alt="Banner"
                      className={`w-32 h-20 md:w-40 md:h-24 object-cover rounded-md cursor-pointer border-2 transition ${currentImage === 0 ? "border-purple-500" : "border-transparent hover:border-gray-500"}`}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setCurrentImage(0)}
                      tabIndex={0}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  {/* Outras imagens */}
                  {game.images?.map((img, i) => (
                    <motion.img
                      key={i}
                      src={img}
                      alt={`Thumbnail ${i + 1}`}
                      className={`w-32 h-20 md:w-40 md:h-24 object-cover rounded-md cursor-pointer border-2 transition ${currentImage === i + 1 ? "border-purple-500" : "border-transparent hover:border-gray-500"}`}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setCurrentImage(i + 1)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Ver imagem ${i + 2}`}
                      onKeyDown={(e) => e.key === "Enter" && setCurrentImage(i + 1)}
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "trailer" && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {game.trailer ? (
                <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl">
                  <iframe
                    src={getEmbedUrl(game.trailer)}
                    title={`Trailer de ${game.title}`}
                    className="absolute top-0 left-0 w-full h-full rounded-xl"
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              ) : (
                <p className="text-gray-400">Sem trailer disponível.</p>
              )}
            </motion.div>
          )}

          {relatedGames.length > 0 && (
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h2 className="text-2xl font-bold mb-4">Jogos relacionados</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedGames.map(r => (
                  <motion.div
                    key={r.id}
                    onClick={() => navigate(`/game/${r.id}`)}
                    whileHover={{ scale: 1.05 }}
                    className="bg-gray-800 rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-purple-500/30 transition"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && navigate(`/game/${r.id}`)}
                    aria-label={`Ver detalhes de ${r.title}`}
                  >
                    <img src={r.banner} alt={`Banner de ${r.title}`} className="h-32 w-full object-cover" loading="lazy" decoding="async" />
                    <div className="p-3">
                      <p className="text-sm font-semibold">{r.title}</p>
                      <p className="text-gray-400 text-sm">€ {r.price.toFixed(2)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}