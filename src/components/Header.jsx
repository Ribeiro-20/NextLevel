import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import SearchModal from "./SearchModal";
import {
  ShoppingCart,
  Heart,
  Search,
  LogOut,
  LogIn,
  User,
  Menu,
  X,
  XCircle,
  Settings,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Header({ user, setUser, setCart, onSearch }) {
  const navigate = useNavigate();
  const [isShrunk, setIsShrunk] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Debounced search state
  const [searchTerm, setSearchTerm] = useState("");
  const searchTimerRef = useRef(null);

  // 🔹 Calcular cartCount internamente (correção do problema)
  useEffect(() => {
    if (!user) {
      return;
    }
    const fetchCartCount = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const cart = snap.data().carrinho || [];
          if (setCart) setCart(cart); // Atualizar estado global se disponível
        }
      } catch (err) {
        console.error("Erro ao buscar carrinho:", err);
      }
    };
    fetchCartCount();
  }, [user, setCart]);

  // Debounce onSearch calls to reduce rapid updates while typing
  useEffect(() => {
    if (!onSearch) return; // nothing to do
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchTerm, onSearch]);

  // Search modal state and keyboard shortcut '/'
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      // open modal with '/' when not typing in an input
      if (e.key === "/") {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Shrink header on scroll
  useEffect(() => {
    const onScroll = () => {
      if (typeof window === "undefined") return;
      setIsShrunk(window.scrollY > 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 🔹 Logout direto (sem confirm)
  // Faz o logout e retorna true/false. Não navega — o chamador fecha menus e navega
  async function handleLogout() {
    if (isLoggingOut) return false;
    setIsLoggingOut(true);

    // salvar estado atual para possível restauração
    const prevUser = user;
    let prevCart = [];
    try {
      if (prevUser) {
        const userRef = doc(db, "users", prevUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) prevCart = snap.data().carrinho || [];
      }
    } catch {
      // se falhar ao ler o carrinho, continua — restauração ficará vazia
      prevCart = [];
    }

    // Atualização otimista da UI: limpa imediatamente para refletir logout
    try {
      try {
        setUser(null);
      } catch {
        /* noop */
      }
      if (setCart) setCart([]);

      // tenta efetuar signOut
      await signOut(auth);
      toast.success("Logout realizado com sucesso!");
      return true;
    } catch (err) {
      // em caso de erro, restaurar estado anterior quando possível
      toast.error("Erro ao fazer logout: " + (err?.message || err));
      try {
        if (prevUser) setUser(prevUser);
        if (setCart) setCart(prevCart);
      } catch {
        // noop
      }
      return false;
    } finally {
      setIsLoggingOut(false);
    }
  }

  // 🔹 Toggle menu mobile
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserDropdown = () => setIsUserDropdownOpen(!isUserDropdownOpen);

  return (
    <motion.header
      className={`sticky top-0 z-60 bg-gray-950/95 border-b border-gray-800/50 shadow-2xl transition-all duration-300 ${isShrunk ? 'backdrop-blur-md' : 'backdrop-blur-xl'}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none"></div>
      
      <div className={`max-w-7xl mx-auto px-4 ${isShrunk ? 'py-2' : 'py-4'} relative z-10 transition-all duration-300`}>
        <div className="flex justify-between items-center gap-6">
          {/* 🕹️ Logo - MAIOR */}
          <motion.div
            onClick={() => navigate("/")}
            className="cursor-pointer flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Ir para Home"
          >
            <img
              src="/images/logo.png"
              alt="NextLevel"
              className={`${isShrunk ? 'h-14 md:h-18' : 'h-24 md:h-32'} w-auto object-contain drop-shadow-2xl transition-all duration-300`}
            />
          </motion.div>

          {/* 🔍 Barra de pesquisa MELHORADA - destaque central (most screens) */}
          <div className="hidden sm:flex items-center flex-1 max-w-2xl min-w-0 md:min-w-[280px] justify-center">
            <div className="relative w-full min-w-0 z-50">
              <div className={`relative flex items-center bg-gray-900/95 rounded-2xl px-3 ${isShrunk ? 'py-1' : 'py-2'} border border-gray-700/40 hover:border-purple-500 transition-all duration-200 shadow-sm`}>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center gap-2 text-gray-300 hover:text-white focus:outline-none"
                  aria-label="Abrir busca de jogos"
                >
                  <Search className={`${isShrunk ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  <span className={`text-sm text-gray-400 hidden sm:inline ${isShrunk ? 'opacity-0 sm:opacity-100' : ''}`}>Pesquisar...</span>
                </button>
                <AnimatePresence>
                  {searchTerm && (
                    <motion.button
                      onClick={() => setSearchTerm("")}
                      className="text-gray-400 hover:text-white transition ml-2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <XCircle className="w-5 h-5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

              {/* Search modal */}
              <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} initialQuery={searchTerm} />
          </div>

          {/* 🔗 Ações (desktop & small+) */}
          <div className="hidden sm:flex items-center gap-3">
            {/* search button removed (use single pill in header) */}
            {/* ❤️ Favoritos */}
            <motion.button
              onClick={() => navigate("/favorites")}
              className="relative text-gray-300 hover:text-pink-400 transition p-3 rounded-xl hover:bg-gray-800/80 backdrop-blur-sm group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Favoritos"
              aria-label="Ir para Favoritos"
            >
              <Heart className="w-6 h-6 group-hover:fill-pink-400 transition-all duration-300" />
            </motion.button>

            {/* 👤 Usuário */}
            {user ? (
              <div className="relative">
                <motion.div
                  onClick={toggleUserDropdown}
                  className="flex items-center gap-3 cursor-pointer p-2 pr-4 rounded-xl hover:bg-gray-800/80 backdrop-blur-sm transition group border border-transparent hover:border-purple-500/50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Abrir menu do usuário"
                >
                  <img
                    src={user.avatar || "/default-avatar.png"}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-purple-600 group-hover:border-purple-400 transition shadow-lg"
                  />
                  <div className="hidden lg:block text-left">
                    <p className="text-white text-sm font-semibold">{user.displayName || "Usuário"}</p>
                    <p className="text-gray-400 text-xs">{user.role === "admin" ? "👑 Admin" : "🎮 Jogador"}</p>
                  </div>
                </motion.div>
                
                <AnimatePresence>
                  {isUserDropdownOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-64 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden z-50"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
                        <p className="text-white font-bold text-base">{user.displayName || "Usuário"}</p>
                        <p className="text-gray-400 text-xs truncate mt-1">{user.email}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setIsUserDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-purple-600/20 transition group"
                      >
                        <User size={18} className="text-purple-400 group-hover:text-purple-300" />
                        <span className="text-sm font-medium">Meu Perfil</span>
                      </button>
                      
                      {(user.role === "admin" || user.isAdmin) && (
                        <button
                          onClick={() => {
                            navigate("/admin");
                            setIsUserDropdownOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-purple-600/20 transition group"
                        >
                          <Shield size={18} className="text-yellow-400 group-hover:text-yellow-300" />
                          <span className="text-sm font-medium">Admin Panel</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setIsUserDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-purple-600/20 transition group"
                      >
                        <Settings size={18} className="text-gray-400 group-hover:text-gray-300" />
                        <span className="text-sm font-medium">Configurações</span>
                      </button>
                      
                      <div className="border-t border-gray-700/50"></div>
                      
                      <button
                        onClick={async () => {
                          if (isLoggingOut) return;
                          const ok = await handleLogout();
                          setIsUserDropdownOpen(false);
                          if (ok) navigate("/");
                        }}
                        disabled={isLoggingOut}
                        className={`flex items-center gap-3 w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition group ${isLoggingOut ? "opacity-60 cursor-wait" : ""}`}
                      >
                        <LogOut size={18} className="group-hover:text-red-300" />
                        <span className="text-sm font-medium">{isLoggingOut ? "Saindo..." : "Sair"}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 py-3 rounded-xl text-white text-sm font-semibold transition shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Fazer login"
              >
                <LogIn size={18} /> Entrar
              </motion.button>
            )}
          </div>

          {/* 📱 Menu hambúrguer (mobile) */}
          <motion.button
            onClick={toggleMenu}
            className="md:hidden text-gray-300 hover:text-white transition p-2 rounded-lg hover:bg-gray-800/80"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Abrir menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>
      </div>

      {/* 📱 Menu dropdown (mobile) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="absolute top-full left-0 w-full bg-gray-900/95 backdrop-blur-xl border-t border-gray-800/50 shadow-2xl md:hidden z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* 🔍 Barra de pesquisa (mobile) */}
            <div className="p-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition"></div>
                <div className="relative flex items-center bg-gray-800/80 backdrop-blur-md rounded-xl px-4 py-3 border border-gray-700/50">
                  <Search className="text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Procurar jogos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent text-white px-3 py-1 w-full focus:outline-none placeholder-gray-400 text-sm"
                    aria-label="Buscar jogos"
                  />
                  <AnimatePresence>
                    {searchTerm && (
                      <motion.button
                        onClick={() => setSearchTerm("")}
                        className="text-gray-400 hover:text-white transition"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <XCircle className="w-4 h-4" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* 🔗 Ações (mobile) */}
            <div className="flex flex-col gap-2 p-4 pt-0">
              <motion.button
                onClick={() => {
                  navigate("/favorites");
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 text-gray-300 hover:text-pink-400 transition p-3 rounded-xl hover:bg-gray-800/80 backdrop-blur-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Heart className="w-5 h-5" /> 
                <span className="font-medium">Favoritos</span>
              </motion.button>
              
              {user ? (
                <>
                  <div className="border-t border-gray-800 my-2"></div>
                  
                  <motion.button
                    onClick={() => {
                      navigate("/profile");
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 text-gray-300 hover:text-white transition p-3 rounded-xl hover:bg-gray-800/80 backdrop-blur-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <User className="w-5 h-5" /> 
                    <span className="font-medium">Meu Perfil</span>
                  </motion.button>
                  
                  {(user.role === "admin" || user.isAdmin) && (
                    <motion.button
                      onClick={() => {
                        navigate("/admin");
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 text-gray-300 hover:text-yellow-400 transition p-3 rounded-xl hover:bg-gray-800/80 backdrop-blur-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">Admin Panel</span>
                    </motion.button>
                  )}
                  
                  <motion.button
                    onClick={() => {
                      navigate("/profile");
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 text-gray-300 hover:text-white transition p-3 rounded-xl hover:bg-gray-800/80 backdrop-blur-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Configurações</span>
                  </motion.button>
                  
                  <div className="border-t border-gray-800 my-2"></div>
                  
                  <motion.button
                    onClick={async () => {
                      if (isLoggingOut) return;
                      const ok = await handleLogout();
                      setIsMenuOpen(false);
                      if (ok) navigate("/");
                    }}
                    disabled={isLoggingOut}
                    className={`flex items-center gap-3 text-red-400 hover:text-red-300 transition p-3 rounded-xl hover:bg-red-500/10 backdrop-blur-sm ${isLoggingOut ? "opacity-60 cursor-wait" : ""}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut className="w-5 h-5" /> 
                    <span className="font-medium">{isLoggingOut ? "Saindo..." : "Sair"}</span>
                  </motion.button>
                </>
              ) : (
                <motion.button
                  onClick={() => {
                    navigate("/login");
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-3 rounded-xl text-white font-medium transition shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogIn size={18} /> Entrar
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
