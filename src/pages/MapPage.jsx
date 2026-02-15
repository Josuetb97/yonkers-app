import { useMemo, useState } from "react";
import { ArrowLeft, Locate } from "lucide-react";
import NearbyMap from "../components/map/NearbyMap";
import PieceCard from "../components/PieceCard";

/**
 * MapPage – Uber Style PRO
 */

export default function MapPage({
  pieces = [],
  center: externalCenter,
  radiusKm = 71,
  onBack,
  height = "100vh",
  hideBackButton = false,
}) {
  /* =========================
     CENTER (FALLBACK)
  ========================= */

  const fallbackCenter = useMemo(
    () => ({ lat: 15.6144, lng: -87.953 }),
    []
  );

  const center = externalCenter || fallbackCenter;

  /* =========================
     SELECCIÓN
  ========================= */

  const [selectedId, setSelectedId] = useState(null);

  const selectedPiece = useMemo(
    () => pieces.find((p) => p.id === selectedId),
    [pieces, selectedId]
  );

  /* =========================
     RENDER
  ========================= */

  return (
    <div style={{ ...styles.page, height }}>
      {/* MAP */}
      <NearbyMap
        pieces={pieces}
        selectedId={selectedId}
        onSelectId={setSelectedId}
        center={center}
        radiusKm={radiusKm}
      />

      {/* DEGRADADO SUPERIOR */}
      <div style={styles.topFade} />

      {/* BACK FLOATING */}
      {!hideBackButton && (
        <button style={styles.backFloating} onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
      )}

      {/* RECENTER BUTTON */}
      <button
        style={styles.recenterBtn}
        onClick={() => setSelectedId(null)}
      >
        <Locate size={18} />
      </button>

      {/* BOTTOM SHEET */}
      {selectedPiece && (
        <div style={styles.bottomSheet}>
          <div style={styles.dragHandle} />
          <PieceCard
            piece={selectedPiece}
            selected
            onSelect={() => {}}
            onOpen={() => {}}
          />
        </div>
      )}
    </div>
  );
}

/* =========================
   STYLES
========================= */

const styles = {
  page: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    background: "#000", // más premium
  },

  topFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    background:
      "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
    zIndex: 5,
    pointerEvents: "none",
  },

  backFloating: {
    position: "absolute",
    top: 20,
    left: 16,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "#ffffff",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,.25)",
    cursor: "pointer",
  },

  recenterBtn: {
    position: "absolute",
    bottom: 140, // encima del bottom nav
    right: 16,
    zIndex: 10,
    width: 46,
    height: 46,
    borderRadius: "50%",
    background: "#ffffff",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,.25)",
    cursor: "pointer",
  },

  bottomSheet: {
    position: "absolute",
    bottom: 70, // respeta navbar inferior
    width: "100%",
    padding: 16,
    background: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    boxShadow: "0 -10px 30px rgba(0,0,0,.25)",
    zIndex: 9,
    animation: "slideUp .25s ease",
  },

  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 10,
    background: "#d1d5db",
    margin: "0 auto 12px auto",
  },
};
