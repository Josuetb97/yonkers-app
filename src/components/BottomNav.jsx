import {
  Home,
  Search,
  Plus,
  MessageSquare,
  Car,
} from "lucide-react";

export default function BottomNav({ active, onChange }) {
  return (
    <nav style={styles.wrapper}>
      <Item
        icon={<Home size={22} />}
        label="Inicio"
        active={active === "inicio"}
        onClick={() => onChange("inicio")}
      />

      <Item
        icon={<Search size={22} />}
        label="Buscar"
        active={active === "buscar"}
        onClick={() => onChange("buscar")}
      />

      {/* 🔥 BOTÓN CENTRAL */}
      <button
        style={styles.centerButton}
        onClick={() => onChange("pieza")}
        aria-label="Agregar pieza"
        onMouseDown={(e) =>
          (e.currentTarget.style.transform = "scale(0.94)")
        }
        onMouseUp={(e) =>
          (e.currentTarget.style.transform = "scale(1)")
        }
      >
        <Plus size={28} strokeWidth={3} />
        <span style={styles.centerText}>Pieza</span>
      </button>

      <Item
        icon={<MessageSquare size={22} />}
        label="Mensajes"
        active={active === "mensajes"}
        onClick={() => onChange("mensajes")}
      />

      <Item
        icon={<Car size={22} />}
        label="Mis piezas"
        active={active === "mis-piezas"}
        onClick={() => onChange("mis-piezas")}
      />
    </nav>
  );
}

/* =========================
   ITEM
========================= */
function Item({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.item,
        color: active ? "#0b4ea2" : "#6b7280",
        fontWeight: active ? 700 : 500,
      }}
    >
      <span
        style={{
          transform: active ? "scale(1.05)" : "scale(1)",
          transition: "transform .15s ease",
        }}
      >
        {icon}
      </span>
      <span style={styles.label}>{label}</span>
    </button>
  );
}

/* =========================
   STYLES — MOCKUP REAL
========================= */
const styles = {
  wrapper: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    paddingBottom: "env(safe-area-inset-bottom)",
    background: "#ffffff",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 9999,
  },

  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "none",
    border: "none",
    gap: 4,
    cursor: "pointer",
    fontFamily: "Inter, system-ui, -apple-system",
    fontSize: 11,
    padding: "6px 10px",
    transition: "color .15s ease",
  },

  label: {
    lineHeight: "12px",
  },

  /* 🔥 BOTÓN CENTRAL */
  centerButton: {
    position: "relative",
    top: -26,
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#facc15",
    border: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 12px 28px rgba(0,0,0,.28)",
    cursor: "pointer",
    color: "#111827",
    transition: "transform .15s ease",
  },

  centerText: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: -2,
    fontFamily: "Inter, system-ui",
  },
};
