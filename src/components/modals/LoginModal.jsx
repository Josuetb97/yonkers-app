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

        {/* Close button */}
        <button style={s.closeBtn} onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        {/* Logo & branding */}
        <div style={s.brand}>
          <div style={s.logo}>Y</div>
          <h2 style={s.title}>Bienvenido a Yonkers</h2>
          <p style={s.subtitle}>Descubre los mejores lugares cerca de ti</p>
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
          </button>

          {/* Facebook */}
          <button style={s.facebookBtn} onClick={loginFacebook}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
              <path d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
            <span>Continuar con Facebook</span>
          </button>
        </div>

        {/* Terms */}
        <p style={s.terms}>
          Al continuar, aceptas nuestros{" "}
          <span style={s.link}>Términos de uso</span> y{" "}
          <span style={s.link}>Política de privacidad</span>
        </p>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10050,
    padding: 16,
  },
  card: {
    background: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 380,
    padding: "36px 32px 28px",
    position: "relative",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 16,
    background: "#f2f2f2",
    border: "none",
    borderRadius: "50%",
    width: 32,
    height: 32,
    cursor: "pointer",
    fontSize: 14,
    color: "#555",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  brand: {
    marginBottom: 28,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: "#111",
    color: "#FFD700",
    fontSize: 28,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#111",
    margin: "0 0 6px",
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    margin: 0,
  },
  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 20,
  },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "13px 20px",
    borderRadius: 14,
    border: "1.5px solid #e0e0e0",
    background: "#fff",
    color: "#111",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  facebookBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "13px 20px",
    borderRadius: 14,
    border: "none",
    background: "#1877F2",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  terms: {
    fontSize: 11,
    color: "#aaa",
    lineHeight: 1.5,
    margin: 0,
  },
  link: {
    color: "#007aff",
    cursor: "pointer",
    textDecoration: "underline",
  },
};
