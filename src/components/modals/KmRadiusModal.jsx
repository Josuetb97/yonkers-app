import { X, MapPin } from "lucide-react";
import { useState, useMemo } from "react";
import { GoogleMap, Circle, Marker, useJsApiLoader } from "@react-google-maps/api";

/* ─────────────────────────────────────────────────────────
   Ciudades de Honduras con coordenadas
───────────────────────────────────────────────────────── */
export const HN_CITIES = [
  { name: "Tegucigalpa",        dept: "Francisco Morazán", lat: 14.0818, lng: -87.2068 },
  { name: "San Pedro Sula",     dept: "Cortés",            lat: 15.4997, lng: -88.0255 },
  { name: "Choloma",            dept: "Cortés",            lat: 15.6167, lng: -87.9500 },
  { name: "La Ceiba",           dept: "Atlántida",         lat: 15.7667, lng: -86.8000 },
  { name: "El Progreso",        dept: "Yoro",              lat: 15.4000, lng: -87.8000 },
  { name: "Comayagua",          dept: "Comayagua",         lat: 14.4500, lng: -87.6330 },
  { name: "Puerto Cortés",      dept: "Cortés",            lat: 15.8330, lng: -87.9330 },
  { name: "Siguatepeque",       dept: "Comayagua",         lat: 14.6000, lng: -87.8330 },
  { name: "Juticalpa",          dept: "Olancho",           lat: 14.6660, lng: -86.2330 },
  { name: "Danlí",              dept: "El Paraíso",        lat: 14.0330, lng: -86.5830 },
  { name: "Choluteca",          dept: "Choluteca",         lat: 13.3000, lng: -87.2000 },
  { name: "Santa Rosa de Copán",dept: "Copán",             lat: 14.7670, lng: -88.7830 },
  { name: "Tela",               dept: "Atlántida",         lat: 15.7830, lng: -87.4330 },
  { name: "Tocoa",              dept: "Colón",             lat: 15.6830, lng: -86.0000 },
  { name: "Olanchito",          dept: "Yoro",              lat: 15.4830, lng: -86.5830 },
  { name: "Trujillo",           dept: "Colón",             lat: 15.9170, lng: -85.9670 },
  { name: "Yoro",               dept: "Yoro",              lat: 15.1330, lng: -87.1170 },
  { name: "Nacaome",            dept: "Valle",             lat: 13.4830, lng: -87.5000 },
  { name: "Nueva Ocotepeque",   dept: "Ocotepeque",        lat: 14.4330, lng: -89.1830 },
  { name: "Gracias",            dept: "Lempira",           lat: 14.5830, lng: -88.5830 },
  { name: "La Paz",             dept: "La Paz",            lat: 14.3170, lng: -87.6830 },
  { name: "Intibucá",           dept: "Intibucá",          lat: 14.3170, lng: -88.1670 },
  { name: "Santa Bárbara",      dept: "Santa Bárbara",     lat: 14.9170, lng: -88.2330 },
  { name: "La Lima",            dept: "Cortés",            lat: 15.4330, lng: -87.9170 },
  { name: "Villanueva",         dept: "Cortés",            lat: 15.3330, lng: -88.0170 },
  { name: "San Lorenzo",        dept: "Valle",             lat: 13.4170, lng: -87.4500 },
  { name: "Roatán",             dept: "Islas de la Bahía", lat: 16.3170, lng: -86.5330 },
  { name: "Catacamas",          dept: "Olancho",           lat: 14.8000, lng: -85.9000 },
  { name: "El Paraíso",         dept: "El Paraíso",        lat: 13.8670, lng: -86.6000 },
  { name: "Marcala",            dept: "La Paz",            lat: 14.1670, lng: -88.0000 },
  { name: "Santa Cruz de Yojoa",dept: "Cortés",            lat: 15.0000, lng: -87.9000 },
  { name: "Copán Ruinas",       dept: "Copán",             lat: 14.8330, lng: -89.1330 },
  { name: "Cofradia",           dept: "Cortés",            lat: 15.4000, lng: -87.9670 },
  { name: "Potrerillos",        dept: "Cortés",            lat: 15.2500, lng: -87.9830 },
  { name: "Omoa",               dept: "Cortés",            lat: 15.7500, lng: -88.0330 },
  { name: "Pimienta",           dept: "Cortés",            lat: 15.2670, lng: -87.9500 },
  { name: "Naco",               dept: "Cortés",            lat: 15.1330, lng: -88.0170 },
  { name: "San Manuel",         dept: "Cortés",            lat: 15.2170, lng: -87.9170 },
  { name: "Armenia",            dept: "Cortés",            lat: 15.3170, lng: -87.9170 },
  { name: "Quimistán",          dept: "Santa Bárbara",     lat: 15.2000, lng: -88.4330 },
  { name: "Morazán",            dept: "Yoro",              lat: 15.2330, lng: -87.5000 },
  { name: "Taulabé",            dept: "Comayagua",         lat: 14.8500, lng: -87.8670 },
  { name: "Cedros",             dept: "Francisco Morazán", lat: 14.5830, lng: -87.1830 },
  { name: "Amarateca",          dept: "Francisco Morazán", lat: 14.2330, lng: -87.1330 },
  { name: "Talanga",            dept: "Francisco Morazán", lat: 14.4170, lng: -87.0670 },
];

export const RADIUS_OPTIONS = [5, 10, 25, 50, 71, 100, 150, 200];

const HN_CENTER = { lat: 14.9, lng: -86.8 };

/* ─────────────────────────────────────────────────────────
   Modal principal
───────────────────────────────────────────────────────── */
export default function KmRadiusModal({ open, onClose, location, radius, onApply }) {
  const [inputText,    setInputText]    = useState(location?.name || "");
  const [localLoc,     setLocalLoc]     = useState(location  || null);
  const [localKm,      setLocalKm]      = useState(radius    || 50);
  const [showDrop,     setShowDrop]     = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

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

  const mapCenter = localLoc
    ? { lat: localLoc.lat, lng: localLoc.lng }
    : HN_CENTER;

  const mapZoom = localLoc
    ? (localKm <= 20 ? 11 : localKm <= 60 ? 9 : localKm <= 120 ? 8 : 7)
    : 7;

  return (
    <div style={s.overlay} onClick={onClose}>
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
                onChange={(e) => {
                  setInputText(e.target.value);
                  setShowDrop(true);
                }}
                onFocus={() => setShowDrop(true)}
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

          {/* ── Selector de radio ── */}
          <div style={s.inputBox}>
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

        {/* ── Mapa preview ── */}
        <div style={s.mapWrap}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={mapCenter}
              zoom={mapZoom}
              options={{
                fullscreenControl: false,
                mapTypeControl: false,
                streetViewControl: false,
                zoomControl: false,
                gestureHandling: "none",
              }}
            >
              {localLoc && (
                <>
                  <Marker position={mapCenter} />
                  {localKm < 99999 && (
                    <Circle
                      center={mapCenter}
                      radius={localKm * 1000}
                      options={{
                        fillColor: "#2374e1",
                        fillOpacity: 0.18,
                        strokeColor: "#2374e1",
                        strokeOpacity: 0.85,
                        strokeWeight: 2,
                      }}
                    />
                  )}
                </>
              )}
            </GoogleMap>
          ) : (
            <div style={s.mapLoading}>🗺️ Cargando mapa…</div>
          )}
        </div>

        {/* ── Botón aplicar ── */}
        <div style={{ padding: "12px 16px 16px" }}>
          <button
            type="button"
            style={{
              ...s.applyBtn,
              opacity: localLoc ? 1 : 0.6,
              cursor: localLoc ? "pointer" : "default",
            }}
            onClick={handleApply}
          >
            Aplicar
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
    background: "rgba(0,0,0,.70)",
    zIndex: 19000,
    display: "flex", justifyContent: "center", alignItems: "center",
    padding: 16,
  },
  modal: {
    width: "100%", maxWidth: 440,
    background: "#242526",
    borderRadius: 16,
    color: "#e4e6eb",
    overflow: "hidden",
    display: "flex", flexDirection: "column",
    maxHeight: "90vh",
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
    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
    background: "#2d2e2f",
    border: "1px solid #3a3b3c",
    borderRadius: 10,
    marginTop: 4,
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
    appearance: "none",
    WebkitAppearance: "none",
  },
  mapWrap: {
    margin: "12px 16px",
    height: 220,
    borderRadius: 14,
    overflow: "hidden",
    flexShrink: 0,
    background: "#18191a",
  },
  mapLoading: {
    height: "100%",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#9ca3af", fontSize: 13,
  },
  applyBtn: {
    width: "100%",
    padding: "13px 0",
    borderRadius: 999,
    border: "none",
    background: "#2374e1",
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
  },
};
