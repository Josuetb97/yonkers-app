/**
 * ErrorBoundary — captura errores de render en cualquier componente hijo
 * y muestra una pantalla de error amigable en lugar de un crash en blanco.
 *
 * Uso:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("❌ ErrorBoundary capturó un error:", error, info);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={st.page}>
        <div style={st.card}>
          <div style={st.icon}>⚠️</div>
          <h2 style={st.title}>Algo salió mal</h2>
          <p style={st.desc}>
            La aplicación encontró un error inesperado. Intenta recargar la página.
          </p>
          {this.state.error?.message && (
            <code style={st.code}>{this.state.error.message}</code>
          )}
          <button style={st.btn} onClick={() => this.handleReset()}>
            Recargar app
          </button>
        </div>
      </div>
    );
  }
}

const st = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
    padding: 24,
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: "40px 28px",
    maxWidth: 360,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 8px" },
  desc:  { fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 16px" },
  code:  {
    display: "block",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: 12,
    padding: "10px 14px",
    borderRadius: 10,
    marginBottom: 20,
    textAlign: "left",
    wordBreak: "break-all",
    border: "1px solid #fecaca",
  },
  btn: {
    width: "100%",
    padding: "14px 0",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #1e4b8f, #0f3e82)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
};
