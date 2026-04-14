import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { useEffect, useState, useCallback } from "react";

const containerStyle = {
  width: "100%",
  height: "100%",
};

export default function NearbyMap({
  pieces = [],
  center,
  selectedId,
  onSelectId,
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  const [selectedPiece, setSelectedPiece] = useState(null);
  const [directions, setDirections] = useState(null);

  /* =========================
     Sincronizar pieza seleccionada
  ========================= */
  useEffect(() => {
    if (!selectedId) return;
    const p = pieces.find((x) => x.id === selectedId);
    if (p) setSelectedPiece(p);
  }, [selectedId, pieces]);

  /* =========================
     Fallback: calcular ruta interna
  ========================= */
  const handleDirections = useCallback(
    (piece) => {
      if (!window.google) return;

      const directionsService =
        new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: center,
          destination: {
            lat: piece.lat,
            lng: piece.lng,
          },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK") {
            setDirections(result);
          } else {
            console.error("Directions error:", status);
          }
        }
      );
    },
    [center]
  );

  /* =========================
     Abrir Google Maps externo (RECOMENDADO)
  ========================= */
  const openExternalMaps = (piece) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${piece.lat},${piece.lng}`;
    window.open(url, "_blank");
  };

  /* =========================
     Estados de carga
  ========================= */
  if (loadError) return <p>Error cargando mapa</p>;
  if (!isLoaded) return <p>Cargando mapa...</p>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      options={{
        fullscreenControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        mapTypeId: "roadmap", // ✅ mapa clásico
      }}
    >
      {/* =========================
         Usuario
      ========================= */}
      <Marker
        position={center}
        icon={{
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        }}
      />

      {/* =========================
         Yonkers
      ========================= */}
      {pieces.map((piece) => (
        <Marker
          key={piece.id}
          position={{ lat: piece.lat, lng: piece.lng }}
          icon={{
            url:
              selectedId === piece.id
                ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                : "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
          }}
          onClick={() => {
            onSelectId(piece.id);
            setSelectedPiece(piece);
            setDirections(null);
          }}
        />
      ))}

      {/* =========================
         Info Window
      ========================= */}
      {selectedPiece && (
        <InfoWindow
          position={{
            lat: selectedPiece.lat,
            lng: selectedPiece.lng,
          }}
          onCloseClick={() => {
            setSelectedPiece(null);
            setDirections(null);
          }}
        >
          <div style={{ maxWidth: 220 }}>
            <h4 style={{ margin: 0, color: "#000", fontWeight: 700 }}>
              {selectedPiece.yonker}
            </h4>

            <p style={{ margin: "4px 0", color: "#555" }}>
              {selectedPiece.city}
            </p>

            {/* BOTONES */}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button
                onClick={() => openExternalMaps(selectedPiece)}
                style={{
                  padding: "6px 12px",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cómo llegar
              </button>

              {/* Fallback interno */}
              <button
                onClick={() => handleDirections(selectedPiece)}
                style={{
                  padding: "6px 12px",
                  background: "#e5e7eb",
                  color: "#111",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Ruta
              </button>
            </div>
          </div>
        </InfoWindow>
      )}

      {/* =========================
         Ruta render
      ========================= */}
      {directions && (
        <DirectionsRenderer directions={directions} />
      )}
    </GoogleMap>
  );
}