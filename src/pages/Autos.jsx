import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Car, MapPin, Settings, SlidersHorizontal, Navigation } from "lucide-react";
import { supabase } from "../lib/supabase";
import NearbyMap from "../components/map/NearbyMap";
import KmRadiusModal from "../components/modals/KmRadiusModal";

/* ── Haversine: distancia en km ── */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── localStorage helpers (clave compartida con Home) ── */
function readLocStorage() {
  try { return JSON.parse(localStorage.getItem("yonkers_loc") || "null"); }
  catch { return null; }
}
function writeLocStorage(v) {
  try { localStorage.setItem("yonkers_loc", JSON.stringify(v)); } catch {}
}

const SUPER_ADMIN_EMAILS = [
  "josuetb19997@gmail.com",
  "josuetaborab@gmail.com",
  "josuetabora2012@gmail.com",
];

const BUDGET_CHIPS = [
  { label: "Todos", min: 0, max: Infinity },
];

function parseImages(images) {
  try {
    if (Array.isArray(images)) return images;
    if (typeof images === "string") {
      const p = JSON.parse(images);
      return Array.isArray(p) ? p : [];
    }
    return [];
  } catch { return []; }
}

function fmt(n) { return Number(n).toLocaleString("es-HN"); }
function safeOpen(url) {
  try { window.open(url, "_blank", "noopener,noreferrer"); } catch {}
}

/* ════════════════════════════════════════════════════════
   ICONS
════════════════════════════════════════════════════════ */
function IconInstagram() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}
function IconFacebook() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
function IconTikTok() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.53V6.76a4.85 4.85 0 01-1.02-.07z"/>
    </svg>
  );
}
function IconWhatsApp({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

const SOCIAL_CONFIG = [
  {
    key: "instagram", label: "Instagram", icon: <IconInstagram />,
    color: "#E1306C", bg: "rgba(225,48,108,0.09)", border: "rgba(225,48,108,0.25)",
    buildUrl: (v) => v.startsWith("http") ? v : `https://instagram.com/${v.replace(/^@/, "")}`,
  },
  {
    key: "facebook", label: "Facebook", icon: <IconFacebook />,
    color: "#1877F2", bg: "rgba(24,119,242,0.09)", border: "rgba(24,119,242,0.25)",
    buildUrl: (v) => v.startsWith("http") ? v : `https://facebook.com/${v.replace(/^@/, "")}`,
  },
  {
    key: "tiktok", label: "TikTok", icon: <IconTikTok />,
    color: "#111827", bg: "rgba(0,0,0,0.06)", border: "rgba(0,0,0,0.16)",
    buildUrl: (v) => v.startsWith("http") ? v : `https://tiktok.com/@${v.replace(/^@/, "")}`,
  },
];

/* ════════════════════════════════════════════════════════
   VEHICLE DETAIL MODAL
════════════════════════════════════════════════════════ */
function VehicleDetailModal({ vehicle, onClose }) {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs  = parseImages(vehicle.images);
  const phone = (vehicle.whatsapp || "").replace(/\D/g, "");
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hola, vi tu vehículo en Yonkers App: ${vehicle.title}. ¿Sigue disponible?`)}`
    : null;

  const socials = SOCIAL_CONFIG.filter(({ key }) => vehicle[key] && String(vehicle[key]).trim());

  // Coordenadas del autolote para el mapa
  const coords = useMemo(() => {
    const lat = Number(vehicle.autolote_lat);
    const lng = Number(vehicle.autolote_lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat === 0 && lng === 0) return null;
    return { lat, lng };
  }, [vehicle.autolote_lat, vehicle.autolote_lng]);

  const mapsUrl = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : null;

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div style={md.overlay} onClick={onClose}>
      <div style={md.sheet} onClick={(e) => e.stopPropagation()}>

        {/* ── Imágenes ── */}
        <div style={md.imgWrap}>
          {imgs.length > 0 ? (
            <img src={imgs[imgIdx]} alt={vehicle.title} style={md.img}
              onError={(e) => { e.currentTarget.style.display = "none"; }} />
          ) : (
            <div style={md.noImg}><Car size={48} color="#9ca3af" /></div>
          )}
          {imgs.length > 1 && (
            <div style={md.thumbRow}>
              {imgs.map((src, i) => (
                <button key={i}
                  style={{ ...md.thumb, outline: i === imgIdx ? "2.5px solid #facc15" : "none" }}
                  onClick={() => setImgIdx(i)}>
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                </button>
              ))}
            </div>
          )}
          <button style={md.closeBtn} onClick={onClose}><X size={16} color="#374151" /></button>
          <div style={md.availBadge}>Disponible</div>
        </div>

        {/* ── Cuerpo scrollable ── */}
        <div style={md.body}>

          {/* Título + precio */}
          <div style={md.titleRow}>
            <div style={md.title}>{vehicle.title}</div>
            {vehicle.price > 0 && <div style={md.price}>L {fmt(vehicle.price)}</div>}
          </div>
          {(vehicle.brand || vehicle.year) && (
            <div style={md.meta}>{[vehicle.brand, vehicle.year].filter(Boolean).join(" · ")}</div>
          )}

          <div style={md.divider} />

          {/* ── Tarjeta del autolote ── siempre visible si hay algo que mostrar */}
          {(vehicle.autolote_name || vehicle.autolote_city || vehicle.whatsapp) && (
            <div style={md.autoloteCard}>
              {/* Fila superior: avatar + nombre + ciudad */}
              <div style={md.autoloteTop}>
                <div style={md.avatar}>
                  {(vehicle.autolote_name || "AU").slice(0, 2).toUpperCase()}
                </div>
                <div style={md.autoloteInfo}>
                  <div style={md.autoloteNameRow}>
                    <span style={md.autoloteName}>
                      {vehicle.autolote_name || "Autolote"}
                    </span>
                    {vehicle.autolote_verified && (
                      <span style={md.verifiedBadge}>✓ Verificado</span>
                    )}
                  </div>
                  {vehicle.autolote_city && (
                    <div style={md.autoloteCity}>
                      <MapPin size={12} color="#6b7280" />
                      <span>{vehicle.autolote_city}</span>
                    </div>
                  )}
                  {vehicle.whatsapp && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
                      📞 {vehicle.whatsapp}
                    </div>
                  )}
                </div>
              </div>

              {/* Fila inferior: redes sociales (si tiene) */}
              {socials.length > 0 && (
                <div style={md.socialsRow}>
                  <span style={md.socialsLabel}>Redes sociales</span>
                  <div style={md.socialBtns}>
                    {socials.map(({ key, label, icon, color, bg, border, buildUrl }) => (
                      <button key={key} title={label}
                        onClick={() => safeOpen(buildUrl(String(vehicle[key]).trim()))}
                        style={{ ...md.socialBtn, background: bg, border: `1px solid ${border}`, color }}>
                        {icon}
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={md.divider} />

          {/* Detalles */}
          <div style={md.detailsBox}>
            <div style={md.detailsTitle}>Detalles del vehículo</div>
            {[
              { label: "Vehículo", value: vehicle.title },
              { label: "Marca",    value: vehicle.brand },
              { label: "Año",      value: vehicle.year  },
              { label: "Precio",   value: vehicle.price > 0 ? `L ${fmt(vehicle.price)}` : "A consultar" },
              { label: "Ciudad",   value: vehicle.autolote_city },
              { label: "Autolote", value: vehicle.autolote_name },
            ].filter((r) => r.value).map(({ label, value }) => (
              <div key={label} style={md.detailRow}>
                <span style={md.detailLabel}>{label}</span>
                <span style={md.detailValue}>{value}</span>
              </div>
            ))}
          </div>

          {/* ── Mapa de ubicación del autolote ── */}
          {coords ? (
            <div>
              <div style={md.mapLabel}>
                <MapPin size={12} color="#6b7280" />
                Ubicación del autolote
              </div>
              <div style={md.mapWrap}>
                <NearbyMap
                  pieces={[{ id: vehicle.id, lat: coords.lat, lng: coords.lng, title: vehicle.autolote_name || "Autolote" }]}
                  center={coords}
                  selectedId={vehicle.id}
                  onSelectId={() => {}}
                />
              </div>
            </div>
          ) : (
            <div style={md.noCoords}>
              📍 Este autolote aún no tiene ubicación registrada
            </div>
          )}

        </div>

        {/* ── Footer fijo — siempre visible ── */}
        <div style={md.footer}>
          {waUrl ? (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" style={md.waBtn}>
              <IconWhatsApp size={20} />
              Contactar por WhatsApp
            </a>
          ) : (
            <div style={md.noContact}>Sin número de contacto registrado</div>
          )}
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={md.routeBtn} title="Cómo llegar">
              <Navigation size={18} />
            </a>
          )}
        </div>

      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   VEHICLE CARD — con carrusel de imágenes táctil
════════════════════════════════════════════════════════ */
function VehicleCard({ v, onClick }) {
  const imgs = parseImages(v.images);
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef(null);

  /* Swipe táctil */
  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 30) return; // threshold mínimo
    if (diff > 0 && idx < imgs.length - 1) setIdx((i) => i + 1); // swipe izquierda → siguiente
    if (diff < 0 && idx > 0)              setIdx((i) => i - 1); // swipe derecha → anterior
    touchStartX.current = null;
  }

  /* Flechas — detienen propagación para no abrir el modal */
  function prev(e) { e.stopPropagation(); setIdx((i) => Math.max(0, i - 1)); }
  function next(e) { e.stopPropagation(); setIdx((i) => Math.min(imgs.length - 1, i + 1)); }

  return (
    <div style={vc.card} onClick={() => onClick(v)} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(v)}>

      {/* ── Carrusel ── */}
      <div style={vc.imgWrap}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

        {imgs.length > 0 ? (
          <img src={imgs[idx]} alt={v.title} style={vc.img}
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div style={vc.noImg}><Car size={28} color="#9ca3af" /></div>
        )}

        {/* Flechas de navegación (solo si hay más de 1 imagen) */}
        {imgs.length > 1 && idx > 0 && (
          <button style={{ ...vc.arrow, left: 6 }} onClick={prev} aria-label="Anterior">‹</button>
        )}
        {imgs.length > 1 && idx < imgs.length - 1 && (
          <button style={{ ...vc.arrow, right: 6 }} onClick={next} aria-label="Siguiente">›</button>
        )}

        {/* Puntos indicadores */}
        {imgs.length > 1 && (
          <div style={vc.dots}>
            {imgs.map((_, i) => (
              <div key={i} style={{ ...vc.dot, ...(i === idx ? vc.dotActive : {}) }} />
            ))}
          </div>
        )}

        <div style={vc.availBadge}>Disponible</div>
      </div>

      {/* ── Info ── */}
      <div style={vc.body}>
        <div style={vc.title}>{v.title}</div>
        {(v.brand || v.year) && (
          <div style={vc.meta}>{[v.brand, v.year].filter(Boolean).join(" · ")}</div>
        )}
        {(v.autolote_name || v.autolote_city) && (
          <div style={vc.lotRow}>
            <MapPin size={10} color="#9ca3af" />
            <span style={vc.lotText}>
              {v.autolote_name}{v.autolote_city ? `, ${v.autolote_city}` : ""}
            </span>
          </div>
        )}
        <div style={vc.priceRow}>
          {v.price > 0
            ? <span style={vc.price}>L {fmt(v.price)}</span>
            : <span style={vc.priceNA}>Consultar</span>
          }
          <span style={vc.tapHint}>Ver más →</span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN — AUTOS (público)
════════════════════════════════════════════════════════ */
export default function Autos({ user }) {
  const navigate = useNavigate();

  const [vehicles,       setVehicles]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [budgetIdx,      setBudgetIdx]      = useState(0);
  const [showCustom,     setShowCustom]     = useState(false);
  const [minPrice,       setMinPrice]       = useState("");
  const [maxPrice,       setMaxPrice]       = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isOwner,        setIsOwner]        = useState(false);
  const heroRef = useRef(null);

  /* ── Filtro de ubicación (compartido con Home vía localStorage) ── */
  const [locFilter,    setLocFilter]    = useState(() => readLocStorage());
  const [showLocModal, setShowLocModal] = useState(false);

  function applyLocation(loc, radius) {
    const next = loc ? { name: loc.name, lat: loc.lat, lng: loc.lng, radius } : null;
    setLocFilter(next);
    writeLocStorage(next);
  }

  function clearLocation() {
    setLocFilter(null);
    writeLocStorage(null);
  }

  /* Verificar si es dueño de autolote */
  useEffect(() => {
    if (!user) return;
    if (SUPER_ADMIN_EMAILS.includes(user.email ?? "")) { setIsOwner(true); return; }
    supabase
      .from("autolote_profiles")
      .select("status")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => { if (data?.status === "approved") setIsOwner(true); });
  }, [user]);

  /* Cargar vehículos + datos completos del autolote (incluyendo redes) */
  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const { data: vData, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ownerIds = [...new Set((vData || []).map((v) => v.owner_id).filter(Boolean))];
      let profiles = {};
      if (ownerIds.length > 0) {
        const { data: pData } = await supabase
          .from("autolote_profiles")
          .select("owner_id, name, city, whatsapp, instagram, facebook, tiktok, verified, lat, lng")
          .in("owner_id", ownerIds)
          .eq("status", "approved");
        (pData || []).forEach((p) => { profiles[p.owner_id] = p; });
      }

      setVehicles(
        (vData || []).map((v) => {
          const p = profiles[v.owner_id] || {};
          return {
            ...v,
            // Usar WhatsApp del autolote si el vehículo no tiene
            whatsapp:          v.whatsapp || p.whatsapp || "",
            autolote_name:     p.name     || null,
            autolote_city:     p.city     || null,
            autolote_verified: p.verified || false,
            autolote_lat:      p.lat      || null,
            autolote_lng:      p.lng      || null,
            instagram:         p.instagram || null,
            facebook:          p.facebook  || null,
            tiktok:            p.tiktok    || null,
          };
        })
      );
    } catch { setVehicles([]); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  /* Filtrado combinado */
  const filtered = useMemo(() => {
    let list = vehicles;
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((v) =>
        v.title?.toLowerCase().includes(q) ||
        v.brand?.toLowerCase().includes(q) ||
        String(v.year || "").includes(q) ||
        v.autolote_name?.toLowerCase().includes(q) ||
        v.autolote_city?.toLowerCase().includes(q)
      );
    }
    if (showCustom) {
      const lo = minPrice ? Number(minPrice) : 0;
      const hi = maxPrice ? Number(maxPrice) : Infinity;
      list = list.filter((v) => { const p = Number(v.price || 0); return p >= lo && p <= hi; });
    } else if (budgetIdx > 0) {
      const { min, max } = BUDGET_CHIPS[budgetIdx];
      list = list.filter((v) => { const p = Number(v.price || 0); return p >= min && p <= max; });
    }
    // Filtro de ubicación
    if (locFilter && locFilter.lat && locFilter.radius && locFilter.radius < 99999) {
      list = list.filter((v) => {
        const lat = Number(v.autolote_lat);
        const lng = Number(v.autolote_lng);
        // Autolote sin GPS → se incluye igual
        if (!lat || !lng || (lat === 0 && lng === 0)) return true;
        return haversine(locFilter.lat, locFilter.lng, lat, lng) <= locFilter.radius;
      });
    }
    return list;
  }, [vehicles, search, budgetIdx, showCustom, minPrice, maxPrice, locFilter]);

  const activeFilters =
    (search.trim() ? 1 : 0) +
    (showCustom ? (minPrice || maxPrice ? 1 : 0) : budgetIdx > 0 ? 1 : 0) +
    (locFilter ? 1 : 0);

  function clearAll() {
    setSearch(""); setBudgetIdx(0);
    setShowCustom(false); setMinPrice(""); setMaxPrice("");
    clearLocation();
  }

  /* ════ RENDER ════ */
  return (
    <div style={pg.page}>

      {/* ── HEADER STICKY ── */}
      <div ref={heroRef} style={pg.stickyTop}>

        {/* Hero */}
        <div style={pg.hero}>
          <div style={pg.heroGlow} />
          <div style={pg.heroInner}>
            <div style={pg.heroLeft}>
              <div style={pg.heroIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e4b8f" strokeWidth="2.2">
                  <rect x="1" y="3" width="15" height="13" rx="2"/>
                  <path d="M16 8h4l3 5v3h-7V8z"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <div>
                <div style={pg.heroTitle}>Autos en venta</div>
                <div style={pg.heroSub}>
                  {loading ? "Cargando..." :
                    `${vehicles.length} vehículo${vehicles.length !== 1 ? "s" : ""} disponible${vehicles.length !== 1 ? "s" : ""}`}
                </div>
              </div>
            </div>
            {isOwner && (
              <button style={pg.manageBtn} onClick={() => navigate("/my-pieces")}>
                <Settings size={13} color="#1e3a8a" />
                Gestionar
              </button>
            )}
          </div>
        </div>

        {/* Buscador + filtros */}
        <div style={pg.filterBox}>

          {/* Barra de búsqueda */}
          <div style={pg.searchWrap}>
            <Search size={16} color="#9ca3af" />
            <input
              placeholder="Marca, modelo, año, ciudad…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={pg.searchInput}
            />
            {search && (
              <button style={pg.iconBtn} onClick={() => setSearch("")}>
                <X size={14} color="#9ca3af" />
              </button>
            )}
          </div>

          {/* Chips de presupuesto — scroll horizontal, sin salto de línea */}
          <div style={pg.chipsScroll}>
            <style>{`
              .chips-track { display:flex; gap:7px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
              .chips-track::-webkit-scrollbar { display:none; }
            `}</style>
            <div className="chips-track">

              {/* ── Chip de ubicación (estilo tab como Home) ── */}
              <button
                style={{
                  flexShrink: 0,
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 0,
                  fontSize: 12,
                  fontWeight: locFilter ? 700 : 600,
                  cursor: "pointer",
                  border: "none",
                  borderBottom: locFilter ? "2.5px solid #facc15" : "2.5px solid transparent",
                  whiteSpace: "nowrap",
                  transition: "all .15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: locFilter ? "#1e4b8f" : "#6b7280",
                  background: "transparent",
                  WebkitTapHighlightColor: "transparent",
                }}
                onClick={() => setShowLocModal(true)}
              >
                <MapPin size={11} />
                {locFilter
                  ? `${locFilter.name} · ${locFilter.radius >= 99999 ? "Todo HN" : `${locFilter.radius} km`}`
                  : "Ubicación"}
                {locFilter && (
                  <span
                    role="button"
                    tabIndex={0}
                    style={{ marginLeft: 2, lineHeight: 1, display: "flex" }}
                    onClick={(e) => { e.stopPropagation(); clearLocation(); }}
                    onKeyDown={(e) => e.key === "Enter" && clearLocation()}
                  >
                    <X size={10} />
                  </span>
                )}
              </button>

              {/* Separador visual */}
              <div style={{ width: 1, background: "#e2e8f0", flexShrink: 0, margin: "2px 0" }} />

              {BUDGET_CHIPS.map((chip, i) => {
                const active = !showCustom && budgetIdx === i;
                return (
                  <button key={chip.label}
                    style={{ ...pg.chip, ...(active ? pg.chipActive : {}) }}
                    onClick={() => { setBudgetIdx(i); setShowCustom(false); setMinPrice(""); setMaxPrice(""); }}>
                    {chip.label}
                  </button>
                );
              })}
              {/* Separador visual */}
              <div style={{ width: 1, background: "#e2e8f0", flexShrink: 0, margin: "2px 0" }} />
              <button
                style={{ ...pg.chip, ...(showCustom ? pg.chipActive : {}), gap: 5, display: "flex", alignItems: "center" }}
                onClick={() => { setShowCustom((v) => !v); setBudgetIdx(0); }}>
                <SlidersHorizontal size={11} />
                Rango
              </button>
            </div>
          </div>

          {/* Panel de rango personalizado — compacto, inline */}
          {showCustom && (
            <div style={pg.customRange}>
              <div style={pg.rangeRow}>
                <input type="number" placeholder="Mínimo (L)" value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)} style={pg.rangeInput} min={0} />
                <span style={{ color: "#9ca3af", fontSize: 14, flexShrink: 0 }}>—</span>
                <input type="number" placeholder="Máximo (L)" value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)} style={pg.rangeInput} min={0} />
              </div>
              {(minPrice || maxPrice) && (
                <div style={pg.rangePreview}>
                  💰 L {fmt(minPrice || 0)} — {maxPrice ? `L ${fmt(maxPrice)}` : "sin límite"}
                </div>
              )}
            </div>
          )}

          {/* Resultados + limpiar — solo si hay filtros activos */}
          {activeFilters > 0 && (
            <div style={pg.activeRow}>
              <span style={pg.activeCount}>{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
              <button style={pg.clearAllBtn} onClick={clearAll}>
                <X size={11} /> Limpiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── LISTADO ── */}
      <div style={pg.body}>
        {loading ? (
          <div style={pg.center}>
            <div style={pg.spinner} />
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 12 }}>Cargando vehículos…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={pg.empty}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🔍</div>
            <div style={pg.emptyTitle}>
              {activeFilters > 0 ? "Sin resultados con esos filtros" : "Aún no hay vehículos publicados"}
            </div>
            <div style={pg.emptySub}>
              {activeFilters > 0 ? "Intenta ampliar tu búsqueda o cambiar el presupuesto"
                : "Pronto los autolotes comenzarán a publicar sus vehículos aquí"}
            </div>
            {activeFilters > 0 && (
              <button style={pg.clearSearchBtn} onClick={clearAll}>Ver todos los autos</button>
            )}
          </div>
        ) : (
          <>
            <div style={pg.resultsLabel}>
              <span style={{ fontWeight: 700, color: "#111" }}>{filtered.length}</span>
              {" "}vehículo{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}
            </div>
            <div style={pg.grid}>
              {filtered.map((v) => (
                <VehicleCard key={v.id} v={v} onClick={setSelectedVehicle} />
              ))}
            </div>
          </>
        )}

        {/* ── BANNER ÚNETE — al final del contenido, siempre visible ── */}
        {!loading && (
          <div style={pg.joinBanner} onClick={() => navigate("/autolote-solicitud")}>
            <div style={pg.joinLeft}>
              <div style={pg.joinIconWrap}>🚗</div>
              <div>
                <div style={pg.joinTitle}>¿Tienes un autolote?</div>
                <div style={pg.joinSub}>Publica gratis · Llega a miles de compradores</div>
              </div>
            </div>
            <div style={pg.joinArrow}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL DETALLE ── */}
      {selectedVehicle && (
        <VehicleDetailModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
      )}

      {/* ── MODAL UBICACIÓN ── */}
      <KmRadiusModal
        open={showLocModal}
        onClose={() => setShowLocModal(false)}
        location={locFilter ? { name: locFilter.name, lat: locFilter.lat, lng: locFilter.lng } : null}
        radius={locFilter?.radius ?? 50}
        onApply={applyLocation}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ════ Modal styles ════ */
const md = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 9000,
    background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    /* Padding inferior para no solapar el BottomNav, lateral para móvil */
    padding: "12px 10px 72px",
  },
  /* Sheet centrado con bordes redondeados en todos los lados */
  sheet: {
    background: "#fff", borderRadius: 22,
    width: "100%", maxWidth: 520,
    maxHeight: "100%",
    overflow: "hidden",
    display: "flex", flexDirection: "column",
    boxShadow: "0 12px 48px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1)",
  },
  imgWrap: {
    position: "relative", width: "100%", height: 190,
    background: "#f3f4f6", flexShrink: 0, overflow: "hidden",
  },
  img:   { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  noImg: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  thumbRow: {
    position: "absolute", bottom: 8, left: 0, right: 0,
    display: "flex", justifyContent: "center", gap: 6, padding: "0 12px",
  },
  thumb: {
    width: 36, height: 36, borderRadius: 8, overflow: "hidden",
    border: "2px solid transparent", cursor: "pointer",
    background: "rgba(0,0,0,0.35)", padding: 0, flexShrink: 0,
  },
  closeBtn: {
    position: "absolute", top: 10, right: 10,
    width: 32, height: 32, borderRadius: "50%",
    background: "#fff", border: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
  },
  availBadge: {
    position: "absolute", top: 10, left: 10,
    background: "#dcfce7", color: "#16a34a",
    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
  },

  /* body hace scroll independiente — deja el footer siempre visible */
  body: {
    flex: 1, overflowY: "auto",
    padding: "16px 18px 8px",
    display: "flex", flexDirection: "column", gap: 12,
  },
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  title: { fontSize: 19, fontWeight: 800, color: "#111827", lineHeight: 1.25, flex: 1 },
  price: { fontSize: 19, fontWeight: 800, color: "#1e3a8a", flexShrink: 0 },
  meta:  { fontSize: 13, color: "#6b7280", marginTop: -6 },
  divider: { height: 1, background: "#f1f5f9", flexShrink: 0 },

  /* Tarjeta del autolote — columna, nunca se corta */
  autoloteCard: {
    background: "#f8fafc", borderRadius: 14, padding: "14px 16px",
    display: "flex", flexDirection: "column", gap: 10,
  },
  autoloteTop: {
    display: "flex", alignItems: "center", gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 13,
    background: "#1e3a8a", color: "#facc15",
    fontSize: 15, fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  autoloteInfo: { flex: 1, minWidth: 0 },
  autoloteNameRow: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  autoloteName: { fontSize: 15, fontWeight: 700, color: "#111827" },
  verifiedBadge: {
    fontSize: 10, fontWeight: 700, color: "#1d4ed8",
    background: "#eff6ff", padding: "2px 7px", borderRadius: 6, flexShrink: 0,
  },
  autoloteCity: {
    fontSize: 12, color: "#6b7280",
    display: "flex", alignItems: "center", gap: 4, marginTop: 4,
  },
  /* Redes sociales en fila propia — nunca tapan el nombre */
  socialsRow: {
    display: "flex", flexDirection: "column", gap: 6,
    borderTop: "1px solid #e2e8f0", paddingTop: 10,
  },
  socialsLabel: { fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.04em", textTransform: "uppercase" },
  socialBtns: { display: "flex", gap: 8 },
  socialBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 12px", borderRadius: 10,
    cursor: "pointer", transition: "transform .15s",
    fontFamily: "system-ui, sans-serif",
  },

  detailsBox: {
    background: "#f8fafc", borderRadius: 14, padding: "14px 16px",
    display: "flex", flexDirection: "column",
  },
  detailsTitle: {
    fontSize: 11, fontWeight: 700, color: "#9ca3af",
    letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10,
  },
  detailRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 0", borderBottom: "1px solid #f1f5f9",
  },
  detailLabel: { fontSize: 13, color: "#6b7280" },
  detailValue: { fontSize: 13, fontWeight: 600, color: "#111827", textAlign: "right" },

  /* Footer SIEMPRE visible — no hace scroll */
  footer: {
    padding: "12px 16px",
    borderTop: "1px solid #f1f5f9",
    background: "#fff", flexShrink: 0,
    display: "flex", gap: 10, alignItems: "center",
  },
  waBtn: {
    flex: 1,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    padding: "13px 0", borderRadius: 14,
    background: "#16a34a", color: "#fff",
    fontSize: 15, fontWeight: 700, textDecoration: "none",
  },
  routeBtn: {
    flexShrink: 0,
    width: 48, height: 48, borderRadius: 14,
    background: "#1e3a8a", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    textDecoration: "none",
    boxShadow: "0 2px 8px rgba(30,58,138,0.3)",
  },
  noContact: { flex: 1, textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "10px 0" },

  /* Mapa */
  mapLabel: {
    display: "flex", alignItems: "center", gap: 5,
    fontSize: 11, fontWeight: 700, color: "#6b7280",
    letterSpacing: "0.04em", textTransform: "uppercase",
    marginBottom: 8,
  },
  mapWrap: {
    width: "100%", height: 180, borderRadius: 14,
    overflow: "hidden", border: "1px solid #e2e8f0",
    marginBottom: 4,
  },
  noCoords: {
    fontSize: 12, color: "#94a3b8",
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 12, padding: "10px 14px",
    marginBottom: 4,
  },
};

/* ════ VehicleCard styles ════ */
const vc = {
  card: {
    background: "#fff", borderRadius: 14, overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
    display: "flex", flexDirection: "column", cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  imgWrap: {
    position: "relative", width: "100%", height: 150,
    background: "#f3f4f6", overflow: "hidden", flexShrink: 0,
    userSelect: "none",
  },
  img: {
    width: "100%", height: "100%", objectFit: "cover", display: "block",
    transition: "opacity 0.15s",
    pointerEvents: "none",   /* evita que el drag de imagen interfiera con el swipe */
  },
  noImg: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  /* Flechas de navegación */
  arrow: {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    width: 26, height: 26, borderRadius: "50%",
    background: "rgba(0,0,0,0.45)", border: "none",
    color: "#fff", fontSize: 18, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", lineHeight: 1, padding: 0,
    zIndex: 2,
  },
  /* Puntos indicadores */
  dots: {
    position: "absolute", bottom: 7, left: 0, right: 0,
    display: "flex", justifyContent: "center", gap: 4, zIndex: 2,
  },
  dot: {
    width: 5, height: 5, borderRadius: "50%",
    background: "rgba(255,255,255,0.5)",
    transition: "background 0.2s, transform 0.2s",
  },
  dotActive: {
    background: "#fff",
    transform: "scale(1.3)",
  },
  availBadge: {
    position: "absolute", top: 7, left: 7, zIndex: 2,
    background: "#dcfce7", color: "#16a34a",
    fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 7,
  },
  body: {
    padding: "10px 12px 12px",
    display: "flex", flexDirection: "column", gap: 3, flex: 1,
  },
  title:  { fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.3 },
  meta:   { fontSize: 11, color: "#6b7280" },
  lotRow: { display: "flex", alignItems: "center", gap: 3 },
  lotText: { fontSize: 10, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  priceRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  price:   { fontSize: 14, fontWeight: 800, color: "#1e3a8a" },
  priceNA: { fontSize: 11, color: "#9ca3af", fontStyle: "italic" },
  tapHint: { fontSize: 10, color: "#9ca3af" },
};

/* ════ Page styles ════ */
const pg = {
  page: {
    background: "#f7f8fa", minHeight: "100vh", paddingBottom: 80,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },

  /* Todo el header (hero + filtros) es un bloque sticky */
  stickyTop: {
    position: "sticky", top: 0, zIndex: 100,
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },

  hero: {
    background: "#1e4b8f", padding: "12px 16px", overflow: "hidden",
  },
  heroGlow: {
    position: "absolute", top: -20, right: -20,
    width: 100, height: 100, borderRadius: "50%",
    background: "rgba(250,204,21,0.15)", pointerEvents: "none",
  },
  heroInner: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: 12, position: "relative",
  },
  heroLeft: { display: "flex", alignItems: "center", gap: 10, flex: 1 },
  heroIcon: {
    width: 36, height: 36, borderRadius: 10, background: "#facc15",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, boxShadow: "0 2px 8px rgba(250,204,21,0.35)",
  },
  heroTitle: { fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" },
  heroSub:   { fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 1 },
  manageBtn: {
    display: "flex", alignItems: "center", gap: 5,
    padding: "7px 12px", borderRadius: 10,
    background: "#facc15", border: "none",
    color: "#1e3a8a", fontSize: 12, fontWeight: 700,
    cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
  },

  filterBox: {
    background: "#fff", padding: "10px 16px 10px",
    borderBottom: "1px solid #ebebeb",
    display: "flex", flexDirection: "column", gap: 8,
  },
  searchWrap: {
    display: "flex", alignItems: "center", gap: 8,
    height: 40, padding: "0 12px",
    border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#f8fafc",
  },
  searchInput: {
    flex: 1, border: "none", outline: "none",
    fontSize: 14, color: "#111", background: "transparent",
    fontFamily: "system-ui, sans-serif",
  },
  iconBtn: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" },

  /* Chips — scroll horizontal sin salto de línea */
  chipsScroll: { margin: "0 -16px", padding: "0 16px" },
  chip: {
    padding: "6px 14px", borderRadius: 20,
    border: "1.5px solid #e2e8f0", background: "#f8fafc",
    color: "#374151", fontSize: 12, fontWeight: 600,
    cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
    flexShrink: 0,
  },
  chipActive: {
    background: "#1e3a8a", color: "#fff",
    border: "1.5px solid #1e3a8a",
    boxShadow: "0 2px 8px rgba(30,58,138,0.25)",
  },

  /* Rango personalizado — compacto */
  customRange: {
    background: "#f0f4ff", border: "1.5px solid #bfdbfe",
    borderRadius: 12, padding: "10px 12px",
    display: "flex", flexDirection: "column", gap: 8,
  },
  rangeRow: { display: "flex", alignItems: "center", gap: 8 },
  rangeInput: {
    flex: 1, height: 36, padding: "0 11px",
    border: "1.5px solid #bfdbfe", borderRadius: 9,
    fontSize: 13, color: "#111", background: "#fff",
    outline: "none", boxSizing: "border-box",
    fontFamily: "system-ui, sans-serif",
    minWidth: 0,
  },
  rangePreview: {
    fontSize: 12, color: "#1e3a8a", fontWeight: 600,
    background: "#dbeafe", borderRadius: 8, padding: "5px 10px",
  },

  activeRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  activeCount: { fontSize: 12, color: "#6b7280", fontWeight: 600 },
  clearAllBtn: {
    display: "flex", alignItems: "center", gap: 4,
    background: "none", border: "1px solid #e2e8f0", borderRadius: 8,
    padding: "4px 10px", color: "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer",
  },

  /* Banner al fondo — elegante, no intrusivo */
  joinBanner: {
    marginTop: 20,
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 16, padding: "16px 18px",
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: 12,
    cursor: "pointer",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },
  joinLeft: { display: "flex", alignItems: "center", gap: 12, flex: 1 },
  joinIconWrap: {
    fontSize: 26,
    width: 44, height: 44, borderRadius: 12,
    background: "#eff6ff",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  joinTitle: { fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 },
  joinSub:   { fontSize: 11, color: "#64748b", lineHeight: 1.4 },
  joinArrow: {
    width: 32, height: 32, borderRadius: "50%",
    background: "#eff6ff",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },

  body: { padding: "4px 16px 16px" },
  center: {
    textAlign: "center", padding: "60px 24px",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  spinner: {
    width: 36, height: 36,
    border: "3px solid #e2e8f0", borderTopColor: "#1e3a8a",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  empty: { textAlign: "center", padding: "48px 24px" },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 },
  emptySub:   { fontSize: 13, color: "#9ca3af", marginBottom: 20 },
  clearSearchBtn: {
    padding: "9px 20px", borderRadius: 10, border: "none",
    background: "#1e3a8a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  resultsLabel: { fontSize: 12, color: "#6b7280", fontWeight: 500, margin: "10px 0 12px" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
    gap: 12,
  },
};
