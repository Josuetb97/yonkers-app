/**
 * PieceCard — tarjeta de pieza. Diseño moderno, limpio y mobile-first.
 */
import React, { useMemo } from "react";
import { Star, Heart, MapPin } from "lucide-react";
import { useAnalytics } from "../hooks/useAnalytics";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "";

/* ── WhatsApp icon ── */
function WaIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

/* ── Condition badge config ── */
function getConditionStyle(condition) {
  if (!condition) return null;
  const l = condition.toLowerCase();
  if (l.includes("nuevo"))      return { bg: "#dcfce7", color: "#15803d" };
  if (l.includes("buen"))       return { bg: "#dbeafe", color: "#1d4ed8" };
  if (l.includes("como nuevo")) return { bg: "#f0fdf4", color: "#16a34a" };
  return { bg: "#f3f4f6", color: "#6b7280" };
}

/* ════════════════════════════
   PIECE CARD
════════════════════════════ */
function PieceCard({
  piece,
  selected,
  onSelect,
  onOpen,
  isFavorite,
  onToggleFavorite,
  onSellerClick,
}) {
  const { track } = useAnalytics();
  const {
    title, brand, years, yonker,
    distance, rating, images, whatsapp,
    condition, price, reviewCount, owner_id,
  } = piece;

  const imgSrc = useMemo(() =>
    images?.length
      ? (images[0].startsWith("http") ? images[0] : `${BACKEND}${images[0]}`)
      : null,
  [images]);

  const kmText = useMemo(() =>
    `${Number(distance || 0).toFixed(1)} km`,
  [distance]);

  const ratingNum = useMemo(() =>
    Number(rating || 0).toFixed(1),
  [rating]);

  const priceText = useMemo(() => {
    if (!price) return null;
    const n = Number(price);
    return isNaN(n) ? String(price) : `L ${n.toLocaleString("es-HN")}`;
  }, [price]);

  const condStyle = useMemo(() => getConditionStyle(condition), [condition]);

  /* ── Handlers ── */
  function handleCardClick() {
    track("piece_view", "home", { piece_id: piece.id, piece_title: title });
    onSelect?.(piece);
    onOpen?.(piece);
  }

  function openWhatsApp(e) {
    e.stopPropagation();
    if (!whatsapp) return;
    track("whatsapp_click", "home", { piece_id: piece.id, piece_title: title });
    const phone = whatsapp.replace(/\D/g, "");
    const msg   = `Hola, vi en *Yonkers App*:\n\n🔧 *${title}*\n🚗 ${brand} ${years}\n\n¿Sigue disponible?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function handleFav(e) {
    e.stopPropagation();
    onToggleFavorite?.();
  }

  function handleSeller(e) {
    if (onSellerClick && owner_id) {
      e.stopPropagation();
      onSellerClick(owner_id);
    }
  }

  return (
    <div
      style={{
        ...s.card,
        ...(selected ? s.cardSelected : {}),
      }}
      onClick={handleCardClick}
    >
      {/* ══ IMAGEN ══ */}
      <div style={s.imgWrap}>
        {imgSrc ? (
          <img src={imgSrc} alt={title} style={s.img} loading="lazy" />
        ) : (
          <div style={s.noImg}>
            <span style={{ fontSize: 28 }}>🔧</span>
            <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Sin imagen</span>
          </div>
        )}

        {/* Gradient overlay bottom */}
        <div style={s.imgGradient} />

        {/* Condición badge */}
        {condition && condStyle && (
          <span style={{
            ...s.badge,
            background: condStyle.bg,
            color: condStyle.color,
          }}>
            {condition}
          </span>
        )}

        {/* Distancia badge */}
        <span style={s.distBadge}>
          <MapPin size={10} strokeWidth={2.5} />
          {kmText}
        </span>

        {/* Favorito */}
        {onToggleFavorite && (
          <button
            style={{
              ...s.favBtn,
              background: isFavorite
                ? "#facc15"
                : "rgba(15,23,42,0.55)",
              transform: isFavorite ? "scale(1.1)" : "scale(1)",
            }}
            onClick={handleFav}
            aria-label={isFavorite ? "Quitar favorito" : "Agregar favorito"}
            type="button"
          >
            <Heart
              size={13}
              fill={isFavorite ? "#1e3a8a" : "none"}
              color={isFavorite ? "#1e3a8a" : "#fff"}
              strokeWidth={2.5}
            />
          </button>
        )}
      </div>

      {/* ══ BODY ══ */}
      <div style={s.body}>

        {/* Yonker */}
        <button
          type="button"
          style={{
            ...s.yonker,
            ...(onSellerClick && owner_id ? s.yonkerLink : {}),
          }}
          onClick={handleSeller}
        >
          {yonker || "Yonker"}
        </button>

        {/* Título */}
        <p style={s.title}>{title}</p>

        {/* Marca · Año */}
        <p style={s.sub}>{[brand, years].filter(Boolean).join(" · ")}</p>

        {/* ── Footer: rating + precio ── */}
        <div style={s.footer}>
          <div style={s.rating}>
            <Star size={12} fill="#f59e0b" color="#f59e0b" strokeWidth={0} />
            <span style={s.ratingNum}>{ratingNum}</span>
            {reviewCount != null && reviewCount > 0 && (
              <span style={s.reviews}>({reviewCount})</span>
            )}
          </div>

          {priceText && (
            <span style={s.price}>{priceText}</span>
          )}
        </div>

        {/* ── WhatsApp ── */}
        {whatsapp && (
          <button style={s.waBtn} onClick={openWhatsApp} type="button">
            <WaIcon />
            Contactar
          </button>
        )}
      </div>
    </div>
  );
}

export default React.memo(
  PieceCard,
  (prev, next) =>
    prev.piece.id   === next.piece.id &&
    prev.selected   === next.selected &&
    prev.isFavorite === next.isFavorite
);

/* ══════════════════════════════════════
   STYLES
══════════════════════════════════════ */
const s = {
  card: {
    background: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    cursor: "pointer",
    position: "relative",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
    fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
    WebkitTapHighlightColor: "transparent",
    /* Efecto hover en desktop */
    willChange: "transform",
  },

  cardSelected: {
    transform: "scale(0.97)",
    boxShadow: "0 0 0 2px #1e4b8f, 0 4px 20px rgba(30,75,143,0.2)",
  },

  /* ── Imagen ── */
  imgWrap: {
    position: "relative",
    height: 155,
    background: "#f1f5f9",
    overflow: "hidden",
  },

  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transition: "transform 0.4s ease",
  },

  imgGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    background: "linear-gradient(to top, rgba(0,0,0,0.35), transparent)",
    pointerEvents: "none",
  },

  noImg: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
  },

  badge: {
    position: "absolute",
    top: 9,
    left: 9,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.04em",
    padding: "3px 8px",
    borderRadius: 20,
    backdropFilter: "blur(4px)",
  },

  distBadge: {
    position: "absolute",
    bottom: 9,
    left: 9,
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 600,
    padding: "3px 7px",
    borderRadius: 20,
    display: "flex",
    alignItems: "center",
    gap: 3,
    backdropFilter: "blur(4px)",
  },

  favBtn: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "transform 0.2s cubic-bezier(.34,1.56,.64,1), background 0.2s",
    backdropFilter: "blur(6px)",
  },

  /* ── Body ── */
  body: {
    padding: "11px 12px 13px",
  },

  yonker: {
    display: "block",
    fontSize: 10,
    fontWeight: 600,
    color: "#94a3b8",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    marginBottom: 4,
    background: "none",
    border: "none",
    padding: 0,
    cursor: "default",
    textAlign: "left",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "100%",
    fontFamily: "inherit",
  },

  yonkerLink: {
    color: "#3b82f6",
    cursor: "pointer",
    textDecoration: "underline",
    textDecorationColor: "rgba(59,130,246,0.35)",
    textUnderlineOffset: 2,
  },

  title: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.3,
    margin: "0 0 3px",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },

  sub: {
    fontSize: 11,
    color: "#94a3b8",
    margin: "0 0 10px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  rating: {
    display: "flex",
    alignItems: "center",
    gap: 3,
  },

  ratingNum: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
  },

  reviews: {
    fontSize: 10,
    color: "#94a3b8",
  },

  price: {
    fontSize: 13,
    fontWeight: 800,
    color: "#1e3a8a",
    background: "#eff6ff",
    padding: "3px 8px",
    borderRadius: 8,
    letterSpacing: "-0.01em",
  },

  waBtn: {
    width: "100%",
    height: 36,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
    letterSpacing: "0.02em",
    boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
    transition: "opacity 0.