/**
 * routes/index.jsx — definición centralizada de rutas de la app
 * Re-exporta las constantes de path para evitar strings mágicos en el código.
 *
 * Uso:
 *   import { ROUTES } from "../routes";
 *   navigate(ROUTES.SELLER(ownerId));
 */

export const ROUTES = {
  HOME:         "/",
  REQUEST:      "/request",
  MY_PIECES:    "/my-pieces",
  MESSAGES:     "/messages",
  MAP:          "/map",
  ADMIN:        "/admin",
  SELLER:       (ownerId) => `/seller/${ownerId}`,
};

export default ROUTES;
