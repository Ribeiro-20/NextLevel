import { useEffect, useState, useMemo } from "react";
import Footer from "../components/Footer";
import FilterSidebar from "../components/FilterSidebar";
import GameCard from "../components/GameCard";
import Carousel from "../components/Carousel";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";

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

// Hook personalizado para gerenciar filtros
const useFilters = (initialFilters) => {
  const [filters, setFilters] = useState(initialFilters);

  const handleFilterChange = (group, value) => {
    setFilters(prev => ({ ...prev, [group]: value }));
  };

  return { filters, handleFilterChange };
};

export default function Home({ user, setUser, cart, setCart, searchQuery = "" }) {
  const { games, loading, error } = useGames();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  useEffect(() => setLocalSearch(searchQuery), [searchQuery]);
  const { filters, handleFilterChange } = useFilters({
    category: "Todos",
    platform: "",
    type: "",
    maxPrice: 200,
    sort: "",
  });

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

  // Aplicar filtros, busca e ordenação (otimizado com useMemo)
  const filteredGames = useMemo(() => {
    return games
      .filter(game => {
        const matchCategory = filters.category === "Todos" || game.category === filters.category;
        const matchPlatform = !filters.platform || (Array.isArray(game.platform) ? game.platform.includes(filters.platform) : game.platform === filters.platform);
        const matchType = !filters.type || game.type === filters.type;
        const matchPrice = !filters.maxPrice || game.price <= filters.maxPrice;
        const searchTerm = (localSearch || searchQuery || "").toLowerCase();
        const matchSearch = (game.title || game.name || "").toLowerCase().includes(searchTerm);
        return matchCategory && matchPlatform && matchType && matchPrice && matchSearch;
      })
      .sort((a, b) => {
        switch (filters.sort) {
          case "price-asc":
            return a.price - b.price;
          case "price-desc":
            return b.price - a.price;
          case "name":
            return (a.title || a.name || "").localeCompare(b.title || b.name || "");
          case "promo":
            return (b.promo || 0) - (a.promo || 0);
          default:
            return 0;
        }
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

  // Resetar página ao mudar filtros ou busca
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

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
      <div className="flex flex-1">
        {/* Sidebar de filtros */}
        <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />

  <main className="flex-1 p-6 min-w-0">
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
                <div className="mb-6">
                  <Carousel slides={slides.slice(0, 5)} interval={5000} />
                </div>
              ) : featuredGame ? (
                <div className="mb-6 rounded-2xl overflow-hidden relative bg-gradient-to-br from-purple-800 via-purple-700 to-black border border-gray-700/40">
                  <div className="md:flex">
                    <div className="md:w-2/3">
                      <img
                        src={featuredGame.banner}
                        alt={featuredGame.title}
                        className="w-full h-64 md:h-80 object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="md:w-1/3 p-6 flex flex-col justify-center gap-4">
                      <h3 className="text-2xl font-bold">Destaque: {featuredGame.title}</h3>
                      <p className="text-gray-300 line-clamp-3">{featuredGame.description || featuredGame.category}</p>
                      <div className="flex gap-3">
                        <a href={`/game/${featuredGame.id}`} className="bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2 rounded-lg text-white shadow">Ver Detalhes</a>
                        <button onClick={() => { window.dispatchEvent(new Event('cartUpdated')); }} className="bg-gray-700 px-4 py-2 rounded-lg text-white">Adicionar ao carrinho</button>
                      </div>
                    </div>
                  </div>
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

          {/* Search bar */}
          <div className="mb-6">
            <div className="flex items-center bg-gray-800 rounded-lg px-4 py-3 border border-gray-700/50">
              <input
                type="search"
                placeholder="Buscar jogos por título ou categoria..."
                value={localSearch}
                onChange={(e) => { setLocalSearch(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-white px-3 py-1 w-full focus:outline-none placeholder-gray-400"
                aria-label="Buscar jogos"
              />
              {localSearch && (
                <button onClick={() => setLocalSearch("")} className="ml-2 text-gray-400 hover:text-white">Limpar</button>
              )}
            </div>
          </div>

          {/* Active filter chips */}
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            {filters.category && filters.category !== "Todos" && (
              <button
                onClick={() => handleFilterChange("category", "Todos")}
                className="inline-flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full text-sm text-gray-200"
                aria-label="Remover filtro categoria"
              >
                {filters.category} <span className="text-gray-400">×</span>
              </button>
            )}
            {filters.platform && (
              <button
                onClick={() => handleFilterChange("platform", "")}
                className="inline-flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full text-sm text-gray-200"
                aria-label="Remover filtro plataforma"
              >
                {filters.platform} <span className="text-gray-400">×</span>
              </button>
            )}
            {filters.type && (
              <button
                onClick={() => handleFilterChange("type", "")}
                className="inline-flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full text-sm text-gray-200"
                aria-label="Remover filtro tipo"
              >
                {filters.type} <span className="text-gray-400">×</span>
              </button>
            )}
            {filters.maxPrice && filters.maxPrice < 200 && (
              <button
                onClick={() => handleFilterChange("maxPrice", 200)}
                className="inline-flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full text-sm text-gray-200"
                aria-label="Remover filtro preço"
              >
                Até €{filters.maxPrice} <span className="text-gray-400">×</span>
              </button>
            )}
            {(filters.category !== "Todos" || filters.platform || filters.type || (filters.maxPrice && filters.maxPrice < 200)) && (
              <button
                onClick={() => {
                  handleFilterChange("category", "Todos");
                  handleFilterChange("platform", "");
                  handleFilterChange("type", "");
                  handleFilterChange("maxPrice", 200);
                }}
                className="ml-2 text-sm text-gray-300 bg-gray-800 px-3 py-1 rounded-full"
              >
                Limpar filtros
              </button>
            )}
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
      </div>
      <Footer />
    </div>
  );
}
