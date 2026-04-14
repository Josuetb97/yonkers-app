/**
 * Sistema de Toast / Notificaciones global
 *
 * Uso:
 *   1. Envuelve tu app con <ToastProvider>
 *   2. En cualquier componente: const { toast } = useToast()
 *      toast.success("Guardado correctamente")
 *      toast.error("Algo salió mal")
 *      toast.info("Pieza agregada al carrito")
 *      toast.warning("Verifica tus datos")
 */
import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

let idCounter = 0;

const ICONS = {
  success: "✅",
  error:   "❌",
  info:    "💬",
  warning: "⚠️",
};

const COLORS = {
  success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", bar: "#16a34a" },
  error:   { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", bar: "#ef4444" },
  info:    { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", bar: "#3b82f6" },
  warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", bar: "#f59e0b" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((message, type = "info", duration = 3500) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev.slice(-4), { id, message, type, duration }]);
    setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  const toast = {
    success: (msg, dur) => add(msg, "success", dur),
    error:   (msg, dur) => add(msg, "error",   dur || 5000),
    info:    (msg, dur) => add(msg, "info",     dur),
    warning: (msg, dur) => add(msg, "warning",  dur),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* ── Portal de toasts ── */}
      <div style={st.container} aria-live="polite">
        {toasts.map((t) => {
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div
              key={t.id}
              style={{ ...st.toast, background: c.bg, border: `1px solid ${c.border}` }}
              onClick={() => remove(t.id)}
            >
              {/* Barra de color izquierda */}
              <div style={{ ...st.bar, background: c.bar }} />

              <span style={st.icon}>{ICONS[t.type]}</span>

              <span style={{ ...st.msg, color: c.text }}>{t.message}</span>

              <button
                style={st.closeBtn}
                onClick={(e) => { e.stopPropagation(); remove(t.id); }}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

const st = {
  container: {
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 99999,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "min(92vw, 360px)",
    pointerEvents: "none",
  },
  toast: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    padding: "12px 14px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    cursor: "pointer",
    pointerEvents: "all",
    animation: "toastIn 0.28s cubic-bezier(.34,1.56,.64,1)",
    position: "relative",
    overflow: "hidden",
  },
  bar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: "14px 0 0 14px",
  },
  icon:  { fontSize: 16, flexShrink: 0, marginLeft: 6 },
  msg:   { flex: 1, fontSize: 13, fontWeight: 600, lineHeight: 1.4 },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "#9ca3af",
    padding: "0 2px",
    lineHeight: 1,
    flexShrink: 0,
  },
};

/* Keyframes */
if (typeof document !== "undefined" && !document.getElementById("toast-kf")) {
  const s = document.createElement("style");
  s.id = "toast-kf";
  s.textContent = `@keyframes toastIn {
    from { opacity:0; transform:translateY(-12px) scale(0.95); }
    to   { opacity:1; transform:translateY(0)     scale(1); }
  }`;
  document.head.appendChild(s);
}
