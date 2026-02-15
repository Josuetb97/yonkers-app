import { useEffect, useMemo, useState } from "react";

export default function PhotoSearchModal({ open, onClose, onSubmit }) {
  const [file, setFile] = useState(null);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!open) return null;

  function handlePick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
  }

  function handleSubmit() {
    if (!file) return alert("Selecciona una foto primero");
    onSubmit?.(file);
    onClose?.();
  }

  return (
    <div style={styles.overlay} onMouseDown={onClose}>
      <div
        style={styles.modal}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>Buscar por foto</div>
          <button onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        {/* BODY */}
        <div style={styles.body}>
          <label style={styles.pick}>
            <div style={styles.pickIcon}>📷</div>
            <div style={styles.pickText}>Subir foto</div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePick}
              style={{ display: "none" }}
            />
          </label>

          {previewUrl ? (
            <div style={styles.previewWrap}>
              <img
                src={previewUrl}
                alt="preview"
                style={styles.previewImg}
              />
              <p style={styles.hint}>
                Tip: usa una foto clara de la pieza (frontal, etiqueta o forma).
              </p>
            </div>
          ) : (
            <div style={styles.empty}>
              Sube una foto para reconocer la pieza.
            </div>
          )}

          <button onClick={handleSubmit} style={styles.cta}>
            🔍 Buscar con esta foto
          </button>

          <p style={styles.note}>
            Próximamente: detección automática de pieza con IA.
          </p>
        </div>
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
    padding: 16,
    zIndex: 10000,
  },

  modal: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 24px 70px rgba(0,0,0,.35)",
  },

  /* HEADER */
  header: {
    height: 52,
    background: "linear-gradient(180deg, #0b4ea2, #083c7a)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  headerTitle: {
    fontWeight: 800,
    fontSize: 15,
  },

  closeBtn: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "rgba(255,255,255,.15)",
    color: "#fff",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 800,
  },

  /* BODY */
  body: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  pick: {
    border: "1.5px dashed #94a3b8",
    borderRadius: 16,
    padding: 16,
    textAlign: "center",
    fontWeight: 800,
    cursor: "pointer",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "center",
  },

  pickIcon: {
    fontSize: 28,
  },

  pickText: {
    fontSize: 14,
  },

  previewWrap: {
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
  },

  previewImg: {
    width: "100%",
    height: 240,
    objectFit: "cover",
  },

  hint: {
    margin: 10,
    fontSize: 12,
    color: "#475569",
  },

  empty: {
    padding: 18,
    borderRadius: 16,
    background: "#f1f5f9",
    color: "#334155",
    fontWeight: 600,
    textAlign: "center",
  },

  cta: {
    marginTop: 6,
    background: "#0B3C7C",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "14px 0",
    fontWeight: 900,
    fontSize: 15,
    cursor: "pointer",
  },

  note: {
    margin: 0,
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
};
