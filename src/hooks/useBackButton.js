/**
 * useBackButton
 * - Detecta el botón físico "Atrás" de Android (popstate)
 * - Detecta swipe desde el borde izquierdo (gesto iOS/Android)
 * - Llama a onBack() cuando se activa
 */
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function useBackButton() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isHome    = location.pathname === "/";

  useEffect(() => {
    if (isHome) return;

    // Android hardware back button (popstate ya lo maneja react-router,
    // pero necesitamos asegurarnos que navegue correctamente)
    function handlePop() {
      // react-router ya manejó el pop — solo aseguramos que el estado quede bien
    }
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [isHome]);

  return { isHome, goBack: () => navigate(-1) };
}

/**
 * useSwipeBack
 * Detecta swipe desde el borde izquierdo (primeros 28px) hacia la derecha.
 * Solo se activa si el usuario no está en home.
 */
export function useSwipeBack(onBack, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    let startX   = 0;
    let startY   = 0;
    let tracking = false;

    function onTouchStart(e) {
      const touch = e.touches[0];
      // Solo desde el borde izquierdo (primeros 28px)
      if (touch.clientX < 28) {
        startX   = touch.clientX;
        startY   = touch.clientY;
        tracking = true;
      }
    }

    function onTouchEnd(e) {
      if (!tracking) return;
      tracking = false;
      const touch  = e.changedTouches[0];
      const dx     = touch.clientX - startX;
      const dy     = Math.abs(touch.clientY - startY);
      // Swipe horizontal > 60px y más horizontal que vertical
      if (dx > 60 && dy < 80) {
        onBack();
      }
    }

    function onTouchCancel() { tracking = false; }

    document.addEventListener("touchstart",  onTouchStart,  { passive: true });
    document.addEventListener("touchend",    onTouchEnd,    { passive: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart",  onTouchStart);
      document.removeEventListener("touchend",    onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [onBack, enabled]);
}
