import { useState, useCallback } from "react";

const STORAGE_KEY = "yonkers_favorites";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => loadFromStorage());

  const toggleFavorite = useCallback((pieceId) => {
    setFavorites((prev) => {
      const next = prev.includes(pieceId)
        ? prev.filter((id) => id !== pieceId)
        : [...prev, pieceId];
      saveToStorage(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (pieceId) => favorites.includes(pieceId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
