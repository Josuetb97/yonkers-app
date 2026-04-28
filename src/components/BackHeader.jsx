/**
 * BackHeader
 * Barra superior con botón ← que aparece en páginas secundarias.
 * Se integra con useBackButton para manejar gesto, botón físico y botón visual.
 */
import { useBackButton, useSwipeBack } from "../hooks/useBackButton";

export default function BackHeader({ title = "", onBack: customBack }) {
  const { goBack, isHome } = useBackButton();
  const handleBack = customBack || goBack;

  // Swipe desde borde izquierdo para volver
  useSwipeBack(handleBack, !isHome);

  if (isHome) return null;

  return (
    <div style={s.bar}>
      <button
        style={s.btn}
        onClick={handleBack}
        type="button"
        aria-label="Volver"
      >
        <svg
          width="22" height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {title && <span style={s.title}>{title}</span>}
    </div>
  );
}

const s = {
  bar: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px 10px 8px",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    WebkitBackdropFilter: "blur(8px)",
  },
  btn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderRadius: 12,
    background: "#f3f4f6",
    border: "none",
    cursor: "pointer",
    color: "#1e3a8a",
    flexShrink: 0,
    WebkitTapHighlightColor: "transparent",
    transition: "background 0.15s",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
