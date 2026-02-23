import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { db } from "../firebase";
import FilterSidebar from "../components/FilterSidebar";
import GameCard from "../components/GameCard";
import Footer from "../components/Footer";

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
        const gameList = gameSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setGames(gameList);
      } catch (err) {
        console.error("Erro ao carregar jogos:", err);
        setError("Erro ao carregar jogos. Verifique sua conexao e tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  return { games, loading, error };
};

export default function Games({ user, setCart, searchQuery = "" }) {
  const { games, loading, error } = useGames();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => setLocalSearch(searchQuery), [searchQuery]);

  const [filters, setFilters] = useState({
    category: "Todos",
    platform: "",
    type: "",
    maxPrice: 200,
    sort: "",
  });

  const handleFilterChange = (group, value) => {
    setFilters((prev) => ({ ...prev, [group]: value }));
  };

  const filteredGames = useMemo(() => {
    const searchTerm = (localSearch || searchQuery || "").toLowerCase();
    const base = games.filter((game) => {
      const matchCategory = filters.category === "Todos" || game.category === filters.category;
      const matchPlatform = !filters.platform || (Array.isArray(game.platform) ? game.platform.includes(filters.platform) : game.platform === filters.platform);
      const matchType = !filters.type || game.type === filters.type;
      const matchPrice = !filters.maxPrice || (game.price || 0) <= filters.maxPrice;
      const matchSearch = (game.title || game.name || "").toLowerCase().includes(searchTerm);
      return matchCategory && matchPlatform && matchType && matchPrice && matchSearch;
    });

    const effectivePrice = (g) => (g.price || 0) * (1 - (g.promo || 0) / 100);

    switch (filters.sort) {
      case "price-asc":
        return [...base].sort((a, b) => effectivePrice(a) - effectivePrice(b));
      case "price-desc":
        return [...base].sort((a, b) => effectivePrice(b) - effectivePrice(a));
      case "name":
        return [...base].sort((a, b) => (a.title || a.name || "").localeCompare(b.title || b.name || ""));
      case "promo":
        return [...base].sort((a, b) => (b.promo || 0) - (a.promo || 0));
      default:
        return base;
    }
  }, [games, filters, localSearch, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <FilterSidebar filters={filters} onFilterChange={handleFilterChange} forceDrawer />

          <div className="flex-1 min-w-0">
            <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-md">
                <div className="flex items-center bg-gray-800 rounded-lg px-4 py-3 border-2 border-gray-700/50 hover:border-purple-600/50 focus-within:border-purple-600 transition-colors">
                  <Search size={18} className="text-gray-400 mr-2" />
                  <input
                    type="search"
                    placeholder="Buscar jogos..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
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
              </div>

              <div className="text-sm text-gray-300">
                {filteredGames.length} jogos encontrados
              </div>
            </div>

            <motion.div
              className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-gray-800 rounded-2xl h-64 animate-pulse" />
                ))
              ) : error ? (
                <motion.p
                  className="col-span-full text-center text-red-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.p>
              ) : filteredGames.length === 0 ? (
                <motion.p
                  className="col-span-full text-center text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Nenhum jogo encontrado. Tente ajustar os filtros.
                </motion.p>
              ) : (
                filteredGames.map((game, index) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                  >
                    <GameCard game={game} user={user} setCart={setCart} />
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
