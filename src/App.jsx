// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

import Header from "./components/Header";
import FloatingCart from "./components/FloatingCart";
import Home from "./pages/Home";
import Games from "./pages/Games";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Checkout from "./pages/Checkout";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import GameDetail from "./pages/GameDetail";
import AdminRoute from "./pages/AdminRoute";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

function AppContent() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]); // ids do carrinho
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const snap = await getDoc(userRef);
          const userData = snap.exists() ? snap.data() : {};
          // junta dados do Auth com dados do Firestore
          setUser({ ...currentUser, ...userData });
          setCart(userData.carrinho || []);
        } catch (err) {
          console.error("Erro ao carregar dados do usuário:", err);
          setUser(currentUser);
        }
      } else {
        setUser(null);
        setCart([]); // Garantir que o carrinho seja limpo
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-white text-center mt-10">Carregando...</div>;

  const PrivateRoute = ({ children }) => (user ? children : <Navigate to="/login" />);

  return (
    <>
      {/* Header global (oculto no admin) */}
      {!location.pathname.startsWith("/admin") && (
        <Header user={user} setUser={setUser} setCart={setCart} onSearch={setSearchQuery} />
      )}

      {/* FloatingCart - sempre visível exceto no admin */}
      {!location.pathname.startsWith("/admin") && user && (
        <FloatingCart user={user} />
      )}

      <Routes>
        <Route
          path="/"
          element={
            <Home
              user={user}
              setUser={setUser}
              cart={cart}
              setCart={setCart}
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
            />
          }
        />

        <Route
          path="/games"
          element={
            <Games
              user={user}
              setCart={setCart}
              searchQuery={searchQuery}
            />
          }
        />

        <Route path="/game/:id" element={<GameDetail user={user} setCart={setCart} />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<SignUp setUser={setUser} />} />
        <Route path="/favorites" element={<Favorites user={user} />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile user={user} setUser={setUser} />
            </PrivateRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <PrivateRoute>
              <Checkout user={user} setCart={setCart} />
            </PrivateRoute>
          }
        />

        <Route path="/admin" element={<AdminRoute />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
