import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Menu, MessageSquare, Bell } from "lucide-react";

import SearchBar from "../components/SearchBar";
import PieceCard from "../components/PieceCard";
import PieceDetailModal from "../components/modals/PieceDetailModal";
import NearbyMap from "../components/map/NearbyMap";

const API = "http://localhost:3001/api";

export default function Home() {
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchingRef = useRef(false);

  const center = useMemo(
    () => ({ lat: 15.6144, lng: -87.953 }),
    []
  );

  const [search, setSearch] = useState({
    query: "",
    filters: {
      maxKm: 71,
      minRating: 0,
      status: "all",
    },
  });

  const handleSearch = useCallback((payload) => {
    setSearch((prev) => ({
      query: payload?.query?.toLowerCase() || "",
      filters: {
        ...prev.filters,
        ...payload?.filters,
      },
    }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchPieces() {
      if (fetchingRef.current) return;

      fetchingRef.current = true;
      setLoading(true);

      try {
        const params = new URLSearchParams({
          query: search.query,
          maxKm: search.filters.maxKm,
          rating: search.filters.minRating,
          status: search.filters.status,
        });

        const res = await fetch(`${API}/pieces?${params}`);
        if (!res.ok) throw new Error();

        const data = await res.json();
        if (!cancelled) setPieces(data);
      } catch {
        console.log("Backend no disponible");
      } finally {
        if (!cancelled) {
          setLoading(false);
          fetchingRef.current = false;
        }
      }
    }

    fetchPieces();
    return () => (cancelled = true);
  }, [search]);

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.topArea}>
        <header style={styles.header}>
          <Menu size={22} />
          <h1 style={styles.title}>Yonkers cerca de ti</h1>
          <div style={styles.headerIcons}>
            <MessageSquare size={20} />
            <Bell size={20} />
          </div>
        </header>

        <div style={styles.searchWrapper}>
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      {/* MAP */}
      <div style={styles.mapContainer}>
        <NearbyMap
          pieces={pieces}
          center={center}
          selectedId={selectedPiece?.id}
          onSelectId={(id) => {
            const p = pieces.find((x) => x.id === id);
            setSelectedPiece(p);
          }}
        />
      </div>

      {/* LIST */}
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Yonkers cercanos</h2>
      </div>

      <div style={styles.list}>
        {loading ? (
          <div style={styles.empty}>⏳ Buscando...</div>
        ) : (
          pieces.map((piece) => (
            <PieceCard
              key={piece.id}
              piece={piece}
              onOpen={(p) => setSelectedPiece(p)}
            />
          ))
        )}
      </div>

      <PieceDetailModal
        piece={selectedPiece}
        onClose={() => setSelectedPiece(null)}
      />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
  },

  topArea: {
    background: "var(--primary-gradient)",
    paddingBottom: 20,
  },

  header: {
    height: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    color: "#fff",
  },

  title: {
    fontSize: 18,
    fontWeight: 700,
  },

  headerIcons: {
    display: "flex",
    gap: 14,
  },

  searchWrapper: {
    padding: "0 16px",
  },

  mapContainer: {
    height: 200,
    width: "100%",
    overflow: "hidden",
  },

  sectionHeader: {
    padding: "16px",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 700,
    margin: 0,
    color: "#e5e7eb",
  },

  list: {
    padding: "0 16px 120px",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },

  empty: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: 40,
    color: "#9ca3af",
  },
};
