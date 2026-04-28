import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
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
import PageTransition from "./components/PageTransition";
import BackHeader from "./components/BackHeader";

import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import { useCart } from "./hooks/useCart";
import NotificationPrompt from "./components/NotificationPrompt";

/* --- Tab order para calcular dirección de la animación --- */
const TAB_ORDER = ["inicio", "solicitar", "mensajes", "autolote"];

/* --- Rutas que no son "home" y muestran el back header --- */
const SUB_PAGES = ["/request", "/my-pieces", "/messages", "/seller"];

/* =========================
   PROTECTED ROUTE
========================= */
function ProtectedRoute({ user, loading, children }) {
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 18, fontWeight: 600,
      }}>
        Cargando...
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return children;
}

/* =========================
   APP ROUTES (con transiciones)
========================= */
function AppRoutes({ tab, setTab, showBottomNav, user, loading, openLogin, cartCount, onCartOpen }) {
  const navigate      = useNavigate();
  const location      = useLocation();
  const prevTabRef    = useRef(tab);
  const [direction, setDirection] = useState("forward");

  // Determinar dirección al cambiar tab
  function handleTabChange(t) {
    const prev = TAB_ORDER.indexOf(prevTabRef.current);
    const next = TAB_ORDER.indexOf(t);
    setDirection(next >= prev ? "forward" : "back");
    prevTabRef.current = t;
    setTab(t);

    if (t === "inicio")    navigate("/");
    if (t === "solicitar") { if (!user) return openLogin(); navigate("/request"); }
    if (t === "autolote")  { if (!user) return openLogin(); navigate("/my-pieces"); }
    if (t === "mensajes")  navigate("/messages");
    if (t === "carrito")   { onCartOpen(); return; }
  }

  // ¿Estamos en una sub-página?
  const isSubPage = SUB_PAGES.some((p) => location.pathname.startsWith(p));

  // Dirección "forward" al entrar a sub-página, "back" al salir
  useEffect(() => {
    if (isSubPage) setDirection("forward");
    else           setDirection("back");
  }, [location.pathname]);

  const pageKey = location.pathname;

  const bottomNav = showBottomNav ? (
    <BottomNav active={tab} onChange={handleTabChange} cartCount={cartCount} />
  ) : null;

  return (
    <PageTransition direction={direction} pageKey={pageKey}>
      <Routes location={location}>

        {/* HOME */}
        <Route path="/" element={
          <MainLayout>
            <Home user={user} openLogin={openLogin} />
            {bottomNav}
          </MainLayout>
        } />

        {/* SOLICITAR */}
        <Route path="/request" element={
          <ProtectedRoute user={user} loading={loading}>
            <MainLayout>
              <BackHeader title="Solicitar pieza" />
              <RequestNeed user={user} />
              {bottomNav}
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* MIS PIEZAS */}
        <Route path="/my-pieces" element={
          <ProtectedRoute user={user} loading={loading}>
            <MainLayout>
              <BackHeader title="Mis piezas" />
              <MyPieces user={user} />
              {bottomNav}
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* ADMIN */}
        <Route path="/admin" element={
          <ProtectedRoute user={user} loading={loading}>
            <Admin user={user} />
          </ProtectedRoute>
        } />

        {/* MENSAJES */}
        <Route path="/messages" element={
          <MainLayout>
            <BackHeader title="Mensajes" />
            <Messages />
            {showBottomNav && (
              <BottomNav active="mensajes" onChange={handleTabChange} />
            )}
          </MainLayout>
        } />

        {/* PERFIL VENDEDOR */}
        <Route path="/seller/:ownerId" element={
          <MainLayout>
            <BackHeader title="Perfil del yonker" />
            <SellerProfile user={user} openLogin={openLogin} />
          </MainLayout>
        } />

        <Route path="/login"    element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="*"         element={<Navigate to="/" replace />} />

      </Routes>
    </PageTransition>
  );
}

/* =========================
   APP ROOT
========================= */
const IS_ADMIN_SUBDOMAIN =
  typeof window !== "undefined" &&
  window.location.hostname === "admin.yonkersapp.com";

export default function App() {
  const [tab,          setTab]          = useState("inicio");
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [user,         setUser]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [loginOpen,    setLoginOpen]    = useState(false);
  const [cartOpen,     setCartOpen]     = useState(false);
  const { cartItems, removeFromCart, clearCart } = useCart();

  useEffect(() => {
    if (!IS_ADMIN_SUBDOMAIN || loading) return;
    if (!user) setLoginOpen(true);
    else if (window.location.pathname !== "/admin") window.location.replace("/admin");
  }, [loading, user]);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
      setLoading(false);
    }
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handler(e) { setShowBottomNav(!e.detail.hidden); }
    window.addEventListener("toggleBottomNav", handler);
    return () => window.removeEventListener("toggleBottomNav", handler);
  }, []);

  // Registrar service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
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

          {loginOpen && (
            <LoginModal
              onClose={() => setLoginOpen(false)}
              onSuccess={() => setLoginOpen(false)}
            />
          )}

          <CartDrawer
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            cartItems={cartItems}
            onRemove={removeFromCart}
            onClear={clearCart}
          />

          <NotificationPrompt />
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}