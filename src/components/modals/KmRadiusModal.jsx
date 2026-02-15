import { X, MapPin } from "lucide-react";
import { useState } from "react";

export default function KmRadiusModal({
  open,
  onClose,
  value = 10,
  onChange,
  city = "Choloma",
}) {
  const [km, setKm] = useState(value);

  if (!open) return null;

  function apply() {
    onChange?.(km);
    onClose();
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* HEADER */}
        <div style={styles.header}>
          <h3 style={styles.title}>Cambiar ubicación</h3>
          <button onClick={onClose} style={styles.close}>
            <X size={20} />
          </button>
        </div>

        {/* CITY */}
        <div style={styles.block}>
          <label style={styles.label}>Ubicación</label>
          <div style={styles.input}>
            <MapPin size={16} />
            {city}
          </div>
        </div>

        {/* KM */}
        <div style={styles.block}>
          <label style={styles.label}>Radio</label>
          <select
            value={km}
            onChange={(e) => setKm(Number(e.target.value))}
            style={styles.select}
          >
            {[5, 10, 20, 30, 50, 71, 100].map((k) => (
              <option key={k} value={k}>
                {k} kilómetros
              </option>
            ))}
          </select>
        </div>

        {/* MAP PLACEHOLDER */}
        <div style={styles.map}>
          <span>🗺️ Mapa (círculo de {km} km)</span>
        </div>

        {/* ACTION */}
        <button style={styles.apply} onClick={apply}>
          Aplicar
        </button>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.65)",
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  modal: {
    width: "100%",
    maxWidth: 420,
    background: "#242526",
    borderRadius: 16,
    color: "#e4e6eb",
    paddingBottom: 16,
  },

  header: {
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #3a3b3c",
  },

  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },

  close: {
    background: "none",
    border: "none",
    color: "#e4e6eb",
    cursor: "pointer",
  },

  block: {
    padding: "12px 16px",
  },

  label: {
    fontSize: 13,
    color: "#b0b3b8",
    marginBottom: 6,
    display: "block",
  },

  input: {
    background: "#3a3b3c",
    borderRadius: 10,
    padding: "10px 12px",
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontWeight: 600,
  },

  select: {
    width: "100%",
    background: "#3a3b3c",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
  },

  map: {
    margin: 16,
    height: 200,
    background: "#18191a",
    borderRadius: 14,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#b0b3b8",
    fontSize: 13,
  },

  apply: {
    margin: "0 16px",
    width: "calc(100% - 32px)",
    padding: 12,
    borderRadius: 999,
    border: "none",
    background: "#2374e1",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
};
