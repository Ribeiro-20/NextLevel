import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Search, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function SearchModal({ isOpen, onClose, initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [active, setActive] = useState(0);
  const [allGames, setAllGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery || "");
      setActive(0);
      setTimeout(() => inputRef.current?.focus?.(), 10);
    }
  }, [isOpen, initialQuery]);

  // ensure we only portal on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // When modal opens, fetch latest games from Firestore once and store locally
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const fetchGames = async () => {
      setLoading(true);
      setError(null);
      try {
        const col = collection(db, "games");
        const snap = await getDocs(col);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (!cancelled) setAllGames(list);
      } catch (err) {
        console.error("Erro ao carregar jogos do Firestore:", err);
        if (!cancelled) setError("Erro ao carregar jogos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchGames();
    return () => { cancelled = true; };
  }, [isOpen]);

  // filter client-side from the fetched allGames
  useEffect(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) {
      setResults(allGames.slice(0, 12));
      setActive(0);
      return;
    }
    const r = allGames.filter(g => ((g.title || g.name || "") + " " + (g.category || g.genre || "") + " " + (g.description || "") ).toLowerCase().includes(q));
    setResults(r.slice(0, 24));
    setActive(0);
  }, [query, allGames]);

  useEffect(() => {
    const onKey = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive(a => Math.min(a + 1, Math.max(0, results.length - 1)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(a => Math.max(a - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const sel = results[active];
        if (sel) {
          onClose();
          navigate(`/game/${sel.id}`);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, results, active, navigate, onClose]);

  const handleSelect = (g) => {
    onClose();
    navigate(`/game/${g.id}`);
  };

  // render modal into document.body to escape parent stacking contexts
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="search-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-start md:items-center justify-center p-4 md:p-8 pt-20 md:pt-12"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

          <motion.div
            initial={{ y: -30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.95 }}
            className="relative z-50 w-full max-w-6xl bg-gradient-to-b from-gray-900 to-gray-950 rounded-3xl shadow-2xl overflow-hidden border border-gray-700/50"
          >
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-gray-700/50 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
              <Search size={24} className="text-purple-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Procurar jogos..." 
                className="flex-1 bg-transparent text-white placeholder-gray-500 px-2 py-2 text-base md:text-lg focus:outline-none"
                aria-label="Pesquisar jogos"
              />
              <button 
                onClick={onClose} 
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                aria-label="Fechar busca"
              >
                <X size={24} />
              </button>
            </div>

            {/* Resultados */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 max-h-[60vh] overflow-y-auto">
              {/* Grid de Jogos */}
              <div className="lg:col-span-3">
                {error ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full text-red-400 p-8 text-center"
                  >
                    Erro ao carregar jogos
                  </motion.div>
                ) : loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-gray-800 rounded-xl h-48 animate-pulse"
                      />
                    ))}
                  </div>
                ) : results.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="col-span-full text-center py-12"
                  >
                    <Zap size={40} className="mx-auto text-gray-600 mb-3 opacity-50" />
                    <p className="text-gray-400 text-lg">Nenhum resultado encontrado</p>
                    <p className="text-gray-600 text-sm mt-2">Tente outra busca</p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                  >
                    {results.map((g, i) => (
                      <motion.button
                        key={g.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => handleSelect(g)}
                        onMouseEnter={() => setActive(i)}
                        className={`group relative overflow-hidden rounded-xl transition-all transform hover:scale-105 ${
                          i === active ? 'ring-2 ring-purple-500 scale-105' : ''
                        }`}
                      >
                        {/* Background Image */}
                        <img
                          src={g.banner || g.img}
                          alt={g.title || g.name}
                          className="w-full h-40 sm:h-48 object-cover"
                        />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          <div className="text-white font-bold text-sm line-clamp-2">{g.title || g.name}</div>
                          <div className="text-purple-300 text-xs mt-1">€ {(g.price || 0).toFixed(2)}</div>
                        </div>

                        {/* Badge */}
                        {g.promo > 0 && (
                          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            -{g.promo}%
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Preview Sidebar */}
              <aside className="hidden lg:block">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="sticky top-0 max-h-[calc(60vh-50px)] overflow-y-auto"
                >
                  {results[active] ? (
                    <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-xl p-4 border border-gray-700/50 backdrop-blur">
                      {/* Imagem */}
                      <img
                        src={results[active].banner || results[active].img}
                        alt={results[active].title || results[active].name}
                        className="w-full h-40 object-cover rounded-lg mb-4"
                      />

                      {/* Info */}
                      <div>
                        <h3 className="text-white font-bold text-lg line-clamp-2">
                          {results[active].title || results[active].name}
                        </h3>

                        {/* Categoria */}
                        <div className="mt-2">
                          <p className="text-purple-400 text-sm font-semibold">
                            {results[active].genre || results[active].category}
                          </p>
                        </div>

                        {/* Descrição */}
                        <p className="mt-3 text-sm text-gray-300 line-clamp-3">
                          {results[active].description || "Sem descrição disponível"}
                        </p>

                        {/* Preço */}
                        <div className="mt-4 flex items-center gap-2">
                          <span className="text-2xl font-bold text-white">
                            €{(results[active].price || 0).toFixed(2)}
                          </span>
                          {results[active].promo > 0 && (
                            <span className="text-sm text-gray-400 line-through">
                              €{(results[active].price || 0).toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Trailer */}
                        {results[active].trailer && (
                          <div className="mt-4 rounded-lg overflow-hidden">
                            <iframe
                              src={results[active].trailer}
                              title="preview"
                              className="w-full h-24 rounded-lg"
                              frameBorder="0"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                            />
                          </div>
                        )}

                        {/* CTA */}
                        <button
                          onClick={() => handleSelect(results[active])}
                          className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 rounded-lg transition transform hover:scale-105"
                        >
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 text-center text-gray-400 h-full flex items-center justify-center">
                      Selecione um resultado
                    </div>
                  )}
                </motion.div>
              </aside>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
