/**
 * SellerOnboardingModal
 * Se muestra la primera vez que un yonker entra al admin.
 * Se controla con localStorage key: "yonkers_seller_onboarded"
 */
import { useState, useEffect } from "react";

const STORAGE_KEY = "yonkers_seller_onboarded";

const STEPS = [
  {
    icon: "📸",
    title: "Sube tus piezas",
    desc: "Agrega fotos claras, precio y descripción. Más detalle = más ventas.",
    color: "#facc15",
    bg: "#fefce8",
  },
  {
    icon: "📍",
    title: "Agrega tu ubicación",
    desc: "Los compradores buscan por ciudad. Indica dónde estás para aparecer primero.",
    color: "#3b82f6",
    bg: "#eff6ff",
  },
  {
    icon: "💬",
    title: "Recibe clientes por WhatsApp",
    desc: "Cada pieza tiene un botón de contacto directo. Los compradores te escriben a ti.",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
];

export default function SellerOnboardingModal({ onDone }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  function finish() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    onDone?.();
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  return (
    <div style={s.overlay}>
      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.logo}>🔧</div>
          <div style={s.headerText}>
            <div style={s.headerTitle}>Bienvenido a Yonkers</div>
            <div style={s.headerSub}>El marketplace de piezas de autos en Honduras</div>
          </div>
        </div>

        {/* Step card */}
        <div style={{ ...s.stepCard, background: current.bg, borderColor: current.color + "40" }}>
          <div style={{ ...s.stepIcon, background: current.color }}>
            {current.icon}
          </div>
          <div style={s.stepTitle}>{current.title}</div>
          <div style={s.stepDesc}>{current.desc}</div>
        </div>

        {/* Dots */}
        <div style={s.dots}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                ...s.dot,
                background: i === step ? "#1e3a8a" : "#e5e7eb",
                width: i === step ? 20 : 8,
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div style={s.actions}>
          {step > 0 && (
            <button style={s.backBtn} onClick={() => setStep((s) => s - 1)}>
              ← Atrás
            </button>
          )}
          <button style={{ ...s.nextBtn, flex: step === 0 ? 1 : undefined }} onClick={next}>
            {isLast ? "¡Empezar ahora! 🚀" : "Siguiente →"}
          </button>
        </div>

        {/* Skip */}
        <button style={s.skipBtn} onClick={finish}>
          Omitir
        </button>

      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  modal: {
    background: "#fff",
    borderRadius: 24,
    padding: "28px 24px",
    maxWidth: 380,
    width: "100%",
    boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    animation: "fadeUp 0.3s ease",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    background: "#1e3a8a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    flexShrink: 0,
  },
  headerText: {},
  headerTitle: { fontSize: 18, fontWeight: 800, color: "#111827" },
  headerSub:   { fontSize: 12, color: "#6b7280", marginTop: 2 },

  stepCard: {
    borderRadius: 18,
    padding: "22px 20px",
    border: "1.5px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    textAlign: "center",
    transition: "all 0.25s ease",
  },
  stepIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    marginBottom: 4,
  },
  stepTitle: { fontSize: 17, fontWeight: 700, color: "#111827" },
  stepDesc:  { fontSize: 13, color: "#4b5563", lineHeight: 1.5 },

  dots: {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: "all 0.3s ease",
  },

  actions: {
    display: "flex",
    gap: 10,
  },
  backBtn: {
    height: 46,
    padding: "0 16px",
    borderRadius: 12,
    border: "1.5px solid #e5e7eb",
    background: "#fff",
    color: "#6b7280",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  nextBtn: {
    height: 46,
    padding: "0 20px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    boxShadow: "0 4px 14px rgba(30,58,138,0.3)",
    flex: 1,
  },
  skipBtn: {
    background: "none",
    border: "none",
    color: "#9ca3af",
    fontSize: 12,
    cursor: "pointer",
    textDecoration: "underline",
    alignSelf: "center",
    fontFamily: "system-ui, sans-serif",
    padding: 4,
  },
};
