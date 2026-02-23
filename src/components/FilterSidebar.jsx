import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Ui/Button"; // Assumindo que existe; se não, use <button>
import {
  Gamepad2,
  Sword,
  Target,
  Sparkles,
  Grid3x3,
  Gift,
  Key,
  Monitor,
  Joystick,
  BadgeDollarSign,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  X,
} from "lucide-react";

const categories = [
  { name: "Todos", icon: Grid3x3 },
  { name: "RPG", icon: Sparkles },
  { name: "Ação", icon: Sword },
  { name: "FPS", icon: Target },
  { name: "Indie", icon: Gamepad2 },
];

const platforms = [
  { name: "PC", icon: Monitor },
  { name: "PlayStation", icon: Gamepad2 },
  { name: "Xbox", icon: Gamepad2 },
  { name: "Nintendo", icon: Gamepad2 },
  { name: "Steam", icon: Key },
];

const types = [
  { name: "Jogo", icon: Gamepad2 },
  { name: "Gift Card", icon: Gift },
  { name: "Key", icon: Key },
];

export default function FilterSidebar({ filters, onFilterChange, forceDrawer = false }) {
  const [openSections, setOpenSections] = useState({
    categories: false,
    platforms: false,
    types: false,
    price: false,
    sort: false,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sidebarRef = useRef();
  const [isStuck, setIsStuck] = useState(false);
  const innerRef = useRef();
  const [translateY, setTranslateY] = useState(0);
  // collapsed feature temporarily disabled to ensure sticky works reliably
  // const [collapsed, setCollapsed] = useState(false);
  const [topOffset, setTopOffset] = useState(128);
  const [_docScroll, setDocScroll] = useState(0);
  const [rectTop, setRectTop] = useState(0);
  const [scrollRootEl, setScrollRootEl] = useState(null);

  // Calcular dinamicamente a folga (top offset) com base na altura do header
  useEffect(() => {
    const compute = () => {
      try {
        const hdr = document.querySelector("header");
        const h = hdr ? Math.round(hdr.getBoundingClientRect().height) : 96;
        // adiciona uma pequena margem extra para não colar no header
        setTopOffset(h + 8);
      } catch {
        setTopOffset(128);
      }
    };
    compute();
    window.addEventListener("resize", compute);
    // NOTE: scroll listener attached later after detecting scrollRootEl

    // observa mudanças de tamanho do header (quando disponível)
    let ro;
    const hdrEl = document.querySelector("header");
    if (hdrEl && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(compute);
      ro.observe(hdrEl);
    }

    return () => {
      window.removeEventListener("resize", compute);
      if (ro && hdrEl) ro.unobserve(hdrEl);
    };
  }, []);

  // Detect the nearest scroll container (could be window or a scrolling element)
  useEffect(() => {
  const startEl = document.querySelector('main') || sidebarRef.current || document.body;
    const getScrollParent = (el) => {
      let parent = el && el.parentElement;
      while (parent && parent !== document.body) {
        const st = getComputedStyle(parent);
        const overflow = `${st.overflow}${st.overflowY}${st.overflowX}`;
        if (/(auto|scroll)/.test(overflow) && parent.scrollHeight > parent.clientHeight) return parent;
        parent = parent.parentElement;
      }
      return window;
    };
    try {
      const root = getScrollParent(startEl);
      setScrollRootEl(root);
    } catch {
      setScrollRootEl(window);
    }
  }, []);

  // Attach scroll listener to the detected scroll root and keep debug values updated
  useEffect(() => {
    if (!scrollRootEl) return;
    let rafId = null;
    let lastScroll = 0;
    const handle = () => {
      const cur = scrollRootEl === window ? (window.scrollY || window.pageYOffset || 0) : (scrollRootEl.scrollTop || 0);
      lastScroll = cur;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setDocScroll(lastScroll);
        if (sidebarRef.current && typeof sidebarRef.current.getBoundingClientRect === 'function') {
          setRectTop(Math.round(sidebarRef.current.getBoundingClientRect().top));
        }

        // compute transform based on current rectTop so it's robust
        if (innerRef.current && sidebarRef.current) {
          try {
            const rectNow = sidebarRef.current.getBoundingClientRect();
            const rt = Math.round(rectNow.top);
            // translate down when the sidebar top is above the desired topOffset
            let desired = Math.max(0, topOffset - rt);
            // clamp so inner doesn't overflow parent
            const parent = sidebarRef.current.parentElement;
            if (parent) {
              const parentRect = parent.getBoundingClientRect();
              const sideRect = sidebarRef.current.getBoundingClientRect();
              const max = Math.max(0, parentRect.height - sideRect.height - 24);
              if (Number.isFinite(max)) desired = Math.min(desired, max);
            }
            // Use React state to drive the transform so the inspector shows it and React keeps DOM in sync
            setTranslateY((prev) => (prev === desired ? prev : desired));
          } catch {
            // silently ignore transform errors in production
          }
        }
      });
    };

    if (scrollRootEl === window) window.addEventListener('scroll', handle, { passive: true });
    else scrollRootEl.addEventListener('scroll', handle, { passive: true });
    // run once to prime values
    handle();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollRootEl === window) window.removeEventListener('scroll', handle);
      else scrollRootEl.removeEventListener('scroll', handle);
    };
  }, [scrollRootEl, topOffset]);

  // Simple measurement-based stuck detection: when the sidebar's top
  // is <= topOffset, consider it stuck. This avoids IntersectionObserver
  // issues when the scroll container is non-standard.
  useEffect(() => {
    setIsStuck(rectTop <= topOffset);
  }, [rectTop, topOffset]);

  // initialTop removed — translations computed from live rectTop instead
  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Handlers otimizados com useCallback
  const handleSelect = useCallback((group, value) => onFilterChange(group, value), [onFilterChange]);
  const handlePriceChange = useCallback((e) => onFilterChange("maxPrice", Number(e.target.value)), [onFilterChange]);
  const handleSortChange = useCallback((e) => onFilterChange("sort", e.target.value), [onFilterChange]);

  // Limpar filtros
  const handleClearFilters = useCallback(() => {
    onFilterChange("category", "Todos");
    onFilterChange("platform", "");
    onFilterChange("type", "");
    onFilterChange("maxPrice", 200);
    onFilterChange("sort", "");
  }, [onFilterChange]);

  // Verificar se há filtros ativos (para botão de limpar)
  const hasActiveFilters = useMemo(() => {
    return (
      filters.category !== "Todos" ||
      filters.platform !== "" ||
      filters.type !== "" ||
      filters.maxPrice !== 200 ||
      filters.sort !== ""
    );
  }, [filters]);

  // debug UI removed

  const renderSection = (title, items, group, sectionKey) => (
    <div className="mb-3">
      {/* Header do dropdown */}
      <motion.button
        onClick={() => toggleSection(sectionKey)}
        className="w-full bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-2.5 flex items-center justify-between hover:border-purple-600 transition-all duration-300"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wide">
          {title}
        </h3>
        <motion.div
          animate={{ rotate: openSections[sectionKey] ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-purple-400" />
        </motion.div>
      </motion.button>

      {/* Conteúdo do dropdown - compacto com max-height e scroll */}
      <AnimatePresence>
        {openSections[sectionKey] && (
          <motion.div
            className="bg-gray-800/50 border border-gray-700 border-t-0 rounded-b-lg p-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-800"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = filters[group] === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleSelect(group, item.name)}
                    className={`flex items-center gap-1.5 rounded-md transition-all duration-200 p-1.5 text-xs ${
                      isActive
                        ? "bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg"
                        : "text-gray-300 hover:bg-gray-700 bg-gray-800/50"
                    }`}
                    aria-label={`Selecionar ${item.name}`}
                  >
                    <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-white" : "text-purple-400"}`} />
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  const sidebarContent = (
    <div className="mb-6 space-y-3" ref={sidebarRef}>
      <div data-filter-inner ref={innerRef} style={{ transition: 'transform 0.18s cubic-bezier(.2,.8,.2,1)', transform: `translateY(${translateY}px)` }}>
      {/* Header com botão limpar - mais compacto */}
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Joystick className="text-purple-500 h-5 w-5" />
          <h2 className="text-lg font-bold text-gray-100 uppercase tracking-wider">Filtros</h2>
          {hasActiveFilters && (
            <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {/* Contador de filtros ativos */}
            </span>
          )}
        </div>
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              onClick={handleClearFilters}
              className="text-gray-400 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-gray-800"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              title="Limpar todos os filtros"
            >
              <RotateCcw className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Dropdowns individuais - compactos */}
      {renderSection("Categorias", categories, "category", "categories")}
      {renderSection("Plataformas", platforms, "platform", "platforms")}
      {renderSection("Tipo de Produto", types, "type", "types")}

      {/* Ordenar dropdown - compacto */}
      <div className="mb-3">
        <motion.button
          onClick={() => toggleSection("sort")}
          className="w-full bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-2.5 flex items-center justify-between hover:border-purple-600 transition-all duration-300"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wide">
            Ordenar por
          </h3>
          <motion.div
            animate={{ rotate: openSections.sort ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-purple-400" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {openSections.sort && (
            <motion.div
              className="bg-gray-800/50 border border-gray-700 border-t-0 rounded-b-lg p-2"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <select
                value={filters.sort}
                onChange={handleSortChange}
                className="w-full bg-gray-800 text-gray-200 rounded-md p-2 border border-gray-700 focus:border-purple-600 focus:outline-none transition text-xs"
              >
                <option value="">Padrão</option>
                <option value="price-asc">Preço: Menor → Maior</option>
                <option value="price-desc">Preço: Maior → Menor</option>
                <option value="name">Nome (A–Z)</option>
                <option value="promo">Promoções</option>
              </select>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preço máximo - sempre visível e compacto - AGORA EM ÚLTIMO */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-3">
        <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wide flex items-center gap-2 mb-2">
          <BadgeDollarSign className="h-4 w-4 text-purple-400" />
          Preço máximo: {filters.maxPrice || "∞"}€
        </h3>
        <input
          type="range"
          min="0"
          max="200"
          step="5"
          value={filters.maxPrice || 200}
          onChange={handlePriceChange}
          className="w-full h-1.5 accent-purple-600 cursor-pointer"
        />
      </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar - sticky so filters follow while scrolling */}
      {!forceDrawer && (
      <div className="hidden lg:block w-80 relative">
        {/* (sentinel removed) */}
        <div className="relative">
          <div
            className={`relative self-start transition-all duration-300 ease-in-out z-30`} 
            style={{ alignSelf: "start" }}
          >
            <div
              ref={sidebarRef}
              style={{ maxHeight: `calc(100vh - ${topOffset + 24}px)` }}
              className={`w-80 overflow-y-auto pr-2 transition-all duration-300 ease-in-out ${
                isStuck
                  ? "shadow-xl translate-y-2 backdrop-blur-md ring-1 ring-purple-700/10 rounded-lg"
                  : "shadow-lg bg-gradient-to-b from-gray-900/80 to-gray-900/60 rounded-md"
              }`}
            >
              {sidebarContent}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Mobile: floating Filters button + drawer */}
      <div className={forceDrawer ? "" : "lg:hidden"}>
        <div className="fixed left-4 bottom-6 z-40">
          <button
            onClick={() => setDrawerOpen(true)}
            className="bg-purple-600/95 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
            aria-label="Abrir filtros"
          >
            <Joystick className="w-4 h-4" />
            Filtros
          </button>
        </div>

        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                className="fixed inset-0 bg-black/60 z-40"
              />

              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 bottom-0 w-80 bg-gray-900 z-50 p-4 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Filtros</h3>
                  <button onClick={() => setDrawerOpen(false)} className="p-2 rounded hover:bg-gray-800">
                    <X className="w-5 h-5 text-gray-300" />
                  </button>
                </div>
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
