/**
 * NotificationPrompt
 * Banner suave que pide permiso de notificaciones.
 * Se muestra solo si no se ha pedido antes y el usuario ha interactuado.
 */
import { useEffect, useState } from "react";
import { usePushNotifications } from "../hooks/usePushNotifications";

const DISMISSED_KEY = "yonkers_notif_dismissed";

export default function NotificationPrompt() {
  const { supported, permission, requestPermission } = usePushNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!supported) return;
    if (permission !== "default") return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Mostrar después de 8s (el usuario ya interactuó con la app)
    const t = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(t);
  }, [supported, permission]);

  if (!visible) return null;

  async function handleAccept() {
    setVisible(false);
    const result = await requestPermission();
    if (result === "granted") {
      // Registrar service worker
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch { /* silencioso */ }
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <span style={s.icon}>🔔</span>
        <div style={s.text}>
          <div style={s.title}>Activa las notificaciones</div>
          <div style={s.sub}>Entérate cuando lleguen nuevas piezas</div>
        </div>
        <div style={s.btns}>
          <button style={s.accept} onClick={handleAccept}>Activar</button>
          <button style={s.dismiss} onClick={handleDismiss}>Ahora no</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: {
    position: "fixed", bottom: 80, left: 12, right: 12,
    zIndex: 9998,
    animation: "slideUp 0.3s ease",
  },
  card: {
    background: "#1e3a8a",
    borderRadius: 18,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 8px 32px rgba(30,58,138,0.4)",
  },
  icon: { fontSize: 24, flexShrink: 0 },
  text: { flex: 1, minWidth: 0 },
  title: { color: "#fff", fontWeight: 700, fontSize: 14 },
  sub:   { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 },
  btns: { display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 },
  accept: {
    background: "#facc15", color: "#1e3a8a",
    border: "none", borderRadius: 10,
    padding: "7px 14px", fontSize: 12, fontWeight: 700,
    cursor: "pointer", whiteSpace: "nowrap",
  },
  dismiss: {
    background: "none", color: "rgba(255,255,255,0.55)",
    border: "none", fontSize: 11, cursor: "pointer",
    padding: "2px 0",
  },
};
