import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { supabase } from "../lib/supabase";

const API = "/api";

const YONKERS_BLUE = "#29408a";
const YONKERS_BLUE_LIGHT = "#3c5bd6";
const YONKERS_YELLOW = "#f5c518";
const INPUT_BG = "#3f3f3f";

function parseImages(images) {
  try {
    if (Array.isArray(images)) return images;
    if (typeof images === "string") {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch {
    return [];
  }
}

export default function Autolote() {
  const initialForm = useMemo(
    () => ({
      title: "",
      brand: "",
      year: "",
      price: "",
      whatsapp: "",
    }),
    []
  );

  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    return () => {
      preview.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [preview]);

  async function getToken() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Error obteniendo sesión:", sessionError);
      return null;
    }

    return session?.access_token || null;
  }

  async function loadVehicles() {
    setLoading(true);
    setError("");

    try {
      const token = await getToken();

      if (!token) {
        setError("Debes iniciar sesión");
        setItems([]);
        return;
      }

      const res = await fetch(`${API}/my/vehicles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "No se pudieron cargar los vehículos");
      }

      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando vehículos:", err);
      setError("Error cargando vehículos");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleFiles(e) {
    const selected = Array.from(e.target.files || []);

    preview.forEach((url) => URL.revokeObjectURL(url));

    setFiles(selected);
    setPreview(selected.map((file) => URL.createObjectURL(file)));
  }

  function resetForm() {
    preview.forEach((url) => URL.revokeObjectURL(url));
    setForm(initialForm);
    setFiles([]);
    setPreview([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Sesión no válida");
      }

      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("brand", form.brand);
      fd.append("year", form.year);
      fd.append("price", form.price);
      fd.append("whatsapp", form.whatsapp);

      files.forEach((file) => {
        fd.append("images", file);
      });

      const res = await fetch(`${API}/vehicles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error al publicar vehículo");
      }

      resetForm();
      setOpen(false);
      await loadVehicles();
    } catch (err) {
      console.error("Error publicando vehículo:", err);
      setError("Error al publicar vehículo");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id) {
    const ok = window.confirm("¿Eliminar vehículo?");
    if (!ok) return;

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Sesión no válida");
      }

      const res = await fetch(`${API}/vehicles/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error al eliminar vehículo");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error eliminando vehículo:", err);
      setError("Error eliminando vehículo");
    }
  }

  return (
    <div style={s.page}>
      <h2 style={s.title}>Mi Autolote</h2>
      <p style={s.subtitle}>Administra tus vehículos publicados</p>

      {error ? <div style={s.error}>{error}</div> : null}

      {!open && (
        <>
          <button style={s.createBtn} onClick={() => setOpen(true)}>
            <Plus size={18} /> Crear publicación
          </button>

          {loading ? (
            <div style={s.empty}>Cargando vehículos...</div>
          ) : items.length === 0 ? (
            <div style={s.empty}>Aún no tienes publicaciones</div>
          ) : (
            <div style={s.grid}>
              {items.map((item) => {
                const imgs = parseImages(item.images);

                return (
                  <div key={item.id} style={s.card}>
                    <div style={s.imageWrapper}>
                      {imgs[0] ? (
                        <img
                          src={imgs[0]}
                          alt={item.title || "Vehículo"}
                          style={s.image}
                        />
                      ) : (
                        <div style={s.noImage}>Sin imagen</div>
                      )}

                      <button
                        type="button"
                        style={s.deleteBtn}
                        onClick={() => deleteItem(item.id)}
                        title="Eliminar vehículo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={s.cardBody}>
                      <div style={s.vehicleTitle}>{item.title || "Vehículo"}</div>

                      <div style={s.meta}>
                        {item.brand || "Sin marca"} • {item.year || "Sin año"}
                      </div>

                      <div style={s.price}>
                        L {Number(item.price || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {open && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Publicar vehículo</h3>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
                style={s.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={s.form}>
              <input
                name="title"
                placeholder="Vehículo"
                value={form.title}
                onChange={handleChange}
                style={s.input}
                required
              />

              <div style={s.row}>
                <input
                  name="brand"
                  placeholder="Marca"
                  value={form.brand}
                  onChange={handleChange}
                  style={s.input}
                />

                <input
                  name="year"
                  placeholder="Año"
                  value={form.year}
                  onChange={handleChange}
                  style={s.input}
                />
              </div>

              <input
                name="price"
                placeholder="Precio"
                value={form.price}
                onChange={handleChange}
                style={s.input}
                inputMode="decimal"
              />

              <input
                name="whatsapp"
                placeholder="WhatsApp"
                value={form.whatsapp}
                onChange={handleChange}
                style={s.input}
              />

              <label style={s.upload}>
                📸 Agregar fotos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  hidden
                  onChange={handleFiles}
                />
              </label>

              {preview.length > 0 && (
                <div style={s.previewGrid}>
                  {preview.map((src, i) => (
                    <img
                      key={`${src}-${i}`}
                      src={src}
                      alt={`Preview ${i + 1}`}
                      style={s.previewImg}
                    />
                  ))}
                </div>
              )}

              <button type="submit" style={s.primaryBtn} disabled={saving}>
                {saving ? "Publicando..." : "Publicar vehículo"}
              </button>

              <button
                type="button"
                style={s.cancelBtn}
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: {
    padding: 30,
    minHeight: "100vh",
    background: "#f4f6fb",
  },

  title: {
    color: YONKERS_BLUE,
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
  },

  subtitle: {
    color: "#6b7280",
    marginTop: 8,
    marginBottom: 20,
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },

  createBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: `linear-gradient(135deg, ${YONKERS_BLUE}, ${YONKERS_BLUE_LIGHT})`,
    color: "#fff",
    border: "none",
    borderRadius: 16,
    padding: "14px 18px",
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 20,
  },

  empty: {
    color: "#6b7280",
    padding: 16,
    background: "#fff",
    borderRadius: 16,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
    gap: 20,
  },

  card: {
    background: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    border: `2px solid ${YONKERS_YELLOW}`,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },

  imageWrapper: {
    position: "relative",
  },

  image: {
    width: "100%",
    height: 160,
    objectFit: "cover",
    display: "block",
  },

  noImage: {
    height: 160,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e5e7eb",
    color: "#6b7280",
  },

  deleteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
  },

  cardBody: {
    padding: 12,
  },

  vehicleTitle: {
    fontWeight: 700,
    color: "#111827",
    marginBottom: 6,
  },

  meta: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 6,
  },

  price: {
    color: YONKERS_BLUE,
    fontWeight: 700,
  },

  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1000,
  },

  modalCard: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 20,
    padding: 24,
    border: `3px solid ${YONKERS_YELLOW}`,
    boxSizing: "border-box",
  },

  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  modalTitle: {
    margin: 0,
    color: "#111827",
  },

  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#111827",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  input: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    border: "none",
    padding: "0 14px",
    background: INPUT_BG,
    color: "#fff",
    boxSizing: "border-box",
    outline: "none",
  },

  row: {
    display: "flex",
    gap: 10,
  },

  upload: {
    background: "#f1f1f1",
    padding: 14,
    borderRadius: 10,
    textAlign: "center",
    cursor: "pointer",
    color: "#111827",
    fontWeight: 600,
  },

  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 6,
  },

  previewImg: {
    width: "100%",
    height: 80,
    objectFit: "cover",
    borderRadius: 10,
    display: "block",
  },

  primaryBtn: {
    background: `linear-gradient(135deg, ${YONKERS_BLUE}, ${YONKERS_BLUE_LIGHT})`,
    color: "#fff",
    border: "none",
    padding: 14,
    borderRadius: 14,
    fontWeight: 700,
    cursor: "pointer",
  },

  cancelBtn: {
    background: "#fff",
    color: YONKERS_BLUE,
    border: `2px solid ${YONKERS_BLUE}`,
    padding: 14,
    borderRadius: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
};