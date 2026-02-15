import { memo, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function NearbyMap({
  pieces = [],
  center,
  selectedId,
  onSelectId,
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markersRef = useRef({});
  const initializedRef = useRef(false);

  /* =========================
     INIT MAP (UNA SOLA VEZ)
  ========================= */
  useEffect(() => {
    if (initializedRef.current) return;
    if (!containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      // ✅ STYLE SEGURO SIN TRAFFIC NI INCIDENTS
      style: "mapbox://styles/mapbox/dark-v11?optimize=true",
      center: [center.lng, center.lat],
      zoom: 12,
    });

    mapRef.current = map;
    initializedRef.current = true;

    /* 🔵 Punto azul usuario */
    const userEl = document.createElement("div");
    userEl.style.width = "18px";
    userEl.style.height = "18px";
    userEl.style.borderRadius = "50%";
    userEl.style.background = "#2563eb";
    userEl.style.boxShadow = "0 0 0 6px rgba(37,99,235,0.3)";
    userEl.style.animation = "pulse 2s infinite";

    new mapboxgl.Marker(userEl)
      .setLngLat([center.lng, center.lat])
      .addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      initializedRef.current = false;
    };
  }, [center]);

  /* =========================
     CREAR / ACTUALIZAR MARKERS
  ========================= */
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const existingMarkers = markersRef.current;

    for (const p of pieces) {
      if (!p?.lat || !p?.lng) continue;

      if (!existingMarkers[p.id]) {
        const el = document.createElement("div");

        el.style.width = "14px";
        el.style.height = "14px";
        el.style.borderRadius = "50%";
        el.style.background =
          p.status === "alta" ? "#22c55e" : "#64748b";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 2px 6px rgba(0,0,0,.4)";
        el.style.cursor = "pointer";
        el.style.transition = "all .2s ease";

        el.onclick = () => {
          onSelectId?.(p.id);
        };

        const marker = new mapboxgl.Marker(el)
          .setLngLat([p.lng, p.lat])
          .addTo(map);

        existingMarkers[p.id] = marker;
      }
    }

    // Eliminar marcadores que ya no existen
    Object.keys(existingMarkers).forEach((id) => {
      if (!pieces.find((p) => String(p.id) === String(id))) {
        existingMarkers[id].remove();
        delete existingMarkers[id];
      }
    });
  }, [pieces, onSelectId]);

  /* =========================
     FOCUS + HIGHLIGHT
  ========================= */
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;

    const map = mapRef.current;

    const selectedPiece = pieces.find(
      (p) => p.id === selectedId
    );

    if (!selectedPiece?.lat || !selectedPiece?.lng) return;

    map.flyTo({
      center: [selectedPiece.lng, selectedPiece.lat],
      zoom: 15,
      speed: 0.8,
      curve: 1.4,
    });

    Object.entries(markersRef.current).forEach(([id, m]) => {
      const el = m.getElement();

      if (String(id) === String(selectedId)) {
        el.style.transform = "scale(1.4)";
        el.style.zIndex = "10";
        el.style.background = "#facc15";
      } else {
        el.style.transform = "scale(1)";
        el.style.zIndex = "1";
        el.style.background =
          pieces.find((p) => String(p.id) === String(id))
            ?.status === "alta"
            ? "#22c55e"
            : "#64748b";
      }
    });
  }, [selectedId, pieces]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
}

/* =========================
   MEMO
========================= */
export default memo(
  NearbyMap,
  (prev, next) =>
    prev.selectedId === next.selectedId &&
    prev.pieces.length === next.pieces.length
);
