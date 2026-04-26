import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { compressImages } from "../lib/compressImage";
import { supabase } from "../lib/supabase";

const API   = "/api";
const BLUE  = "#1e3a8a";
const BLUEM = "#1d4ed8";
const YELL  = "#facc15";
const GREEN = "#16a34a";

/* ─────────────────────────────────────────────────────────────
   FIELD — input con label
───────────────────────────────────────────────────────────── */
function Field({ label, required, hint, children }) {
  return (
    <div style={sc.fieldWrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label style={sc.label}>
          {label}
          {required && <span style={{ color: "#ef4444" }}> *</span>}
        </label>
        {hint && <span style={sc.hint}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MATCH CARD — pieza encontrada en inventario
───────────────────────────────────────────────────────────── */
function MatchCard({ piece }) {
  const BACKEND = import.meta.env.VITE_BACKEND_URL || "";
  const img = Array.isArray(piece.images) ? piece.images[0] : piece.images?.[0];
  const phone = (piece.whatsapp || "").replace(/\D/g, "");
  const msg = encodeURIComponent(
    `Hola, vi en Yonkers App que tienes disponible: ${piece.title} ${piece.brand ? `(${piece.brand})` : ""}. ¿Sigue disponible?`
  );
  const waUrl = phone ? `https://wa.me/${phone}?text=${msg}` : null;

  return (
    <div style={mc.card}>
      {img && (
        <img
          src={`${BACKEND}${img}`}
          alt={piece.title}
          style={mc.img}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}
      {!img && <div style={mc.imgPlaceholder}>📦</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={mc.title}>{piece.title}</div>
        <div style={mc.meta}>
          {[piece.brand, piece.years, piece.city].filter(Boolean).join(" · ")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          {piece.price > 0 && (
            <span style={mc.price}>L {Number(piece.price).toLocaleString()}</span>
          )}
          {piece.condition && (
            <span style={mc.badge}>{piece.condition}</span>
          )}
        </div>
        {piece.yonker && (
          <div style={mc.yonker}>🔧 {piece.yonker}</div>
        )}
      </div>
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={mc.waBtn}
          onClick={(e) => e.stopPropagation()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Contactar
        </a>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   REQUEST CARD — item de la lista reciente
───────────────────────────────────────────────────────────── */
function RequestCard({ r }) {
  return (
    <div style={rc.item}>
      {r.images?.[0] && (
        <img
          src={r.images[0]}
          alt={r.title}
          style={rc.thumb}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={rc.title}>{r.title}</div>
        <div style={rc.meta}>
          {[r.brand, r.years, r.city].filter(Boolean).join(" · ")}
        </div>
        {r.description && (
          <div style={rc.desc}>{r.description}</div>
        )}
      </div>
      <div style={rc.badge}>Activo</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SPINNER
───────────────────────────────────────────────────────────── */
function Spinner({ size = 16, color = "#fff" }) {
  return (
    <span style={{
      display: "inline-block",
      width: size,
      height: size,
      border: `2px solid transparent`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

/* ─────────────────────────────────────────────────────────────
   REQUESTNEED — MAIN
───────────────────────────────────────────────────────────── */
export default function RequestNeed() {
  const navigate   = useNavigate();
  const cameraRef  = useRef();
  const galleryRef = useRef();

  const EMPTY = { title: "", brand: "", years: "", city: "", description: "", whatsapp: "" };

  const [form,         setForm]         = useState(EMPTY);
  const [files,        setFiles]        = useState([]);
  const [preview,      setPreview]      = useState([]);
  const [saving,       setSaving]       = useState(false);
  const [requests,     setRequests]     = useState([]);
  const [sent,         setSent]         = useState(false);

  // Feature #1 — AI autocomplete
  const [aiText,       setAiText]       = useState("");
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiSource,     setAiSource]     = useState(null); // "ai" | "rules" | null
  const [aiFilled,     setAiFilled]     = useState(false);
  const [aiExpanded,   setAiExpanded]   = useState(false);

  // Feature #4 — Inventory match
  const [matches,      setMatches]      = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchDone,    setMatchDone]    = useState(false);

  /* Limpiar object URLs al desmontar */
  useEffect(() => {
    return () => preview.forEach((p) => URL.revokeObjectURL(p));
  }, [preview]);

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    try {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // Reset match si el usuario edita manualmente
    setMatchDone(false);
    setMatches([]);
  }

  /* Acumula fotos de cámara y galería */
  function handleFiles(e) {
    const arr = Array.from(e.target.files || []);
    if (!arr.length) return;
    setFiles((prev) => [...prev, ...arr]);
    setPreview((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function removePhoto(i) {
    URL.revokeObjectURL(preview[i]);
    setFiles((prev)   => prev.filter((_, idx) => idx !== i));
    setPreview((prev) => prev.filter((_, idx) => idx !== i));
  }

  /* ── FEATURE #1: Analizar texto con IA ── */
  async function handleAiParse() {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiFilled(false);

    try {
      const res  = await fetch(`${API}/ai/parse-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });
      const data = await res.json();

      if (data.ok && data.parsed) {
        const p = data.parsed;
        setForm((f) => ({
          title:       p.title       || f.title,
          brand:       p.brand       || f.brand,
          years:       p.years       || f.years,
          city:        p.city        || f.city,
          description: p.description || aiText,
          whatsapp:    f.whatsapp,
        }));
        setAiSource(data.source);
        setAiFilled(true);
        setAiExpanded(false); // colapsar IA tras llenar

        // Auto-buscar en inventario
        if (p.title || p.brand) {
          await searchInventory(p.title, p.brand);
        }
      }
    } catch (err) {
      console.error("AI parse error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  /* ── FEATURE #4: Buscar coincidencias en inventario ── */
  const searchInventory = useCallback(async (title, brand) => {
    const q = [title, brand].filter(Boolean).join(" ").trim();
    if (!q) return;

    setMatchLoading(true);
    setMatchDone(false);

    try {
      const url = `${API}/pieces?query=${encodeURIComponent(q)}&limit=4`;
      const data = await fetch(url).then((r) => r.json());
      setMatches(Array.isArray(data) ? data.slice(0, 4) : []);
      setMatchDone(true);
    } catch {
      setMatches([]);
      setMatchDone(true);
    } finally {
      setMatchLoading(false);
    }
  }, []);

  function handleSearchInventory() {
    searchInventory(form.title, form.brand);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.whatsapp.trim()) {
      alert("La pieza y el WhatsApp son obligatorios.");
      return;
    }

    setSaving(true);

    try {
      // 1. Subir imágenes a Supabase Storage
      const compressed = await compressImages(files);
      const imageUrls = [];

      for (const file of compressed) {
        const ext = file.name?.split(".").pop() || "jpg";
        const filename = `requests/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("pieces")
          .upload(filename, file, { contentType: file.type, upsert: false });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("pieces")
            .getPublicUrl(filename);
          if (urlData?.publicUrl) imageUrls.push(urlData.publicUrl);
        }
      }

      // 2. Insertar en la tabla requests
      const { data: inserted, error: insertError } = await supabase
        .from("requests")
        .insert([{
          title:       form.title.trim(),
          brand:       form.brand?.trim() || "",
          years:       form.years?.trim() || "",
          city:        form.city?.trim()  || "",
          description: form.description?.trim() || "",
          whatsapp:    form.whatsapp.trim(),
          images:      imageUrls,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // 3. Recargar lista y abrir WhatsApp
      await loadRequests();

      const phone = (inserted.whatsapp || "").replace(/\D/g, "");
      if (phone) {
        const msg = encodeURIComponent(
          `Hola, publiqué una solicitud en Yonkers App buscando: ${inserted.title}${inserted.brand ? ` (${inserted.brand})` : ""}. ¿Tienes disponible?`
        );
        window.open(`https://wa.me/${phone}?text=${msg}`, "_blank", "noopener,noreferrer");
      }

      setFiles([]);
      setPreview([]);
      setForm(EMPTY);
      setAiText("");
      setAiFilled(false);
      setMatches([]);
      setMatchDone(false);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      console.error(err);
      alert("Error enviando solicitud. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const charLeft = 300 - (form.description?.length || 0);
  const hasFormData = form.title.trim() || form.brand.trim();

  return (
    <div style={st.page}>

      {/* Keyframe animation for spinner */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      <div style={st.wrapper}>

        {/* ══ HERO HEADER ══ */}
        <div style={st.hero}>
          <div style={st.heroLeft}>
            <div style={st.heroIcon}>🔍</div>
            <div>
              <div style={st.heroTitle}>Solicitar Pieza</div>
              <div style={st.heroSub}>Describe lo que buscas y los yonkers te contactarán</div>
            </div>
          </div>
          <div style={st.heroBadge}>IA ✨</div>
        </div>

        {/* ══ SUCCESS BANNER ══ */}
        {sent && (
          <div style={st.successBanner}>
            <span style={{ fontSize: 20 }}>🎉</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>¡Solicitud publicada!</div>
              <div style={{ fontSize: 12, marginTop: 2, opacity: 0.85 }}>Los yonkers cercanos te escribirán pronto al WhatsApp</div>
            </div>
          </div>
        )}

        {/* ══ STEP 1: AI SMART FILL (colapsable) ══ */}
        <div style={st.aiCard}>
          {/* Cabecera siempre visible — toca para expandir/colapsar */}
          <button
            type="button"
            onClick={() => setAiExpanded((v) => !v)}
            style={st.aiToggleRow}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={st.aiStepBadge}>Paso 1</div>
              <div>
                <div style={st.aiTitle}>✨ Describe tu problema <span style={{ fontWeight: 400, fontSize: 11, color: "#6366f1" }}>(opcional)</span></div>
                {aiFilled && !aiExpanded && (
                  <div style={{ fontSize: 11, color: "#16a34a", marginTop: 1 }}>🤖 Formulario llenado por IA</div>
                )}
                {!aiFilled && !aiExpanded && (
                  <div style={st.aiSub}>La IA llenará el formulario automáticamente</div>
                )}
              </div>
            </div>
            <span style={{ fontSize: 16, color: "#6366f1", transform: aiExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>▾</span>
          </button>

          {/* Contenido expandible */}
          {aiExpanded && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              <textarea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder={`Ej: "Mi Honda Civic 2015 necesita pastillas de freno"`}
                style={st.aiTextarea}
                onFocus={(e) => { e.currentTarget.style.borderColor = BLUEM; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.12)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.boxShadow = "none"; }}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAiParse(); }}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handleAiParse}
                  disabled={!aiText.trim() || aiLoading}
                  style={{ ...st.aiBtn, opacity: !aiText.trim() || aiLoading ? 0.65 : 1, cursor: !aiText.trim() || aiLoading ? "not-allowed" : "pointer" }}
                >
                  {aiLoading ? <><Spinner size={14} color="#fff" /> Analizando...</> : <>✨ Analizar con IA</>}
                </button>
                {aiFilled && aiSource && (
                  <div style={st.aiResult}>{aiSource === "ai" ? "🤖 Llenado" : "🔍 Autocompletado"}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══ STEP 2: FORM CARD ══ */}
        <div style={st.card}>
          <div style={st.stepHeader}>
            <div style={st.stepBadge}>Paso 2</div>
            <div style={st.stepTitle}>Completa los datos</div>
          </div>

          <form onSubmit={handleSubmit} style={st.form}>

            {/* Pieza buscada */}
            <Field label="Nombre de la pieza" required hint="Obligatorio">
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ej: Pastillas de freno, motor, trompa..."
                style={{
                  ...sc.input,
                  borderColor: aiFilled && form.title ? "#818cf8" : "#e5e7eb",
                  background: aiFilled && form.title ? "#f5f3ff" : "#fff",
                }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </Field>

            <div style={st.row2}>
              <Field label="Marca / Modelo">
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="Ej: Honda Civic"
                  style={{
                    ...sc.input,
                    borderColor: aiFilled && form.brand ? "#818cf8" : "#e5e7eb",
                    background: aiFilled && form.brand ? "#f5f3ff" : "#fff",
                  }}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </Field>
              <Field label="Año">
                <input
                  name="years"
                  value={form.years}
                  onChange={handleChange}
                  placeholder="Ej: 2020"
                  style={{
                    ...sc.input,
                    borderColor: aiFilled && form.years ? "#818cf8" : "#e5e7eb",
                    background: aiFilled && form.years ? "#f5f3ff" : "#fff",
                  }}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </Field>
            </div>

            <Field label="Ciudad">
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Ej: San Pedro Sula"
                style={{
                  ...sc.input,
                  borderColor: aiFilled && form.city ? "#818cf8" : "#e5e7eb",
                  background: aiFilled && form.city ? "#f5f3ff" : "#fff",
                }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </Field>

            <Field label="Descripción adicional" hint={`${charLeft} restantes`}>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Agrega detalles del estado, color, número de parte..."
                maxLength={300}
                style={{
                  ...sc.textarea,
                  borderColor: aiFilled && form.description ? "#818cf8" : "#e5e7eb",
                  background: aiFilled && form.description ? "#f5f3ff" : "#fff",
                }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </Field>

            {/* Contacto */}
            <div style={st.divider} />

            <Field label="Número de WhatsApp" required hint="Obligatorio">
              <div style={{ position: "relative" }}>
                <div style={sc.waBadge}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  placeholder="+504 9999-9999"
                  type="tel"
                  style={{ ...sc.input, paddingLeft: 46 }}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
            </Field>

            {/* Fotos */}
            <div style={st.divider} />
            <div style={st.photoSection}>
              <div style={st.photoLabel}>
                📷 Fotos de referencia
                <span style={st.photoOptional}>opcional</span>
              </div>
              <div style={st.photoRow}>
                <button type="button" style={st.camBtn} onClick={() => cameraRef.current?.click()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Cámara
                </button>
                <button type="button" style={st.galleryBtn} onClick={() => galleryRef.current?.click()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Galería
                </button>
              </div>
            </div>

            <input ref={cameraRef}  type="file" accept="image/*" capture="environment" multiple onChange={handleFiles} style={{ display: "none" }} />
            <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />

            {preview.length > 0 && (
              <div style={st.previewRow}>
                {preview.map((p, i) => (
                  <div key={i} style={st.previewBox}>
                    <img src={p} alt="" style={st.previewImg} />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      style={st.removeBtn}
                      aria-label="Eliminar foto"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* ── FEATURE #4: Buscar en inventario ── */}
            {hasFormData && !matchDone && (
              <button
                type="button"
                onClick={handleSearchInventory}
                disabled={matchLoading}
                style={st.searchInvBtn}
              >
                {matchLoading ? (
                  <><Spinner size={14} color={BLUE} /> Buscando en inventario...</>
                ) : (
                  <>🔎 Verificar si hay piezas disponibles</>
                )}
              </button>
            )}

            {/* Resultados del match */}
            {matchDone && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                {matches.length > 0 ? (
                  <div style={st.matchPanel}>
                    <div style={st.matchHeader}>
                      <span style={st.matchIcon}>✅</span>
                      <div>
                        <div style={st.matchTitle}>
                          ¡Encontramos {matches.length} pieza{matches.length > 1 ? "s" : ""} disponible{matches.length > 1 ? "s" : ""}!
                        </div>
                        <div style={st.matchSub}>Puedes contactar directamente al yonker ahora</div>
                      </div>
                    </div>
                    <div style={st.matchList}>
                      {matches.map((p) => (
                        <MatchCard key={p.id} piece={p} />
                      ))}
                    </div>
                    <div style={st.matchDivider}>
                      — O publica tu solicitud para recibir más ofertas —
                    </div>
                  </div>
                ) : (
                  <div style={st.noMatch}>
                    <span style={{ fontSize: 18 }}>📭</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>No encontramos esa pieza aún</div>
                      <div style={{ fontSize: 12, marginTop: 2, opacity: 0.8 }}>Publica tu solicitud y los yonkers te contactarán</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            <button
              type="submit"
              disabled={saving}
              style={{ ...st.ctaBtn, opacity: saving ? 0.75 : 1 }}
            >
              {saving ? (
                <><Spinner size={16} color="#fff" /> Publicando...</>
              ) : (
                <>📢 Publicar solicitud</>
              )}
            </button>

            <div style={st.ctaNote}>
              Los yonkers cercanos te contactarán por WhatsApp
            </div>

          </form>
        </div>

        {/* ══ REQUESTS LIST ══ */}
        {requests.length > 0 && (
          <div style={st.listSection}>
            <div style={st.listHeader}>
              <div style={st.listTitle}>📋 Solicitudes recientes</div>
              <div style={st.listCount}>{requests.length} activas</div>
            </div>
            <div style={st.list}>
              {requests.map((r) => (
                <RequestCard key={r.id} r={r} />
              ))}
            </div>
          </div>
        )}

        {/* Volver */}
        <button type="button" style={st.backBtn} onClick={() => navigate("/")}>
          ← Volver al inicio
        </button>

      </div>
    </div>
  );
}

/* ─── focus / blur helpers ─── */
function focusStyle(e) {
  e.currentTarget.style.borderColor = BLUEM;
  e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(29,78,216,0.12)";
}
function blurStyle(e) {
  const wasFilled = e.currentTarget.style.background === "rgb(245, 243, 255)";
  e.currentTarget.style.borderColor = wasFilled ? "#818cf8" : "#e5e7eb";
  e.currentTarget.style.boxShadow   = "none";
}

/* ─────────────────────────────────────────────────────────────
   SHARED COMPONENT STYLES (sc)
───────────────────────────────────────────────────────────── */
const sc = {
  fieldWrap: { display: "flex", flexDirection: "column", gap: 5 },
  label:     { fontSize: 12, fontWeight: 600, color: "#374151", letterSpacing: "0.02em" },
  hint:      { fontSize: 11, color: "#9ca3af" },
  input: {
    height: 40,
    padding: "0 12px",
    borderRadius: 10,
    border: "1.5px solid #e5e7eb",
    fontSize: 13,
    color: "#111827",
    background: "#fff",
    outline: "none",
    transition: "border-color .15s, box-shadow .15s, background .15s",
    fontFamily: "system-ui, sans-serif",
    width: "100%",
    boxSizing: "border-box",
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px solid #e5e7eb",
    fontSize: 13,
    color: "#111827",
    background: "#fff",
    outline: "none",
    resize: "vertical",
    minHeight: 64,
    transition: "border-color .15s, box-shadow .15s, background .15s",
    fontFamily: "system-ui, sans-serif",
    width: "100%",
    boxSizing: "border-box",
  },
  waBadge: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 40,
    width: 40,
    background: "#16a34a",
    borderRadius: "10px 0 0 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

/* ─────────────────────────────────────────────────────────────
   MATCH CARD STYLES (mc)
───────────────────────────────────────────────────────────── */
const mc = {
  card: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e0e7ff",
  },
  img: {
    width: 52,
    height: 52,
    borderRadius: 10,
    objectFit: "cover",
    flexShrink: 0,
    border: "1px solid #e5e7eb",
  },
  imgPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    flexShrink: 0,
  },
  title: { fontSize: 13, fontWeight: 700, color: "#111827" },
  meta:  { fontSize: 11, color: "#6b7280", marginTop: 1 },
  price: { fontSize: 13, fontWeight: 700, color: BLUE },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
    padding: "2px 7px",
    borderRadius: 20,
  },
  yonker: { fontSize: 11, color: "#9ca3af", marginTop: 3 },
  waBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "7px 12px",
    background: "#16a34a",
    color: "#fff",
    borderRadius: 10,
    textDecoration: "none",
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
};

/* ─────────────────────────────────────────────────────────────
   REQUEST CARD STYLES (rc)
───────────────────────────────────────────────────────────── */
const rc = {
  item: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "12px 14px",
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #f0f0f0",
    borderLeft: `3px solid ${YELL}`,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    objectFit: "cover",
    flexShrink: 0,
    border: "1px solid #e5e7eb",
  },
  title: { fontSize: 14, fontWeight: 700, color: "#111827" },
  meta:  { fontSize: 12, color: "#6b7280", marginTop: 2 },
  desc:  { fontSize: 12, color: "#9ca3af", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  badge: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: 700,
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
    padding: "3px 9px",
    borderRadius: 20,
    letterSpacing: "0.04em",
  },
};

/* ─────────────────────────────────────────────────────────────
   PAGE STYLES (st)
───────────────────────────────────────────────────────────── */
const st = {
  page: {
    background: "#f0f4ff",
    minHeight: "100vh",
    padding: "clamp(16px, 4vw, 28px)",
    paddingBottom: 100,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  wrapper: {
    width: "100%",
    maxWidth: 520,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  /* Hero */
  hero: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    background: `linear-gradient(135deg, ${BLUE} 0%, #1d4ed8 100%)`,
    borderRadius: 20,
    boxShadow: "0 4px 24px rgba(30,58,138,0.28)",
  },
  heroLeft: { display: "flex", alignItems: "center", gap: 14 },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    background: YELL,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  heroTitle: { fontSize: 19, fontWeight: 800, color: "#fff" },
  heroSub:   { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 },
  heroBadge: {
    fontSize: 11,
    fontWeight: 700,
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.3)",
  },

  /* Success */
  successBanner: {
    padding: "14px 18px",
    background: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "#166534",
    animation: "fadeIn 0.3s ease",
  },

  /* AI Card */
  aiCard: {
    background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
    borderRadius: 16,
    padding: "12px 16px",
    border: "1.5px solid #c7d2fe",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  aiHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  aiStepBadge: {
    fontSize: 10,
    fontWeight: 700,
    background: "#6366f1",
    color: "#fff",
    padding: "2px 8px",
    borderRadius: 20,
    flexShrink: 0,
    marginTop: 1,
  },
  aiTitle: { fontSize: 13, fontWeight: 700, color: "#1e1b4b" },
  aiSub:   { fontSize: 11, color: "#6366f1", marginTop: 1 },
  aiToggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    fontFamily: "system-ui, sans-serif",
    textAlign: "left",
  },
  aiTextarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1.5px solid #c7d2fe",
    fontSize: 13,
    color: "#1e1b4b",
    background: "#fff",
    outline: "none",
    resize: "none",
    minHeight: 68,
    fontFamily: "system-ui, sans-serif",
    transition: "border-color .15s, box-shadow .15s",
    lineHeight: 1.5,
  },
  aiBtn: {
    height: 40,
    padding: "0 18px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontFamily: "system-ui, sans-serif",
    boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
    transition: "opacity .15s",
  },
  aiResult: {
    fontSize: 12,
    fontWeight: 600,
    color: "#4f46e5",
    background: "#ede9fe",
    padding: "4px 12px",
    borderRadius: 20,
  },

  /* Form card */
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: "clamp(16px, 4vw, 24px)",
    border: "1px solid #e0e7ff",
    borderTop: `3px solid ${YELL}`,
    boxShadow: "0 2px 16px rgba(30,58,138,0.06)",
  },
  stepHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  stepBadge: {
    fontSize: 10,
    fontWeight: 700,
    background: YELL,
    color: "#1e3a8a",
    padding: "3px 10px",
    borderRadius: 20,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#374151",
  },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  divider: { height: 1, background: "#f3f4f6", margin: "2px 0" },

  /* Photos */
  photoSection: { display: "flex", flexDirection: "column", gap: 8 },
  photoLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  photoOptional: {
    fontSize: 10,
    fontWeight: 500,
    color: "#9ca3af",
    background: "#f3f4f6",
    padding: "2px 8px",
    borderRadius: 10,
  },
  photoRow: { display: "flex", gap: 10 },
  camBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    border: "none",
    background: BLUE,
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  galleryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    border: `1.5px solid ${BLUE}`,
    background: "#fff",
    color: BLUE,
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  previewRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  previewBox: { position: "relative", flexShrink: 0 },
  previewImg: { width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: "1px solid #e5e7eb", display: "block" },
  removeBtn: {
    position: "absolute",
    top: -6, right: -6,
    width: 20, height: 20,
    borderRadius: "50%",
    background: "#ef4444",
    color: "#fff",
    border: "2px solid #fff",
    fontSize: 9,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  /* Search inventory button */
  searchInvBtn: {
    height: 44,
    borderRadius: 12,
    border: `1.5px dashed ${BLUE}`,
    background: "#eff6ff",
    color: BLUE,
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    transition: "background .15s",
  },

  /* Match panel */
  matchPanel: {
    background: "#f0fdf4",
    border: "1.5px solid #86efac",
    borderRadius: 16,
    overflow: "hidden",
  },
  matchHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    background: "#dcfce7",
    borderBottom: "1px solid #bbf7d0",
  },
  matchIcon: { fontSize: 20 },
  matchTitle: { fontSize: 14, fontWeight: 700, color: "#166534" },
  matchSub:   { fontSize: 11, color: "#15803d", marginTop: 1 },
  matchList:  { padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 },
  matchDivider: {
    textAlign: "center",
    fontSize: 11,
    color: "#6b7280",
    padding: "8px 14px 12px",
    borderTop: "1px solid #bbf7d0",
  },

  /* No match */
  noMatch: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14p