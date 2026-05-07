import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const NOTIFY_URL   = `${SUPABASE_URL}/functions/v1/notify-admin-registration`;

export default function SolicitudYonker({ user, openLogin }) {
  const navigate = useNavigate();

  const [form,    setForm]    = useState({ name: "", city: "", whatsapp: "", description: "" });
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");
  const [done,    setDone]    = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.whatsapp.trim()) {
      setMsg("El nombre y WhatsApp son obligatorios.");
      return;
    }
    if (!user) { openLogin(); return; }

    setSaving(true);
    setMsg("");
    try {
      // Verificar si ya tiene solicitud
      const { data: existing } = await supabase
        .from("yonkers")
        .select("id, status")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (existing) {
        if (existing.status === "approved") {
          navigate("/admin");
          return;
        }
        setMsg(existing.status === "pending"
          ? "Ya tienes una solicitud pendiente. Te notificaremos cuando sea aprobada."
          : "Tu solicitud fue rechazada. Contacta al administrador para más información.");
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("yonkers").insert({
        owner_id:    user.id,
        email:       user.email ?? "",
        name:        form.name.trim(),
        city:        form.city.trim(),
        whatsapp:    form.whatsapp.replace(/\D/g, ""),
        status:      "pending",
        active:      false,
      });
      if (error) throw error;

      // Notificar al admin por email (con JWT para autenticar la request)
      const { data: { session } } = await supabase.auth.getSession();
      fetch(NOTIFY_URL, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          name:        form.name.trim(),
          city:        form.city.trim(),
          whatsapp:    form.whatsapp.replace(/\D/g, ""),
          email:       user.email ?? "",
          description: form.description.trim(),
        }),
      }).catch(() => {});

      setDone(true);
    } catch (err) {
      setMsg(err.message || "Error enviando solicitud. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  /* ── Pantalla de éxito ── */
  if (done) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ fontSize: 56, textAlign: "center", marginBottom: 12 }}>⏳</div>
          <div style={s.title}>¡Solicitud enviada!</div>
          <div style={s.subtitle}>
            Revisaremos tu información y te activaremos pronto.<br />
            <strong>Normalmente tardamos menos de 24 horas.</strong>
          </div>
          <button onClick={() => navigate("/")} style={s.btnSecondary}>
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
          <div style={s.headerIcon}>🏪</div>
          <div style={s.title}>Únete como Yonker</div>
          <div style={s.subtitle}>
            Publica tus piezas y llega a miles de compradores en Honduras
          </div>
        </div>

        {/* Beneficios */}
        <div style={s.benefits}>
          {[
            { icon: "📦", text: "Publica piezas ilimitadas" },
            { icon: "🔔", text: "Recibe solicitudes por WhatsApp" },
            { icon: "🤖", text: "Yonky IA muestra tus piezas automáticamente" },
          ].map((b) => (
            <div key={b.text} style={s.benefit}>
              <span style={s.benefitIcon}>{b.icon}</span>
              <span style={s.benefitText}>{b.text}</span>
            </div>
          ))}
        </div>

        <div style={s.divider} />

        {/* Formulario */}
        {!user ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>
              Primero inicia sesión con tu cuenta de Google o Facebook
            </div>
            <button onClick={openLogin} style={s.btnPrimary}>
              Iniciar sesión para continuar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={s.form}>
            {msg && <div style={s.error}>{msg}</div>}

            <div style={s.field}>
              <label style={s.label}>Nombre de tu yonker / negocio <span style={{ color: "#ef4444" }}>*</span></label>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="Ej: DyM Yonker SPS" required
                style={s.input} />
            </div>

            <div style={s.field}>
              <label style={s.label}>Ciudad / Departamento</label>
              <input name="city" value={form.city} onChange={handleChange}
                placeholder="Ej: San Pedro Sula"
                style={s.input} />
            </div>

            <div style={s.field}>
              <label style={s.label}>WhatsApp (con código de país) <span style={{ color: "#ef4444" }}>*</span></label>
              <input name="whatsapp" value={form.whatsapp} onChange={handleChange}
                placeholder="504XXXXXXXX" required type="tel"
                style={s.input} />
            </div>

            <div style={s.field}>
              <label style={s.label}>Cuéntanos sobre tu negocio <span style={{ color: "#94a3b8", fontWeight: 400 }}>(opcional)</span></label>
              <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="¿Qué tipo de piezas vendes? ¿Cuánto tiempo llevas en el negocio?"
                rows={3} style={{ ...s.input, resize: "vertical", fontFamily: "system-ui,sans-serif" }} />
            </div>

            <button type="submit" disabled={saving} style={{ ...s.btnPrimary, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Enviando…" : "📨 Enviar solicitud"}
            </button>
          </form>
        )}

        <button onClick={() => navigate("/")} style={s.btnBack}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

const s = {
  page:        { minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  card:        { width: "100%", maxWidth: 440, background: "#fff", borderRadius: 18, boxShadow: "0 4px 28px rgba(0,0,0,0.09)", padding: 28, display: "flex", flexDirection: "column", gap: 16 },
  header:      { textAlign: "center" },
  headerIcon:  { fontSize: 48, marginBottom: 8 },
  title:       { fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 4 },
  subtitle:    { fontSize: 13, color: "#64748b", lineHeight: 1.6 },
  benefits:    { display: "flex", flexDirection: "column", gap: 8 },
  benefit:     { display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", borderRadius: 10, padding: "10px 14px" },
  benefitIcon: { fontSize: 20 },
  benefitText: { fontSize: 13, color: "#334155", fontWeight: 500 },
  divider:     { height: 1, background: "#f1f5f9" },
  form:        { display: "flex", flexDirection: "column", gap: 14 },
  field:       { display: "flex", flexDirection: "column", gap: 5 },
  label:       { fontSize: 12, fontWeight: 700, color: "#374151" },
  input:       { padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  error:       { background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", borderRadius: 9, padding: "10px 14px", fontSize: 13 },
  btnPrimary:  { background: "#2563eb", color: "#fff", border: "none", borderRadius: 11, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%" },
  btnSecondary:{ background: "#f1f5f9", color: "#374151", border: "none", borderRadius: 11, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", marginTop: 8 },
  btnBack:     { background: "transparent", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", padding: "6px 0", textAlign: "center" },
};
