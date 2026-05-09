import {
  Home,
  Search,
  ShoppingCart,
  Car,
} from "lucide-react";

/* Ícono robot Yonky personalizado */
function YonkyIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Cabeza */}
      <rect x="3" y="7" width="18" height="13" rx="3" />
      {/* Antena */}
      <line x1="12" y1="7" x2="12" y2="3" />
      <circle cx="12" cy="2.5" r="1.5" fill="currentColor" stroke="none" />
      {/* Ojos */}
      <circle cx="8.5" cy="13" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="13" r="1.5" fill="currentColor" stroke="none" />
      {/* Boca */}
      <path d="M8.5 16.5 Q12 18.5 15.5 16.5" strokeWidth="1.8" fill="none" />
    </svg>
  );
}

/**
 * BottomNav
 *
 * Props:
 *   active   — string: "inicio" | "solicitar" | "carrito" | "mensajes" | "autolote"
 *   onChange — (tab: string) => void
 *   hidden   — boolean: oculta el nav con animación (ej. al hacer scroll down)
 */
export default function BottomNav({ active, onChange, hidden, cartCount = 0 }) {
  return (
    <nav
      style={{
        ...st.wrapper,
        transform: hidden ? "translateY(110%)" : "translateY(0)",
      }}
      role="navigation"
      aria-label="Navegación principal"
    >

      <NavItem
        icon={<Home size={22} strokeWidth={2} />}
        label="Inicio"
        isActive={active === "inicio"}
        onClick={() => onChange("inicio")}
      />

      <NavItem
        icon={<Search size={22} strokeWidth={2} />}
        label="Solicitar"
        isActive={active === "solicitar"}
        onClick={() => onChange("solicitar")}
      />

      {/* ── Botón central: Carrito ── */}
      <CenterButton
        isActive={active === "carrito"}
        onClick={() => onChange("carrito")}
        cartCount={cartCount}
      />

      <NavItem
        icon={<YonkyIcon size={22} />}
        label="Yonky"
        isActive={active === "mensajes"}
        onClick={() => onChange("mensajes")}
      />

      <NavItem
        icon={<Car size={22} strokeWidth={2} />}
        label="Autolote"
        isActive={active === "autolote"}
        onClick={() => onChange("autolote")}
      />

    </nav>
  );
}

/* ─────────────────────────────────────
   NAV ITEM
───────────────────────────────────── */
function NavItem({ icon, label, isActive, onClick }) {
  function handleClick(e) {
    // Vibración táctil suave en dispositivos que lo soporten (gama media/alta)
    if (navigator.vibrate) navigator.vibrate(8);
    onClick(e);
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      style={{
        ...st.item,
        color: isActive ? "#1e4b8f" : "#9ca3af",
      }}
    >
      {/* Indicador superior activo */}
      <div
        style={{
          ...st.activeBar,
          opacity:   isActive ? 1 : 0,
          transform: isActive ? "translateX(-50%) scaleX(1)" : "translateX(-50%) scaleX(0)",
        }}
      />

      {/* Círculo de fondo activo */}
      <div style={{
        position: "absolute",
        width: 38, height: 38,
        borderRadius: "50%",
        background: isActive ? "rgba(30,75,143,0.07)" : "transparent",
        transition: "background 0.2s",
        top: "50%", left: "50%",
        transform: "translate(-50%, -48%)",
        pointerEvents: "none",
      }} />

      {/* Ícono */}
      <div
        style={{
          transform:  isActive ? "translateY(-1px) scale(1.12)" : "scale(1)",
          transition: "transform .25s cubic-bezier(.34,1.56,.64,1)",
          position: "relative",
        }}
      >
        {icon}
      </div>

      {/* Label */}
      <span
        style={{
          ...st.label,
          fontWeight: isActive ? 700 : 500,
          color:      isActive ? "#1e4b8f" : "#9ca3af",
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────
   CENTER BUTTON (Carrito)
───────────────────────────────────── */
function CenterButton({ isActive, onClick, cartCount = 0 }) {
  function handleMouseDown(e) {
    e.currentTarget.style.transform = "translateY(-20px) scale(0.92)";
  }
  function handleMouseUp(e) {
    e.currentTarget.style.transform = "translateY(-22px) scale(1)";
  }
  function handleMouseLeave(e) {
    e.currentTarget.style.transform = "translateY(-22px) scale(1)";
  }

  return (
    <button
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      type="button"
      aria-label="Carrito de piezas"
      aria-current={isActive ? "page" : undefined}
      style={{
        ...st.centerBtn,
        boxShadow: isActive
          ? "0 10px 32px rgba(250,204,21,0.7), 0 2px 8px rgba(0,0,0,0.14)"
          : "0 8px 24px rgba(250,204,21,0.5), 0 2px 8px rgba(0,0,0,0.12)",
      }}
    >
      <ShoppingCart size={26} strokeWidth={2.4} color="#1a2d5a" />

      {/* Badge de items */}
      {cartCount > 0 && (
        <span style={{
          position: "absolute",
          top: -2,
          right: -2,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          background: "#1e3a8a",
          color: "#facc15",
          fontSize: 9,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 4px",
          border: "2px solid #FFD200",
          animation: "cartBounce 0.4s ease",
        }}>
          {cartCount > 9 ? "9+" : cartCount}
        </span>
      )}

      {/* Ring decorativo */}
      <span style={st.centerRing} />
    </button>
  );
}

/* ─────────────────────────────────────
   STYLES
───────────────────────────────────── */
const st = {
  wrapper: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
    background: "#ffffff",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 9999,
    borderTop: "1px solid #ebebeb",
    boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
    transition: "transform .35s cubic-bezier(.4,0,.2,1)",
    fontFamily: "'Barlow', system-ui, sans-serif",
  },

  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "none",
    border: "none",
    gap: 2,
    cursor: "pointer",
    padding: "6px 10px 4px",
    position: "relative",
    transition: "color .2s",
    WebkitTapHighlightColor: "transparent",
    minWidth: 48,
  },

  /* Indicador activo: línea amarilla abajo del label */
  activeBar: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%) scaleX(1)",
    width: 22,
    height: 2.5,
    borderRadius: "2px 2px 0 0",
    background: "#facc15",
    transition: "opacity .2s, transform .25s cubic-bezier(.34,1.56,.64,1)",
    transformOrigin: "center",
  },

  label: {
    fontSize: 10,
    lineHeight: "12px",
    letterSpacing: "0.01em",
    transition: "color .2s, font-weight .2s",
    fontFamily: "'Barlow', system-ui, sans-serif",
  },

  centerBtn: {
    position:        "relative",
    width:           62,
    height:          62,
    borderRadius:    "50%",
    background:      "linear-gradient(135deg, #FFD200 0%, #f5c400 100%)",
    border:          "none",
    cursor:          "pointer",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    transform:       "translateY(-22px)",
    transition:      "transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .2s",
    WebkitTapHighlightColor: "transparent",
    flexShrink:      0,
  },

  centerRing: {
    position:     "absolute",
    inset:        -5,
    borderRadius: "50%",
    border:       "2.5px solid rgba(255,210,0,0.35)",
    pointerEvents:"none",
  },
};
