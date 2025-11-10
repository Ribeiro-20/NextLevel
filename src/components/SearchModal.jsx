import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
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
          className="fixed inset-0 z-[9999] flex items-start md:items-center justify-center p-6 md:p-12"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="relative z-50 w-full max-w-5xl bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800"
          >
            <div className="flex items-center gap-3 p-4 border-b border-gray-800">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Procurar jogos, edições, plataformas..."
                className="w-full bg-transparent text-white placeholder-gray-400 px-4 py-3 text-lg focus:outline-none"
                aria-label="Pesquisar jogos"
              />
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                <div className="md:col-span-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {error ? (
                        <div className="col-span-full text-red-400 p-6">{error}</div>
                      ) : loading ? (
                        <div className="col-span-full text-gray-400 p-6">A carregar jogos...</div>
                      ) : results.length === 0 ? (
                        <div className="col-span-full text-gray-400 p-6">Nenhum resultado.</div>
                      ) : (
                    results.map((g, i) => (
                      <button
                        key={g.id}
                        onClick={() => handleSelect(g)}
                        className={`flex flex-col items-start gap-2 p-3 rounded-lg hover:bg-gray-800/60 transition text-left ${i === active ? 'ring-2 ring-offset-2 ring-purple-500' : ''}`}
                        onMouseEnter={() => setActive(i)}
                      >
                        <img src={g.banner || g.img} alt={g.title || g.name} className="w-full h-28 object-cover rounded-md" />
                        <div className="w-full">
                          <div className="text-sm font-semibold text-white truncate">{g.title || g.name}</div>
                          <div className="text-xs text-gray-400">{(g.genre || g.category) ? `${g.genre || g.category}` : ''}</div>
                          <div className="mt-2 text-white font-bold">€ {(g.price || 0).toFixed(2)}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <aside className="hidden md:block md:col-span-1">
                {results[active] ? (
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <img src={results[active].banner || results[active].img} alt={results[active].title || results[active].name} className="w-full h-40 object-cover rounded-md mb-3" />
                    <div className="text-white font-semibold mb-2">{results[active].title || results[active].name}</div>
                    <p className="text-sm text-gray-300 mb-2 line-clamp-3">{results[active].description}</p>
                    {results[active].trailer && (
                      <div className="mt-2">
                        <iframe
                          src={results[active].trailer}
                          title="preview"
                          className="w-full h-32 rounded-md"
                          frameBorder="0"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 text-gray-400">Selecione um resultado para ver detalhes.</div>
                )}
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
