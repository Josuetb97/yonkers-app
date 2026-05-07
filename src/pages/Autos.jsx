import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Car, MapPin, Settings, SlidersHorizontal } from "lucide-react";
import { supabase } from "../lib/supabase";

const SUPER_ADMIN_EMAILS = [
  "josuetb19997@gmail.com",
  "josuetaborab@gmail.com",
  "josuetabora2012@gmail.com",
];

const BUDGET_CHIPS = [
  { label: "Todos",         min: 0,       max: Infinity },
  { label: "Hasta L200k",  min: 0,       max: 200000   },
  { label: "L200k–500k",   min: 200000,  max: 500000   },
  { label: "L500k–1M",     min: 500000,  max: 1000000  },
  { label: "Más de L1M",   min: 1000000, max: Infinity },
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
  const imgs = parseImages(vehicle.images);
  const phone = (vehicle.whatsapp || "").replace(/\D/g, "");
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hola, vi tu vehículo en Yonkers App: ${vehicle.title}. ¿Sigue disponible?`)}`
    : null;

  const hasSocials = SOCIAL_CONFIG.some(({ key }) => vehicle[key] && String(vehicle[key]).trim());

  // Cerrar con fondo o Escape
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
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

          {/* Miniaturas */}
          {imgs.length > 1 && (
            <div style={md.thumbRow}>
              {imgs.map((src, i) => (
                <button key={i} style={{ ...md.thumb, outline: i === imgIdx ? "2.5px solid #facc15" : "none" }}
                  onClick={() => setImgIdx(i)}>
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                </button>
              ))}
            </div>
          )}

          {/* Botón cerrar */}
          <button style={md.closeBtn} onClick={onClose}>
            <X size={16} color="#374151" />
          </button>

          {/* Badge disponible */}
          <div style={md.availBadge}>Disponible</div>
        </div>

        {/* ── Contenido ── */}
        <div style={md.body}>

          {/* Título y precio */}
          <div style={md.titleRow}>
            <div style={md.title}>{vehicle.title}</div>
            {vehicle.price > 0 && (
              <div style={md.price}>L {fmt(vehicle.price)}</div>
            )}
          </div>

          {/* Marca · Año */}
          {(vehicle.brand || vehicle.year) && (
            <div style={md.meta}>{[vehicle.brand, vehicle.year].filter(Boolean).join(" · ")}</div>
          )}

          <div style={md.divider} />

          {/* Info del autolote */}
          {vehicle.autolote_name && (
            <div style={md.autoloteCard}>
              {/* Avatar */}
              <div style={md.avatar}>
                {vehicle.autolote_name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={md.autoloteName}>
                  {vehicle.autolote_name}
                  {vehicle.autolote_verified && (
                    <span style={md.verifiedBadge}>✓ Verificado</span>
                  )}
                </div>
                {vehicle.autolote_city && (
                  <div style={md.autoloteCity}>
                    <MapPin size={11} color="#6b7280" />
                    {vehicle.autolote_city}
                  </div>
                )}
              </div>
              {/* Redes sociales */}
              {hasSocials && (
                <div style={md.socialsRow}>
                  {SOCIAL_CONFIG.map(({ key, label, icon, color, bg, border, buildUrl }) => {
                    const val = vehicle[key];
                    if (!val || !String(val).trim()) return null;
                    return (
                      <button key={key} title={label}
                        onClick={() => safeOpen(buildUrl(String(val).trim()))}
                        style={{ ...md.socialBtn, background: bg, border: `1px solid ${border}`, color }}>
                        {icon}
                      </button>
                    );
                  })}
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
        </div>

        {/* ── Botón WhatsApp fijo ── */}
        <div style={md.footer}>
          {waUrl ? (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" style={md.waBtn}>
              <IconWhatsApp size={20} />
              Contactar por WhatsApp
            </a>
          ) : (
            <div style={md.noContact}>Sin número de contacto registrado</div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   VEHICLE CARD (grilla pública — clickeable)
════════════════════════════════════════════════════════ */
function VehicleCard({ v, onClick }) {
  const imgs = parseImages(v.images);

  return (
    <div style={vc.card} onClick={() => onClick(v)} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(v)}>
      <div style={vc.imgWrap}>
        {imgs[0] ? (
          <img src={imgs[0]} alt={v.title} style={vc.img}
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div style={vc.noImg}><Car size={28} color="#9ca3af" /></div>
        )}
        {imgs.length > 1 && (
          <div style={vc.photoBadge}>+{imgs.length - 1}</div>
        )}
        <div style={vc.availBadge}>Disponible</div>
      </div>

      <div style={vc.body}>
        <div style={vc.title}>{v.title}</div>
        {(v.brand || v.year) && (
          <div style={vc.meta}>{[v.brand, v.year].filter(Boolean).join(" · ")}</div>
        )}
        {v.autolote_name && (
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
          .select("owner_id, name, city, whatsapp, instagram, facebook, verified")
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
    return list;
  }, [vehicles, search, budgetIdx, showCustom, minPrice, maxPrice]);

  const activeFilters =
    (search.trim() ? 1 : 0) +
    (showCustom ? (minPrice || maxPrice ? 1 : 0) : budgetIdx > 0 ? 1 : 0);

  function clearAll() {
    setSearch(""); setBudgetIdx(0);
    setShowCustom(false); setMinPrice(""); setMaxPrice("");
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

        {/* Buscador + filtros (también dentro del bloque sticky) */}
        <div style={pg.filterBox}>

          {/* Barra de búsqueda */}
          <div style={pg.searchWrap}>
            <Search size={16} color="#9ca3af" />
            <input
              placeholder="Buscar por marca, modelo, año, ciudad..."
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

          {/* Label presupuesto */}
          <div style={pg.budgetLabel}>
            <SlidersHorizontal size={13} color="#1e3a8a" />
            <span>Filtrar por presupuesto</span>
          </div>

          {/* Chips rápidos */}
          <div style={pg.chipsRow}>
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
            <button
              style={{ ...pg.chip, ...(showCustom ? pg.chipActive : {}) }}
              onClick={() => { setShowCustom((v) => !v); setBudgetIdx(0); }}>
              ✏️ Personalizado
            </button>
          </div>

          {/* Rango personalizado */}
          {showCustom && (
            <div style={pg.customRange}>
              <div style={pg.rangeRow}>
                <div style={pg.rangeField}>
                  <label style={pg.rangeLabel}>Mínimo (L)</label>
                  <input type="number" placeholder="0" value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)} style={pg.rangeInput} min={0} />
                </div>
                <div style={{ color: "#9ca3af", fontSize: 18, alignSelf: "flex-end", paddingBottom: 8 }}>—</div>
                <div style={pg.rangeField}>
                  <label style={pg.rangeLabel}>Máximo (L)</label>
                  <input type="number" placeholder="Sin límite" value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)} style={pg.rangeInput} min={0} />
                </div>
              </div>
              {(minPrice || maxPrice) && (
                <div style={pg.rangePreview}>
                  💰 L {fmt(minPrice || 0)} — {maxPrice ? `L ${fmt(maxPrice)}` : "sin límite"}
                </div>
              )}
            </div>
          )}

          {/* Resultados + limpiar */}
          {activeFilters > 0 && (
            <div style={pg.activeRow}>
              <span style={pg.activeCount}>{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
              <button style={pg.clearAllBtn} onClick={clearAll}>
                <X size={11} /> Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── BANNER ── */}
      {!isOwner && !loading && (
        <div style={pg.joinBanner}>
          <div style={pg.joinText}>
            <div style={pg.joinTitle}>🚗 ¿Tienes un autolote?</div>
            <div style={pg.joinSub}>Publica gratis y llega a miles de compradores</div>
          </div>
          <button style={pg.joinBtn} onClick={() => navigate("/autolote-solicitud")}>Únete</button>
        </div>
      )}

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
            {!activeFilters && (
              <div style={pg.resultsLabel}>
                {filtered.length} vehículo{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}
              </div>
            )}
            <div style={pg.grid}>
              {filtered.map((v) => (
                <VehicleCard key={v.id} v={v} onClick={setSelectedVehicle} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── MODAL DETALLE ── */}
      {selectedVehicle && (
        <VehicleDetailModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ════ Modal styles ════ */
const md = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 9000,
    background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
  },
  sheet: {
    background: "#fff", borderRadius: "22px 22px 0 0",
    width: "100%", maxWidth: 560, maxHeight: "92vh",
    overflowY: "auto", display: "flex", flexDirection: "column",
    boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
  },
  imgWrap: {
    position: "relative", width: "100%", height: 220,
    background: "#f3f4f6", flexShrink: 0, overflow: "hidden",
  },
  img:   { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  noImg: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  thumbRow: {
    position: "absolute", bottom: 10, left: 0, right: 0,
    display: "flex", justifyContent: "center", gap: 6, padding: "0 12px",
  },
  thumb: {
    width: 38, height: 38, borderRadius: 8, overflow: "hidden",
    border: "2px solid transparent", cursor: "pointer",
    background: "rgba(0,0,0,0.35)", padding: 0, flexShrink: 0,
  },
  closeBtn: {
    position: "absolute", top: 12, right: 12,
    width: 32, height: 32, borderRadius: "50%",
    background: "#fff", border: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
  },
  availBadge: {
    position: "absolute", top: 12, left: 12,
    background: "#dcfce7", color: "#16a34a",
    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
  },
  body: {
    padding: "18px 20px 4px", display: "flex", flexDirection: "column", gap: 12, flex: 1,
  },
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  title: { fontSize: 20, fontWeight: 800, color: "#111827", lineHeight: 1.25, flex: 1 },
  price: { fontSize: 20, fontWeight: 800, color: "#1e3a8a", flexShrink: 0 },
  meta:  { fontSize: 13, color: "#6b7280", marginTop: -6 },
  divider: { height: 1, background: "#f1f5f9" },

  autoloteCard: {
    display: "flex", alignItems: "center", gap: 12,
    background: "#f8fafc", borderRadius: 14, padding: "12px 14px",
  },
  avatar: {
    width: 40, height: 40, borderRadius: 12,
    background: "#1e3a8a", color: "#facc15",
    fontSize: 14, fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  autoloteName: { fontSize: 14, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 6 },
  verifiedBadge: {
    fontSize: 10, fontWeight: 700, color: "#1d4ed8",
    background: "#eff6ff", padding: "2px 7px", borderRadius: 6,
  },
  autoloteCity: {
    fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4, marginTop: 3,
  },
  socialsRow: { display: "flex", gap: 6, marginLeft: "auto" },
  socialBtn: {
    width: 34, height: 34, borderRadius: 9,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "transform .15s", flexShrink: 0,
  },

  detailsBox: {
    background: "#f8fafc", borderRadius: 14, padding: "14px 16px",
    display: "flex", flexDirection: "column", gap: 0,
  },
  detailsTitle: { fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 },
  detailRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "7px 0", borderBottom: "1px solid #f1f5f9",
  },
  detailLabel: { fontSize: 13, color: "#6b7280" },
  detailValue: { fontSize: 13, fontWeight: 600, color: "#111827", textAlign: "right" },

  footer: {
    padding: "16px 20px 32px", borderTop: "1px solid #f1f5f9",
    background: "#fff", flexShrink: 0,
  },
  waBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    width: "100%", padding: "14px 0", borderRadius: 14,
    background: "#16a34a", color: "#fff",
    fontSize: 16, fontWeight: 700, textDecoration: "none",
  },
  noContact: {
    textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "10px 0",
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
    position: "relative", width: "100%", height: 140,
    background: "#f3f4f6", overflow: "hidden", flexShrink: 0,
  },
  img:   { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  noImg: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  photoBadge: {
    position: "absolute", bottom: 6, right: 6,
    background: "rgba(0,0,0,0.6)", color: "#fff",
    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 7,
  },
  availBadge: {
    position: "absolute", top: 6, left: 6,
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
  lotText:{ fontSize: 10, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  priceRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  price:  { fontSize: 14, fontWeight: 800, color: "#1e3a8a" },
  priceNA:{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" },
  tapHint:{ fontSize: 10, color: "#9ca3af" },
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
    background: "#fff", padding: "12px 16px 10px",
    borderBottom: "1px solid #ebebeb",
    display: "flex", flexDirection: "column", gap: 9,
  },
  searchWrap: {
    display: "flex", alignItems: "center", gap: 8,
    height: 42, padding: "0 12px",
    border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#f8fafc",
  },
  searchInput: {
    flex: 1, border: "none", outline: "none",
    fontSize: 14, color: "#111", background: "transparent",
    fontFamily: "system-ui, sans-serif",
  },
  iconBtn: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" },

  budgetLabel: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#1e3a8a" },
  chipsRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  chip: {
    padding: "5px 12px", borderRadius: 20,
    border: "1.5px solid #e2e8f0", background: "#f8fafc",
    color: "#374151", fontSize: 12, fontWeight: 600,
    cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
  },
  chipActive: { background: "#1e3a8a", color: "#fff", border: "1.5px solid #1e3a8a" },

  customRange: {
    background: "#f0f4ff", border: "1.5px solid #bfdbfe",
    borderRadius: 12, padding: "12px 14px",
    display: "flex", flexDirection: "column", gap: 8,
  },
  rangeRow:   { display: "flex", alignItems: "flex-end", gap: 10 },
  rangeField: { flex: 1, display: "flex", flexDirection: "column", gap: 4 },
  rangeLabel: { fontSize: 11, fontWeight: 700, color: "#374151" },
  rangeInput: {
    height: 38, padding: "0 11px",
    border: "1.5px solid #bfdbfe", borderRadius: 9,
    fontSize: 14, color: "#111", background: "#fff",
    outline: "none", width: "100%", boxSizing: "border-box",
    fontFamily: "system-ui, sans-serif",
  },
  rangePreview: {
    fontSize: 12, color: "#1e3a8a", fontWeight: 600,
    background: "#dbeafe", borderRadius: 8, padding: "5px 10px",
  },
  activeRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  activeCount: { fontSize: 12, color: "#6b7280", fontWeight: 600 },
  clearAllBtn: {
    display: "flex", alignItems: "center", gap: 4,
    background: "none", border: "1px solid #e2e8f0", borderRadius: 8,
    padding: "4px 10px", color: "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer",
  },

  joinBanner: {
    margin: "12px 16px",
    background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
    borderRadius: 14, padding: "13px 16px",
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: 12,
  },
  joinText: { flex: 1 },
  joinTitle: { fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 },
  joinSub:   { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  joinBtn: {
    padding: "7px 14px", borderRadius: 9,
    background: "#facc15", border: "none",
    color: "#1e3a8a", fontSize: 13, fontWeight: 700,
    cursor: "pointer", flexShrink: 0,
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
  resultsLabel: { fontSize: 12, color: "#6b7280", fontWeight: 600, margin: "10px 0" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
    gap: 12,
  },
};
