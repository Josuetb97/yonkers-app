import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/ui/Toast";

import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import BottomNav from "./components/BottomNav";
import Admin from "./pages/admin/Admin";
import RequestNeed from "./pages/RequestNeed";
import MyPieces from "./pages/MyPieces";
import SellerProfile from "./pages/SellerProfile";
import Messages from "./pages/Messages";
import LoginModal from "./components/modals/LoginModal";
import CartDrawer from "./components/CartDrawer";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { useCart } from "./hooks/useCart";

/* =========================
   PROTECTED ROUTE
========================= */
function ProtectedRoute({ user, loading, children }) {
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        Cargando...
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return children;
}

/* =========================
   WRAPPER NAV
========================= */
function AppRoutes({
  tab,
  setTab,
  showBottomNav,
  user,
  loading,
  openLogin,
  cartCount,
  onCartOpen,
}) {
  const navigate = useNavigate();

  function handleTabChange(t) {
    setTab(t);

    if (t === "inicio") navigate("/");

    if (t === "solicitar") {
      if (!user) return openLogin();
      navigate("/request");
    }

    if (t === "autolote") {
      if (!user) return openLogin();
      navigate("/my-pieces");
    }

    if (t === "mensajes") {
      navigate("/messages");
    }

    if (t === "carrito") {
      onCartOpen();
      return;
    }
  }

  return (
    <>
      <Routes>
        {/* HOME */}
        <Route
          path="/"
          element={
            <MainLayout>
              <Home user={user} openLogin={openLogin} />
              {showBottomNav && (
                <BottomNav active={tab} onChange={handleTabChange} cartCount={cartCount} />
              )}
            </MainLayout>
          }
        />

        {/* SOLICITAR */}
        <Route
          path="/request"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <MainLayout>
                <RequestNeed user={user} />
                {showBottomNav && (
                  <BottomNav active={tab} onChange={handleTabChange} cartCount={cartCount} />
                )}
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* AUTOLOTE */}
        <Route
          path="/my-pieces"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <MainLayout>
                <MyPieces user={user} />
                {showBottomNav && (
                  <BottomNav active={tab} onChange={handleTabChange} cartCount={cartCount} />
                )}
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ADMIN PROTEGIDO */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <Admin user={user} />
            </ProtectedRoute>
          }
        />

        {/* MENSAJES / CHATBOT */}
        <Route
          path="/messages"
          element={
            <MainLayout>
              <Messages />
              {showBottomNav && (
                <BottomNav active="mensajes" onChange={handleTabChange} />
              )}
            </MainLayout>
          }
        />

        {/* PERFIL DEL VENDEDOR */}
        <Route
          path="/seller/:ownerId"
          element={
            <MainLayout>
              <SellerProfile user={user} openLogin={openLogin} />
            </MainLayout>
          }
        />

        {/* REDIRIGIR /login y /register al home */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />

        {/* CUALQUIER RUTA NO ENCONTRADA → HOME */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

/* =========================
   APP ROOT
========================= */
/* =========================
   ADMIN SUBDOMAIN GUARD
   Si el usuario entra a admin.yonkersapp.com, lo mandamos a /admin
========================= */
const IS_ADMIN_SUBDOMAIN =
  typeof window !== "undefined" &&
  window.location.hostname === "admin.yonkersapp.com";

export default function App() {
  const [tab, setTab] = useState("inicio");
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { cartItems, removeFromCart, clearCart } = useCart();

  // Redirigir cualquier path del subdominio admin → /admin
  useEffect(() => {
    if (IS_ADMIN_SUBDOMAIN && window.location.pathname !== "/admin") {
      window.location.replace("/admin");
    }
  }, []);

  /* =========================
     LOGIN GLOBAL
  ========================= */
  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
      setLoading(false);
    }

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  /* =========================
     NAV EVENT
  ========================= */
  useEffect(() => {
    function handler(e) {
      setShowBottomNav(!e.detail.hidden);
    }

    window.addEventListener("toggleBottomNav", handler);
    return () =>
      window.removeEventListener("toggleBottomNav", handler);
  }, []);

  return (
    <ErrorBoundary>
    <ToastProvider>
    <BrowserRouter>
      <AppRoutes
        tab={tab}
        setTab={setTab}
        showBottomNav={showBottomNav}
        user={user}
        loading={loading}
        openLogin={() => setLoginOpen(true)}
        cartCount={cartItems.length}
        onCartOpen={() => setCartOpen(true)}
      />

      {/* LOGIN MODAL GLOBAL */}
      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onSuccess={() => setLoginOpen(false)}
        />
      )}

      {/* CARRITO GLOBAL */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onRemove={removeFromCart}
        onClear={clearCart}
      />
    </BrowserRouter>
    </ToastProvider>
    </ErrorBoundary>
  );
}