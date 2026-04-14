import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Menu, Camera, X, SlidersHorizontal, Heart, Mic, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";

import PieceCard from "../components/PieceCard";
import PieceDetailModal from "../components/modals/PieceDetailModal";
import VinScannerModal from "../components/modals/VinScannerModal";
import PhotoSearchModal from "../components/modals/PhotoSearchModal";
import { PieceGridSkeleton } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import { useFavorites } from "../hooks/useFavorites";
import { useCart } from "../hooks/useCart";
import { useAnalytics } from "../hooks/useAnalytics";
import { useVoiceSearch } from "../hooks/useVoiceSearch";

const API = import.meta.env.VITE_API_URL || "/api";

/* ── Categorías ── */
const CATEGORIES = [
  { id: "all",        label: "Todos"      },
  { id: "motores",    label: "Motores"    },
  { id: "carroceria", label: "Carrocería" },
  { id: "suspension", label: "Suspensión" },
  { id: "frenos",     label: "Frenos"     },
  { id: "electrico",  label: "Eléctrico"  },
];

const CONDITIONS = ["Todos", "Usado", "Buen estado", "Como nuevo", "Nuevo"];

/* ── Alturas fijas ── */
const HEADER_H   = 68;
const SEARCH_H   = 50;
const CHIPS_H    = 34;
const TOP_AREA_H = HEADER_H + SEARCH_H + CHIPS_H + 36;

const EMPTY_FILTERS = {
  condition: "",
  minPrice:  "",
  maxPrice:  "",
  yearFrom:  "",
  yearTo:    "",
};

export default function Home({ user, openLogin }) {
  const navigate   = useNavigate();
  const { track }  = useAnalytics();
  const [selectedPiece,  setSelectedPiece]  = useState(null);
  const [selectedId,     setSelectedId]     = useState(null);
  const [pieces,         setPieces]         = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [query,          setQuery]          = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showFilters,    setShowFilters]    = useState(false);
  const [filters,        setFilters]        = useState(EMPTY_FILTERS);
  const [pendingFilters, setPendingFilters] = useState(EMPTY_FILTERS);

  const { toast } = useToast();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { addToCart, isInCart } = useCart();
  const [showFavs,     setShowFavs]     = useState(false);
  const [showVinModal,   setShowVinModal]   = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showMenu,       setShowMenu]       = useState(false);
  const [voiceError,     setVoiceError]     = useState("");

  /* ── Voz ── */
  const { listening, supported: voiceSupported, startListening, stopListening } = useVoiceSearch({
    onResult: (text) => {
      setQuery(text);
      setVoiceError("");
    },
    onError: (msg) => setVoiceError(msg),
  });

  /* ── VIN decodificado → poner query ── */
  function handleVinDecoded({ query: vinQuery }) {
    setQuery(vinQuery);
    setActiveCategory("all");
    setShowVinModal(false);
  }

  /* ── Cuántos filtros activos ── */
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  /* ── Ocultar bottom nav con modal abierto ── */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("toggleBottomNav", { detail: { hidden: !!selectedPiece } })
    );
  }, [selectedPiece]);

  /* ── Fetch ── */
  const fetchPieces = useCallback(async (searchText = "", category = "all", f = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchText.trim())    params.set("query",     searchText.trim());
      if (category !== "all")   params.set("category",  category);
      if (f.condition && f.condition !== "Todos") params.set("condition", f.condition);
      if (f.minPrice)           params.set("min_price", f.minPrice);
      if (f.maxPrice)           params.set("max_price", f.maxPrice);
      if (f.yearFrom)           params.set("year_from", f.yearFrom);
      if (f.yearTo)             params.set("year_to",   f.yearTo);

      const res  = await fetch(`${API}/pieces?${params.toString()}`);
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setPieces(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error:", err);
      setPieces([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchPieces("", "all", filters); }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchPieces(query, activeCategory, filters);
      // 📊 Rastrear búsquedas con texto
      if (query.trim().length > 2) {
        track("search", "home", { query: query.trim() });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, activeCategory, filters]);

  const handleOpenCard = useCallback((p) => {
    setSelectedPiece(p);
    setSelectedId(p.id);
  }, []);

  /* ── Heart: favorito + carrito ── */
  function handleToggleFavorite(piece) {
    toggleFavorite(piece.id);
    if (!isFavorite(piece.id)) {
      // Se está agregando → también va al carrito
      addToCart({
        id:      piece.id,
        type:    "piece",
        title:   piece.title,
        brand:   piece.brand,
        years:   piece.years,
        price:   piece.price,
        images:  piece.images,
        whatsapp:piece.whatsapp,
        yonker:  piece.yonker,
        city:    piece.city,
      });
      toast.info(`🛒 "${piece.title || "Pieza"}" agregada al carrito`);
    }
  }

  /* ── Aplicar filtros ── */
  function applyFilters() {
    setFilters(pendingFilters);
    setShowFilters(false);
  }

  function clearFilters() {
    setPendingFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setShowFilters(false);
  }

  /* ── Piezas a mostrar (normal o favoritas) ── */
  const displayedPieces = showFavs
    ? pieces.filter((p) => isFavorite(p.id))
    : pieces;

  return (
    <div style={st.page}>

      {/* ══════════════════════════════
          TOP AREA — fijo
      ══════════════════════════════ */}
      <div style={st.topArea}>

        {/* ── Header: menú · logo · avatar ── */}
        <header style={st.header}>
          <Menu
            size={22}
            color="#fff"
            style={{ position: "absolute", left: 18, cursor: "pointer" }}
            onClick={() => setShowMenu(true)}
          />

          <img
            src="/logo-yonkers.png"
            alt="Yonkers"
            style={st.logo}
          />

          {!user ? (
            <button onClick={openLogin} style={st.loginBtn} type="button">
              Login
            </button>
          ) : (
            <div style={st.avatar}>
              {user.email?.charAt(0).toUpperCase()}
            </div>
          )}
        </header>

        {/* ── Buscador ── */}
        <div style={st.searchRow}>
          <div style={st.searchBar}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="rgba(26,45,90,0.55)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>

            <input
              placeholder="Buscar pieza"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={st.input}
              autoComplete="off"
              spellCheck={false}
            />

            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                style={st.clearBtn}
                aria-label="Limpiar"
              >
                <X size={14} color="rgba(26,45,90,0.5)" strokeWidth={2.5} />
              </button>
            )}

            <span style={st.country}>HN</span>
          </div>

          {/* Botón filtros */}
          <button
            style={{ ...st.camBtn, position: "relative" }}
            type="button"
            aria-label="Filtros"
            onClick={() => { setPendingFilters(filters); setShowFilters(true); }}
          >
            <SlidersHorizontal size={18} color="#fff" strokeWidth={1.8} />
            {activeFilterCount > 0 && (
              <span style={st.filterBadge}>{activeFilterCount}</span>
            )}
          </button>

          {/* Botón voz */}
          {voiceSupported && (
            <button
              style={{
                ...st.camBtn,
                background: listening ? "rgba(239,68,68,0.85)" : "rgba(255,255,255,.15)",
                border: listening ? "1.5px solid rgba(239,68,68,0.9)" : "1.5px solid rgba(255,255,255,.55)",
                transition: "background 0.2s, border 0.2s",
              }}
              type="button"
              aria-label={listening ? "Detener voz" : "Buscar por voz"}
              onClick={listening ? stopListening : startListening}
            >
              <Mic size={18} color="#fff" strokeWidth={1.8} />
            </button>
          )}

          {/* Botón cámara — buscar por foto */}
          <button
            style={st.camBtn}
            type="button"
            aria-label="Buscar por foto"
            onClick={() => setShowPhotoModal(true)}
          >
            <Camera size={18} color="#fff" strokeWidth={1.8} />
          </button>

          {/* Botón VIN */}
          <button
            style={st.camBtn}
            type="button"
            aria-label="Escanear VIN"
            onClick={() => setShowVinModal(true)}
          >
            <QrCode size={18} color="#fff" strokeWidth={1.8} />
          </button>
        </div>

        {/* ── Chips de categoría + favoritos ── */}
        <div style={st.chipsRow}>
          {/* Chip favoritos */}
          <button
            key="favs"
            type="button"
            style={{
              ...st.chip,
              ...(showFavs ? st.chipFav : st.chipOff),
            }}
            onClick={() => setShowFavs(!showFavs)}
          >
            <Heart size={11} style={{ display: "inline", marginRight: 4 }} fill={showFavs ? "#fff" : "none"} />
            Favoritos {favorites.length > 0 && `(${favorites.length})`}
          </button>

          {CATEGORIES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              style={{
                ...st.chip,
                ...(activeCategory === id && !showFavs ? st.chipOn : st.chipOff),
              }}
              onClick={() => { setActiveCategory(id); setShowFavs(false); }}
            >
              {label}
            </button>
          ))}
        </div>

      </div>

      {/* ══════════════════════════════
          CONTENIDO
      ══════════════════════════════ */}
      <div style={{ paddingTop: TOP_AREA_H }}>
        {/* Banner favoritos vacíos */}
        {showFavs && favorites.length === 0 && (
          <div style={st.favBanner}>
            <Heart size={32} color="#facc15" />
            <p style={{ margin: "8px 0 4px", fontWeight: 700, color: "#1e4b8f" }}>
              Aún no tienes favoritos
            </p>
            <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
              Toca el corazón en cualquier pieza para guardarla aquí
            </p>
          </div>
        )}

        <div style={st.list}>
          {loading ? (
            <PieceGridSkeleton count={6} />
          ) : displayedPieces.length === 0 && !showFavs ? (
            <div style={st.empty}>
              <span style={{ fontSize: 36 }}>🔍</span>
              <p style={{ margin: "8px 0 0", fontWeight: 600, color: "#374151" }}>Sin resultados</p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>Intenta con otro término o categoría</p>
            </div>
          ) : (
            displayedPieces.map((piece) => (
              <PieceCard
                key={piece.id}
                piece={piece}
                selected={selectedId === piece.id}
                onOpen={handleOpenCard}
                onSelect={() => setSelectedId(piece.id)}
                isFavorite={isFavorite(piece.id)}
                onToggleFavorite={() => handleToggleFavorite(piece)}
                onSellerClick={(ownerId) => navigate(`/seller/${ownerId}`)}
              />
            ))
          )}
        </div>
      </div>

      {/* ══════════════════════════════
          MODAL PIEZA
      ══════════════════════════════ */}
      <PieceDetailModal
        piece={selectedPiece}
        onClose={() => setSelectedPiece(null)}
        isFavorite={selectedPiece ? isFavorite(selectedPiece.id) : false}
        onToggleFavorite={selectedPiece ? () => handleToggleFavorite(selectedPiece) : null}
      />


      {/* ══════════════════════════════
          MENÚ LATERAL
      ══════════════════════════════ */}
      {showMenu && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 10020,
            display: "flex",
          }}
          onClick={() => setShowMenu(false)}
        >
          <div
            style={{
              width: 260,
              height: "100%",
              background: "#fff",
              padding: "0 0 32px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del menú */}
            <div style={{ background: "linear-gradient(180deg,#1e4b8f,#0f3e82)", padding: "40px 20px 24px" }}>
              <img src="/logo-yonkers.png" alt="Yonkers" style={{ height: 60, objectFit: "contain" }} />
              {user && (
                <div style={{ marginTop: 12, color: "#fff", fontSize: 13, opacity: 0.8 }}>
                  {user.email}
                </div>
              )}
            </div>
            {/* Items del menú */}
            <div style={{ padding: "16px 0", flex: 1 }}>
              {[
                { label: "🏠  Inicio", action: () => { setShowMenu(false); } },
                { label: "🔍  Buscar pieza", action: () => { setShowMenu(false); document.querySelector("input")?.focus(); } },
                { label: "📋  Mis piezas", action: () => { setShowMenu(false); navigate("/my-pieces"); } },
                { label: "💬  Mensajes", action: () => { setShowMenu(false); navigate("/messages"); } },
                { label: "📣  Solicitar pieza", action: () => { setShowMenu(false); navigate("/request"); } },
              ].map(({ label, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "14px 24px",
                    background: "none",
                    border: "none",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#1a2d5a",
                    cursor: "pointer",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Footer del menú */}
            {!user && (
              <button
                type="button"
                onClick={() => { setShowMenu(false); openLogin(); }}
                style={{
                  margin: "0 20px",
                  padding: "13px 0",
                  borderRadius: 12,
                  background: "#facc15",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#1a2d5a",
                  cursor: "pointer",
                }}
              >
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          MODAL FOTO
      ══════════════════════════════ */}
      <PhotoSearchModal
        open={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onSubmit={(query) => { setQuery(query); setShowPhotoModal(false); }}
      />

      {/* ══════════════════════════════
          MODAL VIN SCANNER
      ══════════════════════════════ */}
      {showVinModal && (
        <VinScannerModal
          onClose={() => setShowVinModal(false)}
          onDecoded={handleVinDecoded}
        />
      )}

      {/* ══ VOICE LISTENING INDICATOR ══ */}
      {listening && (
        <div style={{
          position: "fixed",
          bottom: 90,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#ef4444",
          color: "#fff",
          padding: "10px 22px",
          borderRadius: 40,
          fontSize: 13,
          fontWeight: 700,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: "0 4px 20px rgba(239,68,68,0.4)",
          whiteSpace: "nowrap",
          animation: "fadeUp 0.25s ease",
        }}>
          🎙️ Escuchando… habla ahora
        </div>
      )}

      {/* ══ VOICE ERROR TOAST ══ */}
      {voiceError && (
        <div style={{
          position: "fixed",
          bottom: 90,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#111827",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 40,
          fontSize: 13,
          fontWeight: 600,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          whiteSpace: "nowrap",
        }}
          onClick={() => setVoiceError("")}
        >
          ⚠️ {voiceError}
        </div>
      )}

      {/* ══════════════════════════════
          PANEL DE FILTROS
      ══════════════════════════════ */}
      {showFilters && (
        <div style={st.filterOverlay} onClick={() => setShowFilters(false)}>
          <div style={st.filterPanel} onClick={(e) => e.stopPropagation()}>
            <div style={st.filterHeader}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>Filtros</span>
              <button style={st.filterClose} onClick={() => setShowFilters(false)}>
                <X size={18} color="#6b7280" />
              </button>
            </div>

            {/* Condición */}
            <div style={st.filterGroup}>
              <label style={st.filterLabel}>Condición</label>
              <div style={st.conditionRow}>
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    style={{
                      ...st.conditionBtn,
                      ...(pendingFilters.condition === (c === "Todos" ? "" : c)
                        ? st.conditionBtnOn
                        : st.conditionBtnOff),
                    }}
                    onClick={() =>
                      setPendingFilters((f) => ({
                        ...f,
                        condition: c === "Todos" ? "" : c,
                      }))
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Rango de precio */}
            <div style={st.filterGroup}>
              <label style={st.filterLabel}>Precio (L)</label>
              <div style={st.rangeRow}>
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={pendingFilters.minPrice}
                  onChange={(e) => setPendingFilters((f) => ({ ...f, minPrice: e.target.value }))}
                  style={st.rangeInput}
                />
                <span style={{ color: "#9ca3af", fontSize: 14 }}>—</span>
                <input
                  type="number"
                  placeholder="Máximo"
                  value={pendingFilters.maxPrice}
                  onChange={(e) => setPendingFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                  style={st.rangeInput}
                />
              </div>
            </div>

            {/* Rango de año */}
            <div style={st.filterGroup}>
              <label style={st.filterLabel}>Año del vehículo</label>
              <div style={st.rangeRow}>
                <input
                  type="number"
                  placeholder="Desde"
                  value={pendingFilters.yearFrom}
                  onChange={(e) => setPendingFilters((f) => ({ ...f, yearFrom: e.target.value }))}
                  style={st.rangeInput}
                  min="1960"
                  max="2026"
                />
                <span style={{ color: "#9ca3af", fontSize: 14 }}>—</span>
                <input
                  type="number"
                  placeholder="Hasta"
                  value={pendingFilters.yearTo}
                  onChange={(e) => setPendingFilters((f) => ({ ...f, yearTo: e.target.value }))}
                  style={st.rangeInput}
                  min="1960"
                  max="2026"
                />
              </div>
            </div>

            {/* Botones */}
            <div style={st.filterActions}>
              <button style={st.clearBtn2} onClick={clearFilters}>
                Limpiar filtros
              </button>
              <button style={st.applyBtn} onClick={applyFilters}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────
   STYLES
───────────────────────────────────── */
const st = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "#f3f4f6",
  },

  topArea: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: "linear-gradient(180deg,#1e4b8f,#0f3e82)",
    paddingBottom: 10,
    boxShadow: "0 4px 14px rgba(0,0,0,.18)",
  },

  header: {
    height: HEADER_H,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  logo: {
    height: 120,
    objectFit: "contain",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,.25))",
    pointerEvents: "none",
  },

  loginBtn: {
    position: "absolute",
    right: 18,
    background: "#facc15",
    border: "none",
    padding: "6px 14px",
    borderRadius: 20,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    color: "#111",
  },

  avatar: {
    position: "absolute",
    right: 18,
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#facc15",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 15,
    color: "#111",
  },

  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 14px",
    marginBottom: 8,
  },

  searchBar: {
    flex: 1,
    height: SEARCH_H,
    background: "#facc15",
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    gap: 8,
    boxShadow: "0 4px 16px rgba(255,210,0,0.3)",
  },

  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: 14,
    fontWeight: 600,
    color: "#1a2d5a",
    minWidth: 0,
  },

  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "0 2px",
    flexShrink: 0,
  },

  country: {
    fontWeight: 800,
    fontSize: 11,
    color: "rgba(26,45,90,0.45)",
    letterSpacing: "0.05em",
    flexShrink: 0,
  },

  camBtn: {
    width: SEARCH_H,
    height: SEARCH_H,
    borderRadius: 999,
    border: "1.5px solid rgba(255,255,255,.55)",
    background: "rgba(255,255,255,.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },

  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    background: "#facc15",
    color: "#111",
    borderRadius: "50%",
    width: 16,
    height: 16,
    fontSize: 10,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  chipsRow: {
    display: "flex",
    gap: 7,
    padding: "0 14px",
    overflowX: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    paddingBottom: 2,
  },

  chip: {
    flexShrink: 0,
    height: CHIPS_H,
    padding: "0 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    border: "1.5px solid transparent",
    whiteSpace: "nowrap",
    transition: "all .15s",
    WebkitTapHighlightColor: "transparent",
    display: "flex",
    alignItems: "center",
  },

  chipOn: {
    background: "#facc15",
    color: "#0f3e82",
    borderColor: "#facc15",
  },

  chipOff: {
    background: "rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.75)",
    borderColor: "rgba(255,255,255,0.18)",
  },

  chipFav: {
    background: "#facc15",
    color: "#1e4b8f",
    borderColor: "#facc15",
  },

  list: {
    padding: "14px 14px 120px",
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 14,
  },

  empty: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: 40,
    color: "#9ca3af",
    fontSize: 14,
  },

  favBanner: {
    textAlign: "center",
    padding: "32px 24px 0",
  },

  /* ── Filter panel ── */
  filterOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 10000,
    display: "flex",
    alignItems: "flex-end",
  },

  filterPanel: {
    width: "100%",
    background: "#fff",
    borderRadius: "20px 20px 0 0",
    padding: "20px 20px 36px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  filterHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  filterClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    padding: 4,
  },

  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  filterLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
  },

  conditionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },

  conditionBtn: {
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: "1.5px solid transparent",
    transition: "all .15s",
  },

  conditionBtnOn: {
    background: "#1e4b8f",
    color: "#fff",
    borderColor: "#1e4b8f",
  },

  conditionBtnOff: {
    background: "#f3f4f6",
    color: "#374151",
    borderColor: "#e5e7eb",
  },

  rangeRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  rangeInput: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px solid #e5e7eb",
    fontSize: 14,
    outline: "none",
    color: "#111827",
  },

  filterActions: {
    display: "flex",
    gap: 10,
    marginTop: 4,
  },

  clearBtn2: {
    flex: 1,
    padding: 13,
    borderRadius: 12,
    border: "1.5px solid #e5e7eb",
    background: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    color: "#374151",
  },

  applyBtn: {
    flex: 2,
    padding: 13,
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg,#1e4b8f,#0f3e82)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
};
