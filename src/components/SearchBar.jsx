import { useEffect, useState } from "react";
import { Search, Camera } from "lucide-react";

export default function SearchBar({ onSearch, onPhoto }) {
  const [query, setQuery] = useState("");

  /* =========================
     DEBOUNCE SEARCH
  ========================= */
  useEffect(() => {
    const t = setTimeout(() => {
      onSearch?.({ query, filters: {} });
    }, 300);

    return () => clearTimeout(t);
  }, [query, onSearch]);

  return (
    <div style={styles.wrapper}>
      {/* BUSCAR */}
      <div style={styles.searchInput}>
        <Search size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar pieza"
          style={styles.input}
        />
        <span style={styles.country}>HN</span>
      </div>

      {/* SUBIR FOTO */}
      <button style={styles.photoBtn} onClick={onPhoto}>
        <Camera size={18} />
        <span>Subir foto</span>
      </button>
    </div>
  );
}

/* =========================
   STYLES
========================= */
const styles = {
  wrapper: {
    padding: "10px 14px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  searchInput: {
    background: "#FFD200",
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 16px",
    boxShadow: "0 6px 20px rgba(0,0,0,.15)",
  },

  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: 14,
    fontWeight: 700,
  },

  country: {
    fontSize: 12,
    fontWeight: 800,
    opacity: 0.7,
  },

  photoBtn: {
    background: "rgba(255,255,255,.15)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,.35)",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 700,
    display: "flex",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
};
