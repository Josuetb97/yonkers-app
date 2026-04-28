/**
 * useRecentlyViewed
 * Guarda las últimas piezas vistas en localStorage.
 * Máximo 10 piezas, sin duplicados.
 */
import { useState, useCallback } from "react";

const KEY     = "yonkers_recently_viewed";
const MAX     = 10;

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState(load);

  const addPiece = useCallback((piece) => {
    if (!piece?.id) return;
    setItems((prev) => {
      const filtered = prev.filter((p) => p.id !== piece.id);
      const next = [
        {
          id:     piece.id,
          title:  piece.title,
          brand:  piece.brand,
          years:  piece.years,
          price:  piece.price,
          images: piece.images,
          yonker: piece.yonker,
          city:   piece.city,
        },
        ...filtered,
      ].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(KEY);
    setItems([]);
  }, []);

  return { items, addPiece, clearHistory };
}
