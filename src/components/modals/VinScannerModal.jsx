/**
 * VinScannerModal
 *
 * Modal para escanear o ingresar un VIN y obtener Make/Model/Year del vehículo
 * para autocompletar la búsqueda de piezas.
 *
 * Flujo:
 *  1. Muestra cámara trasera con overlay de guía
 *  2. Usa BarcodeDetector API (nativa en Chrome/Edge/Safari) para detectar el código de barras del VIN
 *  3. Si no hay BarcodeDetector, permite entrada manual
 *  4. Llama a la NHTSA API gratuita para decodificar el VIN
 *  5. Devuelve { make, model, year } al padre vía onDecoded()
 *
 * Props:
 *   onClose()                                        — cierra el modal
 *   onDecoded({ vin, make, model, year, query })     — VIN decodificado con query lista
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { X, Search, RotateCcw, QrCode } from "lucide-react";

const NHTSA_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevin";

/* ── Helpers ── */
function isValidVin(v) {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(v);
}

async function decodeVinNHTSA(vin) {
  const res  = await fetch(`${NHTSA_URL}/${vin.toUpperCase()}?format=json`);
  if (!res.ok) throw new Error("Error contactando NHTSA");
  const json = await res.json();
  const results = json.Results ?? [];

  function get(variable) {
    return (results.find((r) => r.Variable === variable)?.Value ?? "").trim();
  }

  const make  = get("Make");
  const model = get("Model");
  const year  = get("Model Year");
  const type  = get("Vehicle Type");

  if (!make || make === "Not Applicable") {
    throw new Error("VIN no reconocido. Verifica el número e intenta de nuevo.");
  }

  return { make, model, year, type };
}

/* ────────────────────────────────────
   COMPONENTE PRINCIPAL
──────────────────────────────────── */
export default function VinScannerModal({ onClose, onDecoded }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const detectorRef = useRef(null);
  const rafRef      = useRef(null);

  const [mode,        setMode]        = useState("camera"); // "camera" | "manual"
  const [manualVin,   setManualVin]   = useState("");
  const [status,      setStatus]      = useState("Apunta al código de barras del VIN");
  const [scanned,     setScanned]     = useState(null);   // VIN detectado
  const [vehicleInfo, setVehicleInfo] = useState(null);   // { make, model, year }
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState(false);

  /* ── Iniciar cámara ── */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setMode("manual");
      setError("No se pudo acceder a la cámara. Ingresa el VIN manualmente.");
    }
  }, []);

  /* ── Parar cámara ── */
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  /* ── Escaneo en loop ── */
  const scanLoop = useCallback(async () => {
    const detector = detectorRef.current;
    const video    = videoRef.current;
    if (!detector || !video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    try {
      const barcodes = await detector.detect(video);
      for (const bc of barcodes) {
        const raw = bc.rawValue?.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
        if (isValidVin(raw)) {
          setScanned(raw);
          setStatus(`VIN detectado: ${raw}`);
          stopCamera();
          return; // detener escaneo
        }
      }
    } catch { /* ignorar errores de detección */ }

    rafRef.current = requestAnimationFrame(scanLoop);
  }, [stopCamera]);

  /* ── Montar: iniciar cámara + detector ── */
  useEffect(() => {
    const hasDet = "BarcodeDetector" in window;
    setHasBarcodeDetector(hasDet);

    if (hasDet) {
      detectorRef.current = new window.BarcodeDetector({
        formats: ["code_39", "code_128", "data_matrix", "pdf417", "qr_code"],
      });
      startCamera().then(() => {
        rafRef.current = requestAnimationFrame(scanLoop);
      });
    } else {
      // Navegador sin BarcodeDetector → modo manual directo
      setMode("manual");
      setStatus("Ingresa el VIN de tu vehículo");
    }

    return () => stopCamera();
  }, [startCamera, stopCamera, scanLoop]);

  /* ── Llamar NHTSA cuando hay VIN (escaneado o manual) ── */
  async function handleDecode(vin) {
    setError("");
    setLoading(true);
    try {
      const info = await decodeVinNHTSA(vin);
      setVehicleInfo(info);
      setScanned(vin.toUpperCase());
    } catch (e) {
      setError(e.message || "Error decodificando VIN");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (scanned && !vehicleInfo && !loading) {
      handleDecode(scanned);
    }
  }, [scanned]);

  /* ── Confirmar selección ── */
  function handleConfirm() {
    if (!vehicleInfo || !scanned) return;
    const { make, model, year } = vehicleInfo;
    // Construir query de búsqueda: "Honda Civic 2003"
    const query = [year, make, model].filter(Boolean).join(" ").trim();
    onDecoded?.({ vin: scanned, ...vehicleInfo, query });
    onClose?.();
  }

  /* ── Reiniciar ── */
  function handleReset() {
    setScanned(null);
    setVehicleInfo(null);
    setError("");
    setManualVin("");
    if (hasBarcodeDetector && mode === "camera") {
      setStatus("Apunta al código de barras del VIN");
      startCamera().then(() => {
        rafRef.current = requestAnimationFrame(scanLoop);
      });
    }
  }

  /* ── Buscar manual ── */
  function handleManualSubmit(e) {
    e.preventDefault();
    const v = manualVin.trim().toUpperCase();
    if (!isValidVin(v)) {
      setError("El VIN debe tener exactamente 17 caracteres alfanuméricos.");
      return;
    }
    setScanned(v);
  }

  /* ─────────────────────────
     RENDER
  ───────────────────────── */
  return (
    <div style={st.overlay} onClick={onClose}>
      <div style={st.sheet} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={st.header}>
          <div style={st.titleRow}>
            <QrCode size={20} color="#1e4b8f" strokeWidth={2} />
            <span style={st.title}>Escáner de VIN</span>
          </div>
          <button style={st.closeBtn} onClick={onClose} type="button">
            <X size={20} color="#6b7280" />
          </button>
        </div>

        {/* ── Vista de cámara ── */}
        {mode === "camera" && !scanned && (
          <div style={st.cameraContainer}>
            <video ref={videoRef} style={st.video} muted playsInline />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Overlay guía */}
            <div style={st.overlay2}>
              <div style={st.vinGuide}>
                <div style={st.corner("topLeft")} />
                <div style={st.corner("topRight")} />
                <div style={st.corner("bottomLeft")} />
                <div style={st.corner("bottomRight")} />
                <span style={st.guideText}>Código de barras del VIN</span>
              </div>
            </div>

            <p style={st.statusText}>{status}</p>

            {/* Botón modo manual */}
            <button
              style={st.manualBtn}
              type="button"
              onClick={() => { stopCamera(); setMode("manual"); setStatus("Ingresa el VIN manualmente"); }}
            >
              Escribir VIN manualmente
            </button>
          </div>
        )}

        {/* ── Entrada manual ── */}
        {mode === "manual" && !scanned && (
          <div style={st.manualContainer}>
            <p style={st.hint}>
              El VIN tiene <strong>17 caracteres</strong>. Lo encuentras en el tablero
              (esquina inferior del parabrisas), en la puerta del conductor o en los
              documentos del vehículo.
            </p>

            <form onSubmit={handleManualSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                value={manualVin}
                onChange={(e) => setManualVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, "").slice(0, 17))}
                placeholder="Ej: 1HGCM82633A004352"
                style={st.vinInput}
                maxLength={17}
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
              />

              <div style={st.vinProgress}>
                {Array.from({ length: 17 }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      ...st.vinDot,
                      background: manualVin[i] ? "#1e4b8f" : "#e5e7eb",
                    }}
                  />
                ))}
              </div>

              <button
                type="submit"
                style={{
                  ...st.decodeBtn,
                  opacity: manualVin.length === 17 ? 1 : 0.45,
                }}
                disabled={manualVin.length !== 17}
              >
                <Search size={16} strokeWidth={2.5} />
                Decodificar VIN
              </button>
            </form>

            {hasBarcodeDetector && (
              <button
                style={st.switchBtn}
                type="button"
                onClick={() => { setMode("camera"); setError(""); startCamera().then(() => { rafRef.current = requestAnimationFrame(scanLoop); }); }}
              >
                Usar cámara
              </button>
            )}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={st.loadingBox}>
            <div style={st.spinner} />
            <p style={{ margin: "12px 0 0", color: "#6b7280", fontSize: 14 }}>
              Consultando base de datos NHTSA…
            </p>
          </div>
        )}

        {/* ── Resultado ── */}
        {vehicleInfo && scanned && !loading && (
          <div style={st.resultBox}>
            <div style={st.vehicleBadge}>
              <span style={st.vehicleYear}>{vehicleInfo.year}</span>
              <span style={st.vehicleName}>
                {vehicleInfo.make} {vehicleInfo.model}
              </span>
              {vehicleInfo.type && (
                <span style={st.vehicleType}>{vehicleInfo.type}</span>
              )}
            </div>

            <div style={st.vinTag}>VIN: {scanned}</div>

            <p style={st.resultHint}>
              Se buscarán piezas compatibles con este vehículo.
            </p>

            <div style={st.resultActions}>
              <button style={st.resetBtn} type="button" onClick={handleReset}>
                <RotateCcw size={15} strokeWidth={2.5} />
                Escanear otro
              </button>
              <button style={st.confirmBtn} type="button" onClick={handleConfirm}>
                <Search size={15} strokeWidth={2.5} />
                Buscar piezas
              </button>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={st.errorBox}>
            <span>⚠️ {error}</span>
            <button style={st.retryBtn} type="button" onClick={handleReset}>
              Reintentar
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   STYLES
───────────────────────────────────── */
const BLUE = "#1e4b8f";

const st = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    zIndex: 10100,
    display: "flex",
    alignItems: "flex-end",
  },

  sheet: {
    width: "100%",
    maxHeight: "92vh",
    background: "#fff",
    borderRadius: "22px 22px 0 0",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 20px 12px",
    borderBottom: "1px solid #f3f4f6",
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  title: {
    fontSize: 17,
    fontWeight: 700,
    color: "#111827",
  },

  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
  },

  /* Cámara */
  cameraContainer: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  video: {
    width: "100%",
    maxHeight: 280,
    objectFit: "cover",
    background: "#000",
  },

  overlay2: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },

  vinGuide: {
    position: "relative",
    width: "78%",
    height: 70,
    border: "2px solid rgba(255,255,255,0.3)",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  corner: (pos) => {
    const base = {
      position: "absolute",
      width: 18,
      height: 18,
      borderColor: "#facc15",
      borderStyle: "solid",
    };
    const corners = {
      topLeft:     { top: -2, left: -2, borderWidth: "3px 0 0 3px", borderRadius: "4px 0 0 0" },
      topRight:    { top: -2, right: -2, borderWidth: "3px 3px 0 0", borderRadius: "0 4px 0 0" },
      bottomLeft:  { bottom: -2, left: -2, borderWidth: "0 0 3px 3px", borderRadius: "0 0 0 4px" },
      bottomRight: { bottom: -2, right: -2, borderWidth: "0 3px 3px 0", borderRadius: "0 0 4px 0" },
    };
    return { ...base, ...corners[pos] };
  },

  guideText: {
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },

  statusText: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    margin: "12px 20px 4px",
  },

  manualBtn: {
    background: "none",
    border: "none",
    color: BLUE,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    padding: "8px 0 16px",
    textDecoration: "underline",
  },

  /* Manual */
  manualContainer: {
    padding: "20px 20px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  hint: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 1.55,
    margin: 0,
  },

  vinInput: {
    padding: "14px 16px",
    borderRadius: 12,
    border: "2px solid #e5e7eb",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#111827",
    outline: "none",
    fontFamily: "monospace",
    transition: "border-color 0.15s",
  },

  vinProgress: {
    display: "flex",
    gap: 4,
    justifyContent: "center",
  },

  vinDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    transition: "background 0.15s",
    flexShrink: 0,
  },

  decodeBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "14px 0",
    borderRadius: 12,
    background: "linear-gradient(135deg, #1e4b8f, #0f3e82)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    transition: "opacity 0.15s",
  },

  switchBtn: {
    background: "none",
    border: "none",
    color: BLUE,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
    textDecoration: "underline",
    padding: "4px 0",
  },

  /* Loading */
  loadingBox: {
    padding: "32px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #e5e7eb",
    borderTopColor: BLUE,
    borderRadius: "50%",
    animation: "vinSpin 0.75s linear infinite",
  },

  /* Resultado */
  resultBox: {
    padding: "20px 20px 32px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  vehicleBadge: {
    background: "linear-gradient(135deg, #1e4b8f, #0f3e82)",
    borderRadius: 16,
    padding: "20px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  vehicleYear: {
    fontSize: 13,
    fontWeight: 700,
    color: "#facc15",
    letterSpacing: "0.05em",
  },

  vehicleName: {
    fontSize: 22,
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1.2,
  },

  vehicleType: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },

  vinTag: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#9ca3af",
    fontFamily: "monospace",
    textAlign: "center",
  },

  resultHint: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    margin: 0,
  },

  resultActions: {
    display: "flex",
    gap: 10,
    marginTop: 4,
  },

  resetBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "13px 0",
    borderRadius: 12,
    border: "1.5px solid #e5e7eb",
    background: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    color: "#374151",
  },

  confirmBtn: {
    flex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "13px 0",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #1e4b8f, #0f3e82)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },

  /* Error */
  errorBox: {
    margin: "0 20px 24px",
    padding: "14px 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 12,
    fontSize: 13,
    color: "#b91c1c",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "flex-start",
  },

  retryBtn: {
    background: "none",
    border: "none",
    color: "#b91c1c",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },
};

/* ── Inyectar keyframes del spinner ── */
if (typeof document !== "undefined" && !document.getElementById("vin-spin-kf")) {
  const style = document.createElement("style");
  style.id = "vin-spin-kf";
  style.textContent = `@keyframes vinSpin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
