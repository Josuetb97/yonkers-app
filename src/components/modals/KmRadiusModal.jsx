import { X, MapPin, Navigation, LocateFixed, Loader } from "lucide-react";
import { useState, useMemo } from "react";

/* ─────────────────────────────────────────────────────────
   Ciudades de Honduras con coordenadas
───────────────────────────────────────────────────────── */
export const HN_CITIES = [
  { name: "Tegucigalpa",         dept: "Francisco Morazán", lat: 14.0818, lng: -87.2068 },
  { name: "San Pedro Sula",      dept: "Cortés",            lat: 15.4997, lng: -88.0255 },
  { name: "Choloma",             dept: "Cortés",            lat: 15.6167, lng: -87.9500 },
  { name: "La Ceiba",            dept: "Atlántida",         lat: 15.7667, lng: -86.8000 },
  { name: "El Progreso",         dept: "Yoro",              lat: 15.4000, lng: -87.8000 },
  { name: "Comayagua",           dept: "Comayagua",         lat: 14.4500, lng: -87.6330 },
  { name: "Puerto Cortés",       dept: "Cortés",            lat: 15.8330, lng: -87.9330 },
  { name: "Siguatepeque",        dept: "Comayagua",         lat: 14.6000, lng: -87.8330 },
  { name: "Juticalpa",           dept: "Olancho",           lat: 14.6660, lng: -86.2330 },
  { name: "Danlí",               dept: "El Paraíso",        lat: 14.0330, lng: -86.5830 },
  { name: "Choluteca",           dept: "Choluteca",         lat: 13.3000, lng: -87.2000 },
  { name: "Santa Rosa de Copán", dept: "Copán",             lat: 14.7670, lng: -88.7830 },
  { name: "Tela",                dept: "Atlántida",         lat: 15.7830, lng: -87.4330 },
  { name: "Tocoa",               dept: "Colón",             lat: 15.6830, lng: -86.0000 },
  { name: "Olanchito",           dept: "Yoro",              lat: 15.4830, lng: -86.5830 },
  { name: "Trujillo",            dept: "Colón",             lat: 15.9170, lng: -85.9670 },
  { name: "Yoro",                dept: "Yoro",              lat: 15.1330, lng: -87.1170 },
  { name: "Nacaome",             dept: "Valle",             lat: 13.4830, lng: -87.5000 },
  { name: "Nueva Ocotepeque",    dept: "Ocotepeque",        lat: 14.4330, lng: -89.1830 },
  { name: "Gracias",             dept: "Lempira",           lat: 14.5830, lng: -88.5830 },
  { name: "La Paz",              dept: "La Paz",            lat: 14.3170, lng: -87.6830 },
  { name: "Intibucá",            dept: "Intibucá",          lat: 14.3170, lng: -88.1670 },
  { name: "Santa Bárbara",       dept: "Santa Bárbara",     lat: 14.9170, lng: -88.2330 },
  { name: "La Lima",             dept: "Cortés",            lat: 15.4330, lng: -87.9170 },
  { name: "Villanueva",          dept: "Cortés",            lat: 15.3330, lng: -88.0170 },
  { name: "San Lorenzo",         dept: "Valle",             lat: 13.4170, lng: -87.4500 },
  { name: "Roatán",              dept: "Islas de la Bahía", lat: 16.3170, lng: -86.5330 },
  { name: "Catacamas",           dept: "Olancho",           lat: 14.8000, lng: -85.9000 },
  { name: "El Paraíso",          dept: "El Paraíso",        lat: 13.8670, lng: -86.6000 },
  { name: "Marcala",             dept: "La Paz",            lat: 14.1670, lng: -88.0000 },
  { name: "Santa Cruz de Yojoa", dept: "Cortés",            lat: 15.0000, lng: -87.9000 },
  { name: "Copán Ruinas",        dept: "Copán",             lat: 14.8330, lng: -89.1330 },
  { name: "Cofradia",            dept: "Cortés",            lat: 15.4000, lng: -87.9670 },
  { name: "Potrerillos",         dept: "Cortés",            lat: 15.2500, lng: -87.9830 },
  { name: "Omoa",                dept: "Cortés",            lat: 15.7500, lng: -88.0330 },
  { name: "Pimienta",            dept: "Cortés",            lat: 15.2670, lng: -87.9500 },
  { name: "Naco",                dept: "Cortés",            lat: 15.1330, lng: -88.0170 },
  { name: "San Manuel",          dept: "Cortés",            lat: 15.2170, lng: -87.9170 },
  { name: "Armenia",             dept: "Cortés",            lat: 15.3170, lng: -87.9170 },
  { name: "Quimistán",           dept: "Santa Bárbara",     lat: 15.2000, lng: -88.4330 },
  { name: "Morazán",             dept: "Yoro",              lat: 15.2330, lng: -87.5000 },
  { name: "Taulabé",             dept: "Comayagua",         lat: 14.8500, lng: -87.8670 },
  { name: "Talanga",             dept: "Francisco Morazán", lat: 14.4170, lng: -87.0670 },
  { name: "Amarateca",           dept: "Francisco Morazán", lat: 14.2330, lng: -87.1330 },
];

export const RADIUS_OPTIONS = [5, 10, 25, 50, 71, 100, 150, 200];

/* ─────────────────────────────────────────────────────────
   Visual de radio (SVG decorativo, sin Google Maps)
───────────────────────────────────────────────────────── */
function RadiusVisual({ city, km }) {
  /* Tamaño del círculo proporcional al radio (entre 30 y 90 px) */
  const r = Math.min(90, Math.max(30, km === 99999 ? 90 : km * 0.55));

  return (
    <div style={{
      position: "relative",
      width: "100%", height: "100%",
      background: "linear-gradient(160deg, #1a1c2a 0%, #0f1525 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      {/* Cuadrícula de fondo tipo mapa */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.12 }}>
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#4b9eff" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Círculo exterior (radio) */}
      <div style={{
        position: "absolute",
        width: r * 2 + "px", height: r * 2 + "px",
        borderRadius: "50%",
        border: "1.5px solid rgba(79,140,255,0.55)",
        background: "rgba(35,116,225,0.10)",
        transform: "translate(-50%,-50%)",
        left: "50%", top: "50%",
        transition: "all 0.4s ease",
      }} />

      {/* Círculo interior */}
      <div style={{
        position: "absolute",
        width: r * 0.5 + "px", height: r * 0.5 + "px",
        borderRadius: "50%",
        border: "1px dashed rgba(79,140,255,0.4)",
        transform: "translate(-50%,-50%)",
        left: "50%", top: "50%",
        transition: "all 0.4s ease",
      }} />

      {/* Pin central */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "#2374e1",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 6px rgba(35,116,225,0.25)",
        }}>
          <MapPin size={18} color="#fff" fill="#fff" />
        </div>
        {city && (
          <div style={{
            background: "rgba(20,20,30,0.85)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 20,
            padding: "4px 12px",
            color: "#e4e6eb",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}>
            {city}
          </div>
        )}
      </div>

      {/* Etiqueta de radio */}
      <div style={{
        position: "absolute",
        bottom: 10, right: 12,
        background: "rgba(35,116,225,0.85)",
        borderRadius: 20,
        padding: "3px 10px",
        color: "#fff",
        fontSize: 11,
        fontWeight: 700,
      }}>
        {km >= 99999 ? "Todo el país" : `${km} km`}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Modal principal
───────────────────────────────────────────────────────── */
/* Haversine para encontrar la ciudad más cercana */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function KmRadiusModal({ open, onClose, location, radius, onApply }) {
  const [inputText,  setInputText]  = useState(location?.name || "");
  const [localLoc,   setLocalLoc]   = useState(location  || null);
  const [localKm,    setLocalKm]    = useState(radius    || 50);
  const [showDrop,   setShowDrop]   = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError,   setGpsError]   = useState("");

  /* ── Usar ubicación del dispositivo ── */
  function useDeviceLocation() {
    if (!navigator.geolocation) {
      setGpsError("Tu dispositivo no soporta GPS.");
      return;
    }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;

        // Buscar la ciudad más cercana de la lista
        let closest = null;
        let minDist = Infinity;
        HN_CITIES.forEach((c) => {
          const d = haversine(lat, lng, c.lat, c.lng);
          if (d < minDist) { minDist = d; closest = c; }
        });

        // Si la ciudad más cercana está a menos de 60 km, usarla como nombre
        const name = (closest && minDist < 60) ? closest.name : "Mi ubicación";
        const city = { name, lat, lng };
        setLocalLoc(city);
        setInputText(name);
        setShowDrop(false);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) setGpsError("Permiso de ubicación denegado.");
        else if (err.code === 2) setGpsError("No se pudo obtener la ubicación.");
        else setGpsError("Tiempo de espera agotado.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  /* Sugerencias mientras el usuario escribe */
  const suggestions = useMemo(() => {
    const t = inputText.trim().toLowerCase();
    if (!t || t === (localLoc?.name || "").toLowerCase()) return [];
    return HN_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(t) ||
        c.dept.toLowerCase().includes(t)
    ).slice(0, 7);
  }, [inputText, localLoc]);

  function pickCity(city) {
    setLocalLoc(city);
    setInputText(city.name);
    setShowDrop(false);
  }

  function clearCity() {
    setLocalLoc(null);
    setInputText("");
    setShowDrop(false);
  }

  function handleApply() {
    if (localLoc) {
      onApply?.({ name: localLoc.name, lat: localLoc.lat, lng: localLoc.lng }, localKm);
    } else {
      onApply?.(null, localKm);
    }
    onClose();
  }

  if (!open) return null;

  return (
    <div style={s.overlay} onClick={onClose}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>

        {/* ── Encabezado ── */}
        <div style={s.header}>
          <h3 style={s.title}>Cambiar ubicación</h3>
          <button type="button" onClick={onClose} style={s.closeBtn}>
            <X size={20} color="#e4e6eb" />
          </button>
        </div>

        <div style={{ padding: "4px 16px 0" }}>
          <p style={s.hint}>Buscar por ciudad, localidad o código postal</p>

          {/* ── Input ciudad ── */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <div style={s.inputBox}>
              <MapPin size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
              <input
                placeholder="Ubicación"
                value={inputText}
                autoComplete="off"
                style={s.textInput}
                onChange={(e) => { setInputText(e.target.value); setShowDrop(true); }}
                onFocus={() => setShowDrop(true)}
                onBlur={() => setTimeout(() => setShowDrop(false), 120)}
              />
              {inputText.length > 0 && (
                <button type="button" onClick={clearCity} style={s.clearBtn}>
                  <X size={14} color="#9ca3af" />
                </button>
              )}
            </div>

            {/* Dropdown sugerencias */}
            {showDrop && suggestions.length > 0 && (
              <div style={s.dropdown}>
                {suggestions.map((c) => (
                  <button
                    key={`${c.name}-${c.dept}`}
                    type="button"
                    style={s.suggestion}
                    onMouseDown={() => pickCity(c)}
                  >
                    <MapPin size={13} color="#9ca3af" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#e4e6eb" }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>{c.dept}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Botón GPS ── */}
          <button
            type="button"
            onClick={useDeviceLocation}
            disabled={gpsLoading}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", marginBottom: 10,
              background: gpsLoading ? "#2d2e2f" : "rgba(35,116,225,0.13)",
              border: "1px solid rgba(35,116,225,0.35)",
              borderRadius: 10, padding: "10px 14px",
              color: "#4b9eff", fontWeight: 600, fontSize: 14,
              cursor: gpsLoading ? "default" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {gpsLoading
              ? <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
              : <LocateFixed size={16} />}
            {gpsLoading ? "Obteniendo ubicación…" : "Usar mi ubicación actual"}
          </button>
          {gpsError && (
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#ef4444" }}>
              ⚠️ {gpsError}
            </p>
          )}

          {/* ── Selector de radio ── */}
          <div style={{ ...s.inputBox, marginBottom: 12 }}>
            <Navigation size={15} color="#9ca3af" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#9ca3af", flexShrink: 0 }}>Radio</span>
            <select
              value={localKm}
              onChange={(e) => setLocalKm(Number(e.target.value))}
              style={s.select}
            >
              {RADIUS_OPTIONS.map((k) => (
                <option key={k} value={k}>{k} kilómetros</option>
              ))}
              <option value={99999}>Todo el país</option>
            </select>
          </div>
        </div>

        {/* ── Mapa preview (OpenStreetMap embed — sin API key) ── */}
        <div style={s.mapWrap}>
          {localLoc ? (() => {
            const offset = Math.min(2.5, Math.max(0.08, localKm / 111));
            const bbox = `${localLoc.lng - offset},${localLoc.lat - offset},${localLoc.lng + offset},${localLoc.lat + offset}`;
            return (
              <iframe
                title="Mapa de ubicación"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${localLoc.lat},${localLoc.lng}`}
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                loading="lazy"
              />
            );
          })() : (
            <RadiusVisual city={null} km={localKm} />
          )}
        </div>

        {/* ── Botón aplicar ── */}
        <div style={{ padding: "12px 16px 16px" }}>
          <button
            type="button"
            style={{
              ...s.applyBtn,
              opacity: localLoc ? 1 : 0.55,
              cursor: localLoc ? "pointer" : "default",
            }}
            onClick={handleApply}
          >
            {localLoc
              ? `Aplicar · ${localLoc.name}${localKm < 99999 ? ` · ${localKm} km` : ""}`
              : "Selecciona una ciudad"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── Estilos ── */
const s = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,.72)",
    zIndex: 19000,
    display: "flex", justifyContent: "center", alignItems: "center",
    padding: 16,
  },
  modal: {
    width: "100%", maxWidth: 440,
    background: "#242526",
    borderRadius: 18,
    color: "#e4e6eb",
    overflow: "hidden",
    display: "flex", flexDirection: "column",
    maxHeight: "92vh",
  },
  header: {
    padding: "14px 16px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "1px solid #3a3b3c",
    flexShrink: 0,
  },
  title: { margin: 0, fontSize: 18, fontWeight: 700 },
  closeBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: 4, display: "flex", alignItems: "center",
  },
  hint: { fontSize: 13, color: "#9ca3af", margin: "6px 0 10px" },
  inputBox: {
    background: "#3a3b3c",
    borderRadius: 10,
    padding: "10px 12px",
    display: "flex", gap: 8, alignItems: "center",
  },
  textInput: {
    flex: 1,
    background: "none", border: "none", outline: "none",
    color: "#e4e6eb", fontSize: 15, fontWeight: 600,
  },
  clearBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: 2, display: "flex", alignItems: "center",
  },
  dropdown: {
    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 10,
    background: "#2d2e2f",
    border: "1px solid #3a3b3c",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
  },
  suggestion: {
    display: "flex", alignItems: "flex-start", gap: 10,
    width: "100%", textAlign: "left",
    background: "none", border: "none", cursor: "pointer",
    padding: "10px 14px",
    borderBottom: "1px solid #3a3b3c",
    color: "#e4e6eb",
  },
  select: {
    flex: 1,
    background: "none", border: "none", outline: "none",
    color: "#e4e6eb", fontSize: 14, fontWeight: 600,
    cursor: "pointer",
  },
  mapWrap: {
    margin: "0 16px 0",
    height: 180,
    borderRadius: 14,
    overflow: "hidden",
    flexShrink: 0,
  },
  applyBtn: {
    width: "100%",
    padding: "13px 0",
    borderRadius: 999,
    border: "none",
    background: "#2374e1",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    transition: "opacity 0.2s",
  },
};
