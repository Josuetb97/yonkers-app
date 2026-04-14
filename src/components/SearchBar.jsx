import { useEffect, useRef, useState } from "react";
import { Search, Camera } from "lucide-react";

/* Categorías de búsqueda rápida */
const CATEGORIES = [
  { id: "all",        label: "Todos"      },
  { id: "motores",    label: "Motores"    },
  { id: "carroceria", label: "Carrocería" },
  { id: "suspension", label: "Suspensión" },
  { id: "frenos",     label: "Frenos"     },
  { id: "electrico",  label: "Eléctrico"  },
];

/**
 * SearchBar
 *
 * Props:
 *   onSearch(query: string, category: string) — llamado con debounce 300ms
 *   onPhoto()                                 — abre cámara / input de imagen
 */
export default function SearchBar({ onSearch, onPhoto }) {
  const [query,       setQuery]    = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [focused,     setFocused]  = useState(false);

  const inputRef = useRef(null);

  /* ── Debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => {
      onSearch?.(query.trim(), activeCategory);
    }, 300);
    return () => clearTimeout(t);
  }, [query, activeCategory, onSearch]);

  /* ── Limpiar query ── */
  function handleClear() {
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <div style={st.wrapper}>

      {/* ── Fila principal: input + cámara ── */}
      <div style={st.row}>

        {/* Input de búsqueda */}
        <div style={{ ...st.searchBar, ...(focused ? st.searchBarFocused : {}) }}>
          <Search
            size={18}
            color="rgba(26,45,90,0.5)"
            strokeWidth={2.5}
            style={{ flexShrink: 0 }}
          />

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Buscar pieza…"
            style={st.input}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

          {/* Botón limpiar — solo visible si hay texto */}
          {query.length > 0 && (
            <button style={st.clearBtn} onClick={handleClear} type="button" aria-label="Limpiar">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(26,45,90,0.5)" strokeWidth="2.2">
                <line x1="1" y1="1" x2="13" y2="13" />
                <line x1="13" y1="1" x2="1" y2="13" />
              </svg>
            </button>
          )}

          <span style={st.country}>HN</span>
        </div>

        {/* Botón cámara */}
        <button style={st.cameraBtn} onClick={onPhoto} type="button" aria-label="Buscar por foto">
          <Camera size={20} color="#fff" strokeWidth={1.8} />
        </button>
      </div>

      {/* ── Chips de categoría ── */}
      <div style={st.chipsRow}>
        {CATEGORIES.map(({ id, label }) => {
          const isActive = activeCategory === id;
          return (
            <button
              key={id}
              type="button"
              style={{ ...st.chip, ...(isActive ? st.chipActive : st.chipInactive) }}
              onClick={() => setActiveCategory(id)}
            >
              {label}
            </button>
          );
        })}
      </div>

    </div>
  );
}

/* ─────────────────────────────────────
   STYLES
───────────────────────────────────── */
const st = {
  wrapper: {
    padding: "8px 16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  /* Barra de búsqueda */
  searchBar: {
    flex: 1,
    background: "#FFD200",
    borderRadius: 50,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 14px",
    height: 50,
    boxShadow: "0 4px 18px rgba(255,210,0,0.32)",
    transition: "box-shadow 0.2s",
    border: "2px solid transparent",
  },

  searchBarFocused: {
    boxShadow: "0 4px 28px rgba(255,210,0,0.6)",
    border: "2px solid rgba(255,255,255,0.5)",
  },

  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: 15,
    fontWeight: 700,
    color: "#1a2d5a",
    fontFamily: "'Barlow', system-ui, sans-serif",
    letterSpacing: "0.01em",
    minWidth: 0,
  },

  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0 2px",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },

  country: {
    fontSize: 11,
    fontWeight: 800,
    color: "rgba(26,45,90,0.45)",
    letterSpacing: "0.08em",
    flexShrink: 0,
  },

  /* Botón cámara */
  cameraBtn: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.13)",
    border: "1.5px solid rgba(255,255,255,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.15s, border-color 0.15s",
  },

  /* Chips de categoría */
  chipsRow: {
    display: "flex",
    gap: 7,
    overflowX: "auto",
    scrollbarWidth: "none",        // Firefox
    msOverflowStyle: "none",       // IE/Edge
    paddingBottom: 2,
  },

  chip: {
    flexShrink: 0,
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'Barlow', system-ui, sans-serif",
    letterSpacing: "0.02em",
    cursor: "pointer",
    border: "1.5px solid transparent",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  },

  chipActive: {
    background: "#FFD200",
    color: "#1a2d5a",
    borderColor: "#FFD200",
  },

  chipInactive: {
    background: "rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.78)",
    borderColor: "rgba(255,255,255,0.18)",
  },
};
