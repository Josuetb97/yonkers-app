/**
 * useLocation — selección de ciudad/ubicación del usuario
 * Combina geolocalización del browser con selección manual.
 * Persiste la ciudad elegida en localStorage.
 */
import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "yonkers_city";
const DEFAULT_CITY = "San Pedro Sula";

export function useLocation() {
  const [city, setCity] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_CITY; }
    catch { return DEFAULT_CITY; }
  });

  const [detecting, setDetecting] = useState(false);
  const [error, setError]         = useState(null);

  /* Guardar en localStorage cada vez que cambia */
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, city); }
    catch {}
  }, [city]);

  /* Selección manual */
  const selectCity = useCallback((newCity) => {
    setCity(newCity);
    setError(null);
  }, []);

  /* Detección automática via browser Geolocation → Nominatim reverse-geocode */
  const detectCity = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }

    setDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "es" } }
          );
          const data = await res.json();
          const detected =
            data.address?.city ||
            data.address?.town ||
            data.address?.municipality ||
            DEFAULT_CITY;
          setCity(detected);
        } catch {
          setError("No se pudo detectar la ciudad. Selecciónala manualmente.");
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setError("Permiso de ubicación denegado.");
        setDetecting(false);
      },
      { timeout: 8000 }
    );
  }, []);

  return { city, selectCity, detectCity, detecting, error };
}
