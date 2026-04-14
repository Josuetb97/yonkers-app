/**
 * useCart — carrito de piezas y vehículos de interés
 * Persiste en localStorage. No es e-commerce real —
 * es una lista de contactos para WhatsApp.
 */
import { useState, useCallback, useEffect } from "react";

const CART_KEY = "yonkers_cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    // Notificar a otras instancias en la MISMA pestaña.
    // queueMicrotask evita disparar el evento sincrónicamente dentro
    // de un updater de setState (lo que causa el warning de React).
    queueMicrotask(() => {
      window.dispatchEvent(new CustomEvent("yonkers_cart_update", { detail: items }));
    });
  } catch {}
}

export function useCart() {
  const [cartItems, setCartItems] = useState(() => loadCart());

  /* Sincronizar cuando otra instancia actualiza el localStorage */
  useEffect(() => {
    function onStorage(e) {
      if (e.key === CART_KEY) {
        try { setCartItems(e.newValue ? JSON.parse(e.newValue) : []); }
        catch {}
      }
    }
    function onLocalUpdate(e) {
      setCartItems(Array.isArray(e.detail) ? e.detail : loadCart());
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("yonkers_cart_update", onLocalUpdate);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("yonkers_cart_update", onLocalUpdate);
    };
  }, []);

  const addToCart = useCallback((item) => {
    // item: { id, type, title, brand, years, price, images, whatsapp, yonker, city }
    setCartItems((prev) => {
      const key = `${item.type || "piece"}_${item.id}`;
      const exists = prev.some((i) => `${i.type || "piece"}_${i.id}` === key);
      if (exists) return prev;
      const next = [...prev, { ...item, type: item.type || "piece", _key: key }];
      saveCart(next);
      return next;
    });
  }, []);

  const removeFromCart = useCallback((id, type = "piece") => {
    setCartItems((prev) => {
      const key = `${type}_${id}`;
      const next = prev.filter((i) => `${i.type || "piece"}_${i.id}` !== key);
      saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    saveCart([]);
  }, []);

  const isInCart = useCallback(
    (id, type = "piece") => cartItems.some((i) => `${i.type || "piece"}_${i.id}` === `${type}_${id}`),
    [cartItems]
  );

  return { cartItems, addToCart, removeFromCart, clearCart, isInCart };
}
