import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { supabase } from "../../lib/supabase";
import { useMaps } from "../../contexts/MapsContext";

/* ──────────────────────────────────────
   Constantes
────────────────────────────────────── */
const SUPER_ADMIN_EMAILS = [
  "josuetb19997@gmail.com",
  "josuetaborab@gmail.com",
  "josuetabora2012@gmail.com",
];

// Centro geográfico de Honduras
const HONDURAS_CENTER = { lat: 14.9, lng: -86.8 };

/* ──────────────────────────────────────
   Componente KPI Card
────────────────────────────────────── */
function KpiCard({ label, value, color, emoji }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "18px 16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        borderLeft: `4px solid ${color}`,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ fontSize: 22 }}>{emoji}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────
   Página principal Stats
────────────────────────────────────── */
export default function Stats({ user }) {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalYonkers: 0,
    approvedYonkers: 0,
    pendingYonkers: 0,
    rejectedYonkers: 0,
    totalPieces: 0,
    totalRequests: 0,
  });
  const [mapYonkers, setMapYonkers]     = useState([]);
  const [allApproved, setAllApproved]   = useState([]);
  const [selectedY, setSelectedY]       = useState(null);
  const { isLoaded }                    = useMaps();
  const [loading, setLoading]           = useState(true);

  /* Guard: solo super admin */
  useEffect(() => {
    if (user === undefined) return; // aún cargando
    if (!SUPER_ADMIN_EMAILS.includes(user?.email ?? "")) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  /* Cargar datos */
  useEffect(() => {
    if (!SUPER_ADMIN_EMAILS.includes(user?.email ?? "")) return;
    fetchStats();
  }, [user]);

  async function fetchStats() {
    setLoading(true);
    try {
      const [yonkersRes, piecesRes, requestsRes] = await Promise.all([
        supabase
          .from("yonkers")
          .select("id, name, city, lat, lng, status, whatsapp, created_at"),
        supabase
          .from("pieces")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("requests")
          .select("id", { count: "exact", head: true }),
      ]);

      const all       = yonkersRes.data ?? [];
      const approved  = all.filter((y) => y.status === "approved");
      const pending   = all.filter((y) => y.status === "pending");
      const rejected  = all.filter((y) => y.status === "rejected");
      const withCoord = approved.filter(
        (y) => y.lat != null && y.lng != null
      );

      setStats({
        totalYonkers:    all.length,
        approvedYonkers: approved.length,
        pendingYonkers:  pending.length,
        rejectedYonkers: rejected.length,
        totalPieces:     piecesRes.count ?? 0,
        totalRequests:   requestsRes.count ?? 0,
      });

      setMapYonkers(withCoord);
      setAllApproved(approved);
    } catch (err) {
      console.error("[Stats] fetchStats:", err);
    } finally {
      setLoading(false);
    }
  }

  /* ──────────────────────────────────
     Render
  ────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", paddingBottom: 80 }}>

      {/* ── Header ── */}
      <div
        style={{
          background: "linear-gradient(180deg,#1e4b8f,#0f3e82)",
          padding: "48px 20px 28px",
          color: "#fff",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "none",
            color: "#fff",
            borderRadius: 10,
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          ← Volver
        </button>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>
          📊 Estadísticas
        </h1>
        <p style={{ margin: "6px 0 0", opacity: 0.75, fontSize: 14 }}>
          Panel de control · Yonkers App
        </p>
      </div>

      <div style={{ padding: "20px 16px" }}>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: 80,
              color: "#9ca3af",
              fontSize: 16,
            }}
          >
            Cargando estadísticas…
          </div>
        ) : (
          <>
            {/* ── KPI Grid ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <KpiCard
                label="Yonkers registrados"
                value={stats.totalYonkers}
                color="#1e4b8f"
                emoji="🏭"
              />
              <KpiCard
                label="Aprobados"
                value={stats.approvedYonkers}
                color="#16a34a"
                emoji="✅"
              />
              <KpiCard
                label="Pendientes"
                value={stats.pendingYonkers}
                color="#f59e0b"
                emoji="⏳"
              />
              <KpiCard
                label="Rechazados"
                value={stats.rejectedYonkers}
                color="#ef4444"
                emoji="❌"
              />
              <KpiCard
                label="Piezas publicadas"
                value={stats.totalPieces}
                color="#7c3aed"
                emoji="🔧"
              />
              <KpiCard
                label="Solicitudes enviadas"
                value={stats.totalRequests}
                color="#0891b2"
                emoji="📣"
              />
            </div>

            {/* ── Mapa Honduras ── */}
            <div
              style={{
                background: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  padding: "16px 20px 14px",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#1a2d5a",
                  }}
                >
                  🗺️ Honduras — Yonkers activos
                </h2>
                <p
                  style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}
                >
                  {mapYonkers.length} yonker
                  {mapYonkers.length !== 1 ? "s" : ""} con ubicación registrada
                </p>
              </div>

              <div style={{ height: 420 }}>
                {!isLoaded ? (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"#9ca3af" }}>
                    Cargando mapa…
                  </div>
                ) : <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={HONDURAS_CENTER}
                  zoom={7}
                  options={{
                    fullscreenControl: false,
                    mapTypeControl: false,
                    streetViewControl: false,
                    zoomControl: true,
                  }}
                >
                  {mapYonkers.map((y) => (
                    <Marker
                      key={y.id}
                      position={{ lat: Number(y.lat), lng: Number(y.lng) }}
                      icon={{ url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }}
                      onClick={() => setSelectedY(y)}
                    />
                  ))}
                  {selectedY && (
                    <InfoWindow
                      position={{ lat: Number(selectedY.lat), lng: Number(selectedY.lng) }}
                      onCloseClick={() => setSelectedY(null)}
                    >
                      <div style={{ maxWidth: 210 }}>
                        <h4 style={{ margin: 0, color: "#111", fontWeight: 700, fontSize: 14 }}>
                          {selectedY.name}
                        </h4>
                        <p style={{ margin: "4px 0 8px", color: "#555", fontSize: 13 }}>
                          📍 {selectedY.city}
                        </p>
                        {selectedY.whatsapp && (
                          <a
                            href={`https://wa.me/${selectedY.whatsapp.replace(/\D/g, "")}`}
                            target="_blank" rel="noreferrer"
                            style={{
                              display: "inline-block", background: "#25D366",
                              color: "#fff", padding: "5px 12px", borderRadius: 8,
                              fontWeight: 700, fontSize: 13, textDecoration: "none",
                            }}
                          >
                            💬 WhatsApp
                          </a>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>}
              </div>
            </div>

            {/* ── Lista de yonkers aprobados ── */}
            <div
              style={{
                background: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              }}
            >
              <div
                style={{
                  padding: "16px 20px 14px",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#1a2d5a",
                  }}
                >
                  ✅ Yonkers aprobados ({allApproved.length})
                </h2>
              </div>

              {allApproved.length === 0 ? (
                <p
                  style={{
                    padding: "24px 20px",
                    color: "#9ca3af",
                    margin: 0,
                    fontSize: 14,
                  }}
                >
                  Sin yonkers aprobados aún.
                </p>
              ) : (
                <div>
                  {allApproved.map((y, i) => (
                    <div
                      key={y.id}
                      style={{
                        padding: "13px 20px",
                        borderBottom:
                          i < allApproved.length - 1
                            ? "1px solid #f3f4f6"
                            : "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#1a2d5a",
                          }}
                        >
                          {y.name}
                        </div>
                        <div
                          style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}
                        >
                          📍 {y.city || "Sin ciudad"}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {y.lat && y.lng ? (
                          <span
                            style={{
                              background: "#d1fae5",
                              color: "#065f46",
                              borderRadius: 20,
                              padding: "3px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            📍 GPS
                          </span>
                        ) : (
                          <span
                            style={{
                              background: "#fef3c7",
                              color: "#92400e",
                              borderRadius: 20,
                              padding: "3px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            Sin GPS
                          </span>
                        )}
                        {y.whatsapp && (
                          <a
                            href={`https://wa.me/${y.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: "#25D366",
                              color: "#fff",
                              borderRadius: 20,
                              padding: "3px 10px",
                              fontSize: 11,
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            WA
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
