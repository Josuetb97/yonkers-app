import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const NOTIFY_URL   = `${SUPABASE_URL}/functions/v1/notify-admin-autolote`;

const BENEFITS = [
  { icon: "🚗", title: "Publica tus vehículos",   desc: "Ilimitados, con fotos y precio" },
  { icon: "📲", title: "Clientes por WhatsApp",    desc: "Recibe consultas directas al instante" },
  { icon: "🤖", title: "Yonky IA te recomienda",  desc: "Tu autolote aparece en búsquedas automáticas" },
  { icon: "📍", title: "Visibilidad local",        desc: "Llega a compradores en toda Honduras" },
];

export default function SolicitudAutolote() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", city: "", whatsapp: "", email: "",
    instagram: "", facebook: "", tiktok: "", description: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState("");
  const [done,   setDone]   = useState(false);
  const [step,   setStep]   = useState(1); // 1 = info básica, 2 = redes / descripción

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  /* Validar paso 1 */
  function handleNext(e) {
    e.preventDefault();
    if (!form.name.trim())     { setMsg("El nombre del autolote es obligatorio."); return; }
    if (!form.whatsapp.trim()) { setMsg("El WhatsApp es obligatorio."); return; }
    if (!form.email.trim())    { setMsg("El correo es obligatorio."); return; }
    setMsg("");
    setStep(2);
  }

  /* Enviar solicitud */
  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");

    try {
      /* Insertar en autolote_profiles sin owner_id (se vinculará al aprobarse) */
      const { error } = await supabase.from("autolote_profiles").insert({
        owner_id:    null,
        name:        form.name.trim(),
        city:        form.city.trim(),
        whatsapp:    form.whatsapp.replace(/\D/g, ""),
        email:       form.email.trim().toLowerCase(),
        instagram:   form.instagram.trim(),
        facebook:    form.facebook.trim(),
        tiktok:      form.tiktok.trim(),
        description: form.description.trim(),
        status:      "pending",
        active:      false,
      });
      if (error) throw error;

      /* Notificar al admin por email */
      fetch(NOTIFY_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        form.name.trim(),
          city:        form.city.trim(),
          whatsapp:    form.whatsapp.replace(/\D/g, ""),
          email:       form.email.trim(),
          instagram:   form.instagram.trim(),
          facebook:    form.facebook.trim(),
          tiktok:      form.tiktok.trim(),
          description: form.description.trim(),
        }),
      }).catch(() => {});

      setDone(true);
    } catch (err) {
      setMsg(err.message || "Error enviando la solicitud. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  /* ── Pantalla de éxito ── */
  if (done) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.successIcon}>✅</div>
          <div style={s.successTitle}>¡Solicitud enviada!</div>
          <div style={s.successSub}>
            Revisaremos tu información y te contactaremos al{" "}
            <strong>{form.email || "correo indicado"}</strong>.<br />
            Normalmente respondemos en menos de <strong>24 horas</strong>.
          </div>
          <div style={s.successNote}>
            📱 También puedes escribirnos por WhatsApp si tienes alguna pregunta.
          </div>
          <button onClick={() => navigate("/")} style={s.btnPrimary}>
            ← Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.headerBadge}>AUTOLOTE PARTNER</div>
          <div style={s.headerIcon}>🚘</div>
          <div style={s.title}>Únete como Autolote</div>
          <div style={s.subtitle}>
            Publica tus vehículos y llega a miles de compradores en Honduras.
            Completa el formulario y te contactamos.
          </div>
        </div>

        {/* Beneficios */}
        <div style={s.benefitsGrid}>
          {BENEFITS.map((b) => (
            <div key={b.title} style={s.benefit}>
              <div style={s.benefitIcon}>{b.icon}</div>
              <div>
                <div style={s.benefitTitle}>{b.title}</div>
                <div style={s.benefitDesc}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={s.divider} />

        {/* Indicador de pasos */}
        <div style={s.steps}>
          <StepDot n={1} active={step === 1} done={step > 1} label="Datos básicos" />
          <div style={{ ...s.stepLine, background: step > 1 ? "#16a34a" : "#e2e8f0" }} />
          <StepDot n={2} active={step === 2} done={false} label="Redes y detalles" />
        </div>

        {/* Error */}
        {msg && <div style={s.error}>{msg}</div>}

        {/* ── Paso 1: datos básicos ── */}
        {step === 1 && (
          <form onSubmit={handleNext} style={s.form}>
            <Field label="Nombre de tu autolote *" name="name" value={form.name}
              onChange={handleChange} placeholder="Ej: Autolote El Buen Precio" />

            <div style={s.row}>
              <Field label="Ciudad / Departamento" name="city" value={form.city}
                onChange={handleChange} placeholder="Ej: Tegucigalpa" />
              <Field label="WhatsApp *" name="whatsapp" value={form.whatsapp}
                onChange={handleChange} placeholder="504XXXXXXXX" type="tel" />
            </div>

            <Field label="Correo electrónico *" name="email" value={form.email}
              onChange={handleChange} placeholder="correo@ejemplo.com" type="email" />

            <button type="submit" style={s.btnPrimary}>
              Continuar →
            </button>
          </form>
        )}

        {/* ── Paso 2: redes sociales y descripción ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} style={s.form}>

            <div style={s.socialSection}>
              <div style={s.socialLabel}>Redes sociales <span style={{ fontWeight: 400, color: "#94a3b8" }}>(opcional)</span></div>

              <SocialField name="instagram" value={form.instagram} onChange={handleChange}
                icon={<IgIcon />} color="#E1306C"
                placeholder="@tuautolote o URL completa" label="Instagram" />

              <SocialField name="facebook" value={form.facebook} onChange={handleChange}
                icon={<FbIcon />} color="#1877F2"
                placeholder="usuario o URL completa" label="Facebook" />

              <SocialField name="tiktok" value={form.tiktok} onChange={handleChange}
                icon={<TkIcon />} color="#010101"
                placeholder="@tuautolote" label="TikTok" />
            </div>

            <div style={s.field}>
              <label style={s.label}>
                Cuéntanos sobre tu negocio <span style={{ fontWeight: 400, color: "#94a3b8" }}>(opcional)</span>
              </label>
              <textarea
                name="description" value={form.description} onChange={handleChange}
                placeholder="¿Qué tipo de vehículos vendes? ¿Cuánto tiempo llevas en el negocio? ¿En qué ciudad estás?"
                rows={3}
                style={{ ...s.input, resize: "vertical", fontFamily: "system-ui, sans-serif", height: "auto", padding: "10px 12px" }}
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => { setStep(1); setMsg(""); }} style={s.btnBack}>
                ← Atrás
              </button>
              <button type="submit" disabled={saving} style={{ ...s.btnPrimary, flex: 1, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Enviando…" : "📨 Enviar solicitud"}
              </button>
            </div>

            <p style={s.disclaimer}>
              Al enviar aceptas que revisemos tu información y nos pongamos en contacto contigo.
              No compartiremos tus datos con terceros.
            </p>
          </form>
        )}

        <button onClick={() => navigate("/")} style={s.btnGhost}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function StepDot({ n, active, done, label }) {
  const bg = done ? "#16a34a" : active ? "#1e3a8a" : "#e2e8f0";
  const color = done || active ? "#fff" : "#94a3b8";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%",
        background: bg, color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800,
        transition: "background 0.3s",
      }}>
        {done ? "✓" : n}
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: active ? "#1e3a8a" : "#94a3b8", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <input name={name} value={value} onChange={onChange}
        placeholder={placeholder} type={type}
        style={s.input} />
    </div>
  );
}

function SocialField({ name, value, onChange, icon, color, placeholder, label }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <div style={{ display: "flex", borderRadius: 10, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{
          width: 40, display: "flex", alignItems: "center", justifyContent: "center",
          background: color + "12", borderRight: `1.5px solid ${color}25`, flexShrink: 0,
        }}>
          {icon}
        </div>
        <input name={name} value={value} onChange={onChange}
          placeholder={placeholder}
          style={{ flex: 1, padding: "10px 12px", border: "none", outline: "none", fontSize: 13, background: "transparent" }} />
      </div>
    </div>
  );
}

/* ── SVG Icons ── */
function IgIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="#E1306C" strokeWidth="2"/>
      <circle cx="12" cy="12" r="4" stroke="#E1306C" strokeWidth="2"/>
      <circle cx="17.5" cy="6.5" r="1" fill="#E1306C"/>
    </svg>
  );
}
function FbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}
function TkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#010101">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.22 8.22 0 004.84 1.56V6.82a4.85 4.85 0 01-1.07-.13z"/>
    </svg>
  );
}

/* ── Styles ── */
const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #f0f4ff 0%, #f8fafc 60%)",
    display: "flex", alignItems: "flex-start", justifyContent: "center",
    padding: "24px 16px 40px",
    fontFamily: "'Barlow', system-ui, sans-serif",
  },
  card: {
    width: "100%", maxWidth: 460,
    background: "#fff",
    borderRadius: 20,
    boxShadow: "0 8px 40px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
    padding: "28px 24px",
    display: "flex", flexDirection: "column", gap: 18,
  },

  /* Header */
  header:      { textAlign: "center" },
  headerBadge: {
    display: "inline-block",
    padding: "3px 12px", borderRadius: 20,
    background: "#eff6ff", color: "#1e4b8f",
    fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
    marginBottom: 8,
  },
  headerIcon:  { fontSize: 48, marginBottom: 6 },
  title:       { fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 6 },
  subtitle:    { fontSize: 13, color: "#64748b", lineHeight: 1.6 },

  /* Benefits */
  benefitsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  benefit:      {
    display: "flex", alignItems: "flex-start", gap: 8,
    background: "#f8fafc", borderRadius: 12, padding: "10px 12px",
    border: "1px solid #f1f5f9",
  },
  benefitIcon:  { fontSize: 20, flexShrink: 0 },
  benefitTitle: { fontSize: 12, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 },
  benefitDesc:  { fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.4 },

  divider: { height: 1, background: "#f1f5f9" },

  /* Step indicator */
  steps: { display: "flex", alignItems: "center", justifyContent: "center", gap: 0 },
  stepLine: { flex: 1, height: 2, maxWidth: 60, borderRadius: 2, margin: "0 8px", marginBottom: 16, transition: "background 0.3s" },

  /* Form */
  form:  { display: "flex", flexDirection: "column", gap: 12 },
  row:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 12, fontWeight: 700, color: "#374151" },
  input: {
    height: 42, padding: "0 12px",
    borderRadius: 10, border: "1.5px solid #e2e8f0",
    fontSize: 14, color: "#0f172a", outline: "none",
    width: "100%", boxSizing: "border-box",
    transition: "border-color 0.15s",
    fontFamily: "system-ui, sans-serif",
  },

  socialSection: { display: "flex", flexDirection: "column", gap: 10 },
  socialLabel:   { fontSize: 12, fontWeight: 700, color: "#374151" },

  error: {
    background: "#fef2f2", border: "1px solid #fca5a5",
    color: "#991b1b", borderRadius: 10, padding: "10px 14px", fontSize: 13,
  },

  /* Buttons */
  btnPrimary: {
    background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
    color: "#fff", border: "none",
    borderRadius: 11, padding: "13px 0",
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    width: "100%", transition: "opacity 0.15s",
    fontFamily: "system-ui, sans-serif",
  },
  btnBack: {
    background: "#f1f5f9", color: "#374151",
    border: "none", borderRadius: 11,
    padding: "13px 18px", fontSize: 14, fontWeight: 600,
    cursor: "pointer", flexShrink: 0,
    fontFamily: "system-ui, sans-serif",
  },
  btnGhost: {
    background: "transparent", border: "none",
    color: "#94a3b8", fontSize: 13, cursor: "pointer",
    padding: "4px 0", textAlign: "center",
    fontFamily: "system-ui, sans-serif",
  },

  disclaimer: {
    fontSize: 11, color: "#94a3b8", textAlign: "center",
    margin: 0, lineHeight: 1.6,
  },

  /* Success */
  successIcon:  { fontSize: 56, textAlign: "center" },
  successTitle: { fontSize: 22, fontWeight: 800, color: "#0f172a", textAlign: "center" },
  successSub:   { fontSize: 14, color: "#475569", textAlign: "center", lineHeight: 1.7 },
  successNote:  {
    background: "#f0fdf4", border: "1px solid #bbf7d0",
    borderRadius: 10, padding: "12px 14px",
    fontSize: 13, color: "#166534", textAlign: "center",
  },
};
