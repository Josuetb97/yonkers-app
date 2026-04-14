/**
 * usePhotoSearch — búsqueda de piezas por fotografía
 * Envía la imagen al backend (/api/photo-search) que la procesa
 * con IA y devuelve el nombre de la pieza detectada + resultados.
 */
import { useState, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "/api";

export function usePhotoSearch() {
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);   // { partName, pieces[] }
  const [error,    setError]    = useState(null);

  /**
   * searchByPhoto — envía un File/Blob al backend
   * @param {File} file
   * @returns {{ partName: string, pieces: Array }} | null
   */
  const searchByPhoto = useCallback(async (file) => {
    if (!file) return null;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("image", file);

      const res = await fetch(`${API}/photo-search`, {
        method: "POST",
        body:   fd,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status}`);
      }

      const data = await res.json();

      // data esperado: { partName: string, pieces: [] }
      const outcome = {
        partName: data.partName || data.query || "",
        pieces:   Array.isArray(data.pieces) ? data.pieces : [],
      };

      setResult(outcome);
      return outcome;

    } catch (err) {
      const msg = err.message || "Error procesando la imagen";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { searchByPhoto, loading, result, error, reset };
}
