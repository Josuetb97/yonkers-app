import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Plus, Trash2, X, Search, ArrowLeft, Car, DollarSign, Eye, CheckCircle } from "lucide-react";

const SOLD_KEY = "yonkers_sold_pieces";
function loadSold() {
  try { return new Set(JSON.parse(localStorage.getItem(SOLD_KEY) || "[]")); }
  catch { return new Set(); }
}
function saveSold(set) {
  localStorage.setItem(SOLD_KEY, JSON.stringify([...set]));
}
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { compressImages } from "../lib/compressImage";

const API    = "/api";
const BLUE   = "#1e3a8a";
const BLUEM  = "#1d4ed8";
const YELL   = "#facc15";
const GREEN  = "#16a34a";
const BACKEND = import.meta.env.VITE_BACKEND_URL || "";

/* ─── helpers ─── */
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

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

/* ─── KPI chip ─── */
function KpiChip({ icon, label, value, color = BLUE }) {
  return (
    <div style={kpi.wrap}>
      <div style={{ ...kpi.icon, background: color + "18", color }}>{icon}</div>
      <div>
        <div style={kpi.value}>{value}</div>
        <div style={kpi.label}>{label}</div>
      </div>
    </div>
  );
}

/* ─── Vehicle card — estilo Booking.com ─── */
function VehicleCard({ v, onDelete, onAddToCart, inCart }) {
  const imgs  = parseImages(v.images);
  const phone = (v.whatsapp || "").replace(/\D/g, "");
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hola, vi tu vehículo en Yonkers App: ${v.title}. ¿Sigue disponible?`)}`
    : null;
  const hasPhoto = !!imgs[0];

  // Estado vendido — persiste en localStorage
  const [sold, setSold] = useState(() => loadSold().has(String(v.id)));
  function toggleSold() {
    setSold((prev) => {
      const set = loadSold();
      if (prev) set.delete(String(v.id));
      else      set.add(String(v.id));
      saveSold(set);
      return !prev;
    });
  }

  return (
    <div style={vc.card}>
      {/* ── Imagen izquierda ── */}
      <div style={vc.imgCol}>
        {hasPhoto ? (
          <img src={`${BACKEND}${imgs[0]}`} alt={v.title} style={vc.img}
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div style={vc.noImg}><Car size={26} color="#9ca3af" /></div>
        )}

        {/* Badge fotos extra */}
        {imgs.length > 1 && (
          <div style={vc.photoBadge}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            +{imgs.length - 1}
          </div>
        )}

        {/* Badge estado */}
        <div style={sold ? vc.soldBadge : vc.availBadge}>{sold ? "Vendido" : "Disponible"}</div>
      </div>

      {/* ── Contenido derecho ── */}
      <div style={vc.content}>
        {/* Título + delete */}
        <div style={vc.topRow}>
          <div style={vc.title}>{v.title}</div>
          <button style={vc.deleteBtn} onClick={() => onDelete(v.id)} aria-label="Eliminar">
            <Trash2 size={12} />
          </button>
        </div>

        {/* Marca · Año */}
        {(v.brand || v.year) && (
          <div style={vc.meta}>{[v.brand, v.year].filter(Boolean).join(" · ")}</div>
        )}

        {/* Separador */}
        <div style={vc.divider} />

        {/* Precio + botones */}
        <div style={vc.bottomRow}>
          {v.price > 0 ? (
            <div style={vc.priceBlock}>
              <div style={vc.priceLabel}>Precio</div>
              <div style={vc.price}>L {Number(v.price).toLocaleString()}</div>
            </div>
          ) : <div />}

          <div style={vc.actions}>
            {/* Favorito */}
            <button
              style={{ ...vc.iconBtn, background: inCart ? "#fef9c3" : "#f3f4f6", borderColor: inCart ? YELL : "#e5e7eb" }}
              onClick={() => onAddToCart(v)}
              title={inCart ? "En tu lista" : "Guardar"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={inCart ? "#f59e0b" : "none"} stroke={inCart ? "#f59e0b" : "#9ca3af"} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>

            {/* Toggle vendido */}
            <button
              style={{ ...vc.iconBtn, background: sold ? "#fef2f2" : "#f0fdf4", borderColor: sold ? "#fca5a5" : "#bbf7d0" }}
              onClick={toggleSold}
              title={sold ? "Marcar disponible" : "Marcar vendido"}
            >
              <CheckCircle size={13} color={sold ? "#dc2626" : "#16a34a"} />
            </button>

            {/* WhatsApp */}
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" style={vc.waBtn}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contactar
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Form Modal ─── */
function VehicleFormModal({ onClose, onSaved }) {
  const cameraRef  = useRef();
  const galleryRef = useRef();
  const [form,    setForm]    = useState({ title: "", brand: "", year: "", price: "", whatsapp: "" });
  const [files,   setFiles]   = useState([]);
  const [preview, setPreview] = useState([]);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleFiles(e) {
    const arr = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...arr]);
    setPreview((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function removePreview(i) {
    URL.revokeObjectURL(preview[i]);
    setFiles((p) => p.filter((_, idx) => idx !== i));
    setPreview((p) => p.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      const fd    = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const compressed = await compressImages(files);
      compressed.forEach((f) => fd.append("images", f));
      const res = await fetch(`${API}/vehicles`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      onSaved();
      onClose();
    } catch {
      setError("Error publicando vehículo. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={fm.overlay} onClick={onClose}>
      <div style={fm.card} onClick={(e) => e.stopPropagation()}>

        <div style={fm.header}>
          <div style={fm.headerIcon}>🚗</div>
          <div>
            <div style={fm.headerTitle}>Publicar vehículo</div>
            <div style={fm.headerSub}>Completa los datos del auto</div>
          </div>
          <button style={fm.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && <div style={fm.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={fm.form}>

          <div style={fm.fieldWrap}>
            <label style={fm.label}>Vehículo <span style={{ color: "#ef4444" }}>*</span></label>
            <input name="title" value={form.title} onChange={handleChange}
              placeholder="Ej: Toyota Hilux 4x4" style={fm.input} required
              onFocus={(e) => { e.target.style.borderColor = BLUEM; }}
              onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }} />
          </div>

          <div style={fm.row2}>
            <div style={fm.fieldWrap}>
              <label style={fm.label}>Marca</label>
              <input name="brand" value={form.brand} onChange={handleChange}
                placeholder="Toyota" style={fm.input}
                onFocus={(e) => { e.target.style.borderColor = BLUEM; }}
                onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }} />
            </div>
            <div style={fm.fieldWrap}>
              <label style={fm.label}>Año</label>
              <input name="year" value={form.year} onChange={handleChange}
                placeholder="2019" style={fm.input}
                onFocus={(e) => { e.target.style.borderColor = BLUEM; }}
                onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }} />
            </div>
          </div>

          <div style={fm.row2}>
            <div style={fm.fieldWrap}>
              <label style={fm.label}>Precio (L)</label>
              <input name="price" value={form.price} onChange={handleChange}
                placeholder="350000" style={fm.input} type="number"
                onFocus={(e) => { e.target.style.borderColor = BLUEM; }}
                onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }} />
            </div>
            <div style={fm.fieldWrap}>
              <label style={fm.label}>WhatsApp</label>
              <input name="whatsapp" value={form.whatsapp} onChange={handleChange}
                placeholder="+504 ..." style={fm.input} type="tel"
                onFocus={(e) => { e.target.style.borderColor = BLUEM; }}
                onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }} />
            </div>
          </div>

          {/* Fotos */}
          <div style={fm.fieldWrap}>
            <label style={fm.label}>Fotos del vehículo</label>
            <div style={fm.photoRow}>
              <button type="button" style={fm.camBtn} onClick={() => cameraRef.current?.click()}>
                📷 Cámara
              </button>
              <button type="button" style={fm.galBtn} onClick={() => galleryRef.current?.click()}>
                🖼️ Galería
              </button>
            </div>
            <input ref={cameraRef}  type="file" accept="image/*" capture="environment" multiple onChange={handleFiles} style={{ display: "none" }} />
            <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
          </div>

          {preview.length > 0 && (
            <div style={fm.previewRow}>
              {preview.map((src, i) => (
                <div key={i} style={{ position: "relative", flexShrink: 0 }}>
                  <img src={src} alt="" style={fm.previewImg} />
                  {i === 0 && <div style={fm.mainBadge}>Principal</div>}
                  <button type="button" onClick={() => removePreview(i)} style={fm.removeBtn}>✕</button>
                </div>
              ))}
            </div>
          )}

          <button type="submit" disabled={saving} style={{ ...fm.submitBtn, opacity: saving ? 0.75 : 1 }}>
            {saving ? "Publicando..." : "🚗 Publicar vehículo"}
          </button>

        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN — MI AUTOLOTE
───────────────────────────────────────────────────────────── */
export default function Autolote() {
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();

  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [toast,    setToast]    = useState("");

  useEffect(() => { loadVehicles(); }, []);

  async function loadVehicles() {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const res  = await fetch(`${API}/my/vehicles`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("Error cargando vehículos");
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id) {
    if (!window.confirm("¿Eliminar este vehículo?")) return;
    const token = await getToken();
    const res   = await fetch(`${API}/vehicles/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setItems((v) => v.filter((i) => i.id !== id));
  }

  function handleAddToCart(v) {
    addToCart({
      id:       v.id,
      type:     "vehicle",
      title:    v.title,
      brand:    v.brand,
      year:     v.year,
      price:    v.price,
      images:   parseImages(v.images),
      whatsapp: v.whatsapp,
    });
    setToast(v.title || "Vehículo");
    setTimeout(() => setToast(""), 2500);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return items;
    return items.filter((v) =>
      v.title?.toLowerCase().includes(q) ||
      v.brand?.toLowerCase().includes(q) ||
      String(v.year).includes(q)
    );
  }, [items, search]);

  /* KPIs */
  const totalValue   = items.reduce((s, v) => s + Number(v.price || 0), 0);
  const withPhotos   = items.filter((v) => parseImages(v.images).length > 0).length;

  return (
    <div style={pg.page}>

      {/* ══ HERO HEADER ══ */}
      <div style={pg.hero}>
        <button style={pg.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} color="#fff" />
        </button>
        <div style={pg.heroContent}>
          <div style={pg.heroIcon}>🚗</div>
          <div>
            <div style={pg.heroTitle}>Mi Autolote</div>
            <div style={pg.heroSub}>Administra tus vehículos publicados</div>
          </div>
        </div>
        <button style={pg.addBtn} onClick={() => setShowForm(true)}>
          <Plus size={16} color={BLUE} />
        </button>
      </div>

      <div style={pg.content}>

        {/* ══ KPIs ══ */}
        {!loading && items.length > 0 && (
          <div style={pg.kpiRow}>
            <KpiChip icon={<Car size={16} />}       label="Publicados" value={items.length}            color={BLUE}  />
            <KpiChip icon={<DollarSign size={16} />} label="Valor total" value={`L ${totalValue.toLocaleString()}`} color={GREEN} />
            <KpiChip icon={<Eye size={16} />}        label="Con fotos"   value={`${withPhotos}/${items.length}`}     color="#7c3aed" />
          </div>
        )}

        {/* ══ SEARCH + ADD ══ */}
        <div style={pg.topBar}>
          <div style={pg.searchWrap}>
            <Search size={15} color="#9ca3af" />
            <input
              placeholder="Buscar por nombre, marca, año..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={pg.searchInput}
            />
            {search && (
              <button style={pg.clearSearch} onClick={() => setSearch("")}>
                <X size={13} color="#9ca3af" />
              </button>
            )}
          </div>
          <button style={pg.createBtn} onClick={() => setShowForm(true)}>
            <Plus size={16} color="#fff" />
            Publicar
          </button>
        </div>

        {error && <div style={pg.error}>{error}</div>}

        {/* ══ GRID ══ */}
        {loading ? (
          <div style={pg.empty}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            Cargando vehículos...
          </div>
        ) : filtered.length === 0 ? (
          <div style={pg.empty}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚗</div>
            <div style={pg.emptyTitle}>
              {search ? "Sin resultados" : "Aún no tienes vehículos"}
            </div>
            <div style={pg.emptySub}>
              {search ? "Intenta con otro término" : "Publica tu primer vehículo para que los compradores te contacten"}
            </div>
            {!search && (
              <button style={pg.emptyBtn} onClick={() => setShowForm(true)}>
                <Plus size={16} /> Publicar ahora
              </button>
            )}
          </div>
        ) : (
          <div style={pg.list}>
            {filtered.map((v) => (
              <VehicleCard
                key={v.id}
                v={v}
                onDelete={deleteItem}
                onAddToCart={handleAddToCart}
                inCart={isInCart(v.id, "vehicle")}
              />
            ))}
          </div>
        )}

        {/* ══ STATS FOOTER ══ */}
        {!loading && items.length > 0 && (
          <div style={pg.statsFooter}>
            <span>💡 Consejo: los vehículos con fotos reciben 3x más contactos</span>
          </div>
        )}

      </div>

      {/* ══ FORM MODAL ══ */}
      {showForm && (
        <VehicleFormModal
          onClose={() => setShowForm(false)}
          onSaved={loadVehicles}
        />
      )}

      {/* ══ TOAST ══ */}
      {toast && (
        <div style={pg.toast}>
          🛒 Añadido a tu lista de interés
        </div>
      )}

    </div>
  );
}

/* ─── KPI styles ─── */
const kpi = {
  wrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    background: "#fff",
    borderRadius: 14,
    flex: 1,
    minWidth: 0,
    border: "1px solid #f0f0f0",
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  value: { fontSize: 14, fontWeight: 800, color: "#111827" },
  label: { fontSize: 10, color: "#9ca3af", marginTop: 1 },
};

/* ─── VehicleCard styles — Booking.com inspired ─── */
const vc = {
  card: {
    background: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "row",
    height: 136,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    transition: "box-shadow 0.2s",
  },
  /* ── Columna imagen ── */
  imgCol: {
    position: "relative",
    width: 120,
    flexShrink: 0,
    background: "#f3f4f6",
    overflow: "hidden",
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
    bottom: 6,
    left: 6,
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    gap: 3,
  },
  availBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    background: "#dcfce7",
    color: "#16a34a",
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: 6,
    letterSpacing: "0.03em",
  },
  soldBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    background: "#fee2e2",
    color: "#dc2626",
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: 6,
    letterSpacing: "0.03em",
  },
  /* ── Columna contenido ── */
  content: {
    flex: 1,
    minWidth: 0,
    padding: "11px 12px 11px",
    display: "flex",
    flexDirection: "column",
  },
  topRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.3,
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  deleteBtn: {
    width: 24,
    height: 24,
    background: "none",
    border: "none",
    color: "#d1d5db",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRadius: 6,
    transition: "color 0.15s",
  },
  meta: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 3,
  },
  divider: {
    flex: 1,
  },
  bottomRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 4,
  },
  priceBlock: { display: "flex", flexDirection: "column" },
  priceLabel: { fontSize: 9, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" },
  price: { fontSize: 16, fontWeight: 800, color: BLUE },
  actions: { display: "flex", gap: 6, alignItems: "center" },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  },
  waBtn: {
    height: 30,
    padding: "0 10px",
    borderRadius: 8,
    background: GREEN,
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
};

/* ─── Form Modal styles ─── */
const fm = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(4px)",
    zIndex: 9000,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "0 0 0",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: "24px 24px 0 0",
    padding: "22px 20px 36px",
    maxWidth: 520,
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    background: BLUE,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    flexShrink: 0,
  },
  headerTitle: { fontSize: 17, fontWeight: 800, color: "#111827" },
  headerSub:   { fontSize: 12, color: "#6b7280", marginTop: 1 },
  closeBtn: {
    marginLeft: "auto",
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#f3f4f6",
    border: "none",
    color: "#6b7280",
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  error: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#dc2626",
    fontSize: 13,
    marginBottom: 14,
  },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 12, fontWeight: 600, color: "#374151" },
  input: {
    height: 46,
    padding: "0 14px",
    borderRadius: 12,
    border: "1.5px solid #e5e7eb",
    fontSize: 14,
    color: "#111827",
    background: "#fff",
    outline: "none",
    fontFamily: "system-ui, sans-serif",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color .15s",
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  photoRow: { display: "flex", gap: 10, marginTop: 2 },
  camBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    border: "none",
    background: BLUE,
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  galBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    border: `1.5px solid ${BLUE}`,
    background: "#fff",
    color: BLUE,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  previewRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  previewImg: { width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: "1px solid #e5e7eb", display: "block" },
  mainBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    background: "rgba(30,58,138,0.85)",
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    textAlign: "center",
    padding: "2px 0",
    borderRadius: "0 0 10px 10px",
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#ef4444",
    border: "2px solid #fff",
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    border: "none",
    background: `linear-gradient(135deg, ${BLUE}, ${BLUEM})`,
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    marginTop: 4,
    boxShadow: "0 4px 14px rgba(30,58,138,0.3)",
    transition: "opacity .15s",
  },
};

/* ─── Page styles ─── */
const pg = {
  page: {
    background: "#f0f4ff",
    minHeight: "100vh",
    paddingBottom: 80,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  hero: {
    background: `linear-gradient(135deg, ${BLUE}, ${BLUEM})`,
    padding: "18px 16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    boxShadow: "0 4px 20px rgba(30,58,138,0.25)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  heroContent: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    background: YELL,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  heroTitle: { fontSize: 19, fontWeight: 800, color: "#fff" },
  heroSub:   { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: YELL,
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  content: {
    padding: "16px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  kpiRow: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
  },
  topBar: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  searchWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 14,
    padding: "0 12px",
    height: 44,
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 14,
    color: "#111827",
    background: "transparent",
    fontFamily: "system-ui, sans-serif",
  },
  clearSearch: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
  },
  createBtn: {
    height: 44,
    padding: "0 16px",
    borderRadius: 13,
    border: "none",
    background: `linear-gradient(135deg, ${BLUE}, ${BLUEM})`,
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "system-ui, sans-serif",
    flexShrink: 0,
    boxShadow: "0 3px 10px rgba(30,58,138,0.25)",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  error: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: 12,
    padding: "12px 16px",
    color: "#dc2626",
    fontSize: 13,
    fontWeight: 600,
  },
  empty: {
    textAlign: "center",
    padding: "48px 24px",
    color: "#9ca3af",
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: "#374151", margin: "0 0 4px" },
  emptyText:  { fontSize: 13, margin: 0 },
  soldBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    background: "#fee2e2",
    color: "#dc2626",
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: 6,
    letterSpacing: "0.03em",
  },
};
