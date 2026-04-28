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
        <button style={s.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>

        {/* Hero header */}
        <div style={s.hero}>
          <div style={s.heroGlow} />
          <img
            src="/logo-yonkers.png"
            alt="Yonkers"
            style={s.logoImg}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <h2 style={s.title}>Únete a Yonkers</h2>
          <p style={s.subtitle}>La app de repuestos #1 en Honduras 🇭🇳</p>
        </div>

        {/* Benefits */}
        <div style={s.benefitsRow}>
          {[
            { icon: "🔍", label: "Busca piezas" },
            { icon: "❤️", label: "Favoritos" },
            { icon: "💬", label: "WhatsApp directo" },
          ].map(({ icon, label }) => (
            <div key={label} style={s.benefit}>
              <span style={s.benefitIcon}>{icon}</span>
              <span style={s.benefitLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={s.buttons}>

          {/* Google */}
          <button style={s.googleBtn} onClick={loginGoogle}>
            <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.1 33.1 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l6-6C34.5 6.5 29.5 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5c11 0 20.5-8 20.5-20.5 0-1.4-.1-2.7-.5-4z"/>
              <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.2 13 24 13c3 0 5.8 1.1 7.9 3l6-6C34.5 6.5 29.5 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"/>
              <path fill="#FBBC05" d="M24 45.5c5.4 0 10.3-1.8 14.1-4.9l-6.5-5.3C29.6 36.9 26.9 38 24 38c-5.6 0-10.3-3.8-12-9l-6.9 5.3C8.7 41.3 15.8 45.5 24 45.5z"/>
              <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-.8 2.2-2.3 4.1-4.2 5.3l6.5 5.3C42.3 35.6 45 30.8 45 25c0-1.7-.2-3.4-.5-5z"/>
            </svg>
            <span>Continuar con Google</span>
            <span style={s.arrow}>→</span>
          </button>

          {/* Facebook */}
          <button style={s.facebookBtn} onClick={loginFacebook}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
              <path d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
            <span>Continuar con Facebook</span>
            <span style={s.arrow}>→</span>
          </button>

        </div>

        {/* Terms */}
        <p style={s.terms}>
          Al continuar aceptas los{" "}
          <span style={s.link}>Términos de uso</span> y{" "}
          <span style={s.link}>Privacidad</span>
        </p>

      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(10,20,60,0.7)",
    backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 10050, padding: 16,
  },

  card: {
    background: "#fff",
    borderRadius: 28,
    width: "100%", maxWidth: 370,
    overflow: "hidden",
    position: "relative",
    boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
  },

  closeBtn: {
    position: "absolute", top: 14, right: 14, zIndex: 2,
    background: "rgba(255,255,255,0.25)",
    border: "none", borderRadius: "50%",
    width: 32, height: 32,
    cursor: "pointer", fontSize: 14, color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(4px)",
  },

  /* Hero */
  hero: {
    background: "linear-gradient(150deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)",
    padding: "40px 28px 28px",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute", top: -40, left: "50%",
    transform: "translateX(-50%)",
    width: 220, height: 220,
    background: "radial-gradient(circle, rgba(250,204,21,0.18) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  logoImg: {
    height: 54, objectFit: "contain",
    marginBottom: 14,
    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
    position: "relative",
  },
  title: {
    fontSize: 22, fontWeight: 900, color: "#fff",
    margin: "0 0 6px", lineHeight: 1.15, textAlign: "center",
  },
  sub: {
    fontSize: 13, color: "rgba(255,255,255,0.7)",
    margin: "0 0 22px", textAlign: "center",
  },
  benefits: {
    display: "flex", gap: 18, justifyContent: "center", marginBottom: 22,
  },
  benefit: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
  },
  benefitIcon: { fontSize: 20 },
  benefitText: { fontSize: 10, color: "rgba(255,255,255,0.6)", textAlign: "center" },
  dividerRow: {
    display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1, background: "rgba(255,255,255,0.15)" },
  dividerText: { fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500 },
  btnGoogle: {
    width: "100%", height: 52, borderRadius: 14,
    background: "#fff", border: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 10, cursor: "pointer", marginBottom: 12,
    fontSize: 15, fontWeight: 700, color: "#1a1a1a",
    boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
    transition: "box-shadow 0.15s, transform 0.12s",
  },
  btnFb: {
    width: "100%", height: 52, borderRadius: 14,
    background: "#1877F2", border: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 10, cursor: "pointer",
    fontSize: 15, fontWeight: 700, color: "#fff",
    boxShadow: "0 4px 16px rgba(24,119,242,0.35)",
    transition: "box-shadow 0.15s, transform 0.12s",
  },
  btnArrow: {
    marginLeft: "auto", fontSize: 18, opacity: 0.7,
  },
  footer: {
    marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.4)",
    textAlign: "center", lineHeight: 1.5,
  },
};
