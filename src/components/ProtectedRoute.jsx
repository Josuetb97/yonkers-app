// ProtectedRoute — protege rutas que requieren sesión activa de Supabase
import { Navigate } from "react-router-dom";

/**
 * Props:
 *   user    — objeto user de Supabase (null si no autenticado)
 *   loading — true mientras se verifica la sesión
 *   children
 */
export default function ProtectedRoute({ user, loading, children }) {
  // Mientras verifica la sesión, no redirige aún
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        fontWeight: 600,
        color: "#6b7280",
      }}>
        Cargando...
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return children;
}
