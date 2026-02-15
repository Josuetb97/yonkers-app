import React, { useEffect, useMemo } from "react";
import {
  MapPin,
  Star,
  Phone,
  MessageCircle,
  X,
} from "lucide-react";

function PieceDetailModal({ piece, onClose }) {
  /* 🔒 bloquear scroll */
  useEffect(() => {
    if (!piece) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [piece]);

  if (!piece) return null;

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
  const ratingText = Number(rating || 0).toFixed(1);
  const kmText = Number(distance || 0).toFixed(1);

  function openWhatsApp() {
    if (!whatsapp) return;

    const msg = encodeURIComponent(
      `Hola 👋 estoy interesado en:\n\n${title}\n${brand} ${years}\n${yonker}`
    );

    window.open(`https://wa.me/${whatsapp}?text=${msg}`, "_blank");
  }

  function callPhone() {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE */}
        <button style={styles.close} onClick={onClose}>
          <X size={18} />
        </button>

        {/* IMAGE */}
        <div style={styles.imageWrap}>
          {image ? (
            <img
              src={image}
              alt={title}
              style={styles.image}
            />
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

          <div style={styles.row}>
            <MapPin size={15} color="#6b7280" />
            <span style={styles.bold}>{yonker}</span>
            <span style={styles.muted}>{kmText} km</span>
          </div>

          <div style={styles.row}>
            <Star
              size={15}
              fill="#facc15"
              color="#facc15"
            />
            <span style={styles.bold}>{ratingText}</span>
            <span style={styles.muted}>
              · {contacts} contactos
            </span>
          </div>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <button
            style={styles.whatsapp}
            onClick={openWhatsApp}
          >
            <MessageCircle size={17} />
            WhatsApp
          </button>

          <button
            style={styles.call}
            onClick={callPhone}
          >
            <Phone size={17} />
            Llamar
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(
  PieceDetailModal,
  (a, b) => a.piece?.id === b.piece?.id
);

/* =========================
   STYLES
========================= */

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.6)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 9999,
  },

  modal: {
    width: "min(520px, 95vw)",
    maxHeight: "90vh",
    background: "#ffffff",
    borderRadius: 22,
    overflow: "hidden",
    boxShadow: "0 30px 80px rgba(0,0,0,.35)",
    animation: "zoomIn .2s ease",
    display: "flex",
    flexDirection: "column",
  },

  close: {
    position: "absolute",
    right: 18,
    top: 18,
    background: "#ffffff",
    border: "none",
    borderRadius: "50%",
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,.2)",
    zIndex: 2,
  },

  imageWrap: {
    height: 280,
    background: "#0b1220",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  noImg: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#cbd5e1",
    fontWeight: 600,
  },

  body: {
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
  },

  subtitle: {
    fontSize: 14,
    color: "#64748b",
  },

  badge: {
    alignSelf: "flex-start",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
  },

  row: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
  },

  bold: {
    fontWeight: 600,
    color: "#0f172a",
  },

  muted: {
    color: "#64748b",
  },

  footer: {
    display: "flex",
    gap: 12,
    padding: 18,
    borderTop: "1px solid #e5e7eb",
  },

  whatsapp: {
    flex: 1,
    background:
      "linear-gradient(135deg,#16a34a,#15803d)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "13px 0",
    fontWeight: 600,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
  },

  call: {
    flex: 1,
    background: "#f1f5f9",
    color: "#1e293b",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "13px 0",
    fontWeight: 600,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
  },
};
