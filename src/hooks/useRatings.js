/**
 * useRatings
 * Sistema de reputación: guarda ratings en Supabase tabla "ratings".
 * Si no existe la tabla, cae back a localStorage.
 */
import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

const LOCAL_KEY = "yonkers_ratings";

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}"); }
  catch { return {}; }
}

export function useRatings() {
  // ratings locales: { [piece_id]: { stars, comment, ts } }
  const [localRatings, setLocalRatings] = useState(loadLocal);

  const submitRating = useCallback(async ({ pieceId, sellerId, stars, comment = "" }) => {
    // 1. Guardar localmente siempre
    setLocalRatings((prev) => {
      const next = { ...prev, [pieceId]: { stars, comment, ts: Date.now() } };
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      return next;
    });

    // 2. Intentar guardar en Supabase
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      await supabase.from("ratings").upsert({
        piece_id:  pieceId,
        seller_id: sellerId,
        user_id:   userId ?? null,
        stars,
        comment:   comment.trim(),
        created_at: new Date().toISOString(),
      }, { onConflict: "piece_id,user_id" });
    } catch { /* silencioso si tabla no existe */ }
  }, []);

  const getRating = useCallback((pieceId) => {
    return localRatings[pieceId] ?? null;
  }, [localRatings]);

  return { submitRating, getRating, localRatings };
}
