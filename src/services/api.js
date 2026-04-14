/**
 * services/api.js — capa centralizada de llamadas HTTP al backend
 * Todas las rutas van a través de aquí para que sea fácil cambiar
 * la base URL o añadir headers globales en un solo lugar.
 */
import { supabase } from "../lib/supabase";

const BASE = import.meta.env.VITE_API_URL || "/api";

/* ── Helper: obtener token de sesión activa ── */
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/* ── Helper: fetch con auth opcional ── */
async function request(path, options = {}, requireAuth = false) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };

  if (requireAuth) {
    const token = await getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Error ${res.status}`);
  }

  return res.json();
}

/* ══════════════════════════════════════════
   PIEZAS
══════════════════════════════════════════ */
export const piecesApi = {
  /** Buscar piezas con filtros */
  search(params = {}) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return request(`/pieces${qs ? `?${qs}` : ""}`);
  },

  /** Detalle de una pieza */
  getById(id) {
    return request(`/pieces/${id}`);
  },

  /** Crear pieza (requiere auth) */
  create(formData) {
    return request("/pieces", { method: "POST", body: formData, headers: {} }, true);
  },

  /** Actualizar pieza (requiere auth) */
  update(id, formData) {
    return request(`/pieces/${id}`, { method: "PUT", body: formData, headers: {} }, true);
  },

  /** Eliminar pieza (requiere auth) */
  delete(id) {
    return request(`/pieces/${id}`, { method: "DELETE" }, true);
  },
};

/* ══════════════════════════════════════════
   SOLICITUDES / NEEDS
══════════════════════════════════════════ */
export const needsApi = {
  create(body) {
    return request("/needs", { method: "POST", body: JSON.stringify(body) }, true);
  },

  list() {
    return request("/needs");
  },
};

/* ══════════════════════════════════════════
   CHAT / IA
══════════════════════════════════════════ */
export const chatApi = {
  send(messages) {
    return request("/chat", {
      method: "POST",
      body:   JSON.stringify({ messages }),
    });
  },
};

/* ══════════════════════════════════════════
   ANALÍTICAS
══════════════════════════════════════════ */
export const analyticsApi = {
  track(event, page = "", extra = {}) {
    return fetch(`${BASE}/analytics`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ event, page, ...extra }),
    }).catch(() => {}); // silencioso
  },
};
