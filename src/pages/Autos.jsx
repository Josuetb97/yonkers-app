import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Car, MapPin, Settings } from "lucide-react";
import { supabase } from "../lib/supabase";

const SUPER_ADMIN_EMAILS = [
  "josuetb19997@gmail.com",
  "josuetaborab@gmail.com",
  "josuetabora2012@gmail.com",
];

function parseImages(images) {
  try {
    if (Array.isArray(images)) return images;
    if (typeof images === "string") {
      const p = JSON.parse(images);
      return Array.isArray(p) ? p : [];
    }
    return [];
  } catch { return []; }
}

/* ── Tarjeta de vehículo pública ── */
function VehicleCard({ v }) {
  const imgs  = parseImages(v.images);
  const phone = (v.whatsapp || "").replace(/\D/g, "");
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hola, vi tu vehículo en Yonkers App: ${v.title}. ¿Sigue disponible?`)}`
    : null;

  return (
    <div style={vc.card}>
      {/* Imagen */}
      <div style={vc.imgWrap}>
        {imgs[0] ? (
          <img src={imgs[0]} alt={v.title} style={vc.img}
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div style={vc.noImg}><Car size={32} color="#9ca3af" /></div>
        )}
        {imgs.length > 1 && (
          <div style={vc.photoBadge}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
            +{imgs.length - 1}
          </div>
        )}
        <div style={vc.availBadge}>Disponible</div>
      </div>

      {/* Contenido */}
      <div style={vc.body}>
        <div style={vc.title}>{v.title}</div>

        {(v.brand || v.year) && (
          <div style={vc.meta}>{[v.brand, v.year].filter(Boolean).join(" · ")}</div>
        )}

        {v.autolote_name && (
          <div style={vc.lotRow}>
            <MapPin size={11} color="#6b7280" />
            <span style={vc.lotText}>
              {v.autolote_name}{v.autolote_city ? ` · ${v.autolote_city}` : ""}
            </span>
            {v.autolote_verified && (
              <span style={vc.verifiedBadge}>✓ Verificado</span>
            )}
          </div>
        )}

        <div style={vc.bottom}>
          {v.price > 0 ? (
            <div style={vc.price}>L {Number(v.price).toLocaleString()}</div>
          ) : (
            <div style={vc.priceNA}>Precio a consultar</div>
          )}

          {waUrl ? (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" style={vc.waBtn}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar
            </a>
          ) : (
            <div style={{ fontSize: 12, color: "#9ca3af" }}>Sin contacto</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN — AUTOS (listado público)
═══════════════════════════════════════ */
export default function Autos({ user }) {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [isOwner,  setIsOwner]  = useState(false);

  /* Verificar si el usuario es dueño de autolote aprobado */
  useEffect(() => {
    if (!user) return;
    if (SUPER_ADMIN_EMAILS.includes(user.email ?? "")) { setIsOwner(true); return; }
    supabase
      .from("autolote_profiles")
      .select("status")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.status === "approved") setIsOwner(true);
      });
  }, [user]);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      /* 1. Traer todos los vehículos */
      const { data: vData, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      /* 2. Traer perfiles de autolotes aprobados */
      const ownerIds = [...new Set((vData || []).map((v) => v.owner_id).filter(Boolean))];
      let profiles = {};
      if (ownerIds.length > 0) {
        const { data: pData } = await supabase
          .from("autolote_profiles")
          .select("owner_id, name, city, verified")
          .in("owner_id", ownerIds)
          .eq("status", "approved");
        (pData || []).forEach((p) => { profiles[p.owner_id] = p; });
      }

      /* 3. Combinar datos */
      const enriched = (vData || []).map((v) => ({
        ...v,
        autolote_name:     profiles[v.owner_id]?.name     ?? null,
        autolote_city:     profiles[v.owner_id]?.city     ?? null,
        autolote_verified: profiles[v.owner_id]?.verified ?? false,
      }));

      setVehicles(enriched);
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return vehicles;
    return vehicles.filter((v) =>
      v.title?.toLowerCase().includes(q) ||
      v.brand?.toLowerCase().includes(q) ||
      String(v.year || "").includes(q) ||
      v.autolote_name?.toLowerCase().includes(q) ||
      v.autolote_city?.toLowerCase().includes(q)
    );
  }, [vehicles, search]);

  return (
    <div style={pg.page}>

      {/* ── HEADER ── */}
      <div style={pg.hero}>
        <div style={pg.heroGlow} />
        <div style={pg.heroInner}>
          <div style={pg.heroLeft}>
            <div style={pg.heroIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e4b8f" strokeWidth="2.2">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <path d="M16 8h4l3 5v3h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <div style={pg.heroTitle}>Autos en venta</div>
              <div style={pg.heroSub}>
                {loading
                  ? "Cargando..."
                  : `${vehicles.length} vehículo${vehicles.length !== 1 ? "s" : ""} disponible${vehicles.length !== 1 ? "s" : ""}`}
              </div>
            </div>
          </div>

          {/* Botón "Gestionar" solo para dueños de autolote aprobados */}
          {isOwner && (
            <button style={pg.manageBtn} onClick={() => navigate("/my-pieces")}>
              <Settings size={13} color="#1e3a8a" />
              Gestionar
            </button>
          )}
        </div>
      </div>

      {/* ── BÚSQUEDA ── */}
      <div style={pg.searchSection}>
        <div style={pg.searchWrap}>
          <Search size={15} color="#9ca3af" />
          <input
            placeholder="Marca, modelo, año, ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={pg.searchInput}
          />
          {search && (
            <button style={pg.clearBtn} onClick={() => setSearch("")}>
              <X size={13} color="#9ca3af" />
            </button>
          )}
        </div>
      </div>

      {/* ── BANNER: ¿Tienes un autolote? ── */}
      <div style={pg.joinBanner}>
        <div style={pg.joinText}>
          <div style={pg.joinTitle}>🚗 ¿Tienes un autolote?</div>
          <div style={pg.joinSub}>Publica tus vehículos gratis y llega a miles de compradores</div>
        </div>
        <button style={pg.joinBtn} onClick={() => navigate("/autolote-solicitud")}>
          Únete
        </button>
      </div>

      {/* ── LISTADO ── */}
      <div style={pg.body}>
        {loading ? (
          <div style={pg.center}>
            <div style={pg.spinner} />
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 12 }}>Cargando vehículos…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={pg.empty}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🚗</div>
            <div style={pg.emptyTitle}>
              {search ? `Sin resultados para "${search}"` : "Aún no hay vehículos publicados"}
            </div>
            <div style={pg.emptySub}>
              {search
                ? "Intenta con otro término de búsqueda"
                : "Pronto los autolotes comenzarán a publicar sus vehículos aquí"}
            </div>
            {search && (
              <button style={pg.clearSearchBtn} onClick={() => setSearch("")}>
                Ver todos los autos
              </button>
            )}
          </div>
        ) : (
          <>
            {search && (
              <div style={pg.resultsLabel}>
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para &ldquo;{search}&rdquo;
              </div>
            )}
            <div style={pg.grid}>
              {filtered.map((v) => (
                <VehicleCard key={v.id} v={v} />
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── VehicleCard styles ── */
const vc = {
  card: {
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
  },
  imgWrap: {
    position: "relative",
    width: "100%",
    height: 160,
    background: "#f3f4f6",
    overflow: "hidden",
    flexShrink: 0,
  },
  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  noImg: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  photoBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  availBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    background: "#dcfce7",
    color: "#16a34a",
    fontSize: 10,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 8,
  },
  body: {
    padding: "12px 14px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 5,
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.3,
  },
  meta: {
    fontSize: 12,
    color: "#6b7280",
  },
  lotRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    flexWrap: "wrap",
  },
  lotText: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: 500,
  },
  verifiedBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: "#1d4ed8",
    background: "#eff6ff",
    padding: "1px 6px",
    borderRadius: 6,
  },
  bottom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  price: {
    fontSize: 17,
    fontWeight: 800,
    color: "#1e3a8a",
  },
  priceNA: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  waBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "7px 12px",
    borderRadius: 10,
    background: "#16a34a",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    textDecoration: "none",
  },
};

/* ── Page styles ── */
const pg = {
  page: {
    background: "#f7f8fa",
    minHeight: "100vh",
    paddingBottom: 80,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  hero: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "#1e4b8f",
    padding: "12px 16px",
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: -20, right: -20,
    width: 100, height: 100,
    borderRadius: "50%",
    background: "rgba(250,204,21,0.15)",
    pointerEvents: "none",
  },
  heroInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    position: "relative",
  },
  heroLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  heroIcon: {
    width: 36, height: 36,
    borderRadius: 10,
    background: "#facc15",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(250,204,21,0.35)",
  },
  heroTitle: { fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" },
  heroSub:   { fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 1 },
  manageBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "7px 12px",
    borderRadius: 10,
    background: "#facc15",
    border: "none",
    color: "#1e3a8a",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },

  searchSection: {
    background: "#fff",
    padding: "12px 16px",
    borderBottom: "1px solid #ebebeb",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    height: 42,
    padding: "0 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    background: "#f8fafc",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 14,
    color: "#111",
    background: "transparent",
    fontFamily: "system-ui, sans-serif",
  },
  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
  },

  joinBanner: {
    margin: "12px 16px",
    background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
    borderRadius: 14,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  joinText: { flex: 1 },
  joinTitle: { fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 },
  joinSub:   { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  joinBtn: {
    padding: "8px 16px",
    borderRadius: 10,
    background: "#facc15",
    border: "none",
    color: "#1e3a8a",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },

  body: {
    padding: "0 16px 16px",
  },
  center: {
    textAlign: "center",
    padding: "60px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid #e2e8f0",
    borderTopColor: "#1e3a8a",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  empty: {
    textAlign: "center",
    padding: "50px 24px",
  },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: "#374151", marginBottom: 8 },
  emptySub:   { fontSize: 13, color: "#9ca3af", marginBottom: 20 },
  clearSearchBtn: {
    padding: "9px 20px",
    borderRadius: 10,
    border: "none",
    background: "#1e3a8a",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  resultsLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 600,
    margin: "0 0 12px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 12,
  },
};
