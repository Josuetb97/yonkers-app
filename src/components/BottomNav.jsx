import {
  Home,
  Search,
  ShoppingCart,
  MessageSquare,
  Car,
} from "lucide-react";

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
        icon={<MessageSquare size={22} strokeWidth={2} />}
        label="Mensajes"
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
        color: isActive ? "#1a2d5a" : "#b0b8c9",
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
        width: 40, height: 40,
        borderRadius: "50%",
        background: isActive ? "rgba(26,45,90,0.07)" : "transparent",
        transition: "background 0.2s",
        top: "50%", left: "50%",
        transform: "translate(-50%, -42%)",
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
          color:      isActive ? "#1a2d5a" : "#b0b8c9",
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
    height: 68,
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
    background: "#ffffff",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 9999,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    boxShadow: "0 -6px 28px rgba(0,0,0,0.09)",
    transition: "transform .35s cubic-bezier(.4,0,.2,1)",
    fontFamily: "'Barlow', system-ui, sans-serif",
  },

  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "none",
    border: "none",
    gap: 3,
    cursor: "pointer",
    padding: "4px 10px 6px",
    position: "relative",
    transition: "color .2s",
    WebkitTapHighlightColor: "transparent",
  },

  /* Barra indicadora en la parte superior del item activo */
  activeBar: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%) scaleX(1)",
    width: 28,
    height: 3,
    borderRadius: "0 0 3px 3px",
    background: "#FFD200",
    transition: "opacity .2s, transform .25s cubic-bezier(.34,1.56,.64,1)",
    transformOrigin: "center",
  },

  label: {
    fontSize: 10.5,
    lineHeight: "12px",
    letterSpacing: "0.01em",
    transition: "color .2s, font-weight .2s",
    fontFamily: "'Barlow', system-ui, sans-serif",
  },
};
