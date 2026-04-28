import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { compressImages } from "../lib/compressImage";
import { supabase } from "../lib/supabase";

const BLUE  = "#1e3a8a";
const BLUEM = "#1d4ed8";
const YELL  = "#facc15";

/* ─── Field wrapper ─── */
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

/* ─── Spinner ─── */
function Spinner({ size = 16, color = "#fff" }) {
  return (
    <span style={{
      display: "inline-block",
      width: size, height: size,
      border: "2px solid transparent",
      borderTopColor: color,
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

/* ─────────────────────────────────────────────────────────────
   REQUESTNEED
───────────────────────────────────────────────────────────── */
export default function RequestNeed() {
  const navigate    = useNavigate();
  const cameraRef   = useRef();
  const galleryRef  = useRef();

  const EMPTY = { title: "", brand: "", years: "", city: "", description: "", whatsapp: "" };

  const [form,       setForm]       = useState(EMPTY);
  const [files,      setFiles]      = useState([]);
  const [preview,    setPreview]    = useState([]);
  const [compressed, setCompressed] = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [sent,       setSent]       = useState(false);
  const [sentData,   setSentData]   = useState(null);

  useEffect(() => {
    return () => preview.forEach((p) => URL.revokeObjectURL(p));
  }, [preview]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleFiles(e) {
    const arr = Array.from(e.target.files || []);
    if (!arr.length) return;
    setFiles((prev) => [...prev, ...arr]);
    setPreview((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
    compressImages(arr).then((comp) => {
      setCompressed((prev) => [...prev, ...comp]);
    });
  }

  function removePhoto(i) {
    URL.revokeObjectURL(preview[i]);
    setFiles((p)      => p.filter((_, idx) => idx !== i));
    setPreview((p)    => p.filter((_, idx) => idx !== i));
    setCompressed((p) => p.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.whatsapp.trim()) {
      alert("La pieza y el WhatsApp son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const imageUrls = [];
      const filesToUpload = compressed.length > 0 ? compressed : await compressImages(files);

      for (const file of filesToUpload) {
        const ext = file.name?.split(".").pop() || "jpg";
        const filename = `requests/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("pieces")
          .upload(filename, file, { contentType: file.type, upsert: false });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("pieces").getPublicUrl(filename);
          if (urlData?.publicUrl) imageUrls.push(urlData.publicUrl);
        }
      }

      const { data: inserted, error: insertError } = await supabase
        .from("requests")
        .insert([{
          title:       form.title.trim(),
          brand:       form.brand?.trim()       || "",
          years:       form.years?.trim()       || "",
          city:        form.city?.trim()        || "",
          description: form.description?.trim() || "",
          whatsapp:    form.whatsapp.trim(),
          images:      imageUrls,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      const shareFiles = (compressed.length > 0 ? compressed : filesToUpload).filter(
        (f) => f instanceof File
      );
      setSentData({
        title:       inserted.title,
        brand:       inserted.brand,
        city:        inserted.city,
        description: inserted.description,
        imageUrls,
        shareFiles,
      });

      setFiles([]);
      setPreview([]);
      setCompressed([]);
      setForm(EMPTY);
      setSent(true);
    } catch (err) {
      console.error(err);
      alert("Error enviando solicitud. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    if (!sentData) return;
    const { title, brand, city, description, imageUrls, shareFiles } = sentData;
    let text = `🔍 Busco: *${title}*`;
    if (brand)       text += ` (${brand})`;
    if (city)        text += ` — ${city}`;
    if (description) text += `\n${description}`;
    text += `\n\nPublicado en Yonkers App 🔧\nhttps://yonkersapp.com/request`;

    const canShareFiles = navigator.canShare && shareFiles.length > 0 &&
      navigator.canShare({ files: shareFiles });
    if (canShareFiles) {
      try { await navigator.share({ title: `Busco: ${title}`, text, files: shareFiles }); return; }
      catch (err) { if (err.name === "AbortError") return; }
    }
    if (navigator.share) {
      try { await navigator.share({ title: `Busco: ${title}`, text }); return; }
      catch (err) { if (err.name === "AbortError") return; }
    }
    if (imageUrls.length > 0) text += `\n\n📷 Fotos:\n${imageUrls.join("\n")}`;
    window.location.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  const charLeft = 300 - (form.description?.length || 0);

  return (
    <div style={st.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={st.wrapper}>

        {/* ══ HERO ══ */}
        <div style={st.hero}>
          <div style={st.heroLeft}>
            <div style={st.heroIcon}>🔍</div>
            <div>
              <div style={st.heroTitle}>Solicitar Pieza</div>
              <div style={st.heroSub}>Describe lo que buscas y los yonkers te contactarán</div>
            </div>
          </div>
        </div>

        {/* ══ SUCCESS MODAL ══ */}
        {sent && sentData && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}>
            <div style={{
              background: "#fff", borderRadius: 20, padding: "28px 24px",
              maxWidth: 360, width: "100%", textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 6 }}>
                ¡Solicitud publicada!
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24, lineHeight: 1.5 }}>
                Los yonkers cercanos te escribirán pronto. Comparte tu solicitud en WhatsApp para llegar a más personas.
              </div>
              {sentData.imageUrls.length > 0 && (
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
                  {sentData.imageUrls.slice(0, 4).map((url, i) => (
                    <img key={i} src={url} alt="" style={{
                      width: 60, height: 60, borderRadius: 10,
                      objectFit: "cover", border: "2px solid #e5e7eb",
                    }} />
                  ))}
                </div>
              )}
              <button onClick={handleShare} style={{
                width: "100%", padding: "14px", borderRadius: 12,
                background: "#25D366", color: "#fff", border: "none",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginBottom: 10,
              }}>
                <span style={{ fontSize: 20 }}>📤</span>
                Compartir en WhatsApp
              </button>
              <button
                onClick={() => { setSent(false); setSentData(null); }}
                style={{
                  width: "100%", padding: "11px", borderRadius: 12,
                  background: "#f3f4f6", color: "#374151", border: "none",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* ══ FORM ══ */}
        <div style={st.card}>
          <form onSubmit={handleSubmit} style={st.form}>

            <Field label="Nombre de la pieza" required hint="Obligatorio">
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ej: Pastillas de freno, motor, trompa..."
                style={sc.input}
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
                  style={sc.input}
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
                  style={sc.input}
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
                style={sc.input}
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
                style={sc.textarea}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </Field>

            <div style={st.divider} />

            <Field label="Número de WhatsApp" required hint="Obligatorio">
              <div style={{ position: "relative" }}>
                <div style={sc.waBadge}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
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

            <div style={st.divider} />

            {/* Fotos */}
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
                    <button type="button" onClick={() => removePhoto(i)} style={st.removeBtn} aria-label="Eliminar foto">✕</button>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" disabled={saving} style={{ ...st.ctaBtn, opacity: saving ? 0.75 : 1 }}>
              {saving ? <><Spinner size={16} color="#fff" /> Publicando...</> : <>📢 Publicar solicitud</>}
            </button>

            <div style={st.ctaNote}>
              Los yonkers cercanos te contactarán por WhatsApp
            </div>

          </form>
        </div>

        <button type="button" style={st.backBtn} onClick={() => navigate("/")}>
          ← Volver al inicio
        </button>

      </div>
    </div>
  );
}

/* ─── focus / blur ─── */
function focusStyle(e) {
  e.currentTarget.style.borderColor = BLUEM;
  e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(29,78,216,0.12)";
}
function blurStyle(e) {
  e.currentTarget.style.borderColor = "#e5e7eb";
  e.currentTarget.style.boxShadow   = "none";
}

/* ─── Shared styles ─── */
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
    transition: "border-color .15s, box-shadow .15s",
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
    transition: "border-color .15s, box-shadow .15s",
    fontFamily: "system-ui, sans-serif",
    width: "100%",
    boxSizing: "border-box",
  },
  waBadge: {
    position: "absolute",
    left: 0, top: 0,
    height: 40, width: 40,
    background: "#16a34a",
    borderRadius: "10px 0 0 10px",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
};

/* ─── Page styles ─── */
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
  hero: {
    display: "flex",
    alignItems: "center",
    padding: "16px 20px",
    background: `linear-gradient(135deg, ${BLUE} 0%, #1d4ed8 100%)`,
    borderRadius: 20,
    boxShadow: "0 4px 24px rgba(30,58,138,0.28)",
  },
  heroLeft: { display: "flex", alignItems: "center", gap: 14 },
  heroIcon: {
    width: 46, height: 46,
    borderRadius: 13,
    background: YELL,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, flexShrink: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  heroTitle: { fontSize: 19, fontWeight: 800, color: "#fff" },
  heroSub:   { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: "clamp(16px, 4vw, 24px)",
    border: "1px solid #e0e7ff",
    borderTop: `3px solid ${YELL}`,
    boxShadow: "0 2px 16px rgba(30,58,138,0.06)",
  },
  form:    { display: "flex", flexDirection: "column", gap: 14 },
  row2:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  divider: { height: 1, background: "#f3f4f6", margin: "2px 0" },
  photoSection: { display: "flex", flexDirection: "column", gap: 8 },
  photoLabel: {
    fontSize: 12, fontWeight: 600, color: "#374151",
    display: "flex", alignItems: "center", gap: 6,
  },
  photoOptional: {
    fontSize: 10, fontWeight: 500, color: "#9ca3af",
    background: "#f3f4f6", padding: "2px 8px", borderRadius: 10,
  },
  photoRow: { display: "flex", gap: 10 },
  camBtn: {
    flex: 1, height: 44, borderRadius: 12, border: "none",
    background: BLUE, color: "#fff", fontSize: 13, fontWeight: 600,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    cursor: "pointer", fontFamily: "system-ui, sans-serif",
  },
  galleryBtn: {
    flex: 1, height: 44, borderRadius: 12,
    border: `1.5px solid ${BLUE}`, background: "#fff",
    color: BLUE, fontSize: 13, fontWeight: 600,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    cursor: "pointer", fontFamily: "system-ui, sans-serif",
  },
  previewRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  previewBox: { position: "relative", flexShrink: 0 },
  previewImg: { width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: "1px solid #e5e7eb", display: "block" },
  removeBtn: {
    position: "absolute", top: -6, right: -6,
    width: 20, height: 20, borderRadius: "50%",
    background: "#ef4444", color: "#fff", border: "2px solid #fff",
    fontSize: 9, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
  },
  ctaBtn: {
    height: 52, borderRadius: 14, border: "none",
    background: `linear-gradient(135deg, ${BLUE}, ${BLUEM})`,
    color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: "pointer", marginTop: 4,
    fontFamily: "system-ui, sans-serif",
    transition: "opacity .15s",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: "0 4px 14px rgba(30,58,138,0.3)",
  },
  ctaNote: {
    textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: -4,
  },
  backBtn: {
    height: 46, borderRadius: 12,
    border: `1.5px solid ${BLUE}`, background: "#fff",
    color: BLUE, fontSize: 14, fontWeight: 600,
    cursor: "pointer", fontFamily: "system-ui, sans-serif",
  },
};
