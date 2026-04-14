/**
 * services/location.js — helpers de geolocalización y ciudades
 */

/** Lista de ciudades de Honduras disponibles en la app */
export const HONDURAS_CITIES = [
  "San Pedro Sula",
  "Tegucigalpa",
  "La Ceiba",
  "El Progreso",
  "Choloma",
  "Villanueva",
  "Choluteca",
  "Comayagua",
  "Puerto Cortés",
  "Danlí",
  "Juticalpa",
  "Santa Rosa de Copán",
  "Siguatepeque",
  "Tela",
  "La Lima",
];

/**
 * getDistanceKm — distancia entre dos coordenadas (fórmula Haversine)
 * @returns distancia en kilómetros
 */
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * getCurrentPosition — wrapper promisificado de navigator.geolocation
 * @returns {{ lat: number, lng: number }}
 */
export function getCurrentPosition(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no soportada en este navegador"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      (err) => reject(new Error(err.message)),
      { timeout: timeoutMs, enableHighAccuracy: false }
    );
  });
}

/**
 * reverseGeocode — convierte coordenadas en nombre de ciudad
 * Usa Nominatim (OpenStreetMap) — gratuito, sin API key
 */
export async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { "Accept-Language": "es" } }
  );
  if (!res.ok) throw new Error("Error en reverse geocoding");
  const data = await res.json();
  return (
    data.address?.city ||
    data.address?.town  ||
    data.address?.municipality ||
    "Honduras"
  );
}
