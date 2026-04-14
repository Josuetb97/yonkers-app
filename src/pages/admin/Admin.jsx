import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import SellerOnboardingModal from "../../components/SellerOnboardingModal";

const API = import.meta.env.VITE_API_URL || "/api";

/* ─────────────────────────────────────────────────────────────
   FIELD CONFIG
───────────────────────────────────────────────────────────── */
const PIECE_FIELDS = [
  { name: "title",     label: "Nombre de la pieza", placeholder: "Ej: Trompa delantera", required: true  },
  { name: "brand",     label: "Marca / Modelo",     placeholder: "Ej: Honda Civic",      required: true  },
  { name: "years",     label: "Año",                placeholder: "Ej: 2020",             required: false },
  { name: "yonker",    label: "Nombre del yonker",  placeholder: "Ej: DyM Yonker",       required: true  },
  { name: "city",      label: "Ciudad",             placeholder: "Ej: San Pedro Sula",   required: false },
  { name: "price",     label: "Precio (L)",         placeholder: "Ej: 3500",             required: false },
  { name: "condition", label: "Condición",          placeholder: "Ej: Buen estado",      required: false },
];

const SOCIAL_FIELDS = [
  { name: "instagram", label: "Instagram", placeholder: "@usuario o URL completa", icon: "IG", color: "#E1306C" },
  { name: "facebook",  label: "Facebook",  placeholder: "usuario o URL completa",  icon: "FB", color: "#1877F2" },
  { name: "tiktok",    label: "TikTok",    placeholder: "@usuario o URL completa",  icon: "TK", color: "#111"    },
];

const EMPTY_FORM = {
  title: "", brand: "", years: "", yonker: "", city: "",
  price: "", condition: "", lat: "", lng: "",
  instagram: "", facebook: "", tiktok: "",
};

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
function resolveImageUrl(imagePath) {
  if (!imagePath) return "";
  // Backend sirve imágenes desde /uploads/filename
  // imagePath viene como "/uploads/filename" desde el backend
  // No añadir /api porque el proxy de Vite mapea /uploads → backend:3001/uploads
  if (imagePath.startsWith("http")) return imagePath;
  return imagePath; // "/uploads/..."
}

async function getToken() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) return null;
  return session.access_token;
}

async function apiFetch(path, options = {}) {
  const token = await getToken();
  if (!token) throw new Error("No hay sesión activa. Por favor inicia sesión.");

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const msg =
      body?.error ||
      body?.message ||
      `Error ${res.status}: ${res.statusText}`;
    throw new Error(msg);
  }

  return body;
}

/* ─────────────────────────────────────────────────────────────
   SMALL COMPONENTS
───────────────────────────────────────────────────────────── */
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={sc.sectionHead}>
      <div style={sc.sectionIcon}>{icon}</div>
      <div>
        <div style={sc.sectionTitle}>{title}</div>
        {subtitle && <div style={sc.sectionSub}>{subtitle}</div>}
      </div>
    </div>
  );
}

function Field({ field, value, onChange }) {
  return (
    <div style={sc.fieldWrap}>
      <label style={sc.label}>
        {field.label}
        {field.required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      <input
        name={field.name}
        value={value}
        onChange={onChange}
        placeholder={field.placeholder}
        required={field.required}
        style={sc.input}
        onFocus={(e) => {
          e.currentTarget.style.borderColor  = "#2563eb";
          e.currentTarget.style.borderWidth  = "1.5px";
          e.currentTarget.style.borderStyle  = "solid";
          e.currentTarget.style.boxShadow    = "0 0 0 3px rgba(37,99,235,0.12)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor  = "#e2e8f0";
          e.currentTarget.style.borderWidth  = "1.5px";
          e.currentTarget.style.borderStyle  = "solid";
          e.currentTarget.style.boxShadow    = "none";
        }}
      />
    </div>
  );
}

function SocialField({ field, value, onChange }) {
  return (
    <div style={sc.fieldWrap}>
      <label style={sc.label}>{field.label}</label>
      <div style={{
        display: "flex",
        alignItems: "center",
        borderRadius: 9,
        borderWidth: "1.5px",
        borderStyle: "solid",
        borderColor: "#e2e8f0",
        background: "#fff",
        overflow: "hidden",
        transition: "border-color .15s, box-shadow .15s",
      }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = field.color;
          e.currentTarget.style.boxShadow   = `0 0 0 3px ${field.color}15`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#e2e8f0";
          e.currentTarget.style.boxShadow   = "none";
        }}
      >
        {/* Badge lateral */}
        <div style={{
          flexShrink: 0,
          width: 40,
          height: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: field.color + "12",
          borderRight: `1.5px solid ${field.color}25`,
          fontSize: 9,
          fontWeight: 800,
          color: field.color,
          letterSpacing: "0.04em",
        }}>
          {field.icon}
        </div>
        <input
          name={field.name}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder}
          style={{
            flex: 1,
            height: 38,
            padding: "0 12px",
            border: "none",
            outline: "none",
            fontSize: 13,
            color: "#0f172a",
            background: "transparent",
            fontFamily: "system-ui, sans-serif",
          }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LOCATION PICKER
───────────────────────────────────────────────────────────── */
const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";

function LocationPicker({ lat, lng, city, onLocation }) {
  const [status,      setStatus]      = useState("idle"); // idle | loading | success | error
  const [errorMsg,    setErrorMsg]    = useState("");
  const [geoStatus,   setGeoStatus]   = useState("idle"); // idle | loading | success | error
  const [geoMsg,      setGeoMsg]      = useState("");

  /* ── GPS actual ── */
  function getLocation() {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Tu dispositivo no soporta geolocalización.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onLocation(latitude.toFixed(6), longitude.toFixed(6));
        setStatus("success");
      },
      (err) => {
        setStatus("error");
        switch (err.code) {
          case 1:  setErrorMsg("Permiso de ubicación denegado. Habilítalo en la configuración."); break;
          case 2:  setErrorMsg("No se pudo obtener la ubicación. Intenta de nuevo."); break;
          default: setErrorMsg("Error obteniendo ubicación."); break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  /* ── Geocodificar desde ciudad ── */
  async function geocodeCity() {
    const address = (city || "").trim();
    if (!address) {
      setGeoMsg("Escribe una ciudad primero en el campo Ciudad.");
      setGeoStatus("error");
      return;
    }
    if (!GMAPS_KEY) {
      setGeoMsg("No hay API key de Google Maps configurada.");
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    setGeoMsg("");
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ", Honduras")}&key=${GMAPS_KEY}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
        const { lat: la, lng: lo } = data.results[0].geometry.location;
        onLocation(la.toFixed(6), lo.toFixed(6));
        setGeoStatus("success");
        setGeoMsg(`Ubicación encontrada: ${data.results[0].formatted_address}`);
      } else {
        setGeoStatus("error");
        setGeoMsg(`No se encontró la ciudad "${address}". Intenta con un nombre más específico.`);
      }
    } catch {
      setGeoStatus("error");
      setGeoMsg("Error al conectar con Google Maps. Verifica tu conexión.");
    }
  }

  const hasCoords = lat && lng;

  return (
    <div style={sc.fieldWrap}>
      <label style={sc.label}>Ubicación del yonker</label>

      {/* ── Botones compactos lado a lado ── */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={geocodeCity}
          disabled={geoStatus === "loading"}
          style={{
            ...lc.gpsBtn,
            ...(geoStatus === "success" ? lc.gpsBtnSuccess : {}),
            ...(geoStatus === "loading" ? lc.gpsBtnLoading : {}),
          }}
        >
          {geoStatus === "loading" ? (
            <><span style={lc.spinner} /> Buscando…</>
          ) : geoStatus === "success" ? (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> Ciudad OK</>
          ) : (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Por ciudad</>
          )}
        </button>

        <button
          type="button"
          onClick={getLocation}
          disabled={status === "loading"}
          style={{
            ...lc.gpsBtn,
            ...(status === "success" ? lc.gpsBtnSuccess : {}),
            ...(status === "loading" ? lc.gpsBtnLoading : {}),
          }}
        >
          {status === "loading" ? (
            <><span style={lc.spinner} /> Buscando…</>
          ) : status === "success" ? (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> GPS OK</>
          ) : (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> Mi GPS</>
          )}
        </button>
      </div>

      {geoMsg && (
        <div style={{ ...lc.errorBox, ...(geoStatus === "success" ? { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" } : {}) }}>
          {geoMsg}
        </div>
      )}

      {hasCoords && (
        <div style={lc.coordsDisplay}>
          <div style={lc.coordsRow}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#16a34a">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
            </svg>
            <span style={lc.coordsText}>
              <span style={lc.coordsLabel}>Lat:</span> {lat}
              &nbsp;&nbsp;
              <span style={lc.coordsLabel}>Lng:</span> {lng}
            </span>
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={lc.mapsLink}
            >
              Ver en Maps →
            </a>
          </div>
        </div>
      )}

      {status === "error" && (
        <div style={lc.errorBox}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <div style={{ flex: 1, ...sc.fieldWrap, gap: 3 }}>
          <label style={{ ...sc.label, fontSize: 11, color: "#9ca3af" }}>Latitud (manual)</label>
          <input
            name="lat"
            value={lat}
            onChange={(e) => onLocation(e.target.value, lng)}
            placeholder="15.5003"
            style={{ ...sc.input, height: 36, fontSize: 12, color: "#6b7280" }}
          />
        </div>
        <div style={{ flex: 1, ...sc.fieldWrap, gap: 3 }}>
          <label style={{ ...sc.label, fontSize: 11, color: "#9ca3af" }}>Longitud (manual)</label>
          <input
            name="lng"
            value={lng}
            onChange={(e) => onLocation(lat, e.target.value)}
            placeholder="-88.0256"
            style={{ ...sc.input, height: 36, fontSize: 12, color: "#6b7280" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PHOTO GUIDE MODAL
───────────────────────────────────────────────────────────── */
const PHOTO_TIPS = [
  { icon: "☀️", tip: "Toma la foto con buena luz natural — evita sombras" },
  { icon: "🔍", tip: "Muestra el número de parte si la pieza lo tiene" },
  { icon: "📐", tip: "Incluye varias tomas: frente, lado y detalles" },
  { icon: "🚫", tip: "Evita fondos desordenados — un piso limpio funciona bien" },
];

function PhotoGuideModal({ onClose }) {
  return (
    <div style={pg.overlay} onClick={onClose}>
      <div style={pg.modal} onClick={(e) => e.stopPropagation()}>
        <div style={pg.header}>
          <span style={pg.headerIcon}>📸</span>
          <div>
            <div style={pg.headerTitle}>Tips para tus fotos</div>
            <div style={pg.headerSub}>Las buenas fotos se venden más rápido</div>
          </div>
        </div>
        <div style={pg.list}>
          {PHOTO_TIPS.map((t, i) => (
            <div key={i} style={pg.item}>
              <span style={pg.itemIcon}>{t.icon}</span>
              <span style={pg.itemText}>{t.tip}</span>
            </div>
          ))}
        </div>
        <button style={pg.btn} onClick={onClose}>Entendido ✓</button>
      </div>
    </div>
  );
}

const pg = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(3px)", zIndex: 9000, display: "flex",
    alignItems: "flex-end", justifyContent: "center", padding: "0 0 20px",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  modal: {
    background: "#fff", borderRadius: 24, padding: "22px 20px",
    maxWidth: 400, width: "100%", boxShadow: "0 -4px 30px rgba(0,0,0,0.15)",
    display: "flex", flexDirection: "column", gap: 14,
  },
  header: { display: "flex", alignItems: "center", gap: 12 },
  headerIcon: {
    width: 44, height: 44, borderRadius: 14, background: "#1e3a8a",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, flexShrink: 0,
  },
  headerTitle: { fontSize: 16, fontWeight: 700, color: "#111827" },
  headerSub:   { fontSize: 12, color: "#6b7280", marginTop: 1 },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  item: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 12px", background: "#f9fafb", borderRadius: 12,
  },
  itemIcon: { fontSize: 18, flexShrink: 0 },
  itemText: { fontSize: 13, color: "#374151" },
  btn: {
    height: 46, borderRadius: 13, border: "none",
    background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
    color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
};

/* ─────────────────────────────────────────────────────────────
   IMAGE UPLOADER
───────────────────────────────────────────────────────────── */
const PHOTO_GUIDE_KEY = "yonkers_photo_guide_seen";

function ImageUploader({ files, preview, onFiles, onRemove }) {
  const cameraRef  = useRef();
  const galleryRef = useRef();
  const [showGuide, setShowGuide] = useState(false);
  const pendingRef = useRef(null); // "camera" | "gallery"

  function handlePhotoClick(type) {
    const seen = localStorage.getItem(PHOTO_GUIDE_KEY);
    if (!seen) {
      pendingRef.current = type;
      setShowGuide(true);
    } else {
      type === "camera"
        ? cameraRef.current?.click()
        : galleryRef.current?.click();
    }
  }

  function onGuideDone() {
    localStorage.setItem(PHOTO_GUIDE_KEY, "1");
    setShowGuide(false);
    if (pendingRef.current === "camera") cameraRef.current?.click();
    else galleryRef.current?.click();
    pendingRef.current = null;
  }

  return (
    <div style={sc.fieldWrap}>
      {showGuide && <PhotoGuideModal onClose={onGuideDone} />}
      <label style={sc.label}>Imágenes de la pieza</label>

      <div style={im.btnRow}>
        <button
          type="button"
          style={im.camBtn}
          onClick={() => handlePhotoClick("camera")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Tomar foto
        </button>

        <button
          type="button"
          style={im.galleryBtn}
          onClick={() => handlePhotoClick("gallery")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Elegir de galería
        </button>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFiles}
          style={{ display: "none" }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onFiles}
          style={{ display: "none" }}
        />
      </div>

      {files.length > 0 && (
        <div style={im.countBadge}>
          {files.length} foto(s) seleccionada(s)
        </div>
      )}

      {preview.length > 0 && (
        <div style={im.previewRow}>
          {preview.map((src, i) => (
            <div key={i} style={im.previewBox}>
              <img src={src} alt="" style={im.previewImg} />
              <button
                type="button"
                onClick={() => onRemove(i)}
                style={im.removeBtn}
                aria-label="Eliminar imagen"
              >
                ✕
              </button>
              {i === 0 && <div style={im.mainBadge}>Principal</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ADMIN — componente principal
───────────────────────────────────────────────────────────── */
export default function Admin() {
  const navigate = useNavigate();

  const [form,      setForm]      = useState(EMPTY_FORM);
  const [files,     setFiles]     = useState([]);
  const [preview,   setPreview]   = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [pieces,    setPieces]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [msg,       setMsg]       = useState({ text: "", type: "" });
  const [search,    setSearch]    = useState("");
  const [editingId, setEditingId] = useState(null);

  // Ref to track object URLs for cleanup
  const objectUrlsRef = useRef([]);

  useEffect(() => {
    loadPieces();
    // Cleanup object URLs on unmount
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  async function loadPieces() {
    setLoading(true);
    try {
      const data = await apiFetch("/my/pieces");
      setPieces(Array.isArray(data) ? data : []);
    } catch (err) {
      setMsg({ text: err.message || "Error cargando piezas.", type: "error" });
      setPieces([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredPieces = useMemo(
    () =>
      pieces.filter((p) =>
        p.title?.toLowerCase().includes(search.toLowerCase())
      ),
    [pieces, search]
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  const handleLocation = useCallback((lat, lng) => {
    setForm((f) => ({ ...f, lat, lng }));
  }, []);

  function handleFiles(e) {
    const arr     = Array.from(e.target.files);
    const newUrls = arr.map((f) => URL.createObjectURL(f));
    // Track for cleanup
    objectUrlsRef.current.push(...newUrls);
    setFiles((prev)   => [...prev, ...arr]);
    setPreview((prev) => [...prev, ...newUrls]);
    // Reset input so same file can be selected again
    e.target.value = "";
  }

  function removeImage(index) {
    // Revoke the object URL to free memory
    const urlToRevoke = preview[index];
    if (urlToRevoke && urlToRevoke.startsWith("blob:")) {
      URL.revokeObjectURL(urlToRevoke);
      objectUrlsRef.current = objectUrlsRef.current.filter((u) => u !== urlToRevoke);
    }
    setFiles((prev)   => prev.filter((_, i) => i !== index));
    setPreview((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    // Revoke all remaining object URLs
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
    setFiles([]);
    setPreview([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg({ text: "", type: "" });

    // Validate required fields client-side
    if (!form.title.trim()) {
      setMsg({ text: "El nombre de la pieza es obligatorio.", type: "error" });
      return;
    }
    if (!form.brand.trim()) {
      setMsg({ text: "La marca / modelo es obligatoria.", type: "error" });
      return;
    }
    if (!form.yonker.trim()) {
      setMsg({ text: "El nombre del yonker es obligatorio.", type: "error" });
      return;
    }

    const token = await getToken();
    if (!token) {
      setMsg({ text: "No hay sesión activa. Por favor inicia sesión.", type: "error" });
      return;
    }

    setSaving(true);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
    files.forEach((f) => fd.append("images", f));

    try {
      // Backend only has POST /api/pieces (no PUT).
      // For edits: DELETE old + POST new is not ideal, so we POST regardless
      // and treat editingId as a UI-only "pre-fill" that becomes a new record
      // if the backend doesn't support PUT.
      // Since backend has no PUT, we always POST and show a note when editing.
      const data = await apiFetch("/pieces", {
        method: "POST",
        body: fd,
      });

      if (editingId) {
        // If user was editing, delete the old piece silently after successful POST
        try {
          await apiFetch(`/pieces/${editingId}`, { method: "DELETE" });
          setPieces((prev) => prev.filter((p) => p.id !== editingId));
        } catch {
          // If delete fails, the old piece stays — non-critical
        }
        setPieces((prev) => [data, ...prev]);
        setMsg({ text: "Pieza actualizada correctamente", type: "success" });
      } else {
        setPieces((prev) => [data, ...prev]);
        setMsg({ text: "Pieza publicada correctamente", type: "success" });
      }

      setEditingId(null);
      resetForm();
    } catch (err) {
      setMsg({
        text: err.message || "Error guardando la pieza. Inténtalo de nuevo.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar esta pieza?")) return;
    try {
      await apiFetch(`/pieces/${id}`, { method: "DELETE" });
      setPieces((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) {
        setEditingId(null);
        resetForm();
      }
    } catch (err) {
      setMsg({
        text: err.message || "No se pudo eliminar la pieza.",
        type: "error",
      });
    }
  }

  function handleEdit(piece) {
    resetForm();
    setForm({
      title:     piece.title     ?? "",
      brand:     piece.brand     ?? "",
      years:     piece.years     ?? "",
      yonker:    piece.yonker    ?? "",
      city:      piece.city      ?? "",
      price:     piece.price     != null ? String(piece.price) : "",
      condition: piece.condition ?? "",
      lat:       piece.lat       ?? "",
      lng:       piece.lng       ?? "",
      instagram: piece.instagram ?? "",
      facebook:  piece.facebook  ?? "",
      tiktok:    piece.tiktok    ?? "",
    });
    setEditingId(piece.id);
    setMsg({ text: "", type: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setMsg({ text: "", type: "" });
    resetForm();
  }

  return (
    <div style={st.page}>
      {/* Spinner CSS keyframe injected once */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ══ ONBOARDING MODAL (solo primera vez) ══ */}
      <SellerOnboardingModal />

      <div style={st.wrapper}>

        {/* ══ HEADER ══ */}
        <div style={st.pageHeader}>
          <div>
            <div style={st.pageTitle}>Panel Yonkers</div>
            <div style={st.pageSubtitle}>Administra tus piezas disponibles</div>
          </div>
          <button onClick={() => navigate("/")} style={st.backBtn} type="button">
            ← Volver
          </button>
        </div>

        {/* ══ KPI STRIP ══ */}
        <div style={st.kpiRow}>
          <div style={st.kpiCard}>
            <div style={st.kpiNum}>{pieces.length}</div>
            <div style={st.kpiLabel}>Piezas publicadas</div>
          </div>
          <div style={{ ...st.kpiCard, background: "#fefce8", borderColor: "#fde047" }}>
            <div style={{ ...st.kpiNum, color: "#854d0e" }}>{filteredPieces.length}</div>
            <div style={{ ...st.kpiLabel, color: "#a16207" }}>En búsqueda actual</div>
          </div>
          <div style={{ ...st.kpiCard, background: "#f0fdf4", borderColor: "#86efac" }}>
            <div style={{ ...st.kpiNum, color: "#166534" }}>
              {pieces.filter((p) => Array.isArray(p.images) && p.images.length > 0).length}
            </div>
            <div style={{ ...st.kpiLabel, color: "#166534" }}>Con imágenes</div>
          </div>
        </div>

        {/* ══ FORM CARD ══ */}
        <div style={st.card}>
          <SectionHeader
            icon={editingId ? "✏️" : "＋"}
            title={editingId ? "Editar pieza" : "Agregar nueva pieza"}
            subtitle={
              editingId
                ? "Se publicará como nueva pieza y se eliminará la anterior"
                : "Completa los datos para que los compradores te encuentren"
            }
          />

          {msg.text && (
            <div
              style={{
                ...st.msgBox,
                background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
                borderColor: msg.type === "success" ? "#86efac" : "#fca5a5",
                color:       msg.type === "success" ? "#166534" : "#991b1b",
              }}
            >
              {msg.type === "success" ? "✓ " : "✕ "}{msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} style={st.form}>

            {/* ── Layout 2 columnas ── */}
            <div style={st.formGrid}>

              {/* Columna izquierda: Información */}
              <div style={st.formSection}>
                <div style={st.formSectionLabel}>Información de la pieza</div>
                <div style={st.grid}>
                  {PIECE_FIELDS.map((field) => (
                    <Field
                      key={field.name}
                      field={field}
                      value={form[field.name]}
                      onChange={handleChange}
                    />
                  ))}
                </div>
              </div>

              {/* Columna derecha: Ubicación + Redes sociales */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                <div style={st.formSection}>
                  <div style={st.formSectionLabel}>Ubicación</div>
                  <LocationPicker
                    lat={form.lat}
                    lng={form.lng}
                    city={form.city}
                    onLocation={handleLocation}
                  />
                </div>

                <div style={st.formSection}>
                  <div style={st.formSectionLabel}>Redes sociales del yonker</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {SOCIAL_FIELDS.map((field) => (
                      <SocialField
                        key={field.name}
                        field={field}
                        value={form[field.name]}
                        onChange={handleChange}
                      />
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Imágenes — ancho completo */}
            <div style={st.formSection}>
              <div style={st.formSectionLabel}>Fotos de la pieza</div>
              <ImageUploader
                files={files}
                preview={preview}
                onFiles={handleFiles}
                onRemove={removeImage}
              />
            </div>

            {/* Acciones */}
            <div style={st.formActions}>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={st.cancelBtn}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                style={{ ...st.saveBtn, opacity: saving ? 0.7 : 1 }}
              >
                {saving
                  ? "Guardando…"
                  : editingId
                  ? "Actualizar pieza"
                  : "Publicar pieza"}
              </button>
            </div>

          </form>
        </div>

        {/* ══ LIST CARD ══ */}
        <div style={st.card}>
          <SectionHeader
            icon="📦"
            title="Mis piezas"
            subtitle={`${pieces.length} pieza(s) publicadas`}
          />

          <div style={st.searchWrap}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2.5"
              style={{ flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              placeholder="Buscar pieza..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={st.searchInput}
            />
          </div>

          <div style={st.list}>
            {loading ? (
              <div style={st.empty}>Cargando piezas…</div>
            ) : filteredPieces.length === 0 ? (
              <div style={st.empty}>No hay piezas todavía</div>
            ) : (
              filteredPieces.map((p) => {
                const images = Array.isArray(p.images) ? p.images : [];
                const thumb  = images[0] ? resolveImageUrl(images[0]) : null;

                return (
                  <div key={p.id} style={st.item}>
                    <div style={st.itemThumb}>
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={p.title}
                          style={st.thumbImg}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div style={st.thumbPlaceholder}>📷</div>
                      )}
                    </div>
                    <div style={st.itemInfo}>
                      <div style={st.itemTitle}>{p.title}</div>
                      <div style={st.itemSub}>
                        {[p.brand, p.years, p.city].filter(Boolean).join(" · ")}
                      </div>
                      {p.price != null && Number(p.price) > 0 && (
                        <div style={st.itemPrice}>
                          L {Number(p.price).toLocaleString("es-HN")}
                        </div>
                      )}
                    </div>
                    <div style={st.itemActions}>
                      <button
                        onClick={() => handleEdit(p)}
                        style={st.editBtn}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        style={st.deleteBtn}
                        type="button"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LOCATION COMPONENT STYLES (lc)
───────────────────────────────────────────────────────────── */
const lc = {
  gpsBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 36,
    padding: "0 10px",
    borderRadius: 9,
    border: "1.5px solid #cbd5e1",
    background: "#f8fafc",
    color: "#334155",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all .15s",
    fontFamily: "system-ui, sans-serif",
    whiteSpace: "nowrap",
  },
  gpsBtnSuccess: {
    background: "#f0fdf4",
    borderColor: "#86efac",
    color: "#16a34a",
  },
  gpsBtnLoading: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
  spinner: {
    display: "inline-block",
    width: 12,
    height: 12,
    border: "2px solid #cbd5e1",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    flexShrink: 0,
  },
  coordsDisplay: {
    marginTop: 8,
    padding: "8px 12px",
    background: "#f0fdf4",
    borderRadius: 9,
    border: "1px solid #86efac",
  },
  coordsRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  coordsText: {
    fontSize: 11,
    color: "#166534",
    fontFamily: "monospace",
    flex: 1,
  },
  coordsLabel: {
    fontWeight: 700,
  },
  mapsLink: {
    fontSize: 11,
    color: "#2563eb",
    fontWeight: 600,
    textDecoration: "none",
    flexShrink: 0,
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: "8px 12px",
    background: "#fef2f2",
    borderRadius: 9,
    border: "1px solid #fecaca",
    fontSize: 12,
    color: "#991b1b",
  },
};

/* ─────────────────────────────────────────────────────────────
   IMAGE UPLOADER STYLES (im)
───────────────────────────────────────────────────────────── */
const im = {
  btnRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  camBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    height: 38,
    padding: "0 16px",
    borderRadius: 9,
    border: "none",
    background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
  },
  galleryBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    height: 38,
    padding: "0 16px",
    borderRadius: 9,
    border: "1.5px dashed #93c5fd",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  countBadge: {
    marginTop: 8,
    display: "inline-block",
    padding: "4px 12px",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  previewRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 12,
  },
  previewBox: {
    position: "relative",
    flexShrink: 0,
  },
  previewImg: {
    width: 84,
    height: 84,
    borderRadius: 12,
    objectFit: "cover",
    border: "2px solid #e5e7eb",
    display: "block",
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#ef4444",
    color: "#fff",
    border: "2px solid #fff",
    fontSize: 10,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  mainBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 4,
    letterSpacing: "0.04em",
  },
};

/* ─────────────────────────────────────────────────────────────
   SHARED COMPONENT STYLES (sc)
───────────────────────────────────────────────────────────── */
const sc = {
  sectionHead:  { display: "flex", alignItems: "center", gap: 10, marginBottom: 18 },
  sectionIcon:  { width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, boxShadow: "0 1px 4px rgba(37,99,235,0.12)" },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: "#0f172a" },
  sectionSub:   { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  fieldWrap:    { display: "flex", flexDirection: "column", gap: 4 },
  label:        { fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.04em", textTransform: "uppercase" },
  input: {
    height: 38,
    padding: "0 12px",
    borderRadius: 9,
    borderWidth: "1.5px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
    fontSize: 13,
    color: "#0f172a",
    background: "#fff",
    outline: "none",
    transition: "border-color .15s, box-shadow .15s",
    fontFamily: "system-ui, sans-serif",
    boxSizing: "border-box",
    width: "100%",
  },
};

/* ─────────────────────────────────────────────────────────────
   PAGE STYLES (st)
───────────────────────────────────────────────────────────── */
const st = {
  page:            { background: "linear-gradient(160deg,#f0f4ff 0%,#f8fafc 60%)", minHeight: "100vh", padding: "clamp(14px,3vw,30px)", fontFamily: "'DM Sans',system-ui,sans-serif" },
  wrapper:         { width: "100%", maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 },
  pageHeader:      { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 },
  pageTitle:       { fontSize: "clamp(20px,3.5vw,26px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" },
  pageSubtitle:    { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  backBtn:         { background: "#fff", border: "1.5px solid #e2e8f0", padding: "7px 16px", borderRadius: 9, fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  kpiRow:          { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 },
  kpiCard:         { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 16px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  kpiNum:          { fontSize: 26, fontWeight: 800, color: "#1e3a8a", lineHeight: 1 },
  kpiLabel:        { fontSize: 10, fontWeight: 600, color: "#94a3b8", marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase" },
  card:            { background: "#fff", borderRadius: 18, padding: "clamp(18px,3.5vw,28px)", boxShadow: "0 2px 12px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e8edf5" },
  form:            { display: "flex", flexDirection: "column", gap: 20 },
  formGrid:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" },
  formSection:     { display: "flex", flexDirection: "column", gap: 10 },
  formSectionLabel:{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8", paddingBottom: 6, borderBottom: "1px solid #f1f5f9" },
  grid:            { display: "grid", gridTemplateColumns: "1fr", gap: 10 },
  gridSocial:      { display: "grid", gridTemplateColumns: "1fr", gap: 10 },
  formActions:     { display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 },
  cancelBtn:       { padding: "10px 20px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" },
  saveBtn:         { padding: "10px 26px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "opacity .15s, transform .1s", boxShadow: "0 3px 10px rgba(37,99,235,0.3)" },
  msgBox:          { padding: "10px 14px", borderRadius: 9, border: "1px solid", fontSize: 13, fontWeight: 500, marginBottom: 4 },
  searchWrap:      { display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "0 12px", height: 40, marginBottom: 14 },
  searchInput:     { flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#0f172a" },
  list:            { display: "flex", flexDirection: "column", gap: 8 },
  empty:           { textAlign: "center", padding: 28, color: "#94a3b8", fontSize: 13 },
  item:            { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e8edf5", transition: "box-shadow .15s" },
  itemThumb:       { width: 48, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" },
  thumbImg:        { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  thumbPlaceholder:{ fontSize: 18 },
  itemInfo:        { flex: 1, minWidth: 0 },
  itemTitle:       { fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  itemSub:         { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  itemPrice:       { fontSize: 12, fontWeight: 700, color: "#2563eb", marginTop: 2 },
  itemActions:     { display: "flex", gap: 6, flexShrink: 0 },
  editBtn:         { background: "linear-gradient(135deg,#1e3a8a,#2563eb)", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 6px rgba(37,99,235,0.2)" },
  deleteBtn:       { background: "#fff", color: "#ef4444", border: "1.5px solid #fecaca", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" },
};
