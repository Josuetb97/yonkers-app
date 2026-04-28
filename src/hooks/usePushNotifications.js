/**
 * usePushNotifications
 * Maneja permiso de notificaciones push (Web Push API).
 * Funciona en Android Chrome/Firefox. iOS 16.4+ con PWA instalada.
 */
import { useState, useCallback } from "react";

export function usePushNotifications() {
  const supported = "Notification" in window && "serviceWorker" in navigator;
  const [permission, setPermission] = useState(
    supported ? Notification.permission : "denied"
  );

  const requestPermission = useCallback(async () => {
    if (!supported) return "denied";
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return "denied";
    }
  }, [supported]);

  /**
   * Muestra una notificación local (sin servidor).
   * Útil para confirmar acciones: "Solicitud publicada", "Pieza guardada".
   */
  const notify = useCallback(async (title, options = {}) => {
    if (!supported || Notification.permission !== "granted") return;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        reg.showNotification(title, {
          icon:    "/logo-yonkers.png",
          badge:   "/logo-yonkers.png",
          vibrate: [100, 50, 100],
          ...options,
        });
      } else {
        new Notification(title, {
          icon: "/logo-yonkers.png",
          ...options,
        });
      }
    } catch { /* silencioso */ }
  }, [supported]);

  return { supported, permission, requestPermission, notify };
}
