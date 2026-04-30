import { supabase } from "../../lib/supabase";

export default function LoginModal({ onClose }) {
  async function loginGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  async function loginFacebook() {
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: window.location.origin },
    });
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.card} onClick={(e) => e.stopPropagation()}>

        {/* Close */}
        <button style={s.closeBtn} onClick={onClose} aria-label="Cerrar">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Left accent bar */}
        <div style={s.accentBar} />

        {/* Content */}
        <div style={s.content}>

          {/* Logo + Brand */}
          <div style={s.brand}>
            <img
              src="/logo-yonkers.png"
              alt="Yonkers"
              style={s.logo}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <div style={s.brandText}>
              <div style={s.brandName}>YONKERS</div>
              <div style={s.brandTagline}>Marketplace de repuestos en Honduras</div>
            </div>
          </div>

          {/* Divider */}
          <div style={s.divider} />

          {/* Heading */}
          <div style={s.heading}>
            <h2 style={s.title}>Bienvenido</h2>
            <p style={s.subtitle}>Inicia sesión para acceder a todas las funciones</p>
          </div>

          {/* Benefits */}
          <div style={s.benefits}>
            {BENEFITS.map(({ icon, label }) => (
              <div key={label} style={s.benefit}>
                <div style={s.benefitIcon}>{icon}</div>
                <span style={s.benefitLabel}>{label}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div style={s.buttons}>
            <button style={s.googleBtn} onClick={loginGoogle}>
              <GoogleIcon />
              <span style={s.btnLabel}>Continuar con Google</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={s.btnArrow}>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <button style={s.fbBtn} onClick={loginFacebook}>
              <FacebookIcon />
              <span style={s.btnLabel}>Continuar con Facebook</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ ...s.btnArrow, color: "rgba(255,255,255,0.6)" }}>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Terms */}
          <p style={s.terms}>
            Al continuar aceptas nuestros{" "}
            <span style={s.link}>Términos de uso</span>
            {" "}y{" "}
            <span style={s.link}>Política de privacidad</span>
          </p>

        </div>
      </div>
    </div>
  );
}

/* ── Benefit items ── */
const BENEFITS = [
  {
    label: "Busca piezas",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e4b8f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    label: "Guarda favoritos",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e4b8f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    label: "Contacto directo",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e4b8f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.23h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
  },
];

/* ── SVG Icons ── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.1 33.1 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l6-6C34.5 6.5 29.5 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5c11 0 20.5-8 20.5-20.5 0-1.4-.1-2.7-.5-4z"/>
      <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.2 13 24 13c3 0 5.8 1.1 7.9 3l6-6C34.5 6.5 29.5 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"/>
      <path fill="#FBBC05" d="M24 45.5c5.4 0 10.3-1.8 14.1-4.9l-6.5-5.3C29.6 36.9 26.9 38 24 38c-5.6 0-10.3-3.8-12-9l-6.9 5.3C8.7 41.3 15.8 45.5 24 45.5z"/>
      <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-.8 2.2-2.3 4.1-4.2 5.3l6.5 5.3C42.3 35.6 45 30.8 45 25c0-1.7-.2-3.4-.5-5z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
      <path d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

/* ── Styles ── */
const s = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(5,15,40,0.75)",
    backdropFilter: "blur(10px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 10050, padding: 20,
  },

  card: {
    background: "#fff",
    borderRadius: 20,
    width: "100%", maxWidth: 360,
    overflow: "hidden",
    position: "relative",
    boxShadow: "0 40px 100px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)",
    display: "flex",
  },

  accentBar: {
    width: 5,
    background: "linear-gradient(180deg, #1e4b8f 0%, #2563eb 50%, #facc15 100%)",
    flexShrink: 0,
  },

  closeBtn: {
    position: "absolute", top: 16, right: 16, zIndex: 2,
    background: "#f1f5f9",
    border: "none", borderRadius: "50%",
    width: 32, height: 32,
    cursor: "pointer",
    color: "#64748b",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s",
  },

  content: {
    flex: 1,
    padding: "28px 24px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },

  /* Brand */
  brand: {
    display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
  },
  logo: {
    height: 40, objectFit: "contain",
    flexShrink: 0,
  },
  brandText: {},
  brandName: {
    fontSize: 13, fontWeight: 900, letterSpacing: "2px",
    color: "#0f172a",
  },
  brandTagline: {
    fontSize: 10, color: "#94a3b8", marginTop: 1, letterSpacing: "0.3px",
  },

  divider: {
    height: 1, background: "#f1f5f9", marginBottom: 20,
  },

  /* Heading */
  heading: { marginBottom: 18 },
  title: {
    fontSize: 24, fontWeight: 800, color: "#0f172a",
    margin: "0 0 4px", letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5,
  },

  /* Benefits */
  benefits: {
    display: "flex", flexDirection: "column", gap: 10, marginBottom: 24,
  },
  benefit: {
    display: "flex", alignItems: "center", gap: 10,
  },
  benefitIcon: {
    width: 30, height: 30, borderRadius: 8,
    background: "#eff6ff",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  benefitLabel: {
    fontSize: 13, color: "#334155", fontWeight: 500,
  },

  /* Buttons */
  buttons: {
    display: "flex", flexDirection: "column", gap: 10, marginBottom: 16,
  },

  googleBtn: {
    width: "100%", height: 48, borderRadius: 12,
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    display: "flex", alignItems: "center",
    gap: 10, cursor: "pointer", padding: "0 14px",
    fontSize: 14, fontWeight: 600, color: "#1a1a1a",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },

  fbBtn: {
    width: "100%", height: 48, borderRadius: 12,
    background: "#1877F2",
    border: "none",
    display: "flex", alignItems: "center",
    gap: 10, cursor: "pointer", padding: "0 14px",
    fontSize: 14, fontWeight: 600, color: "#fff",
    boxShadow: "0 4px 14px rgba(24,119,242,0.3)",
    transition: "box-shadow 0.15s, opacity 0.15s",
  },

  btnLabel: { flex: 1, textAlign: "left" },
  btnArrow: { color: "#94a3b8", flexShrink: 0 },

  /* Terms */
  terms: {
    fontSize: 10, color: "#94a3b8", margin: 0,
    lineHeight: 1.6, textAlign: "center",
  },
  link: {
    color: "#1e4b8f", cursor: "pointer", fontWeight: 500,
    textDecoration: "underline", textUnderlineOffset: 2,
  },
};
