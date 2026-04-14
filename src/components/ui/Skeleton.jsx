/**
 * Skeleton — componentes de carga animados (shimmer effect)
 * Reemplazan el spinner genérico con una preview del layout real.
 *
 * Uso:
 *   <PieceCardSkeleton />          — una card
 *   <PieceGridSkeleton count={6} /> — grid completo
 */

/* ── Bloque base con animación shimmer ── */
function Shimmer({ style = {} }) {
  return <div style={{ ...sh.block, ...style }} />;
}

/* ── Card skeleton — replica el layout de PieceCard ── */
export function PieceCardSkeleton() {
  return (
    <div style={sk.card}>
      {/* Imagen */}
      <Shimmer style={sk.img} />

      {/* Body */}
      <div style={sk.body}>
        <Shimmer style={{ height: 10, width: "55%", borderRadius: 6, marginBottom: 8 }} />
        <Shimmer style={{ height: 14, width: "85%", borderRadius: 6, marginBottom: 5 }} />
        <Shimmer style={{ height: 11, width: "60%", borderRadius: 6, marginBottom: 14 }} />

        <div style={sk.divider} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Shimmer style={{ height: 13, width: 48, borderRadius: 6 }} />
          <Shimmer style={{ height: 22, width: 64, borderRadius: 8 }} />
        </div>

        <Shimmer style={{ height: 36, width: "100%", borderRadius: 10 }} />
      </div>
    </div>
  );
}

/* ── Grid de skeletons ── */
export function PieceGridSkeleton({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <PieceCardSkeleton key={i} />
      ))}
    </>
  );
}

/* ── Shimmer keyframe — se inyecta una sola vez ── */
if (typeof document !== "undefined" && !document.getElementById("shimmer-kf")) {
  const style = document.createElement("style");
  style.id = "shimmer-kf";
  style.textContent = `
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }
  `;
  document.head.appendChild(style);
}

const SHIMMER_BG =
  "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 37%, #f0f0f0 63%)";

const sh = {
  block: {
    background: SHIMMER_BG,
    backgroundSize: "800px 100%",
    animation: "shimmer 1.4s infinite linear",
    borderRadius: 8,
  },
};

const sk = {
  card: {
    background: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  img: {
    width: "100%",
    height: 160,
    borderRadius: 0,
  },
  body: {
    padding: "12px 13px 14px",
  },
  divider: {
    height: 1,
    background: "#f3f4f6",
    marginBottom: 12,
  },
};
