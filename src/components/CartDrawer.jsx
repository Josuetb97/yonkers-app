/**
 * CartDrawer — panel lateral estilo Booking.com
 * Lista de piezas/vehículos guardados para consultar por WhatsApp
 */
import { useEffect } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "";
const BLUE    = "#1e3a8a";
const BLUEM   = "#1d4ed8";
const GREEN   = "#16a34a";

/* ── Ícono WhatsApp ── */
function WaIcon({ size = 14, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

/* ── Ícono X ── */
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  );
}

/* ── Tarjeta de ítem — estilo Booking.com ── */
function CartItem({ item, onRemove }) {
  const img   = Array.isArray(item.images) ? item.images[0] : null;
  const phone = (item.whatsapp || "").replace(/\D/g, "");
  const msg   = encodeURIComponent(
    `Hola, vi en Yonkers App: ${item.title}${item.brand ? ` (${item.brand})` : ""}. ¿Sigue disponible?`
  );
  const waUrl = phone ? `https://wa.me/${phone}?text=${msg}` : null;
  const isVehicle = item.type === "vehicle";

  return (
    <div style={ci.card}>
      {/* Imagen */}
      <div style={ci.imgBox}>
        {img ? (
          <img
            src={`${BACKEND}${img}`}
            alt={item.title}
            style={ci.img}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div style={ci.imgPlaceholder}>
            {isVehicle ? "🚗" : "🔧"}
          </div>
        )}
        {/* Tipo badge */}
        <span style={{ ...ci.typeBadge, background: isVehicle ? "#818cf8" : BLUEM }}>
          {isVehicle ? "Auto" : "Pieza"}
        </span>
      </div>

      {/* Info */}
      <div style={ci.info}>
        <div style={ci.title}>{item.title}</div>

        {(item.brand || item.years || item.year) && (
          <div style={ci.meta}>
            {[item.brand, item.years || item.year].filter(Boolean).join(" · ")}
          </div>
        )}

        {item.yonker && (
          <div style={ci.seller}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            {item.yonker}
          </div>
        )}

        {/* Precio + acciones */}
        <div style={ci.footer}>
          {Number(item.price || 0) > 0 ? (
            <div style={ci.price}>L {Number(item.price).toLocaleString()}</div>
          ) : <div />}

          <div style={ci.actions}>
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" style={ci.waBtn}>
                <WaIcon size={12} />
                Consultar
              </a>
            )}
            <button
              style={ci.removeBtn}
              onClick={() => onRemove(item.id, item.type)}
              aria-label="Quitar"
            >
              <XIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CART DRAWER
───────────────────────────────────────── */
export default function CartDrawer({ open, onClose, cartItems, onRemove, onClear }) {
  /* Bloquear scroll del body */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* Consultar todo por WhatsApp al primer vendedor */
  function contactAll() {
    const withWa = cartItems.filter((i) => i.whatsapp);
    if (!withWa.length) return;
    const phone = withWa[0].whatsapp.replace(/\D/g, "");
    const lista = cartItems
      .map((i) => `• ${i.title}${i.brand ? ` (${i.brand})` : ""}`)
      .join("\n");
    const msg = encodeURIComponent(
      `Hola, vi estas piezas en Yonkers App y me interesan:\n${lista}\n\n¿Tienes alguna disponible?`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  }

  if (!open && cartItems.length === 0) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          ...cd.overlay,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition: "opacity 0.28s ease",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          ...cd.panel,
          transform: open ? "translateX(0)" : "translateX(105%)",
          transition: "transform 0.32s cubic-bezier(.4,0,.2,1)",
        }}
      >
        {/* ── Header ── */}
        <div style={cd.header}>
          <div style={cd.headerLeft}>
            {/* Ícono */}
            <div style={cd.headerIconWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div>
              <div style={cd.headerTitle}>Lista de interés</div>
              <div style={cd.headerSub}>
                {cartItems.length === 0
                  ? "Ningún artículo guardado"
                  : `${cartItems.length} ${cartItems.length === 1 ? "artículo guardado" : "artículos guardados"}`
                }
              </div>
            </div>
          </div>
          <button style={cd.closeBtn} onClick={onClose} aria-label="Cerrar">
            <XIcon />
          </button>
        </div>

        {/* ── Divider ── */}
        <div style={cd.divider} />

        {/* ── Items ── */}
        <div style={cd.body}>
          {cartItems.length === 0 ? (
            <div style={cd.empty}>
              <div style={cd.emptyIcon}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <div style={cd.emptyTitle}>Tu lista está vacía</div>
              <div style={cd.emptySub}>
                Dale ❤️ a piezas o vehículos para guardarlos aquí y consultarlos por WhatsApp
              </div>
            </div>
          ) : (
            <div style={cd.list}>
              {cartItems.map((item) => (
                <CartItem
                  key={`${item.type}_${item.id}`}
                  item={item}
                  onRemove={onRemove}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {cartItems.length > 0 && (
          <div style={cd.footer}>
            {/* Resumen */}
            <div style={cd.summary}>
              <span style={cd.summaryCount}>{cartItems.length} {cartItems.length === 1 ? "artículo" : "artículos"}</span>
              <button style={cd.clearLink} onClick={onClear}>Vaciar lista</button>
            </div>

            {/* Botón principal */}
            <button style={cd.contactAllBtn} onClick={contactAll}>
              <WaIcon size={16} />
              Consultar todo por WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── CartItem styles ─── */
const ci = {
  card: {
    display: "flex",
    gap: 0,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #f0f2f5",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  imgBox: {
    position: "relative",
    width: 88,
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
  imgPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    minHeight: 100,
  },
  typeBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    fontSize: 9,
    fontWeight: 700,
    color: "#fff",
    padding: "2px 6px",
    borderRadius: 5,
    letterSpacing: "0.04em",
  },
  info: {
    flex: 1,
    minWidth: 0,
    padding: "10px 12px 10px",
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.35,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  meta: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  seller: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    fontSize: 14,
    fontWeight: 800,
    color: BLUE,
  },
  actions: {
    display: "flex",
    gap: 5,
    alignItems: "center",
  },
  waBtn: {
    height: 26,
    padding: "0 8px",
    borderRadius: 7,
    background: GREEN,
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    letterSpacing: "0.01em",
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    color: "#9ca3af",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.15s",
  },
};

/* ─── Drawer styles ─── */
const cd = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.4)",
    backdropFilter: "blur(3px)",
    WebkitBackdropFilter: "blur(3px)",
    zIndex: 10009,
  },
  panel: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "min(390px, 100vw)",
    background: "#f8fafc",
    zIndex: 10010,
    display: "flex",
    flexDirection: "column",
    boxShadow: "-4px 0 32px rgba(0,0,0,0.12)",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  /* ── Header limpio (blanco) ── */
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 18px 16px",
    background: "#fff",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: { fontSize: 16, fontWeight: 800, color: "#0f172a" },
  headerSub:   { fontSize: 12, color: "#94a3b8", marginTop: 1 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: "#f1f5f9",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.15s",
  },
  divider: {
    height: 1,
    background: "#f1f5f9",
    flexShrink: 0,
  },
  body: {
    flex: 1,
    overflowY: "auto",
    padding: "14px 14px 0",
    minHeight: 0,
  },
  /* ── Empty state ── */
  empty: {
    textAlign: "center",
    padding: "64px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 6 },
  emptySub:   { fontSize: 13, color: "#9ca3af", lineHeight: 1.6, maxWidth: 240 },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingBottom: 14,
  },
  /* ── Footer ── */
  footer: {
    padding: "14px 16px 28px",
    background: "#fff",
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    flexShrink: 0,
  },
  summary: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryCount: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
  },
  clearLink: {
    background: "none",
    border: "none",
    fontSize: 12,
    color: "#94a3b8",
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
    textDecoration: "underline",
    textDecorationColor: "#d1d5db",
  },
  contactAllBtn: {
    width: "100%",
    height: 50,
    borderRadius: 13,
    border: "none",
    background: `linear-gradient(135deg, #16a34a, #15803d)`,
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "inherit",
    boxShadow: "0 4px 14px rgba(22,163,74,0.35)",
    letterSpacing: "0.01em",
    transition: "opacity 0.15s",
  },
};
