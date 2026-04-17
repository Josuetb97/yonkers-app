import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    if (!email.trim()) {
      alert("Ingresa un email válido");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);

    if (error) {
      console.error("Supabase error:", error.message);
      alert(error.message);
      return;
    }

    setSent(true);
  }

  async function loginGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  async function loginFacebook() {
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.card} onClick={(e) => e.stopPropagation()}>
        <h2>Accede a Yonkers</h2>

        {!sent ? (
          <form onSubmit={handleLogin} style={s.form}>
            <input
              type="email"
              placeholder="Tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={s.input}
              required
            />

            <button style={s.btn} disabled={loading}>
              {loading ? "Enviando..." : "Entrar con email"}
            </button>

            <button type="button" onClick={loginGoogle} style={s.google}>
              Continuar con Google
            </button>

            <button type="button" onClick={loginFacebook} style={s.facebook}>
              Continuar con Facebook
            </button>
          </form>
        ) : (
          <p>Revisa tu correo para entrar 🔥</p>
        )}

        <button onClick={onClose} style={s.close}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10050,
  },
  card: {
    background: "#fff",
    padding: 24,
    borderRadius: 18,
    width: 320,
    textAlign: "center",
  },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  input: {
    height: 46,
    borderRadius: 12,
    border: "1px solid #ddd",
    padding: 10,
  },
  btn: {
    background: "#007aff",
    color: "#fff",
    border: "none",
    padding: 12,
    borderRadius: 12,
  },
  google: {
    background: "#000",
    color: "#fff",
    border: "none",
    padding: 12,
    borderRadius: 12,
    cursor: "pointer",
  },
  facebook: {
    background: "#1877F2",
    color: "#fff",
    border: "none",
    padding: 12,
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 600,
  },
  close: {
    marginTop: 10,
    background: "transparent",
    border: "none",
    color: "#555",
  },
};