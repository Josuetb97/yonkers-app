/**
 * useAnalytics — rastreo de eventos clave en Yonkers App
 * Llama al endpoint POST /api/analytics (ya existe en el backend).
 * Falla silenciosamente para no interrumpir la UX.
 */
import { useCallback } from "react";

const API = "/api";

export function useAnalytics() {
  const track = useCallback(async (event, page = "", extra = {}) => {
    try {
      await fetch(`${API}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, page, ...extra }),
      });
    } catch {
      // Silent — analytics never rompe la app
    }
  }, []);

  return { track };
}

/*
  Eventos recomendados:
  track("whatsapp_click",  "home",    { piece_id, piece_title })
  track("piece_view",      "home",    { piece_id })
  track("search",          "home",    { query })
  track("seller_profile",  "seller",  { seller_id })
  track("request_submit",  "request", {})
  track("chat_message",    "messages",{})
*/
