import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle } from "lucide-react";
import PieceCard from "../components/PieceCard";
import PieceDetailModal from "../components/modals/PieceDetailModal";
import { useAnalytics } from "../hooks/useAnalytics";
import { supabase } from "../lib/supabase";

const API     = import.meta.env.VITE_API_URL || "/api";
const BACKEND = import.meta.env.VITE_BACKEND_URL || "";

/* ─────────────────────────────────────────────────────────────
   ID de sesión anónima para evitar reseñas duplicadas
───────────────────────────────────────────────────────────── */
function getReviewerSession() {
  let id = localStorage.getItem("yonkers_reviewer_id");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("yonkers_reviewer_id", id);
  }
  return id;
}

/* ─────────────────────────────────────────────────────────────
   REVIEW SECTION
───────────────────────────────────────────────────────────── */
function ReviewSection({ sellerId }) {
  const [summary,    setSummary]    = useState(null);   // { total, positive, pct, reviews[] }
  const [myScore,    setMyScore]    = useState(null);   // 1 | -1 | null
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent,       setSent]       = useState(false);
  const session = getReviewerSession();

  const load = useCallback(async () => {
    try {
      const data = await fetch(`${API}/reviews/${sellerId}`).then((r) => r.json());
      setSummary(data);
    } catch {
      setSummary(null);
    }
  }, [sellerId]);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (myScore === null) return;
    setSubmitting(true);
    try {
      await fetch(`${API}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_id: sellerId,
          score: myScore,
          comment: comment.trim(),
          reviewer_session: session,
        }),
      });
      setSent(true);
      setComment("");
      await load();
    } catch {
      alert("Error al enviar reseña");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={rv.wrap}>
      <div style={rv.header}>⭐ Reseñas del yonker</div>

      {/* Resumen */}
      {summary && summary.total > 0 && (
        <div style={rv.summary}>
          <div style={rv.pct}>
            <span style={rv.pctNum}>{summary.pct}%</span>
            <span style={rv.pctLabel}>positivas</span>
          </div>
          <div style={rv.bar}>
            <div style={{ ...rv.barFill, width: `${summary.pct}%` }} />
          </div>
          <div style={rv.count}>{summary.total} reseña{summary.total !== 1 ? "s" : ""}</div>
        </div>
      )}

      {/* Lista de reseñas recientes */}
      {summary?.reviews?.filter((r) => r.comment).slice(0, 3).map((r) => (
        <div key={r.id} style={rv.item}>
          <span style={{ fontSize: 16 }}>{r.score === 1 ? "👍" : "👎"}</span>
          <span style={rv.itemText}>{r.comment}</span>
        </div>
      ))}

      {/* Formulario */}
      {!sent ? (
        <div style={rv.form}>
          <div style={rv.formLabel}>¿Cómo fue tu experiencia?</div>
          <div style={rv.btnRow}>
            <button
              style={{ ...rv.voteBtn, ...(myScore === 1 ? rv.voteBtnGood : {}) }}
              onClick={() => setMyScore(myScore === 1 ? null : 1)}
            >
              👍 Buena
            </button>
            <button
              style={{ ...rv.voteBtn, ...(myScore === -1 ? rv.voteBtnBad : {}) }}
              onClick={() => setMyScore(myScore === -1 ? null : -1)}
            >
              👎 Mala
            </button>
          </div>
          {myScore !== null && (
            <>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cuéntanos más (opcional)..."
                maxLength={200}
                style={rv.textarea}
              />
              <button
                onClick={submit}
                disabled={submitting}
                style={{ ...rv.submitBtn, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? "Enviando..." : "Publicar reseña →"}
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={rv.thanks}>
          ✅ ¡Gracias por tu reseña!
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SELLER PROFILE
───────────────────────────────────────────────────────────── */
export default function SellerProfile({ user, openLogin }) {
  const { ownerId } = useParams();
  const navigate    = useNavigate();
  const { track }   = useAnalytics();

  const [pieces,        setPieces]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [selectedId,    setSelectedId]    = useState(null);

  const seller = pieces[0] ?? null;

  /* ── Ocultar bottom nav al abrir modal ── */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("toggleBottomNav", { detail: { hidden: !!selectedPiece } })
    );
  }, [selectedPiece]);

  /* ── Track vista del perfil ── */
  useEffect(() => {
    if (ownerId) track("seller_profile", "seller", { seller_id: ownerId });
  }, [ownerId]);

  /* ── Fetch piezas del vendedor (Supabase directo) ── */
  const fetchPieces = useCallback(async () => {
    if (!ownerId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pieces")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setPieces(Array.isArray(data) ? data : []);
    } catch {
      setPieces([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => { fetchPieces(); }, [fetchPieces]);

  /* ── Contactar por WhatsApp ── */
  function openWhatsApp() {
    if (!seller?.whatsapp) return;
    track("whatsapp_click", "seller", { seller_id: ownerId, type: "profile" });
    const phone = seller.whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=Hola, vi tu perfil en YONKERS APP`, "_blank");
  }

  const initial = seller?.yonker?.charAt(0)?.toUpperCase() || "Y";

  return (
    <div style={s.page}>

      {/* ── Header ── */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} color="#fff" />
        </button>
        <span style={s.headerTitle}>Perfil del Yonker</span>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Hero del vendedor ── */}
      <div style={s.hero}>
        <div style={s.avatar}>{initial}</div>

        {loading ? (
          <div style={s.heroName}>Cargando...</div>
        ) : seller ? (
          <>
            <div style={s.heroName}>{seller.yonker}</div>

            {seller.city && (
              <div style={s.heroSub}>
                <MapPin size={13} color="rgba(255,255,255,0.75)" />
                <span>{seller.city}</span>
              </div>
            )}

            <div style={s.heroBadge}>
              {pieces.length} pieza{pieces.length !== 1 ? "s" : ""} publicada{pieces.length !== 1 ? "s" : ""}
            </div>

            {/* Redes sociales */}
            <div style={s.socialRow}>
              {seller.instagram && (
                <a
                  href={seller.instagram.startsWith("http") ? seller.instagram : `https://instagram.com/${seller.instagram.replace("@", "")}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ ...s.socialBtn, background: "#E1306C" }}
                >IG</a>
              )}
              {seller.facebook && (
                <a
                  href={seller.facebook.startsWith("http") ? seller.facebook : `https://facebook.com/${seller.facebook}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ ...s.socialBtn, background: "#1877F2" }}
                >FB</a>
              )}
              {seller.tiktok && (
                <a
                  href={seller.tiktok.startsWith("http") ? seller.tiktok : `https://tiktok.com/@${seller.tiktok.replace("@", "")}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ ...s.socialBtn, background: "#111" }}
                >TK</a>
              )}
            </div>

            {/* Botón WhatsApp */}
            {seller.whatsapp && (
              <button style={s.waBtn} onClick={openWhatsApp}>
                <MessageCircle size={16} color="#fff" />
                Contactar por WhatsApp
              </button>
            )}
          </>
        ) : (
          <div style={s.heroName}>Vendedor no encontrado</div>
        )}
      </div>

      {/* ── Sección de piezas ── */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Inventario disponible</div>

        {loading ? (
          <div style={s.empty}>⏳ Cargando piezas...</div>
        ) : pieces.length === 0 ? (
          <div style={s.empty}>Este yonker no tiene piezas publicadas</div>
        ) : (
          <div style={s.grid}>
            {pieces.map((piece) => (
              <PieceCard
                key={piece.id}
                piece={piece}
                selected={selectedId === piece.id}
                onOpen={(p) => { setSelectedPiece(p); setSelectedId(p.id); }}
                onSelect={() => setSelectedId(piece.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Reseñas ── */}
      {!loading && seller && ownerId && (
        <div style={s.section}>
          <ReviewSection sellerId={ownerId} />
        </div>
      )}

      {/* ── Modal detalle ── */}
      <PieceDetailModal
        piece={selectedPiece}
        onClose={() => setSelectedPiece(null)}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   REVIEW STYLES (rv)
───────────────────────────────────────────────────────────── */
const rv = {
  wrap: {
    background: "#fff",
    borderRadius: 18,
    padding: "18px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    border: "1px solid #f0f0f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  header: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  },
  summary: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    background: "#f9fafb",
    borderRadius: 12,
  },
  pct: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
    minWidth: 48,
  },
  pctNum:   { fontSize: 18, fontWeight: 800, color: "#16a34a" },
  pctLabel: { fontSize: 10, color: "#6b7280", marginTop: -2 },
  bar: {
    flex: 1,
    height: 8,
    background: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "#16a34a",
    borderRadius: 4,
    transition: "width 0.5s ease",
  },
  count: { fontSize: 12, color: "#6b7280", flexShrink: 0 },

  item: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "8px 12px",
    background: "#f9fafb",
    borderRadius: 10,
    fontSize: 13,
  },
  itemText: { color: "#374151", lineHeight: 1.4 },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "12px 14px",
    background: "#f8faff",
    borderRadius: 14,
    border: "1px solid #e0e7ff",
  },
  formLabel: { fontSize: 13, fontWeight: 600, color: "#374151" },
  btnRow: { display: "flex", gap: 8 },
  voteBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    border: "1.5px solid #e5e7eb",
    background: "#fff",
    color: "#374151",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    transition: "all 0.15s",
  },
  voteBtnGood: {
    background: "#f0fdf4",
    borderColor: "#86efac",
    color: "#16a34a",
  },
  voteBtnBad: {
    background: "#fef2f2",
    borderColor: "#fca5a5",
    color: "#dc2626",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px solid #e5e7eb",
    fontSize: 13,
    color: "#111827",
    background: "#fff",
    outline: "none",
    resize: "none",
    minHeight: 72,
    fontFamily: "system-ui, sans-serif",
  },
  submitBtn: {
    height: 42,
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    transition: "opacity .15s",
  },
  thanks: {
    padding: "12px 14px",
    background: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    color: "#166534",
    textAlign: "center",
  },
};

/* ─────────────────────────────────────────────────────────────
   PAGE STYLES (s)
───────────────────────────────────────────────────────────── */
const s = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    paddingBottom: 80,
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "linear-gradient(180deg,#1e4b8f,#0f3e82)",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  backBtn: {
    background: "rgba(255,255,255,0.15)",
    border: "none",
    borderRadius: "50%",
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  headerTitle: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
  },
  hero: {
    background: "linear-gradient(180deg,#0f3e82,#1e4b8f)",
    padding: "32px 20px 28px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "#facc15",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
    fontWeight: 800,
    color: "#1e4b8f",
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
    marginBottom: 4,
  },
  heroName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: 800,
    textAlign: "center",
  },
  heroSub: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
  },
  heroBadge: {
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 14px",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.2)",
  },
  socialRow: {
    display: "flex",
    gap: 10,
    marginTop: 4,
  },
  socialBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
  },
  waBtn: {
    marginTop: 6,
    padding: "10px 24px",
    borderRadius: 20,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  section: {
    padding: "20px 14px 0",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 14,
  },
  grid: {
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 14,
  },
  empty: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#9ca3af",
    fontSize: 14,
  },
};
