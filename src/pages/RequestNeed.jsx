import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { compressImages } from "../lib/compressImage";
import { supabase } from "../lib/supabase";

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

/* ─── Row separator with title ─── */
function SectionTitle({ children }) {
  return (
    <div style={{
      background: "#f7f8fa",
      padding: "10px 16px",
      fontSize: 12,
      fontWeight: 700,
      color: "#666",
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      borderTop: "1px solid #ebebeb",
      borderBottom: "1px solid #ebebeb",
      margin: "0 -16px",
    }}>
      {children}
    </div>
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
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .rn-input:focus { border-color: #1e4b8f !important; box-shadow: 0 0 0 2px rgba(30,75,143,0.1) !important; }
      `}</style>

      {/* ══ SUCCESS MODAL ══ */}
      {sent && sentData && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px",
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "28px 24px",
            maxWidth: 360, width: "100%", textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#f0fdf4", display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
              Solicitud publicada
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, lineHeight: 1.5 }}>
              Los yonkers cercanos te escribirán pronto por WhatsApp.
            </div>
            {sentData.imageUrls.length > 0 && (
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
                {sentData.imageUrls.slice(0, 4).map((url, i) => (
                  <img key={i} src={url} alt="" style={{
                    width: 60, height: 60, borderRadius: 8,
                    objectFit: "cover", border: "1px solid #e5e7eb",
                  }} />
                ))}
              </div>
            )}
            <button onClick={handleShare} style={{
              width: "100%", padding: "13px", borderRadius: 8,
              background: "#25D366", color: "#fff", border: "none",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              marginBottom: 10,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Compartir en WhatsApp
            </button>
            <button
              onClick={() => { setSent(false); setSentData(null); }}
              style={{
                width: "100%", padding: "11px", borderRadius: 8,
                background: "#f3f4f6", color: "#374151", border: "none",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* ══ BANNER DE CONFIANZA ══ */}
        <div style={st.trustBanner}>
          <div style={st.trustItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e4b8f" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>Respuesta directa por WhatsApp</span>
          </div>
          <div style={st.trustDivider} />
          <div style={st.trustItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e4b8f" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Yonkers responden rápido</span>
          </div>
          <div style={st.trustDivider} />
          <div style={st.trustItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e4b8f" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>100% gratis</span>
          </div>
        </div>

        {/* ══ SECCIÓN: INFORMACIÓN DE LA PIEZA ══ */}
        <div style={st.section}>
          <SectionTitle>Información de la pieza</SectionTitle>

          <div style={st.sectionBody}>

            {/* Nombre */}
            <div style={st.field}>
              <label style={st.label}>
                Nombre de la pieza <span style={{ color: "#ff4d4f" }}>*</span>
              </label>
              <input
                className="rn-input"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ej: Pastillas de freno, motor, transmisión..."
                style={st.input}
              />
            </div>

            {/* Marca + Año en fila */}
            <div style={st.row2}>
              <div style={st.field}>
                <label style={st.label}>Marca / Modelo</label>
                <input
                  className="rn-input"
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="Honda Civic"
                  style={st.input}
                />
              </div>
              <div style={st.field}>
                <label style={st.label}>Año</label>
                <input
                  className="rn-input"
                  name="years"
                  value={form.years}
                  onChange={handleChange}
                  placeholder="2018"
                  style={st.input}
                />
              </div>
            </div>

            {/* Ciudad */}
            <div style={st.field}>
              <label style={st.label}>Ciudad</label>
              <input
                className="rn-input"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Ej: Tegucigalpa, San Pedro Sula..."
                style={st.input}
              />
            </div>

            {/* Descripción */}
            <div style={st.field}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label style={st.label}>Detalles adicionales</label>
                <span style={{ fontSize: 11, color: "#bbb" }}>{charLeft} restantes</span>
              </div>
              <textarea
                className="rn-input"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Estado que busca, color, número de parte..."
                maxLength={300}
                style={{ ...st.input, height: 80, resize: "vertical", paddingTop: 10, paddingBottom: 10 }}
              />
            </div>

          </div>
        </div>

        {/* ══ SECCIÓN: FOTOS ══ */}
        <div style={st.section}>
          <SectionTitle>Fotos de referencia (opcional)</SectionTitle>

          <div style={st.sectionBody}>
            <div style={st.photoRow}>
              <button type="button" style={st.photoBtn} onClick={() => cameraRef.current?.click()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Cámara
              </button>
              <button type="button" style={{ ...st.photoBtn, ...st.photoBtnOutline }} onClick={() => galleryRef.current?.click()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                Galería
              </button>
            </div>

            {preview.length > 0 && (
              <div style={st.previewRow}>
                {preview.map((p, i) => (
                  <div key={i} style={{ position: "relative", flexShrink: 0 }}>
                    <img src={p} alt="" style={st.previewImg} />
                    <button type="button" onClick={() => removePhoto(i)} style={st.removeBtn} aria-label="Eliminar">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══ SECCIÓN: CONTACTO ══ */}
        <div style={st.section}>
          <SectionTitle>Datos de contacto</SectionTitle>

          <div style={st.sectionBody}>
            <div style={st.field}>
              <label style={st.label}>
                Número de WhatsApp <span style={{ color: "#ff4d4f" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <div style={st.waBadge}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <input
                  className="rn-input"
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  placeholder="+504 9999-9999"
                  type="tel"
                  style={{ ...st.input, paddingLeft: 48 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ══ CTA ══ */}
        <div style={st.ctaArea}>
          <button
            type="submit"
            disabled={saving}
            style={{ ...st.ctaBtn, opacity: saving ? 0.75 : 1 }}
          >
            {saving
              ? <><Spinner size={16} color="#fff" /> Publicando...</>
              : <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e4b8f" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Publicar solicitud
                </>
            }
          </button>
          <p style={st.ctaNote}>
            Al publicar, los yonkers verán tu solicitud y te escribirán directamente por WhatsApp.
          </p>
        </div>

      </form>

      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" multiple onChange={handleFiles} style={{ display: "none" }} />
      <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />

    </div>
  );
}

/* ─────────────────────────────────────
   STYLES
───────────────────────────────────── */
const st = {
  page: {
    background: "#f7f8fa",
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, sans-serif",
    paddingBottom: 40,
  },

  /* Banner de confianza */
  trustBanner: {
    background: "#fff",
    borderBottom: "1px solid #ebebeb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    padding: "12px 16px",
    gap: 4,
  },
  trustItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    flex: 1,
    fontSize: 10,
    fontWeight: 600,
    color: "#374151",
    textAlign: "center",
    lineHeight: 1.3,
  },
  trustDivider: {
    width: 1,
    height: 32,
    background: "#ebebeb",
    flexShrink: 0,
  },

  /* Secciones estilo Alibaba */
  section: {
    background: "#fff",
    marginBottom: 8,
  },
  sectionBody: {
    padding: "16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  /* Campos */
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: "#333",
  },
  input: {
    height: 42,
    padding: "0 12px",
    border: "1px solid #d9d9d9",
    borderRadius: 6,
    fontSize: 14,
    color: "#111",
    background: "#fff",
    outline: "none",
    transition: "border-color .15s, box-shadow .15s",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "system-ui, sans-serif",
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },

  /* WhatsApp badge */
  waBadge: {
    position: "absolute",
    left: 0, top: 0,
    height: 42, width: 42,
    background: "#16a34a",
    borderRadius: "6px 0 0 6px",
    display: "flex", alignItems: "center", justifyContent: "center",
  },

  /* Fotos */
  photoRow: {
    display: "flex",
    gap: 10,
  },
  photoBtn: {
    flex: 1,
    height: 44,
    borderRadius: 6,
    border: "none",
    background: "#1e4b8f",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    cursor: "pointer",
  },
  photoBtnOutline: {
    background: "#fff",
    border: "1px solid #1e4b8f",
    color: "#1e4b8f",
  },
  previewRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
  },
  previewImg: {
    width: 72, height: 72,
    borderRadius: 6,
    objectFit: "cover",
    border: "1px solid #e5e7eb",
    display: "block",
  },
  removeBtn: {
    position: "absolute", top: -6, right: -6,
    width: 20, height: 20, borderRadius: "50%",
    background: "#ff4d4f", color: "#fff", border: "2px solid #fff",
    fontSize: 9, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
  },

  /* CTA */
  ctaArea: {
    background: "#fff",
    padding: "16px 16px 24px",
    borderTop: "1px solid #ebebeb",
  },
  ctaBtn: {
    width: "100%",
    height: 48,
    borderRadius: 6,
    border: "none",
    background: "#facc15",
    color: "#1e4b8f",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "opacity .15s",
    fontFamily: "system-ui, sans-serif",
    boxShadow: "0 2px 8px rgba(250,204,21,0.4)",
  },
  ctaNote: {
    textAlign: "center",
    fontSize: 11,
    color: "#9ca3af",
    margin: "10px 0 0",
    lineHeight: 1.5,
  },
};
