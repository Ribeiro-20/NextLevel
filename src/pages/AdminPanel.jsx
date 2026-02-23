// src/pages/AdminPanel.jsx
import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {collection,getDocs,addDoc,deleteDoc,doc,updateDoc,} from "firebase/firestore";
import { Dialog } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  Users,
  Gamepad2,
  Shield,
  AlertTriangle,
  LayoutDashboard,
  BarChart3,
  Settings,
  Menu,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function AdminPanel() {
  const [tab, setTab] = useState("games");
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const itemsPerPage = 10;

  // Buscar dados com loading
  async function loadGames() {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "games"));
      setGames(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error("Erro ao carregar jogos: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "users"));
      setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error("Erro ao carregar usuários: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGames();
    loadUsers();
  }, []);

  // 🔹 Filtrar dados com busca
  const filteredGames = useMemo(() => {
    return games.filter((game) =>
      (game.title || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (game.category || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [games, searchQuery]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.displayName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // 🔹 Paginação
  const paginatedGames = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredGames.slice(start, start + itemsPerPage);
  }, [filteredGames, currentPage]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  // 🔹 Exportar CSV (dados filtrados de acordo com o separador ativo)
  const csvEscape = (val) => {
    if (val === undefined || val === null) return "\"\"";
    const s = String(val);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const toCSV = (rows, headers) => {
    const head = headers.map((h) => csvEscape(h.label)).join(",");
    const body = rows
      .map((row) => headers.map((h) => csvEscape(row[h.key])).join(","))
      .join("\n");
    return `${head}\n${body}`;
  };

  function formatDateYMD(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  }

  function handleExport() {
    try {
      const isGames = tab === "games";
      const data = isGames ? filteredGames : filteredUsers;
      if (!data || data.length === 0) {
        toast.error("Sem dados para exportar.");
        return;
      }

      if (isGames) {
        const headers = [
          { key: "id", label: "ID" },
          { key: "title", label: "Título" },
          { key: "category", label: "Categoria" },
          { key: "type", label: "Tipo" },
          { key: "price", label: "Preço" },
          { key: "promo", label: "Promo (%)" },
          { key: "rating", label: "Rating" },
          { key: "platform", label: "Plataformas" },
          { key: "featured", label: "Destaque" },
          { key: "publisher", label: "Publisher" },
          { key: "developer", label: "Developer" },
          { key: "trailer", label: "Trailer" },
        ];
        const rows = data.map((g) => ({
          id: g.id,
          title: g.title || "",
          category: g.category || "",
          type: g.type || "",
          price: Number(g.price ?? 0),
          promo: Number(g.promo ?? 0),
          rating: Number(g.rating ?? 0),
          platform: Array.isArray(g.platform) ? g.platform.join("|") : (g.platform || ""),
          featured: g.featured ? "sim" : "não",
          publisher: g.publisher || "",
          developer: g.developer || "",
          trailer: g.trailer || "",
        }));
        const csv = toCSV(rows, headers);
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `games-${formatDateYMD()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Exportação de jogos iniciada.");
      } else {
        const headers = [
          { key: "id", label: "ID" },
          { key: "displayName", label: "Nome" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "avatar", label: "Avatar" },
        ];
        const rows = data.map((u) => ({
          id: u.id,
          displayName: u.displayName || "",
          email: u.email || "",
          role: u.role || "user",
          avatar: u.avatar || "",
        }));
        const csv = toCSV(rows, headers);
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users-${formatDateYMD()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Exportação de utilizadores iniciada.");
      }
    } catch (err) {
      console.error("Erro ao exportar:", err);
      toast.error("Erro ao exportar.");
    }
  }

  // 🔹 Abrir modal
  function openModal(item = null, type) {
    if (type === "game") {
      setEditingGame(item);
      setEditingUser(null);
      setFormData(
        item
          ? {
              ...item,
              images: item.images?.join(", ") || "",
              platform: item.platform?.join(", ") || "",
            }
          : {
              title: "",
              banner: "",
              images: "",
              category: "",
              description: "",
              developer: "",
              publisher: "",
              platform: "",
              type: "Jogo",
              price: "",
              promo: 0,
              rating: 0,
              trailer: "",
              featured: false,
            }
      );
    } else {
      setEditingUser(item);
      setEditingGame(null);
      setFormData(
        item || {
          displayName: "",
          email: "",
          role: "user",
          avatar: "",
        }
      );
    }
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setEditingGame(null);
    setEditingUser(null);
    setFormData({});
  }

  // 🔹 Salvar com validações
  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editingGame || tab === "games") {
        if (!formData.title || !formData.price) {
          toast.error("Título e preço são obrigatórios!");
          return;
        }
        const data = {
          ...formData,
          price: parseFloat(formData.price) || 0,
          promo: parseFloat(formData.promo) || 0,
          rating: parseFloat(formData.rating) || 0,
          featured: Boolean(formData.featured),
          images: formData.images
            ? formData.images.split(",").map((i) => i.trim())
            : [],
          platform: formData.platform
            ? formData.platform.split(",").map((p) => p.trim())
            : [],
        };

        if (editingGame) {
          await updateDoc(doc(db, "games", editingGame.id), data);
          toast.success("Jogo atualizado!");
        } else {
          await addDoc(collection(db, "games"), data);
          toast.success("Novo jogo adicionado!");
        }
        await loadGames();
      } else if (editingUser || tab === "users") {
        if (!formData.email) {
          toast.error("Email é obrigatório!");
          return;
        }
        const data = {
          displayName: formData.displayName || "",
          email: formData.email || "",
          role: formData.role || "user",
          avatar: formData.avatar || "",
        };

        if (editingUser) {
          await updateDoc(doc(db, "users", editingUser.id), data);
          toast.success("Usuário atualizado!");
        } else {
          await addDoc(collection(db, "users"), data);
          toast.success("Novo usuário adicionado!");
        }
        await loadUsers();
      }
      closeModal();
    } catch (err) {
      toast.error("Erro ao salvar: " + (err.message || err));
    }
  }

  // 🔹 Deletar com confirmação
  async function handleDeleteGame(id) {
    if (window.confirm("Apagar este jogo?")) {
      try {
        await deleteDoc(doc(db, "games", id));
        toast.success("Jogo deletado!");
        await loadGames();
      } catch (err) {
        toast.error("Erro ao deletar jogo: " + (err?.message || err));
      }
    }
  }

  async function handleDeleteUser(id) {
    if (window.confirm("Apagar este usuário?")) {
      try {
        await deleteDoc(doc(db, "users", id));
        toast.success("Usuário deletado!");
        await loadUsers();
      } catch (err) {
        toast.error("Erro ao deletar usuário: " + (err?.message || err));
      }
    }
  }

  // 🔹 Renderizar campos
  function renderFields() {
    if (tab === "games") {
      const gameFields = [
        "title",
        "banner",
        "images",
        "category",
        "description",
        "developer",
        "publisher",
        "platform",
        "type",
        "price",
        "promo",
        "rating",
        "trailer",
        "featured",
      ];

      return gameFields.map((field) => (
        <motion.div
          key={field}
          className="flex flex-col"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <label className="text-sm font-medium text-gray-200 capitalize mb-1">
            {field}
          </label>

          {field === "featured" ? (
            <select
              value={String(formData.featured || false)}
              onChange={(e) =>
                setFormData({ ...formData, featured: e.target.value === "true" })
              }
              className="bg-gray-800 text-white border border-gray-600 rounded-lg p-2 focus:border-purple-500 focus:outline-none"
            >
              <option value="false">Não</option>
              <option value="true">Sim</option>
            </select>
          ) : field === "type" ? (
            <select
              value={formData.type || "Jogo"}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="bg-gray-800 text-white border border-gray-600 rounded-lg p-2 focus:border-purple-500 focus:outline-none"
            >
              <option value="Jogo">Jogo</option>
              <option value="Gift Card">Gift Card</option>
              <option value="Key">Key</option>
            </select>
          ) : (
            <input
              type={field === "price" || field === "promo" || field === "rating" ? "number" : "text"}
              value={formData[field] ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, [field]: e.target.value })
              }
              className="bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-2 focus:border-purple-500 focus:outline-none"
              placeholder={`Digite ${field}`}
            />
          )}
        </motion.div>
      ));
    } else {
      const userFields = ["displayName", "email", "role", "avatar"];
      return userFields.map((field) => (
        <motion.div
          key={field}
          className="flex flex-col"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <label className="text-sm font-medium text-gray-200 capitalize mb-1">
            {field}
          </label>
          {field === "role" ? (
            <select
              value={formData.role || "user"}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="bg-gray-800 text-white border border-gray-600 rounded-lg p-2 focus:border-purple-500 focus:outline-none"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          ) : (
            <input
              type="text"
              value={formData[field] ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, [field]: e.target.value })
              }
              className="bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-2 focus:border-purple-500 focus:outline-none"
              placeholder={`Digite ${field}`}
            />
          )}
        </motion.div>
      ));
    }
  }

  // Skeleton loader
  const SkeletonCard = () => (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg animate-pulse">
      <div className="w-full h-40 bg-gray-700 rounded mb-2"></div>
      <div className="h-6 bg-gray-700 rounded mb-1"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2 mb-1"></div>
      <div className="h-5 bg-gray-700 rounded w-1/3"></div>
    </div>
  );

  const totalPages = Math.max(
    1,
    Math.ceil((tab === "games" ? filteredGames.length : filteredUsers.length) / itemsPerPage)
  );

  // Estatísticas
  const stats = {
    totalGames: games.length,
    totalUsers: users.length,
    featuredGames: games.filter((g) => g.featured).length,
    adminUsers: users.filter((u) => u.role === "admin").length,
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "games", label: "Jogos", icon: Gamepad2 },
    { id: "users", label: "Utilizadores", icon: Users },
    { id: "stats", label: "Estatísticas", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
      <Toaster position="top-right" />

      {/* Sidebar - Desktop */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="hidden lg:flex w-72 bg-gray-900/80 backdrop-blur-xl border-r border-gray-700/50 flex-col"
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Admin Panel</h2>
              <p className="text-xs text-gray-400">NextLevel Manager</p>
            </div>
          </div>
        </div>

        {/* Menu de navegação */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  setCurrentPage(1);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
                whileHover={{ x: isActive ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Stats Cards na Sidebar */}
        <div className="p-4 border-t border-gray-700/50 space-y-3">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 p-3 rounded-lg border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total Jogos</p>
                <p className="text-2xl font-bold text-blue-400">{stats.totalGames}</p>
              </div>
              <Gamepad2 className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 p-3 rounded-lg border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-purple-400">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Footer da Sidebar */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span>Cuidado ao editar dados</span>
          </div>
        </div>
      </motion.aside>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-gray-900 z-50 flex flex-col shadow-2xl"
            >
              {/* Mobile Header */}
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Admin Panel</h2>
                    <p className="text-xs text-gray-400">NextLevel</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Menu Mobile */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTab(item.id);
                        setCurrentPage(1);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Stats Mobile */}
              <div className="p-4 border-t border-gray-700 space-y-3">
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Jogos</p>
                      <p className="text-xl font-bold text-blue-400">{stats.totalGames}</p>
                    </div>
                    <Gamepad2 className="w-6 h-6 text-blue-400 opacity-50" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Users</p>
                      <p className="text-xl font-bold text-purple-400">{stats.totalUsers}</p>
                    </div>
                    <Users className="w-6 h-6 text-purple-400 opacity-50" />
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-700/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition"
              >
                <Menu className="w-6 h-6 text-gray-300" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {tab === "dashboard"
                    ? "Dashboard"
                    : tab === "games"
                    ? "Gestão de Jogos"
                    : tab === "users"
                    ? "Gestão de Utilizadores"
                    : "Estatísticas"}
                </h1>
                <p className="text-sm text-gray-400">
                  {tab === "dashboard"
                    ? "Visão geral do sistema"
                    : tab === "games"
                    ? `${filteredGames.length} ${filteredGames.length === 1 ? "jogo" : "jogos"}`
                    : tab === "users"
                    ? `${filteredUsers.length} ${filteredUsers.length === 1 ? "utilizador" : "utilizadores"}`
                    : "Análise de dados"}
                </p>
              </div>
            </div>

            {/* Ações rápidas */}
            {(tab === "games" || tab === "users") && (
              <div className="flex gap-2">
                <motion.button
                  onClick={() => openModal(null, tab === "games" ? "game" : "user")}
                  className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition flex items-center gap-2 shadow-lg text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Novo</span>
                </motion.button>
                <motion.button
                  onClick={handleExport}
                  className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition flex items-center gap-2 text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download size={18} />
                  <span className="hidden sm:inline">Exportar</span>
                </motion.button>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {tab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 p-6 rounded-xl border border-blue-500/30"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-400 text-sm font-medium">Total Jogos</h3>
                    <Gamepad2 className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-4xl font-bold text-white">{stats.totalGames}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.featuredGames} em destaque</p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 p-6 rounded-xl border border-purple-500/30"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-400 text-sm font-medium">Utilizadores</h3>
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-4xl font-bold text-white">{stats.totalUsers}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.adminUsers} admins</p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-green-600/20 to-green-800/20 p-6 rounded-xl border border-green-500/30"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-400 text-sm font-medium">Destaques</h3>
                    <Shield className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-4xl font-bold text-white">{stats.featuredGames}</p>
                  <p className="text-xs text-gray-500 mt-1">Jogos em destaque</p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 p-6 rounded-xl border border-pink-500/30"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-400 text-sm font-medium">Administradores</h3>
                    <Settings className="w-8 h-8 text-pink-400" />
                  </div>
                  <p className="text-4xl font-bold text-white">{stats.adminUsers}</p>
                  <p className="text-xs text-gray-500 mt-1">Com acesso total</p>
                </motion.div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50">
                <h2 className="text-xl font-bold text-white mb-4">Ações Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setTab("games")}
                    className="p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition text-left group"
                  >
                    <Gamepad2 className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition" />
                    <h3 className="text-white font-semibold">Gerir Jogos</h3>
                    <p className="text-sm text-gray-400">Adicionar, editar ou remover jogos</p>
                  </button>
                  <button
                    onClick={() => setTab("users")}
                    className="p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition text-left group"
                  >
                    <Users className="w-8 h-8 text-purple-400 mb-2 group-hover:scale-110 transition" />
                    <h3 className="text-white font-semibold">Gerir Utilizadores</h3>
                    <p className="text-sm text-gray-400">Ver e editar utilizadores</p>
                  </button>
                  <button
                    onClick={() => setTab("stats")}
                    className="p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition text-left group"
                  >
                    <BarChart3 className="w-8 h-8 text-green-400 mb-2 group-hover:scale-110 transition" />
                    <h3 className="text-white font-semibold">Ver Estatísticas</h3>
                    <p className="text-sm text-gray-400">Análise detalhada de dados</p>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "stats" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50">
                  <h3 className="text-xl font-bold text-white mb-4">Distribuição de Jogos</h3>
                  <div className="space-y-3">
                    {Array.from(new Set(games.map((g) => g.category))).map((cat) => {
                      const count = games.filter((g) => g.category === cat).length;
                      const percentage = ((count / games.length) * 100).toFixed(1);
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">{cat || "Sem categoria"}</span>
                            <span className="text-gray-400">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50">
                  <h3 className="text-xl font-bold text-white mb-4">Roles dos Utilizadores</h3>
                  <div className="space-y-3">
                    {["admin", "user"].map((role) => {
                      const count = users.filter((u) => u.role === role).length;
                      const percentage = users.length > 0 ? ((count / users.length) * 100).toFixed(1) : 0;
                      return (
                        <div key={role}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300 capitalize">{role}</span>
                            <span className="text-gray-400">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "games" && (
            <>
              {/* Search Bar */}
              <div className="mb-6">
                <div className="flex items-center bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700/50">
                  <Search className="text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar jogos por título ou categoria..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-white px-3 py-1 w-full focus:outline-none placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Games Grid */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                ) : paginatedGames.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Nenhum jogo encontrado</p>
                  </div>
                ) : (
                  paginatedGames.map((game) => (
                    <motion.div
                      key={game.id}
                      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-purple-500/50 transition-all group"
                      whileHover={{ y: -4 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {game.banner ? (
                        <div className="relative overflow-hidden">
                          <img
                            src={game.banner}
                            alt={game.title}
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {game.featured && (
                            <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                              ⭐ Destaque
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gray-700/50 flex items-center justify-center">
                          <Gamepad2 className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-white mb-1 truncate">{game.title}</h3>
                        <p className="text-sm text-gray-400 mb-2">{game.category}</p>
                        <p className="font-bold text-green-400 text-xl mb-3">€ {Number(game.price || 0).toFixed(2)}</p>
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => openModal(game, "game")}
                            className="flex-1 bg-blue-600 px-3 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1 text-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Edit size={16} />
                            Editar
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteGame(game.id)}
                            className="flex-1 bg-red-600 px-3 py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-1 text-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Trash2 size={16} />
                            Apagar
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-lg transition"
                  >
                    Anterior
                  </button>
                  <div className="px-4 py-2 bg-gray-800 rounded-lg text-gray-300">
                    Página {currentPage} de {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-lg transition"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}

          {tab === "users" && (
            <>
              {/* Search Bar */}
              <div className="mb-6">
                <div className="flex items-center bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700/50">
                  <Search className="text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar utilizadores por nome ou email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-white px-3 py-1 w-full focus:outline-none placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="py-4 px-6 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Utilizador
                        </th>
                        <th className="py-4 px-6 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="py-4 px-6 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="py-4 px-6 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                                <div className="h-4 bg-gray-700 rounded w-24"></div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="h-4 bg-gray-700 rounded w-32"></div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="h-4 bg-gray-700 rounded w-16"></div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="h-4 bg-gray-700 rounded w-20 ml-auto"></div>
                            </td>
                          </tr>
                        ))
                      ) : paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center">
                            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">Nenhum utilizador encontrado</p>
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-700/30 transition">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <img
                                  src={u.avatar || "/default-avatar.png"}
                                  alt={u.displayName || u.email}
                                  className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-600"
                                />
                                <span className="text-white font-medium">{u.displayName || "-"}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-gray-300">{u.email}</td>
                            <td className="py-4 px-6">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  u.role === "admin"
                                    ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                                    : "bg-gray-600/20 text-gray-400 border border-gray-500/30"
                                }`}
                              >
                                {u.role === "admin" ? "👑 Admin" : "🎮 User"}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => openModal(u, "user")}
                                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition text-sm flex items-center gap-1"
                                >
                                  <Edit size={14} />
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition text-sm flex items-center gap-1"
                                >
                                  <Trash2 size={14} />
                                  Apagar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-lg transition"
                  >
                    Anterior
                  </button>
                  <div className="px-4 py-2 bg-gray-800 rounded-lg text-gray-300">
                    Página {currentPage} de {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-lg transition"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal (Headless UI) */}
      <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl">
            <Dialog.Title className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {editingGame
                ? "Editar Jogo"
                : editingUser
                ? "Editar Utilizador"
                : `Novo ${tab === "games" ? "Jogo" : "Utilizador"}`}
            </Dialog.Title>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderFields()}

              <div className="md:col-span-2 flex justify-end gap-3 mt-6 pt-6 border-t border-gray-700/50">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition shadow-lg"
                >
                  {editingGame || editingUser ? "Salvar Alterações" : "Adicionar"}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
