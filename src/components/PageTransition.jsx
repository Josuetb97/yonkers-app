/**
 * PageTransition
 * Animación de entrada al cambiar de ruta.
 * Usa solo transform + opacity (GPU-accelerated, funciona en cualquier gama).
 * Respeta prefers-reduced-motion para accesibilidad / gama baja.
 */
import { useEffect, useRef } from "react";

const REDUCED = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function PageTransition({ children, direction = "forward", pageKey }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED) return;

    // Posición inicial según dirección
    const fromX = direction === "back" ? "-28px" : "28px";

    el.style.opacity    = "0";
    el.style.transform  = `translateX(${fromX})`;
    el.style.transition = "none";

    // Un frame de reflow para que el browser registre el estado inicial
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!ref.current) return;
        el.style.transition = "opacity 220ms ease, transform 240ms cubic-bezier(0.25,0.46,0.45,0.94)";
        el.style.opacity    = "1";
        el.style.transform  = "translateX(0)";
      });
    });
  }, [pageKey]);

  return (
    <div ref={ref} style={{ width: "100%", minHeight: "100%" }}>
      {children}
    </div>
  );
}
