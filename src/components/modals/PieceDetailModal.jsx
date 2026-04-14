import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Navigation,
  Phone,
  Star,
  X,
} from "lucide-react";
import NearbyMap from "../map/NearbyMap";

const BACKEND =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "";

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
function resolveImageUrl(img) {
  const str = String(img ?? "").trim();
  if (!str) return null;
  if (str.startsWith("http://") || str.startsWith("https://")) return str;
  return str.startsWith("/") ? `${BACKEND}${str}` : `${BACKEND}/${str}`;
}

function extractWhatsappNumber(piece) {
  if (!piece) return "";
  const fields = [
    piece.whatsapp, piece.phone, piece.telefono,
    piece.celular,  piece.contacto, piece.numero, piece.tel,
  ];
  for (const raw of fields) {
    if (raw == null) continue;
    const digits = String(raw).replace(/\D/g, "");
    if (digits.length >= 7) return digits;
  }
  return "";
}

function extractPhoneNumber(piece) {
  if (!piece) return "";
  const fields = [piece.phone, piece.telefono, piece.tel, piece.whatsapp, piece.celular];
  for (const raw of fields) {
    if (raw == null) continue;
    const clean = String(raw).replace(/[^\d+]/g, "").replace(/(?!^\+)\+/g, "");
    if (clean.replace(/\D/g, "").length >= 7) return clean;
  }
  return "";
}

function safeOpen(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

/* ─────────────────────────────────────────────────────────────
   ICONOS SVG DE REDES SOCIALES
───────────────────────────────────────────────────────────── */
function IconInstagram() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function IconTikTok() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.53V6.76a4.85 4.85 0 01-1.02-.07z"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   SOCIAL CONFIG
   buildUrl: convierte handle o URL en enlace directo a la red
───────────────────────────────────────────────────────────── */
const SOCIAL_CONFIG = [
  {
    key:      "instagram",
    label:    "Instagram",
    icon:     <IconInstagram />,
    color:    "#E1306C",
    bg:       "rgba(225,48,108,0.09)",
    border:   "rgba(225,48,108,0.25)",
    buildUrl: (v) =>
      v.startsWith("http") ? v : `https://instagram.com/${v.replace(/^@/, "")}`,
  },
  {
    key:      "facebook",
    label:    "Facebook",
    icon:     <IconFacebook />,
    color:    "#1877F2",
    bg:       "rgba(24,119,242,0.09)",
    border:   "rgba(24,119,242,0.25)",
    buildUrl: (v) =>
      v.startsWith("http") ? v : `https://facebook.com/${v.replace(/^@/, "")}`,
  },
  {
    key:      "tiktok",
    label:    "TikTok",
    icon:     <IconTikTok />,
    color:    "#111827",
    bg:       "rgba(0,0,0,0.06)",
    border:   "rgba(0,0,0,0.16)",
    buildUrl: (v) =>
      v.startsWith("http") ? v : `https://tiktok.com/@${v.replace(/^@/, "")}`,
  },
];

/* ─────────────────────────────────────────────────────────────
   SOCIALLINKS — renderiza los botones de redes del yonker
   Lee: piece.instagram / piece.facebook / piece.tiktok
   Si el campo no existe o está vacío, no muestra nada.
───────────────────────────────────────────────────────────── */
function SocialLinks({ piece }) {
  if (!piece) return null;

  const available = SOCIAL_CONFIG.filter(({ key }) => {
    const v = piece[key];
    return v && String(v).trim().length > 0;
  });

  if (available.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
      {available.map(({ key, label, icon, color, bg, border, buildUrl }) => {
        const url = buildUrl(String(piece[key]).trim());
        return (
          <button
            key={key}
            type="button"
            aria-label={`Ver en ${label}`}
            title={label}
            onClick={(e) => { e.stopPropagation(); safeOpen(url); }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: bg,
              border: `1px solid ${border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color,
              flexShrink: 0,
              transition: "transform .15s",
              padding: 0,
            }}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   WAICON
───────────────────────────────────────────────────────────── */
function WaIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"
      style={{ flexShrink: 0 }} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   PIECEDETAILMODAL
───────────────────────────────────────────────────────────── */
export default function PieceDetailModal({ piece, onClose, isFavorite, onToggleFavorite }) {

  const [imgIndex,  setImgIndex]  = useState(0);
  const [failedSet, setFailedSet] = useState(() => new Set());
  const imgLenRef = useRef(0);

  useEffect(() => {
    setImgIndex(0);
    setFailedSet(new Set());
  }, [piece?.id]);

  useEffect(() => {
    if (!piece) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [piece]);

  const allImages = useMemo(() => {
    if (!piece) return [];
    const raw = Array.isArray(piece.images) && piece.images.length
      ? piece.images
      : piece.image ? [piece.image] : [];
    return raw.map(resolveImageUrl).filter(Boolean);
  }, [piece]);

  const images = useMemo(
    () => allImages.filter((_, i) => !failedSet.has(i)),
    [allImages, failedSet]
  );

  imgLenRef.current = images.length;

  useEffect(() => {
    if (images.length > 0 && imgIndex >= images.length) setImgIndex(images.length - 1);
  }, [images.length, imgIndex]);

  const coords = useMemo(() => {
    if (!piece) return null;
    const lat = Number(piece.lat);
    const lng = Number(piece.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat === 0 && lng === 0) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    return { lat, lng };
  }, [piece]);

  const cleanWhatsapp = useMemo(() => extractWhatsappNumber(piece), [piece]);
  const cleanPhone    = useMemo(() => extractPhoneNumber(piece),    [piece]);

  const priceText = useMemo(() => {
    const price = piece?.price;
    if (price == null || price === "") return null;
    const num = Number(price);
    if (!Number.isFinite(num)) return String(price);
    return `L ${num.toLocaleString("es-HN")}`;
  }, [piece?.price]);

  const whatsappUrl = useMemo(() => {
    if (!cleanWhatsapp) return null;
    const msg = [
      "Hola 👋 estoy interesado en:",
      "",
      piece?.title  ?? "",
      `${piece?.brand ?? ""} ${piece?.years ?? ""}`.trim(),
      piece?.yonker ?? "",
    ].join("\n");
    return `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(msg)}`;
  }, [cleanWhatsapp, piece?.title, piece?.brand, piece?.years, piece?.yonker]);

  const handleKeyDown = useCallback((e) => {
    if (!piece) return;
    if (e.key === "Escape") { onClose?.(); return; }
    const len = imgLenRef.current;
    if (len < 2) return;
    if (e.key === "ArrowRight") setImgIndex((i) => (i + 1) % len);
    if (e.key === "ArrowLeft")  setImgIndex((i) => (i === 0 ? len - 1 : i - 1));
  }, [piece, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  /* ── Early return después de TODOS los hooks ── */
  if (!piece) return null;

  const {
    title      = "",
    brand      = "",
    years      = "",
    yonker     = "",
    distance   = 0,
    rating     = 0,
    contacts   = 0,
    condition  = "",
    reviewCount,
    city       = "",
    department = "",
  } = piece;

  const ratingText      = Number(rating   || 0).toFixed(1);
  const kmText          = Number(distance || 0).toFixed(1);
  const conditionIsGood = Boolean(condition && /buen|nuevo|excelente|premium/i.test(condition));
  const yonkerInitials  = yonker
    ? yonker.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase()
    : "YK";
  const yLocation  = [city, department].filter(Boolean).join(" · ") || "Ubicación no disponible";
  const hasImages  = images.length > 0;
  const multiImage = images.length > 1;

  /*
   * ─── REDES SOCIALES ───────────────────────────────────────────
   * El componente SocialLinks lee piece.instagram / piece.facebook / piece.tiktok.
   *
   * Mientras configuras el backend, puedes forzar valores de prueba
   * descomentando las líneas de abajo. Una vez que tu API devuelva
   * esos campos, vuelve a comentarlas.
   *
   * piece.instagram = "@dymyonker";
   * piece.facebook  = "dymyonkersps";
   * piece.tiktok    = "@dymyonker";
   * ─────────────────────────────────────────────────────────────
   */

  function goNext() {
    if (!multiImage) return;
    setImgIndex((i) => (i + 1) % images.length);
  }
  function goPrev() {
    if (!multiImage) return;
    setImgIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }
  function handleImgError() {
    let visible = -1;
    const orig = allImages.findIndex((_, origIdx) => {
      if (!failedSet.has(origIdx)) visible++;
      return visible === imgIndex && !failedSet.has(origIdx);
    });
    if (orig >= 0) setFailedSet((prev) => new Set([...prev, orig]));
  }
  function openWhatsApp() { safeOpen(whatsappUrl); }
  function callPhone()    { if (cleanPhone) window.location.href = `tel:${cleanPhone}`; }
  function openMaps()     {
    if (!coords) return;
    safeOpen(`https://www.google.com/maps?q=${coords.lat},${coords.lng}`);
  }

  /* ── Pieza enriquecida con datos de prueba de redes sociales ──
   *
   * INSTRUCCIONES:
   *   1. Para VER los iconos ahora → usa pieceWithSocials abajo (ya tiene datos de prueba)
   *   2. Cuando tu backend envíe los campos → cambia pieceWithSocials por piece en <SocialLinks>
   *
   */
  const pieceWithSocials = {
    ...piece,
    // ▼ DATOS DE PRUEBA — reemplaza con los valores reales de tu yonker
    instagram: piece.instagram || "@dymyonker",
    facebook:  piece.facebook  || "dymyonkersps",
    tiktok:    piece.tiktok    || "@dymyonker",
    // ▲ Cuando el backend ya envíe los campos, borra estas 3 líneas
  };

  return (
    <div style={st.overlay} onClick={onClose}>
      <div
        style={st.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${title}`}
      >

        {/* ══════ HERO ══════ */}
        <div style={st.imageWrap}>
          {hasImages ? (
            <img
              key={images[imgIndex]}
              src={images[imgIndex]}
              alt={title || "Pieza"}
              style={st.image}
              onError={handleImgError}
            />
          ) : (
            <div style={st.noImg}>Sin imagen</div>
          )}

          <div style={st.heroScrim} />

          {condition ? (
            <span style={{ ...st.badge, ...(conditionIsGood ? st.badgeGood : st.badgeUsed) }}>
              {condition}
            </span>
          ) : null}

          <button style={st.btnClose} onClick={onClose} aria-label="Cerrar" type="button">
            <X size={16} />
          </button>

          {onToggleFavorite && (
            <button
              style={{
                ...st.btnFav,
                background: isFavorite ? "#facc15" : "rgba(0,0,0,0.45)",
              }}
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              aria-label={isFavorite ? "Quitar de favoritos" : "Me encanta"}
              type="button"
            >
              <Heart
                size={18}
                fill={isFavorite ? "#1e4b8f" : "none"}
                color={isFavorite ? "#1e4b8f" : "#fff"}
                strokeWidth={2}
              />
            </button>
          )}

          {multiImage && (
            <>
              <button style={st.btnPrev} onClick={goPrev} aria-label="Anterior" type="button">
                <ChevronLeft size={20} />
              </button>
              <button style={st.btnNext} onClick={goNext} aria-label="Siguiente" type="button">
                <ChevronRight size={20} />
              </button>
              <div style={st.dots}>
                {images.map((_, i) => (
                  <span key={i} style={{ ...st.dot, ...(i === imgIndex ? st.dotOn : {}) }} />
                ))}
              </div>
            </>
          )}

          <div style={st.heroInfo}>
            <div style={st.heroEyebrow}>{brand}{years ? ` · ${years}` : ""}</div>
            <div style={st.heroTitle}>{title}</div>
          </div>
        </div>

        {/* ══════ BODY ══════ */}
        <div style={st.body}>

          <div style={st.pillRow}>
            <div style={st.pill}>
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              <span style={st.pillText}>{ratingText}</span>
              {reviewCount != null && <span style={st.pillMuted}>({reviewCount})</span>}
            </div>
            <div style={st.pill}>
              <MapPin size={13} color="#6b7280" />
              <span style={st.pillText}>{kmText} km</span>
            </div>
            {priceText && <div style={st.pillPrice}>{priceText}</div>}
          </div>

          {/* ── FILA YONKER ── */}
          <div style={st.yonkerRow}>
            <div style={st.yAvatar}>{yonkerInitials}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={st.yName}>{yonker || "Yonker"}</div>
              <div style={st.yLoc}>{yLocation}</div>
            </div>

            {/* Iconos de redes sociales — usa pieceWithSocials para verlos ahora */}
            <SocialLinks piece={pieceWithSocials} />

            <div style={{ ...st.yBadge, marginLeft: 6 }}>verificado</div>
          </div>

          <div style={st.divider} />

          <div style={st.specLabel}>Detalles de la pieza</div>
          <div style={st.specGrid}>
            {[
              ["Pieza",     title    || "-"],
              ["Marca",     brand    || "-"],
              ["Año",       years    || "-"],
              condition      ? ["Condición",  condition, conditionIsGood] : null,
              contacts != null ? ["Contactos", `${contacts} personas`]    : null,
            ]
              .filter(Boolean)
              .map(([key, val, green], i, arr) => (
                <div
                  key={key}
                  style={{ ...st.specRow, ...(i === arr.length - 1 ? st.specRowLast : {}) }}
                >
                  <span style={st.specKey}>{key}</span>
                  <span style={{ ...st.specVal, ...(green ? st.specGreen : {}) }}>{val}</span>
                </div>
              ))}
          </div>

          {coords ? (
            <div style={st.mapWrap}>
              <NearbyMap
                pieces={[{ ...piece, lat: coords.lat, lng: coords.lng }]}
                center={coords}
                selectedId={piece.id}
                onSelectId={() => {}}
              />
            </div>
          ) : (
            <div style={st.coordsHint}>
              Esta pieza no tiene coordenadas. Agrega Lat/Lng en el Admin para ver el mapa.
            </div>
          )}
        </div>

        {/* ══════ FOOTER STICKY ══════ */}
        <div style={st.footer}>
          <button
            style={{ ...st.btnRoute, ...(!coords ? st.btnDisabled : {}) }}
            onClick={openMaps}
            disabled={!coords}
            type="button"
          >
            <Navigation size={16} />
            Cómo llegar
          </button>

          <button
            style={{ ...st.btnWa, ...(!whatsappUrl ? st.btnDisabled : {}) }}
            onClick={openWhatsApp}
            disabled={!whatsappUrl}
            type="button"
          >
            <WaIcon size={18} />
            Contactar por WhatsApp
          </button>

          {cleanPhone && (
            <button style={st.btnCall} onClick={callPhone} type="button" aria-label="Llamar">
              <Phone size={18} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────── */
const st = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 9999, padding: 0,
  },
  modal: {
    width: "100%", maxWidth: 480, height: "100dvh",
    background: "#fff", display: "flex", flexDirection: "column",
    fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
    overflow: "hidden",
  },
  imageWrap: {
    position: "relative", width: "100%", aspectRatio: "4 / 3",
    background: "#1a1a2e", overflow: "hidden", flexShrink: 0,
  },
  image: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  heroScrim: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to bottom,rgba(0,0,0,.20) 0%,transparent 35%,rgba(0,0,0,.60) 100%)",
    pointerEvents: "none",
  },
  noImg: {
    height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
    color: "#4b5563", fontSize: 13, background: "#f3f4f6",
  },
  badge: {
    position: "absolute", top: 14, left: 14,
    fontSize: 10, fontWeight: 500, letterSpacing: "0.05em",
    padding: "3px 10px", borderRadius: 20,
    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
  },
  badgeUsed: { background: "rgba(255,255,255,.88)", color: "#374151" },
  badgeGood: { background: "rgba(34,197,94,.88)",   color: "#fff"    },
  btnClose: {
    position: "absolute", top: 14, right: 14,
    width: 32, height: 32, borderRadius: "50%",
    background: "rgba(255,255,255,.92)", border: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.18)", color: "#111",
  },
  btnFav: {
    position: "absolute", top: 14, right: 54,
    width: 36, height: 36, borderRadius: "50%",
    border: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.25)",
    transition: "background 0.2s, transform 0.15s",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
  },
  btnPrev: {
    position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
    width: 34, height: 34, borderRadius: "50%",
    background: "rgba(0,0,0,.42)", border: "none",
    color: "#fff", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  btnNext: {
    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
    width: 34, height: 34, borderRadius: "50%",
    background: "rgba(0,0,0,.42)", border: "none",
    color: "#fff", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  dots: {
    position: "absolute", bottom: 70, width: "100%",
    display: "flex", justifyContent: "center", gap: 5,
  },
  dot:   { height: 4, width: 8,  borderRadius: 2, background: "#fff", opacity: 0.4, transition: "all .2s" },
  dotOn: { height: 4, width: 20, borderRadius: 2, background: "#fff", opacity: 1 },
  heroInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 16px" },
  heroEyebrow: { fontSize: 11, color: "rgba(255,255,255,.65)", fontWeight: 400, marginBottom: 3, letterSpacing: "0.02em" },
  heroTitle:   { fontSize: 22, fontWeight: 600, color: "#fff", lineHeight: 1.15 },
  body: { flex: 1, padding: "16px 16px 0", overflowY: "auto", WebkitOverflowScrolling: "touch" },
  pillRow: { display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap" },
  pill: {
    display: "flex", alignItems: "center", gap: 5,
    padding: "5px 11px", borderRadius: 20,
    background: "#f9fafb", border: "1px solid #f0f0f0",
    fontSize: 12, color: "#374151", fontWeight: 500,
  },
  pillText:  { fontSize: 12, fontWeight: 500, color: "#374151" },
  pillMuted: { fontSize: 11, color: "#9ca3af" },
  pillPrice: {
    fontFamily: "'DM Mono', monospace", fontSize: 12,
    background: "#f9fafb", border: "1px solid #e5e7eb",
    padding: "5px 11px", borderRadius: 20, color: "#111827", fontWeight: 500,
  },
  yonkerRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 14px", borderRadius: 14,
    background: "#f9fafb", border: "1px solid #f0f0f0", marginBottom: 14,
  },
  yAvatar: {
    width: 38, height: 38, borderRadius: 10,
    background: "#d1fae5", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 13, fontWeight: 600,
    color: "#065f46", flexShrink: 0,
  },
  yName: { fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  yLoc:  { fontSize: 11.5, color: "#6b7280", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  yBadge: {
    fontSize: 10, fontFamily: "'DM Mono', monospace",
    background: "#ecfdf5", color: "#065f46",
    border: "1px solid #d1fae5", padding: "3px 8px",
    borderRadius: 20, flexShrink: 0,
  },
  divider: { height: 1, background: "#f3f4f6", marginBottom: 14 },
  specLabel: { fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 8 },
  specGrid:  { border: "1px solid #f0f0f0", borderRadius: 14, overflow: "hidden", marginBottom: 14 },
  specRow:   { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "10px 13px", borderBottom: "1px solid #f9fafb" },
  specRowLast: { borderBottom: "none" },
  specKey:   { fontSize: 12, color: "#9ca3af", fontWeight: 400, flexShrink: 0 },
  specVal:   { fontSize: 13, fontWeight: 500, color: "#111827", textAlign: "right", wordBreak: "break-word" },
  specGreen: { color: "#16a34a", fontWeight: 600 },
  mapWrap:   { width: "100%", height: 180, borderRadius: 14, overflow: "hidden", border: "1px solid #f0f0f0", marginBottom: 14 },
  coordsHint: { fontSize: 12, color: "#6b7280", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 13px", borderRadius: 12, marginBottom: 14 },
  footer: {
    position: "sticky", bottom: 0,
    padding: "12px 14px calc(env(safe-area-inset-bottom,0px) + 12px)",
    background: "#fff", borderTop: "1px solid #f0f0f0",
    display: "flex", gap: 10, alignItems: "stretch",
    boxShadow: "0 -8px 24px rgba(0,0,0,.07)", zIndex: 10, flexShrink: 0,
  },
  btnRoute: {
    flex: "0 0 auto", height: 50, paddingLeft: 16, paddingRight: 16,
    borderRadius: 14, border: "none", background: "#1d4ed8", color: "#fff",
    fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center",
    justifyContent: "center", gap: 7, cursor: "pointer", whiteSpace: "nowrap",
    fontFamily: "'DM Sans', system-ui, sans-serif", transition: "opacity .15s",
  },
  btnWa: {
    flex: 1, height: 50, borderRadius: 14, border: "none",
    background: "#16a34a", color: "#fff", fontSize: 14, fontWeight: 600,
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 8, cursor: "pointer",
    fontFamily: "'DM Sans', system-ui, sans-serif", transition: "background .15s",
  },
  btnDisabled: { background: "#d1d5db", cursor: "not-allowed", opacity: 0.6, pointerEvents: "none" },
  btnCall: {
    flex: "0 0 50px", height: 50, borderRadius: 14,
    border: "1px solid #e5e7eb", background: "#f9fafb",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: "#6b7280",
  },
};
