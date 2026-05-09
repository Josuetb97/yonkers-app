import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { supabase } from "../../lib/supabase";
import { useMaps } from "../../contexts/MapsContext";

const SUPER_ADMIN_EMAILS = [
  "josuetb19997@gmail.com",
  "josuetaborab@gmail.com",
  "josuetabora2012@gmail.com",
];

const HONDURAS_CENTER = { lat: 14.9, lng: -86.8 };

/* ── KPI Card ── */
function KpiCard({ label, value, icon, gradient, shadow }) {
  return (
    <div style={{
      background: gradient,
      borderRadius: 20,
      padding: "20px 18px",
      boxShadow: shadow,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Círculo decorativo */}
      <div style={{
        position: "absolute", top: -18, right: -18,
        width: 80, height: 80, borderRadius: "50%",
        background: "rgba(255,255,255,0.12)",
      }} />
      <div style={{ fontSize: 26, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-1px" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
    </div>
  );
}

/* ── Stat Row ── */
function StatRow({ label, value, color, pct }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#4b5563", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "#f0f0f0", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${Math.min(100, pct)}%`,
          background: color, borderRadius: 99,
          transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
    </div>
  );
}

export default function Stats({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalYonkers: 0, approvedYonkers: 0, pendingYonkers: 0,
    rejectedYonkers: 0, totalPieces: 0, totalRequests: 0,
  });
  const [mapYonkers, setMapYonkers]   = useState([]);
  const [allApproved, setAllApproved] = useState([]);
  const [selectedY, setSelectedY]     = useState(null);
  const { isLoaded }                  = useMaps();
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (user === undefined) return;
    if (!SUPER_ADMIN_EMAILS.includes(user?.email ?? "")) navigate("/", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!SUPER_ADMIN_EMAILS.includes(user?.email ?? "")) return;
    fetchStats();
  }, [user]);

  async function fetchStats() {
    setLoading(true);
    try {
      const [yonkersRes, piecesRes, requestsRes] = await Promise.all([
        supabase.from("yonkers").select("id,name,city,lat,lng,status,whatsapp,created_at"),
        supabase.from("pieces").select("id", { count: "exact", head: true }),
        supabase.from("requests").select("id", { count: "exact", head: true }),
      ]);
      const all      = yonkersRes.data ?? [];
      const approved = all.filter((y) => y.status === "approved");
      const pending  = all.filter((y) => y.status === "pending");
      const rejected = all.filter((y) => y.status === "rejected");
      const withCoord = approved.filter((y) => y.lat != null && y.lng != null);
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

  const approvalRate = stats.totalYonkers > 0
    ? Math.round((stats.approvedYonkers / stats.totalYonkers) * 100)
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stat-card { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #0f1f4e 0%, #1e4b8f 60%, #1565c0 100%)",
        padding: "52px 20px 36px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decoración de fondo */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", borderRadius: 12,
            padding: "8px 16px", cursor: "pointer",
            fontSize: 13, fontWeight: 600, marginBottom: 24,
            backdropFilter: "blur(8px)",
          }}
        >
          ← Volver
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}>📊</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
              Estadísticas
            </h1>
            <p style={{ margin: "4px 0 0", opacity: 0.65, fontSize: 13, color: "#fff" }}>
              Panel de control · Yonkers App
            </p>
          </div>
        </div>

        {/* Tasa de aprobación en header */}
        {!loading && (
          <div style={{
            marginTop: 22,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 14, padding: "12px 16px",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600 }}>
              Tasa de aprobación
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 100, height: 6, borderRadius: 99, background: "rgba(255,255,255,0.2)" }}>
                <div style={{ width: `${approvalRate}%`, height: "100%", borderRadius: 99, background: "#4ade80", transition: "width 1s" }} />
              </div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{approvalRate}%</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "20px 16px 80px", maxWidth: 600, margin: "0 auto" }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{
              width: 44, height: 44, border: "4px solid #e5e7eb",
              borderTopColor: "#1e4b8f", borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: "#9ca3af", fontSize: 14 }}>Cargando estadísticas…</p>
          </div>
        ) : (<>

          {/* ── KPI Grid ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div className="stat-card" style={{ animationDelay: "0ms" }}>
              <KpiCard
                label="Yonkers registrados"
                value={stats.totalYonkers}
                icon="🏭"
                gradient="linear-gradient(135deg, #1e4b8f, #2563eb)"
                shadow="0 8px 24px rgba(30,75,143,0.35)"
              />
            </div>
            <div className="stat-card" style={{ animationDelay: "60ms" }}>
              <KpiCard
                label="Aprobados"
                value={stats.approvedYonkers}
                icon="✅"
                gradient="linear-gradient(135deg, #059669, #10b981)"
                shadow="0 8px 24px rgba(5,150,105,0.35)"
              />
            </div>
            <div className="stat-card" style={{ animationDelay: "120ms" }}>
              <KpiCard
                label="Piezas publicadas"
                value={stats.totalPieces}
                icon="🔧"
                gradient="linear-gradient(135deg, #7c3aed, #8b5cf6)"
                shadow="0 8px 24px rgba(124,58,237,0.35)"
              />
            </div>
            <div className="stat-card" style={{ animationDelay: "180ms" }}>
              <KpiCard
                label="Solicitudes enviadas"
                value={stats.totalRequests}
                icon="📣"
                gradient="linear-gradient(135deg, #0891b2, #06b6d4)"
                shadow="0 8px 24px rgba(8,145,178,0.35)"
              />
            </div>
          </div>

          {/* ── Card de desglose ── */}
          <div style={{
            background: "#fff", borderRadius: 20, padding: "20px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)", marginBottom: 16,
            border: "1px solid #f0f0f0",
          }} className="stat-card" style={{ animationDelay: "240ms" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 16 }}>
              📈 Desglose de yonkers
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <StatRow
                label="Aprobados"
                value={stats.approvedYonkers}
                color="#10b981"
                pct={stats.totalYonkers ? (stats.approvedYonkers / stats.totalYonkers) * 100 : 0}
              />
              <StatRow
                label="Pendientes"
                value={stats.pendingYonkers}
                color="#f59e0b"
                pct={stats.totalYonkers ? (stats.pendingYonkers / stats.totalYonkers) * 100 : 0}
              />
              <StatRow
                label="Rechazados"
                value={stats.rejectedYonkers}
                color="#ef4444"
                pct={stats.totalYonkers ? (stats.rejectedYonkers / stats.totalYonkers) * 100 : 0}
              />
            </div>
          </div>

          {/* ── Mapa Honduras ── */}
          <div style={{
            background: "#fff", borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            marginBottom: 16,
            border: "1px solid #f0f0f0",
          }} className="stat-card" style={{ animationDelay: "300ms" }}>
            <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #f5f5f5" }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#111" }}>🗺️ Honduras — Yonkers activos</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>
                {mapYonkers.length} yonker{mapYonkers.length !== 1 ? "s" : ""} con ubicación registrada
              </div>
            </div>
            <div style={{ height: 380 }}>
              {!isLoaded ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", fontSize: 13 }}>
                  Cargando mapa…
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={HONDURAS_CENTER}
                  zoom={7}
                  options={{ fullscreenControl: false, mapTypeControl: false, streetViewControl: false, zoomControl: true }}
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
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{selectedY.name}</div>
                        <div style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 8px" }}>📍 {selectedY.city}</div>
                        {selectedY.whatsapp && (
                          <a
                            href={`https://wa.me/${selectedY.whatsapp.replace(/\D/g, "")}`}
                            target="_blank" rel="noreferrer"
                            style={{ display: "inline-block", background: "#25D366", color: "#fff", padding: "5px 12px", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none" }}
                          >
                            💬 WhatsApp
                          </a>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              )}
            </div>
          </div>

          {/* ── Lista de yonkers aprobados ── */}
          <div style={{
            background: "#fff", borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            border: "1px solid #f0f0f0",
          }} className="stat-card" style={{ animationDelay: "360ms" }}>
            <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #f5f5f5" }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#111" }}>
                ✅ Yonkers aprobados
                <span style={{
                  marginLeft: 8, background: "#dcfce7", color: "#166534",
                  borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700,
                }}>
                  {allApproved.length}
                </span>
              </div>
            </div>
            {allApproved.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                Sin yonkers aprobados aún.
              </div>
            ) : (
              <div>
                {allApproved.map((y, i) => (
                  <div key={y.id} style={{
                    padding: "13px 20px",
                    borderBottom: i < allApproved.length - 1 ? "1px solid #f5f5f5" : "none",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "background 0.15s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 12,
                        background: "linear-gradient(135deg, #dbeafe, #ede9fe)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, flexShrink: 0,
                      }}>🏭</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{y.name}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>📍 {y.city || "Sin ciudad"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {y.lat && y.lng ? (
                        <span style={{ background: "#dcfce7", color: "#166534", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                          GPS ✓
                        </span>
                      ) : (
                        <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                          Sin GPS
                        </span>
                      )}
                      {y.whatsapp && (
                        <a
                          href={`https://wa.me/${y.whatsapp.replace(/\D/g, "")}`}
                          target="_blank" rel="noreferrer"
                          style={{ background: "#25D366", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, textDecoration: "none" }}
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

        </>)}
      </div>
    </div>
  );
}
