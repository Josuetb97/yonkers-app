/**
 * useVoiceSearch
 *
 * Hook que activa el micrófono y usa la Web Speech API
 * para transcribir lo que dice el usuario y pasarlo como query de búsqueda.
 *
 * Uso:
 *   const { listening, supported, startListening, stopListening } = useVoiceSearch({ onResult });
 *
 * Props:
 *   onResult(text: string) — se llama al terminar la escucha con el texto transcrito
 *   onError(msg: string)   — se llama si ocurre un error (opcional)
 *   lang                   — idioma BCP 47 (default: "es-HN")
 */
import { useCallback, useEffect, useRef, useState } from "react";

export function useVoiceSearch({ onResult, onError, lang = "es-HN" } = {}) {
  const [listening,  setListening]  = useState(false);
  const [supported,  setSupported]  = useState(false);
  const recognitionRef = useRef(null);

  /* ── Verificar soporte al montar ── */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
  }, []);

  /* ── Iniciar escucha ── */
  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError?.("Tu navegador no soporta búsqueda por voz.");
      return;
    }

    // Si ya está escuchando, detener primero
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.lang             = lang;
    recognition.interimResults   = false; // solo resultado final
    recognition.maxAlternatives  = 1;
    recognition.continuous       = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (transcript) onResult?.(transcript);
    };

    recognition.onerror = (event) => {
      const msgs = {
        "not-allowed":   "Permiso de micrófono denegado.",
        "no-speech":     "No se detectó ningún audio. Intenta de nuevo.",
        "network":       "Error de red. Verifica tu conexión.",
        "audio-capture": "No se pudo acceder al micrófono.",
      };
      onError?.(msgs[event.error] || `Error: ${event.error}`);
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, onResult, onError]);

  /* ── Detener escucha ── */
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  /* ── Limpiar al desmontar ── */
  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  return { listening, supported, startListening, stopListening };
}
