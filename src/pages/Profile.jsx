import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { updateEmail, updatePassword } from "firebase/auth";
import Footer from "../components/Footer";
import GameCard from "../components/GameCard";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Camera,
  Settings,
  Heart,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function Profile({ user, setUser }) {
  const [favorites, setFavorites] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAvatar, setEditAvatar] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editUpdating, setEditUpdating] = useState(false);
  
  

  useEffect(() => {
    if (!user) return;

    async function fetchProfile() {
      setLoading(true);
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return;

        const userData = snap.data();
        setAvatarUrl(userData.avatar || "https://i.pravatar.cc/150");
        setNewAvatarUrl(userData.avatar || "");

        // Deduplicate favorite IDs to avoid duplicate display
        const favoriteIds = Array.from(new Set((userData.favoritos || []).filter(Boolean)));
        const favGames = [];
        for (let id of favoriteIds) {
          const docRef = doc(db, "games", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) favGames.push({ id: docSnap.id, ...docSnap.data() });
        }
        setFavorites(favGames);
        // Fetch recent orders for this user (by customer_email)
        try {
          setOrdersLoading(true);
          const ordersCol = collection(db, "orders");
          const q = query(ordersCol, where("customer_email", "==", user.email), orderBy("created", "desc"));
          const snap = await getDocs(q);
          const map = new Map();
          snap.forEach(d => {
            if (!map.has(d.id)) map.set(d.id, { id: d.id, ...d.data() });
          });
          setOrders(Array.from(map.values()));
        } catch (ordErr) {
          console.error('Erro ao buscar pedidos:', ordErr);
        } finally {
          setOrdersLoading(false);
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar perfil.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  // Avatar file deletion/upload handled elsewhere; debug upload removed.

  const handleAvatarSave = async () => {
    if (!newAvatarUrl.trim()) {
      toast.error("Insira uma URL válida para o avatar!");
      return;
    }
    setUpdating(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { avatar: newAvatarUrl });
      setAvatarUrl(newAvatarUrl);
      setUser(prev => ({ ...prev, avatar: newAvatarUrl }));
      toast.success("Avatar atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar avatar.");
    } finally {
      setUpdating(false);
    }
  };


  // Skeleton loader para favoritos
  const SkeletonCard = () => (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg animate-pulse">
      <div className="w-full h-40 bg-gray-700 rounded mb-2"></div>
      <div className="h-6 bg-gray-700 rounded mb-1"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2 mb-1"></div>
      <div className="h-5 bg-gray-700 rounded w-1/3"></div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <Toaster position="top-right" />
      <main className="flex-1 p-6">
        {loading ? (
          <motion.div
            className="flex justify-center items-center min-h-[50vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
            <span className="ml-2 text-gray-400">Carregando perfil...</span>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column: Avatar + settings */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <motion.section
                  className="flex flex-col items-center gap-6 bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <motion.div className="relative" whileHover={{ scale: 1.03 }}>
                    <img
                      src={avatarUrl}
                      alt="Avatar do usuário"
                      className="w-28 h-28 rounded-full object-cover border-4 border-purple-500 shadow-lg"
                    />
                    <Camera className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full text-white shadow-lg" />
                  </motion.div>
                    <div className="w-full">
                    <input
                      type="text"
                      placeholder="Cole a URL do avatar"
                      value={newAvatarUrl}
                      onChange={(e) => setNewAvatarUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      aria-label="URL do avatar"
                    />
                      {/* file upload removed (CORS issues) — use URL field above to set avatar for now */}
                    <motion.button
                      onClick={handleAvatarSave}
                      disabled={updating}
                      className="mt-3 w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50 shadow"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Salvar avatar"
                    >
                      {updating ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      {updating ? "Salvando..." : "Salvar Avatar"}
                    </motion.button>
                    
                      <motion.button
                        onClick={() => {
                          // open edit modal prefilled with current values
                          setEditAvatar(newAvatarUrl || avatarUrl || "");
                          setEditEmail(user ? user.email || "" : "");
                          setEditPassword("");
                          setShowEditModal(true);
                        }}
                        className="mt-3 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg flex justify-center items-center gap-2 shadow"
                      >
                        Editar Perfil
                      </motion.button>
                      {/* debug UI removed */}
                  </div>
                </motion.section>

                {/* Configurações removed per user request */}
              </div>

              {/* Right column: Favorites + Orders */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <motion.section
                  className=""
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-3xl font-bold mb-4 flex items-center gap-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    <Heart className="text-red-500" /> Favoritos
                  </h3>
                  {favorites.length === 0 ? (
                    <motion.div className="text-center text-gray-400 py-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Heart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <p className="text-lg">Nenhum favorito ainda 💔</p>
                      <p className="text-sm">Adicione jogos aos seus favoritos para vê-los aqui!</p>
                    </motion.div>
                  ) : (
                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                      {favorites.map((game, index) => (
                        <motion.div key={game.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                          <GameCard game={game} user={user} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </motion.section>

                <motion.section
                  className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-3xl font-bold mb-4 flex items-center gap-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    <Settings className="text-purple-500" /> Pedidos
                  </h3>
                  {ordersLoading ? (
                    <div className="text-gray-400">Carregando pedidos...</div>
                  ) : orders.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 rounded-md">
                      <p className="text-lg">Nenhum pedido encontrado</p>
                      <p className="text-sm">Compre algo para vê-lo listado aqui depois.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {orders.map((o) => (
                        <div key={o.id} className="p-4 bg-gray-900 rounded-lg border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white font-semibold">#</div>
                            <div>
                              <div className="text-sm text-gray-400">ID: <span className="text-gray-200">{o.id}</span></div>
                              <div className="text-lg font-semibold mt-1">{(o.amount_total && (o.amount_total/100).toFixed(2)) || '—'}€</div>
                              <div className="text-sm text-gray-400 mt-1">Status: <span className="text-gray-200">{o.payment_status || '—'}</span></div>
                            </div>
                          </div>

                          <div className="flex-1">
                            {o.line_items && o.line_items.length ? (
                              <div className="text-sm text-gray-300">
                                {o.line_items.slice(0,3).map((it, idx) => (
                                  <span key={idx} className="inline-block mr-3">{it.name} x{it.quantity}</span>
                                ))}
                                {o.line_items.length > 3 ? <span className="text-xs text-gray-500"> +{o.line_items.length-3} outros</span> : null}
                              </div>
                            ) : o.stripe_session && o.stripe_session.line_items && o.stripe_session.line_items.data ? (
                              <div className="text-sm text-gray-300">
                                {o.stripe_session.line_items.data.slice(0,3).map((li, idx) => (
                                  <span key={idx} className="inline-block mr-3">{(li.description || (li.price && (li.price.product && li.price.product.name)) || 'Item')} x{li.quantity}</span>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">Sem detalhes do item</div>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <a href={`/success?session_id=${o.id}`} className="text-xs bg-purple-600 text-white px-3 py-2 rounded-lg">Ver detalhes</a>
                            <div className="text-xs text-gray-400">{o.created && o.created.toDate ? o.created.toDate().toLocaleString() : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.section>
              </div>
            </div>

            {/* Removed duplicate Favorites and Orders sections (now using the grid layout above) */}
          </>
        )}
      </main>

      <Footer />

      {/* Edit Profile Modal */}
      {showEditModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-xl bg-gray-900 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Editar Perfil</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Avatar URL</label>
                <input type="text" value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-700" />
                {/* file upload removed from modal (use Avatar URL field above) */}
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-700" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Nova Senha</label>
                <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-700" />
                <div className="text-xs text-gray-500 mt-1">Deixe em branco para manter a senha atual.</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-lg bg-gray-700 text-white">Cancelar</button>
              <button
                onClick={async () => {
                  setEditUpdating(true);
                  try {
                    // Avatar update
                    if ((editAvatar || "").trim() && editAvatar !== avatarUrl) {
                      const userRef = doc(db, "users", user.uid);
                      await updateDoc(userRef, { avatar: editAvatar });
                      setAvatarUrl(editAvatar);
                      setNewAvatarUrl(editAvatar);
                      setUser(prev => ({ ...prev, avatar: editAvatar }));
                      // previous avatar cleanup omitted
                    }
                    // Email update
                    if ((editEmail || "").trim() && editEmail !== (user ? user.email : "")) {
                      await updateEmail(auth.currentUser, editEmail);
                      toast.success('Email atualizado');
                    }
                    // Password update
                    if ((editPassword || "").trim()) {
                      if (editPassword.length < 6) throw new Error('Senha deve ter pelo menos 6 caracteres');
                      await updatePassword(auth.currentUser, editPassword);
                      toast.success('Senha atualizada');
                    }
                    toast.success('Perfil atualizado');
                    setShowEditModal(false);
                  } catch (err) {
                    console.error('Erro ao salvar edição:', err);
                    toast.error('Erro ao atualizar: ' + (err.message || err));
                  } finally {
                    setEditUpdating(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white disabled:opacity-50"
                disabled={editUpdating}
              >
                {editUpdating ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
