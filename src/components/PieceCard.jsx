import React, { useMemo } from "react";
import {
  MapPin,
  Star,
  Phone,
  MessageCircle,
} from "lucide-react";

function PieceCard({ piece, selected, onSelect, onOpen }) {
  const {
    title,
    brand,
    years,
    yonker,
    distance,
    rating,
    contacts,
    whatsapp,
    phone,
    status,
    image,
  } = piece;

  const isHigh = status === "alta";

  const kmText = useMemo(
    () => Number(distance || 0).toFixed(1),
    [distance]
  );

  const ratingText = useMemo(
    () => Number(rating || 0).toFixed(1),
    [rating]
  );

  function openWhatsApp(e) {
    e.stopPropagation();
    if (!whatsapp) return;

    const msg = encodeURIComponent(
      `Hola 👋 estoy interesado en:\n\n${title}\n${brand} ${years}\n${yonker}`
    );

    window.open(`https://wa.me/${whatsapp}?text=${msg}`, "_blank");
  }

  function callPhone(e) {
    e.stopPropagation();
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  }

  function handleCardClick() {
    onSelect?.(piece);
    onOpen?.(piece);
  }

  return (
    <div
      style={{
        ...styles.card,
        ...(selected ? styles.selected : {}),
      }}
      onClick={handleCardClick}
    >
      {/* IMAGE */}
      <div style={styles.imageWrap}>
        {image ? (
          <img src={image} alt={title} style={styles.image} />
        ) : (
          <div style={styles.noImg}>Sin imagen</div>
        )}
      </div>

      {/* BODY */}
      <div style={styles.body}>
        <div style={styles.title}>{title}</div>

        <div style={styles.subtitle}>
          {brand} · {years}
        </div>

        {/* BADGE */}
        <div
          style={{
            ...styles.badge,
            background: isHigh
              ? "linear-gradient(135deg,#15803d,#16a34a)"
              : "#475569",
          }}
        >
          {isHigh
            ? "🔥 Alta probabilidad"
            : "Disponible"}
        </div>

        {/* LOCATION */}
        <div style={styles.row}>
          <MapPin size={15} color="#6b7280" />
          <span style={styles.bold}>{yonker}</span>
          <span style={styles.muted}>{kmText} km</span>
        </div>

        {/* RATING */}
        <div style={styles.row}>
          <Star size={15} fill="#facc15" color="#facc15" />
          <span style={styles.bold}>{ratingText}</span>
          <span style={styles.muted}>
            · {contacts} contactos
          </span>
        </div>

        {/* ACTIONS */}
        <div style={styles.actions}>
          <button style={styles.whatsapp} onClick={openWhatsApp}>
            <MessageCircle size={17} />
            WhatsApp
          </button>

          <button style={styles.call} onClick={callPhone}>
            <Phone size={17} />
            Llamar
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(
  PieceCard,
  (prev, next) =>
    prev.piece.id === next.piece.id &&
    prev.selected === next.selected
);

/* =========================
   STYLES PRO
========================= */

const styles = {
  card: {
    background: "#ffffff",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 6px 18px rgba(0,0,0,.08)",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    transition: "all .25s ease",
  },

  selected: {
    boxShadow:
      "0 0 0 2px #2563eb, 0 8px 25px rgba(0,0,0,.12)",
  },

  imageWrap: {
    height: 210,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform .3s ease",
  },

  noImg: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    color: "#64748b",
    fontWeight: 600,
  },

  body: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.2,
  },

  subtitle: {
    fontSize: 13,
    color: "#64748b",
  },

  badge: {
    alignSelf: "flex-start",
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
  },

  row: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
  },

  bold: {
    fontWeight: 600,
    color: "#0f172a",
  },

  muted: {
    color: "#64748b",
  },

  actions: {
    display: "flex",
    gap: 10,
    marginTop: 8,
  },

  whatsapp: {
    flex: 1,
    background:
      "linear-gradient(135deg,#16a34a,#15803d)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "11px 0",
    fontWeight: 600,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
    transition: "all .2s ease",
  },

  call: {
    flex: 1,
    background: "#f1f5f9",
    color: "#1e293b",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "11px 0",
    fontWeight: 600,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
    transition: "all .2s ease",
  },
};
