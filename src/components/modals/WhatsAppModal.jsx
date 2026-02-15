export default function WhatsAppModal({ open, onClose, piece }) {
  if (!open || !piece) return null;

  const {
    title,
    brand,
    years,
    yonker,
    whatsapp,
    image,
  } = piece;

  const defaultMessage = `Hola 👋
Estoy interesado en la siguiente pieza:

🔧 ${title}
🚗 ${brand} ${years}
📍 ${yonker}

¿Está disponible?`;

  const [message, setMessage] = React.useState(defaultMessage);

  function sendWhatsApp() {
    const text = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsapp}?text=${text}`, "_blank");
    onClose();
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* HEADER */}
        <div style={styles.header}>
          <h3>Contactar por WhatsApp</h3>
          <button onClick={onClose} style={styles.close}>✕</button>
        </div>

        {/* PIEZA */}
        <div style={styles.piece}>
          <img src={image} alt={title} style={styles.image} />
          <div>
            <strong>{title}</strong>
            <div style={styles.meta}>{brand} · {years}</div>
            <div style={styles.meta}>📍 {yonker}</div>
          </div>
        </div>

        {/* MENSAJE */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={styles.textarea}
          rows={6}
        />

        {/* ACCIÓN */}
        <button style={styles.send} onClick={sendWhatsApp}>
          🟢 Enviar por WhatsApp
        </button>
      </div>
    </div>
  );
}

/* =========================
   STYLES
========================= */
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 16,
  },

  modal: {
    background: "#fff",
    borderRadius: 18,
    width: "100%",
    maxWidth: 420,
    padding: 16,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  close: {
    border: "none",
    background: "transparent",
    fontSize: 20,
    cursor: "pointer",
  },

  piece: {
    display: "flex",
    gap: 12,
    marginBottom: 12,
  },

  image: {
    width: 70,
    height: 70,
    borderRadius: 12,
    objectFit: "cover",
  },

  meta: {
    fontSize: 13,
    color: "#64748b",
  },

  textarea: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    padding: 10,
    fontSize: 14,
    marginBottom: 12,
  },

  send: {
    width: "100%",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "14px 0",
    borderRadius: 14,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
};
