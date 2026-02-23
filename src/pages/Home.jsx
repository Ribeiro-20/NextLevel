import { useEffect, useState, useMemo } from "react";
import Footer from "../components/Footer";
import GameCard from "../components/GameCard";
import Carousel from "../components/Carousel";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Filter, X, Search } from "lucide-react";
import { Dialog } from "@headlessui/react";

// Hook personalizado para buscar jogos do Firebase
const useGames = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        setError(null);
        const gamesCol = collection(db, "games");
        const gameSnapshot = await getDocs(gamesCol);
        const gameList = gameSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGames(gameList);
      } catch (err) {
        console.error("Erro ao carregar jogos:", err);
        setError("Erro ao carregar jogos. Verifique sua conexão e tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  return { games, loading, error };
};



export default function Home({ user, setUser, cart, setCart, searchQuery = "" }) {
  const { games, loading, error } = useGames();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  useEffect(() => setLocalSearch(searchQuery), [searchQuery]);
  
  // Estados de filtros e modal
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({
    category: "Todos",
    platform: "",
    type: "",
    maxPrice: 200,
  });

  const handleFilterChange = (group, value) => {
    setFilters(prev => ({ ...prev, [group]: value }));
  };

  // Categorias rápidas
  const quickCategories = ["Todos", "Ação", "RPG", "Estratégia", "Aventura", "Puzzle"];

  // Sugestões de busca
  const searchSuggestions = useMemo(() => {
    if (!localSearch || localSearch.length < 2) return [];
    return games
      .filter(g => (g.title || "").toLowerCase().includes(localSearch.toLowerCase()))
      .slice(0, 5);
  }, [games, localSearch]);

  // Atalho Cmd/K para focar na search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Buscar avatar do usuário (otimizado, só executa se user existir)
  useEffect(() => {
    if (!user || !setUser) return;

    const fetchAvatar = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const avatar = snap.data().avatar || "";
          setUser(prev => ({ ...prev, avatar }));
        }
      } catch (err) {
        console.error("Erro ao buscar avatar:", err);
      }
    };

    fetchAvatar();
  }, [user, setUser]);

  // Aplicar busca e filtros (otimizado com useMemo)
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      const matchCategory = filters.category === "Todos" || game.category === filters.category;
      const matchPlatform = !filters.platform || (Array.isArray(game.platform) ? game.platform.includes(filters.platform) : game.platform === filters.platform);
      const matchType = !filters.type || game.type === filters.type;
      const matchPrice = !filters.maxPrice || game.price <= filters.maxPrice;
      const searchTerm = (localSearch || searchQuery || "").toLowerCase();
      const matchSearch = (game.title || game.name || "").toLowerCase().includes(searchTerm);
      return matchCategory && matchPlatform && matchType && matchPrice && matchSearch;
    });
  }, [games, filters, searchQuery, localSearch]);

  // featured game for hero (prefer explicit featured flag)
  const featuredGame = useMemo(() => {
    if (!games || games.length === 0) return null;
    const f = games.find(g => g.featured) || games[0];
    return f;
  }, [games]);

  // Paginação (12 jogos por página)
  const [currentPage, setCurrentPage] = useState(1);
  const gamesPerPage = 12;
  const totalPages = Math.ceil(filteredGames.length / gamesPerPage);
  const paginatedGames = useMemo(() => {
    const start = (currentPage - 1) * gamesPerPage;
    return filteredGames.slice(start, start + gamesPerPage);
  }, [filteredGames, currentPage]);

  // Resetar página ao mudar busca ou filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // Componente de skeleton para loading
  const SkeletonCard = () => (
    <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-lg animate-pulse">
      <div className="h-48 bg-gray-700"></div>
      <div className="p-4">
        <div className="h-6 bg-gray-700 rounded mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-5 bg-gray-700 rounded w-1/3"></div>
      </div>
      <div className="p-4 flex gap-3">
        <div className="flex-1 h-10 bg-gray-700 rounded-xl"></div>
        <div className="w-12 h-12 bg-gray-700 rounded-xl"></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <main className="flex-1 p-6">
          <span className="sr-only">Carrinho: {cart?.length || 0} itens</span>
          {/* debug controls removed */}
          {/* Hero / Carousel or Featured */}
          {games && games.length > 0 && (
            (() => {
              // Prefer featured games that have a banner (hero images). Fallback to any games with banner.
              const hasBanner = g => g && (g.banner || g.image || g.cover || g.thumbnail);
              const featuredWithBanner = games.filter(g => g.featured && hasBanner(g));
              const fallbackWithBanner = games.filter(g => hasBanner(g));
              const slides = featuredWithBanner.length ? featuredWithBanner : fallbackWithBanner.slice(0, 6);

              return slides.length > 1 ? (
                <div className="mb-8">
                  <Carousel slides={slides.slice(0, 5)} interval={5000} />
                </div>
              ) : featuredGame ? (
                <div className="mb-8 rounded-3xl overflow-hidden relative group">
                  {/* Imagem de fundo */}
                  <img
                    src={featuredGame.banner}
                    alt={featuredGame.title}
                    className="w-full h-[500px] md:h-[700px] lg:h-screen object-contain group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                  
                  {/* Gradiente overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent"></div>
                  
                  {/* Conteúdo */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-12">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-1 w-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded"></div>
                        <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Destaque do Mês</span>
                      </div>
                      
                      <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg leading-tight max-w-2xl">
                        {featuredGame.title}
                      </h1>
                      
                      <div className="flex flex-wrap gap-3 items-center">
                        <span className="px-3 py-1 bg-purple-600 rounded-full text-sm font-semibold text-white">
                          {featuredGame.category}
                        </span>
                        {featuredGame.promo > 0 && (
                          <span className="px-3 py-1 bg-red-600 rounded-full text-sm font-bold text-white">
                            -{featuredGame.promo}%
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-200 line-clamp-2 text-lg max-w-2xl drop-shadow">
                        {featuredGame.description || featuredGame.category}
                      </p>
                      
                      <div className="flex gap-4 pt-4">
                        <a 
                          href={`/game/${featuredGame.id}`}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 via-purple-600 to-purple-700 hover:from-pink-700 hover:via-purple-700 hover:to-purple-800 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
                        >
                          Ver Detalhes
                        </a>
                        <button 
                          onClick={() => { window.dispatchEvent(new Event('cartUpdated')); }}
                          className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-bold px-8 py-3 rounded-xl border border-white/30 transition-all duration-300 transform hover:scale-105"
                        >
                          🛒 Carrinho
                        </button>
                      </div>
                      
                      {featuredGame.price && (
                        <div className="flex items-baseline gap-2 pt-2">
                          <span className="text-3xl font-bold text-white">
                            €{(featuredGame.price * (1 - (featuredGame.promo || 0) / 100)).toFixed(2)}
                          </span>
                          {featuredGame.promo > 0 && (
                            <span className="text-lg text-gray-400 line-through">
                              €{featuredGame.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </div>
                  
                  {/* Efeito de brilho */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-3xl -z-10"></div>
                </div>
              ) : null;
            })()
          )}

          {/* Promoções (horizontal scroller) */}
          {games.some(g => g.promo > 0) && (
            <section className="mb-6">
              <h2 className="text-xl font-bold mb-3">Promoções</h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-purple-600 pb-2 w-full flex-nowrap">
                {games.filter(g => g.promo > 0).slice(0, 12).map(g => (
                  <div key={g.id} className="min-w-[220px] flex-shrink-0 bg-gray-800 rounded-xl overflow-hidden cursor-pointer border border-gray-700" onClick={() => window.location.href = `/game/${g.id}`}>
                    <img src={g.banner} alt={g.title} className="w-full h-36 object-cover" loading="lazy" decoding="async" />
                    <div className="p-3">
                      <p className="font-semibold text-white line-clamp-1">{g.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-green-400 font-bold">€ {(g.price * (1 - (g.promo || 0) / 100)).toFixed(2)}</span>
                        <span className="line-through text-gray-400 text-sm">€ {g.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Search bar com Filtros e Sugestões */}
          <div className="mb-8">
            <div className="flex gap-3 mb-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <div className="flex items-center bg-gray-800 rounded-lg px-4 py-3 border-2 border-gray-700/50 hover:border-purple-600/50 focus-within:border-purple-600 transition-colors">
                  <Search size={20} className="text-gray-400 mr-2" />
                  <input
                    id="search-input"
                    type="search"
                    placeholder="Buscar jogos..."
                    value={localSearch}
                    onChange={(e) => { 
                      setLocalSearch(e.target.value); 
                      setCurrentPage(1);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="bg-transparent text-white px-3 py-1 w-full focus:outline-none placeholder-gray-500 text-sm"
                    aria-label="Buscar jogos"
                  />
                  {localSearch && (
                    <button 
                      onClick={() => setLocalSearch("")} 
                      className="ml-2 text-gray-400 hover:text-white transition"
                      aria-label="Limpar busca"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* Dropdown de Sugestões */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden"
                  >
                    {searchSuggestions.map((game) => (
                      <button
                        key={game.id}
                        onClick={() => {
                          setLocalSearch(game.title);
                          setShowSuggestions(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-700 transition text-left border-b border-gray-700 last:border-b-0"
                      >
                        <img src={game.banner} alt={game.title} className="w-10 h-10 rounded object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{game.title}</p>
                          <p className="text-gray-400 text-xs">{game.category}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Filtros Button */}
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-3 rounded-lg transition transform hover:scale-105"
                aria-label="Abrir filtros"
              >
                <Filter size={20} />
                <span className="hidden sm:inline">Filtros</span>
              </button>
            </div>

            {/* Categorias Rápidas */}
            <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
              {quickCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    handleFilterChange("category", cat);
                    setLocalSearch("");
                  }}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition whitespace-nowrap ${
                    filters.category === cat
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de jogos com animações */}
          <motion.div
            className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(340px,1fr))] justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            ) : error ? (
              <motion.p
                className="col-span-full text-center text-red-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            ) : paginatedGames.length === 0 ? (
              <motion.p
                className="col-span-full text-center text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Nenhum jogo encontrado. Tente ajustar os filtros.
              </motion.p>
            ) : (
              paginatedGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <GameCard game={game} user={user} setCart={setCart} />
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Paginação */}
          {totalPages > 1 && (
            <motion.div
              className="flex justify-center mt-8 gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition"
                aria-label="Página anterior"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-white">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition"
                aria-label="Próxima página"
              >
                Próxima
              </button>
            </motion.div>
          )}
        </main>

        {/* Modal de Filtros */}
        <Dialog open={isFilterOpen} onClose={() => setIsFilterOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 flex items-end justify-center pb-20 pointer-events-none"
          >
            <Dialog.Panel className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-96 max-w-full pointer-events-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-xl font-bold text-white">Filtros</Dialog.Title>
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6 max-h-96 overflow-y-auto">
                {/* Categoria */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Categoria</label>
                  <select 
                    value={filters.category}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Ação">Ação</option>
                    <option value="RPG">RPG</option>
                    <option value="Estratégia">Estratégia</option>
                    <option value="Aventura">Aventura</option>
                    <option value="Puzzle">Puzzle</option>
                    <option value="Simulação">Simulação</option>
                  </select>
                </div>

                {/* Plataforma */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Plataforma</label>
                  <select 
                    value={filters.platform}
                    onChange={(e) => handleFilterChange("platform", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="">Todas</option>
                    <option value="PC">PC</option>
                    <option value="PlayStation">PlayStation</option>
                    <option value="Xbox">Xbox</option>
                    <option value="Nintendo">Nintendo</option>
                    <option value="Mobile">Mobile</option>
                  </select>
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Tipo</label>
                  <select 
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="">Todos</option>
                    <option value="AAA">AAA</option>
                    <option value="Indie">Indie</option>
                    <option value="Free">Free-to-Play</option>
                  </select>
                </div>

                {/* Preço */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Preço Máximo: €{filters.maxPrice}</label>
                  <input 
                    type="range"
                    min="0"
                    max="200"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange("maxPrice", parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setFilters({ category: "Todos", platform: "", type: "", maxPrice: 200 });
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Limpar
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Aplicar
                </button>
              </div>
            </Dialog.Panel>
          </motion.div>
        </Dialog>

      <Footer />
    </div>
  );
}
