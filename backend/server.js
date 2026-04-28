/**
 * Yonkers Backend PRO
 * Supabase Auth + PostgreSQL + Pieces + Requests + Vehicles + Analytics
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const os = require("os");
const { Pool } = require("pg");
const http = require("http");
const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");

const app = express();
const server = http.createServer(app);

/* =========================
   CONFIG
========================= */

const PORT = Number(process.env.PORT || 3001);
const FIXED_LAN_IP = process.env.LAN_IP || "";
const DATABASE_URL = process.env.DATABASE_URL || "";
const NODE_ENV = process.env.NODE_ENV || "development";
const STORAGE_BUCKET = "pieces";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL no está definido en .env");
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY faltan en .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl:
    NODE_ENV === "production" || DATABASE_URL.includes("supabase")
      ? { rejectUnauthorized: false }
      : false,
});

/* =========================
   SUPABASE CLIENT
========================= */

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/* =========================
   HELPERS
========================= */

function getLocalIPv4() {
  const nets = os.networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const family =
        typeof net.family === "string"
          ? net.family
          : net.family === 4
          ? "IPv4"
          : "";

      if (family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }

  return "127.0.0.1";
}

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeText(v, fallback = "") {
  if (v === undefined || v === null) return fallback;
  return String(v).trim();
}

function parsePossibleJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* Crea el bucket público en Supabase si no existe */
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === STORAGE_BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(STORAGE_BUCKET, { public: true });
    console.log(`✅ Bucket "${STORAGE_BUCKET}" creado`);
  } else {
    console.log(`✅ Bucket "${STORAGE_BUCKET}" listo`);
  }
}

/* Sube un archivo (buffer) a Supabase Storage y devuelve la URL pública */
async function uploadToSupabase(file) {
  const cleanName = String(file.originalname || "file")
    .replace(/\s+/g, "_")
    .replace(/[^\w.-]/g, "");
  const filename = `${Date.now()}-${cleanName}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filename, file.buffer, {
      contentType: file.mimetype || "image/jpeg",
      upsert: false,
    });

  if (error) throw new Error(`Supabase Storage: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

function normalizeImages(value) {
  const arr = parsePossibleJsonArray(value);
  return arr.filter(Boolean).map(String);
}

async function deleteUploadedFiles(images = []) {
  const arr = normalizeImages(images);
  for (const img of arr) {
    try {
      // Extraer solo el nombre del archivo de la URL pública
      const filename = img.split("/").pop();
      if (filename) {
        await supabase.storage.from(STORAGE_BUCKET).remove([filename]);
      }
    } catch (_err) {
      // ignorar errores individuales
    }
  }
}

function jsonError(res, status, message) {
  return res.status(status).json({ ok: false, error: message });
}

function extractBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
}

function normalizePhone(phone = "") {
  return String(phone).replace(/\D/g, "");
}

function buildWhatsAppMessage(data = {}) {
  return `
🚗 *NUEVA SOLICITUD DE PIEZA*

🔧 Pieza: ${safeText(data.title, "-")}
🚘 Marca: ${safeText(data.brand, "-")}
📅 Año: ${safeText(data.years, "-")}
📍 Ciudad: ${safeText(data.city, "-")}

📝 Descripción:
${safeText(data.description, "-")}

📲 Cliente:
${safeText(data.whatsapp, "-")}

Enviado desde *YONKERS APP*
  `.trim();
}

/* =========================
   AUTH (SUPABASE)
========================= */

async function auth(req, res, next) {
  const token = extractBearerToken(req);

  if (!token) {
    return jsonError(res, 401, "No autorizado");
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return jsonError(res, 403, "Token inválido o expirado");
    }

    req.user = data.user;
    next();
  } catch {
    return jsonError(res, 403, "Token inválido");
  }
}

/* =========================
   DB INIT
========================= */

async function initDB() {
  // Crear tablas si no existen
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pieces (
      id BIGSERIAL PRIMARY KEY,
      title TEXT DEFAULT '',
      brand TEXT DEFAULT '',
      years TEXT DEFAULT '',
      price NUMERIC DEFAULT 0,
      yonker TEXT DEFAULT '',
      city TEXT DEFAULT '',
      condition TEXT DEFAULT '',
      description TEXT DEFAULT '',
      whatsapp TEXT DEFAULT '',
      images JSONB DEFAULT '[]'::jsonb,
      owner_id UUID,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id BIGSERIAL PRIMARY KEY,
      title TEXT DEFAULT '',
      brand TEXT DEFAULT '',
      year TEXT DEFAULT '',
      price NUMERIC DEFAULT 0,
      whatsapp TEXT DEFAULT '',
      images JSONB DEFAULT '[]'::jsonb,
      owner_id UUID,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS requests (
      id BIGSERIAL PRIMARY KEY,
      title TEXT DEFAULT '',
      brand TEXT DEFAULT '',
      years TEXT DEFAULT '',
      city TEXT DEFAULT '',
      description TEXT DEFAULT '',
      whatsapp TEXT DEFAULT '',
      images JSONB DEFAULT '[]'::jsonb,
      owner_id UUID,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id BIGSERIAL PRIMARY KEY,
      event TEXT,
      page TEXT,
      user_id UUID,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id BIGSERIAL PRIMARY KEY,
      seller_id TEXT NOT NULL,
      score SMALLINT NOT NULL CHECK (score IN (1, -1)),
      comment TEXT DEFAULT '',
      reviewer_session TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Migraciones seguras — piezas
  await pool.query(`
    ALTER TABLE pieces ADD COLUMN IF NOT EXISTS yonker      TEXT    DEFAULT '';
    ALTER TABLE pieces ADD COLUMN IF NOT EXISTS city        TEXT    DEFAULT '';
    ALTER TABLE pieces ADD COLUMN IF NOT EXISTS condition   TEXT    DEFAULT '';
    ALTER TABLE pieces ADD COLUMN IF NOT EXISTS description TEXT    DEFAULT '';
    ALTER TABLE pieces ADD COLUMN IF NOT EXISTS whatsapp    TEXT    DEFAULT '';
    ALTER TABLE pieces ADD COLUMN IF NOT EXISTS images      JSONB   DEFAULT '[]'::jsonb;
    ALTER TABLE pieces ADD COLUMN IF NOT EXISTS owner_id    UUID;
  `);

  // Migraciones seguras — vehículos
  await pool.query(`
    ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS whatsapp  TEXT    DEFAULT '';
    ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS images    JSONB   DEFAULT '[]'::jsonb;
    ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS owner_id  UUID;
  `);

  // Migraciones seguras — solicitudes
  await pool.query(`
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS city        TEXT    DEFAULT '';
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS description TEXT    DEFAULT '';
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS whatsapp    TEXT    DEFAULT '';
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS images      JSONB   DEFAULT '[]'::jsonb;
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS owner_id    UUID;
  `);

  // Verificar columnas críticas de pieces
  const { rows: cols } = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'pieces'
    ORDER BY ordinal_position
  `);
  const colNames = cols.map((c) => c.column_name);
  const required = ["yonker", "city", "condition", "description", "whatsapp", "images", "owner_id"];
  const missing  = required.filter((c) => !colNames.includes(c));

  if (missing.length > 0) {
    console.error("❌ Columnas faltantes en pieces:", missing.join(", "));
    console.error("   Ejecuta: node migrate.js");
    process.exit(1);
  }

  console.log("✅ DB inicializada y migrada");
  console.log("📋 pieces columnas:", colNames.join(", "));
}

/* =========================
   MULTER
========================= */

/* Multer en memoria — los archivos se suben a Supabase Storage */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB por imagen
});

async function collectUploadedImages(req) {
  const files = Array.isArray(req.files) ? req.files : [];
  const imageFiles = files.filter((f) => f.fieldname === "images");
  const urls = [];
  for (const file of imageFiles) {
    const url = await uploadToSupabase(file);
    urls.push(url);
  }
  return urls;
}

/* =========================
   MIDDLEWARE
========================= */

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();

  console.log(`➡️  ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`⬅️  ${res.statusCode} ${req.originalUrl} (${ms}ms)`);
  });

  next();
});

/* =========================
   ROOT
========================= */

app.get("/", (_req, res) => {
  res.json({ ok: true, app: "Yonkers Backend PRO" });
});

/* =========================
   DEBUG TEMPORAL
========================= */
app.get("/api/debug-db", async (req, res) => {
  try {
    const { rows: cols } = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='pieces' ORDER BY ordinal_position`
    );
    const { rows: sample } = await pool.query(`SELECT * FROM pieces LIMIT 3`);
    const dbHost = pool.options?.connectionString?.replace(/:([^@]+)@/, ":***@") || "unknown";
    res.json({ host: dbHost, columns: cols.map(r => r.column_name), sample });
  } catch (err) {
    res.json({ error: err.message });
  }
});

/* =========================
   PIECES — PUBLIC
========================= */

app.get("/api/pieces", async (req, res) => {
  try {
    const query     = safeText(req.query.query).toLowerCase();
    const category  = safeText(req.query.category).toLowerCase();
    const condition = safeText(req.query.condition).toLowerCase();
    const minPrice  = req.query.min_price ? safeNumber(req.query.min_price, null) : null;
    const maxPrice  = req.query.max_price ? safeNumber(req.query.max_price, null) : null;
    const yearFrom  = req.query.year_from ? safeNumber(req.query.year_from, null) : null;
    const yearTo    = req.query.year_to   ? safeNumber(req.query.year_to,   null) : null;
    const yonkerId  = safeText(req.query.owner_id);

    const conditions = [];
    const params = [];

    // Búsqueda por texto
    if (query) {
      params.push(`%${query}%`);
      const i = params.length;
      conditions.push(`(LOWER(title) LIKE $${i} OR LOWER(brand) LIKE $${i} OR LOWER(years) LIKE $${i} OR LOWER(yonker) LIKE $${i} OR LOWER(city) LIKE $${i})`);
    }

    // Filtro de categoría (busca en title)
    if (category && category !== "all") {
      params.push(`%${category}%`);
      conditions.push(`LOWER(title) LIKE $${params.length}`);
    }

    // Filtro de condición
    if (condition) {
      params.push(`%${condition}%`);
      conditions.push(`LOWER(condition) LIKE $${params.length}`);
    }

    // Filtro de precio
    if (minPrice !== null) {
      params.push(minPrice);
      conditions.push(`price >= $${params.length}`);
    }
    if (maxPrice !== null) {
      params.push(maxPrice);
      conditions.push(`price <= $${params.length}`);
    }

    // Filtro de año
    if (yearFrom !== null) {
      params.push(String(yearFrom));
      conditions.push(`CAST(NULLIF(REGEXP_REPLACE(years, '[^0-9]', '', 'g'), '') AS INTEGER) >= $${params.length}`);
    }
    if (yearTo !== null) {
      params.push(String(yearTo));
      conditions.push(`CAST(NULLIF(REGEXP_REPLACE(years, '[^0-9]', '', 'g'), '') AS INTEGER) <= $${params.length}`);
    }

    // Filtro por dueño (para perfil del vendedor)
    if (yonkerId) {
      params.push(yonkerId);
      conditions.push(`owner_id = $${params.length}`);
    }

    let sql = `SELECT * FROM pieces`;
    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(" AND ");
    }
    sql += ` ORDER BY created_at DESC LIMIT 200`;

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error cargando piezas:", err);
    jsonError(res, 500, "No se pudieron cargar las piezas");
  }
});

/* =========================
   PIECES — PRIVATE
========================= */

app.get("/api/my/pieces", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM pieces WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Error cargando mis piezas:", err);
    jsonError(res, 500, "No se pudieron cargar tus piezas");
  }
});

app.post("/api/pieces", auth, upload.any(), async (req, res) => {
  const images = await collectUploadedImages(req);
  const b = req.body;

  const title = safeText(b.title);

  if (!title) {
    await deleteUploadedFiles(images);
    return jsonError(res, 400, "El nombre de la pieza es obligatorio");
  }

  const ownerId = req.user?.id ?? null;
  if (!ownerId) {
    await deleteUploadedFiles(images);
    return jsonError(res, 401, "Usuario no autenticado correctamente");
  }

  const brand     = safeText(b.brand);
  const years     = safeText(b.years);
  const price     = safeNumber(b.price, 0);
  const yonker    = safeText(b.yonker);
  const city      = safeText(b.city);
  const condition = safeText(b.condition);
  const descr     = safeText(b.description);
  const whatsapp  = safeText(b.whatsapp);

  const imagesJson = JSON.stringify(
    Array.isArray(images) ? images.filter(Boolean) : []
  );

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO pieces
        (title, brand, years, price, yonker, city, condition, description, whatsapp, images, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::uuid)
      RETURNING *
      `,
      [title, brand, years, price, yonker, city, condition, descr, whatsapp, imagesJson, ownerId]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error creando pieza:", err);
    await deleteUploadedFiles(images);

    return res.status(500).json({
      ok: false,
      error: "No se pudo crear la pieza",
      detail: err?.detail ?? null,
      message: err?.message ?? null,
      ...(NODE_ENV !== "production" && { stack: err?.stack }),
    });
  }
});

app.delete("/api/pieces/:id", auth, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id) || id <= 0) {
    return jsonError(res, 400, "ID inválido");
  }

  try {
    const { rows: existing } = await pool.query(
      `SELECT * FROM pieces WHERE id = $1`,
      [id]
    );

    if (!existing[0]) {
      return jsonError(res, 404, "Pieza no encontrada");
    }

    if (String(existing[0].owner_id) !== String(req.user.id)) {
      return jsonError(res, 403, "No tienes permiso para eliminar esta pieza");
    }

    const { rows } = await pool.query(
      `DELETE FROM pieces WHERE id = $1 RETURNING *`,
      [id]
    );

    await deleteUploadedFiles(rows[0].images);

    res.json({ ok: true, deleted: rows[0] });
  } catch (err) {
    console.error("❌ Error eliminando pieza:", err);
    jsonError(res, 500, "No se pudo eliminar la pieza");
  }
});

/* =========================
   VEHICLES — PUBLIC
========================= */

app.get("/api/vehicles", async (req, res) => {
  try {
    const query = safeText(req.query.query).toLowerCase();

    let sql = `SELECT * FROM vehicles`;
    const params = [];

    if (query) {
      sql += `
        WHERE
          LOWER(title) LIKE $1
          OR LOWER(brand) LIKE $1
          OR LOWER(year) LIKE $1
      `;
      params.push(`%${query}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT 200`;

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error cargando vehículos:", err);
    jsonError(res, 500, "No se pudieron cargar los vehículos");
  }
});

/* =========================
   VEHICLES — PRIVATE
========================= */

app.get("/api/my/vehicles", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM vehicles WHERE owner_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Error cargando mis vehículos:", err);
    jsonError(res, 500, "No se pudieron cargar tus vehículos");
  }
});

app.post("/api/vehicles", auth, upload.any(), async (req, res) => {
  const images = await collectUploadedImages(req);
  const b = req.body;

  const title = safeText(b.title);

  if (!title) {
    await deleteUploadedFiles(images);
    return jsonError(res, 400, "El título del vehículo es obligatorio");
  }

  const ownerId = req.user?.id ?? null;
  if (!ownerId) {
    await deleteUploadedFiles(images);
    return jsonError(res, 401, "Usuario no autenticado correctamente");
  }

  const imagesJson = JSON.stringify(
    Array.isArray(images) ? images.filter(Boolean) : []
  );

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO vehicles
        (title, brand, year, price, whatsapp, images, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::uuid)
      RETURNING *
      `,
      [
        title,
        safeText(b.brand),
        safeText(b.year),
        safeNumber(b.price),
        safeText(b.whatsapp),
        imagesJson,
        ownerId,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error creando vehículo:", err);
    await deleteUploadedFiles(images);

    return res.status(500).json({
      ok: false,
      error: "No se pudo crear el vehículo",
      detail: err?.detail ?? null,
      message: err?.message ?? null,
      ...(NODE_ENV !== "production" && { stack: err?.stack }),
    });
  }
});

app.delete("/api/vehicles/:id", auth, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id) || id <= 0) {
    return jsonError(res, 400, "ID inválido");
  }

  try {
    const { rows: existing } = await pool.query(
      `SELECT * FROM vehicles WHERE id = $1`,
      [id]
    );

    if (!existing[0]) {
      return jsonError(res, 404, "Vehículo no encontrado");
    }

    if (String(existing[0].owner_id) !== String(req.user.id)) {
      return jsonError(res, 403, "No tienes permiso para eliminar este vehículo");
    }

    const { rows } = await pool.query(
      `DELETE FROM vehicles WHERE id = $1 RETURNING *`,
      [id]
    );

    await deleteUploadedFiles(rows[0].images);

    res.json({ ok: true, deleted: rows[0] });
  } catch (err) {
    console.error("❌ Error eliminando vehículo:", err);
    jsonError(res, 500, "No se pudo eliminar el vehículo");
  }
});

/* =========================
   REQUESTS — PUBLIC
========================= */

app.get("/api/requests", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM requests ORDER BY created_at DESC LIMIT 100`
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Error cargando solicitudes:", err);
    jsonError(res, 500, "No se pudieron cargar las solicitudes");
  }
});

app.post("/api/requests", upload.any(), async (req, res) => {
  const images = await collectUploadedImages(req);
  const b = req.body;

  const title    = safeText(b.title);
  const whatsapp = safeText(b.whatsapp);

  if (!title) {
    await deleteUploadedFiles(images);
    return jsonError(res, 400, "La pieza es obligatoria");
  }

  if (!whatsapp) {
    await deleteUploadedFiles(images);
    return jsonError(res, 400, "El WhatsApp es obligatorio");
  }

  const imagesJson = JSON.stringify(
    Array.isArray(images) ? images.filter(Boolean) : []
  );

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO requests
        (title, brand, years, city, description, whatsapp, images, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
      RETURNING *
      `,
      [
        title,
        safeText(b.brand),
        safeText(b.years),
        safeText(b.city),
        safeText(b.description),
        whatsapp,
        imagesJson,
        null,
      ]
    );

    const request = rows[0];
    const message = buildWhatsAppMessage(request);

    res.json({
      ok: true,
      request,
      whatsapp: {
        phone: normalizePhone(whatsapp),
        message,
        url: `https://wa.me/${normalizePhone(whatsapp)}?text=${encodeURIComponent(message)}`,
      },
    });
  } catch (err) {
    console.error("❌ Error creando solicitud:", err);
    await deleteUploadedFiles(images);

    return res.status(500).json({
      ok: false,
      error: "No se pudo crear la solicitud",
      detail: err?.detail ?? null,
      message: err?.message ?? null,
      ...(NODE_ENV !== "production" && { stack: err?.stack }),
    });
  }
});

/* =========================
   REQUESTS — PRIVATE
========================= */

app.get("/api/my/requests", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM requests WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Error cargando mis solicitudes:", err);
    jsonError(res, 500, "No se pudieron cargar tus solicitudes");
  }
});

app.delete("/api/requests/:id", auth, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id) || id <= 0) {
    return jsonError(res, 400, "ID inválido");
  }

  try {
    const { rows: existing } = await pool.query(
      `SELECT * FROM requests WHERE id = $1`,
      [id]
    );

    if (!existing[0]) {
      return jsonError(res, 404, "Solicitud no encontrada");
    }

    if (
      existing[0].owner_id &&
      String(existing[0].owner_id) !== String(req.user.id)
    ) {
      return jsonError(res, 403, "No tienes permiso para eliminar esta solicitud");
    }

    const { rows } = await pool.query(
      `DELETE FROM requests WHERE id = $1 RETURNING *`,
      [id]
    );

    await deleteUploadedFiles(rows[0].images);

    res.json({ ok: true, deleted: rows[0] });
  } catch (err) {
    console.error("❌ Error eliminando solicitud:", err);
    jsonError(res, 500, "No se pudo eliminar la solicitud");
  }
});

/* =========================
   ANALYTICS
========================= */

app.post("/api/analytics", async (req, res) => {
  try {
    const body = req.body || {};

    const { rows } = await pool.query(
      `
      INSERT INTO analytics_events (event, page, user_id)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [safeText(body.event), safeText(body.page), body.user_id || null]
    );

    res.json({ ok: true, event: rows[0] });
  } catch (err) {
    console.error("❌ Error guardando analytics:", err);
    jsonError(res, 500, "No se pudo guardar el evento");
  }
});

/* =========================
   CHATBOT — YONKY AI
========================= */

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/* Herramientas que GPT puede llamar */
const CHAT_TOOLS = [
  {
    type: "function",
    function: {
      name: "buscar_piezas",
      description: "Busca piezas de autos en el inventario de Yonkers. Úsala cuando el usuario pregunte por alguna pieza, refacción o parte de vehículo.",
      parameters: {
        type: "object",
        properties: {
          query:     { type: "string",  description: "Texto de búsqueda (nombre de pieza, marca, modelo)" },
          city:      { type: "string",  description: "Ciudad en Honduras (ej: San Pedro Sula, Tegucigalpa)" },
          condition: { type: "string",  description: "Condición: 'usado', 'buen estado', 'como nuevo', 'nuevo'" },
          min_price: { type: "number",  description: "Precio mínimo en Lempiras" },
          max_price: { type: "number",  description: "Precio máximo en Lempiras" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "obtener_detalle_pieza",
      description: "Obtiene los detalles completos de una pieza específica por su ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "ID de la pieza" },
        },
        required: ["id"],
      },
    },
  },
];

/* Ejecutar herramientas */
async function runTool(name, input) {
  if (name === "buscar_piezas") {
    const conditions = [];
    const params = [];

    if (input.query) {
      params.push(`%${input.query.toLowerCase()}%`);
      const i = params.length;
      conditions.push(`(LOWER(title) LIKE $${i} OR LOWER(brand) LIKE $${i} OR LOWER(years) LIKE $${i} OR LOWER(yonker) LIKE $${i})`);
    }
    if (input.city) {
      params.push(`%${input.city.toLowerCase()}%`);
      conditions.push(`LOWER(city) LIKE $${params.length}`);
    }
    if (input.condition) {
      params.push(`%${input.condition.toLowerCase()}%`);
      conditions.push(`LOWER(condition) LIKE $${params.length}`);
    }
    if (input.min_price != null) {
      params.push(input.min_price);
      conditions.push(`price >= $${params.length}`);
    }
    if (input.max_price != null) {
      params.push(input.max_price);
      conditions.push(`price <= $${params.length}`);
    }

    let sql = "SELECT id, title, brand, years, yonker, city, price, condition, whatsapp, images, rating FROM pieces";
    if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY created_at DESC LIMIT 6";

    const { rows } = await pool.query(sql, params);
    return rows;
  }

  if (name === "obtener_detalle_pieza") {
    const { rows } = await pool.query("SELECT * FROM pieces WHERE id = $1", [input.id]);
    return rows[0] || null;
  }

  return null;
}

app.post("/api/chat", async (req, res) => {
  if (!openai) {
    return jsonError(res, 503, "OPENAI_API_KEY no configurada en el servidor.");
  }

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonError(res, 400, "Se requiere un array de mensajes.");
  }

  try {
    const systemPrompt = `Eres Yonky, el asistente inteligente de Yonkers App — el marketplace líder de piezas de autos usadas en Honduras.

Tu misión:
- Ayudar a compradores a encontrar piezas específicas en el inventario real
- Identificar qué pieza necesitan según los síntomas del vehículo
- Recomendar yonkers (vendedores) confiables
- Responder preguntas sobre cómo funciona la app

Personalidad: amigable, directo, conoces mucho de mecánica automotriz y del mercado hondureño.

Reglas importantes:
- Cuando el usuario pida una pieza, SIEMPRE usa la herramienta buscar_piezas antes de responder
- Si encuentras piezas, preséntales de forma clara con precio, condición y yonker
- Si no hay resultados, sugiere términos alternativos o ciudades cercanas
- Habla siempre en español, con términos que usan en Honduras
- Sé conciso — respuestas cortas y útiles
- Si el usuario describe síntomas de falla, ayúdalo a identificar la pieza y luego búscala`;

    const gptMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    let finalText = "";
    let piecesFound = [];

    /* Agentic loop — GPT puede llamar herramientas múltiples veces */
    for (let round = 0; round < 5; round++) {
      const response = await openai.chat.completions.create({
        model:       "gpt-4o-mini",
        max_tokens:  1024,
        tools:       CHAT_TOOLS,
        tool_choice: "auto",
        messages:    gptMessages,
      });

      const choice = response.choices[0];

      if (choice.finish_reason === "stop") {
        finalText = choice.message.content || "";
        break;
      }

      if (choice.finish_reason === "tool_calls") {
        gptMessages.push(choice.message);

        const toolResults = [];
        for (const toolCall of choice.message.tool_calls) {
          const args   = JSON.parse(toolCall.function.arguments);
          const result = await runTool(toolCall.function.name, args);

          if (toolCall.function.name === "buscar_piezas" && Array.isArray(result)) {
            piecesFound = result;
          }

          toolResults.push({
            role:         "tool",
            tool_call_id: toolCall.id,
            content:      JSON.stringify(result ?? []),
          });
        }

        gptMessages.push(...toolResults);
        continue;
      }

      break;
    }

    res.json({ text: finalText, pieces: piecesFound });
  } catch (err) {
    console.error("❌ Chat error:", err);
    jsonError(res, 500, "Error al procesar el mensaje: " + err.message);
  }
});

/* =========================
   REVIEWS
========================= */

app.get("/api/reviews/:sellerId", async (req, res) => {
  const sellerId = safeText(req.params.sellerId);
  if (!sellerId) return jsonError(res, 400, "sellerId requerido");

  try {
    const { rows } = await pool.query(
      `SELECT id, score, comment, created_at
       FROM reviews
       WHERE seller_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [sellerId]
    );

    const total    = rows.length;
    const positive = rows.filter((r) => r.score === 1).length;
    const pct      = total > 0 ? Math.round((positive / total) * 100) : null;

    res.json({ reviews: rows, total, positive, pct });
  } catch (err) {
    console.error("❌ Error cargando reseñas:", err);
    jsonError(res, 500, "No se pudieron cargar las reseñas");
  }
});

app.post("/api/reviews", async (req, res) => {
  const { seller_id, score, comment, reviewer_session } = req.body || {};

  if (!seller_id)              return jsonError(res, 400, "seller_id requerido");
  if (score !== 1 && score !== -1) return jsonError(res, 400, "score debe ser 1 o -1");

  try {
    // Evitar reseñas duplicadas del mismo reviewer en el mismo vendedor
    if (reviewer_session) {
      const { rows: existing } = await pool.query(
        `SELECT id FROM reviews WHERE seller_id = $1 AND reviewer_session = $2`,
        [seller_id, String(reviewer_session)]
      );
      if (existing.length > 0) {
        // Actualizar en vez de duplicar
        await pool.query(
          `UPDATE reviews SET score = $1, comment = $2, created_at = NOW()
           WHERE seller_id = $3 AND reviewer_session = $4`,
          [score, safeText(comment), seller_id, String(reviewer_session)]
        );
        return res.json({ ok: true, updated: true });
      }
    }

    await pool.query(
      `INSERT INTO reviews (seller_id, score, comment, reviewer_session)
       VALUES ($1, $2, $3, $4)`,
      [seller_id, score, safeText(comment), safeText(reviewer_session)]
    );

    res.json({ ok: true, updated: false });
  } catch (err) {
    console.error("❌ Error guardando reseña:", err);
    jsonError(res, 500, "No se pudo guardar la reseña");
  }
});

/* =========================
   AI — PARSE REQUEST (Feature #1)
========================= */

/**
 * Extracción basada en reglas cuando OpenAI no está disponible
 */
function extractFromText(text) {
  const t = text.toLowerCase();

  // Año
  const yearMatch = text.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  const years = yearMatch ? yearMatch[0] : "";

  // Marcas comunes
  const brandsList = [
    "honda", "toyota", "nissan", "mitsubishi", "hyundai", "kia",
    "chevrolet", "ford", "mazda", "suzuki", "isuzu", "jeep", "dodge",
    "volkswagen", "subaru", "volvo", "bmw", "mercedes", "audi", "fiat",
    "peugeot", "renault", "seat", "acura", "infiniti", "lexus",
  ];
  const foundBrand = brandsList.find((b) => t.includes(b));
  const brand = foundBrand
    ? foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1)
    : "";

  // Modelos comunes (para añadir al brand)
  const modelsMap = {
    "civic": "Civic", "corolla": "Corolla", "hilux": "Hilux",
    "camry": "Camry", "rav4": "RAV4", "cr-v": "CR-V", "crv": "CR-V",
    "sentra": "Sentra", "altima": "Altima", "tiida": "Tiida",
    "accent": "Accent", "tucson": "Tucson", "sportage": "Sportage",
    "silverado": "Silverado", "f-150": "F-150", "ranger": "Ranger",
    "galaxy": "Galaxy", "rio": "Rio", "picanto": "Picanto",
    "lancer": "Lancer", "outlander": "Outlander", "galant": "Galant",
  };
  let brandFull = brand;
  for (const [key, val] of Object.entries(modelsMap)) {
    if (t.includes(key)) { brandFull = brand ? `${brand} ${val}` : val; break; }
  }

  // Piezas comunes
  const partsMap = [
    ["freno", "Pastillas de freno"],
    ["disco de freno", "Disco de freno"],
    ["motor", "Motor"],
    ["transmisión", "Transmisión"], ["transmision", "Transmisión"],
    ["radiador", "Radiador"],
    ["alternador", "Alternador"],
    ["batería", "Batería"], ["bateria", "Batería"],
    ["llanta", "Llanta"],
    ["rin", "Rin"],
    ["espejo", "Espejo retrovisor"],
    ["retrovisor", "Espejo retrovisor"],
    ["parabrisas", "Parabrisas"],
    ["vidrio", "Vidrio"],
    ["puerta", "Puerta"],
    ["capó", "Capó"], ["capo", "Capó"],
    ["trompa", "Trompa delantera"],
    ["bumper", "Bumper"],
    ["parachoques", "Parachoques"],
    ["amortiguador", "Amortiguador"],
    ["suspensión", "Suspensión"], ["suspension", "Suspensión"],
    ["clutch", "Clutch"],
    ["embrague", "Embrague"],
    ["arranque", "Motor de arranque"],
    ["bomba de agua", "Bomba de agua"],
    ["bomba de gasolina", "Bomba de gasolina"],
    ["dirección", "Dirección"], ["direccion", "Dirección"],
    ["escape", "Escape"],
    ["catalizador", "Catalizador"],
    ["sensor", "Sensor"],
    ["faro", "Faro"],
    ["luz delantera", "Luz delantera"],
    ["compresor", "Compresor de A/C"],
    ["aire acondicionado", "Compresor de A/C"],
    ["culata", "Culata"],
    ["pistón", "Pistón"], ["piston", "Pistón"],
    ["correa", "Correa de distribución"],
    ["cadena de distribución", "Cadena de distribución"],
    ["inyector", "Inyector"],
    ["carburador", "Carburador"],
    ["filtro", "Filtro"],
    ["axle", "Axle / Media luna"],
    ["media luna", "Media luna"],
    ["junta", "Junta"],
    ["empaque", "Empaque de motor"],
  ];
  let title = "";
  for (const [key, val] of partsMap) {
    if (t.includes(key)) { title = val; break; }
  }

  // Ciudades hondureñas
  const citiesMap = [
    ["tegucigalpa", "Tegucigalpa"],
    ["san pedro sula", "San Pedro Sula"],
    ["choloma", "Choloma"],
    ["la ceiba", "La Ceiba"],
    ["el progreso", "El Progreso"],
    ["comayagua", "Comayagua"],
    ["choluteca", "Choluteca"],
    ["danlí", "Danlí"], ["danli", "Danlí"],
    ["juticalpa", "Juticalpa"],
    ["siguatepeque", "Siguatepeque"],
    ["tocoa", "Tocoa"],
  ];
  let city = "";
  for (const [key, val] of citiesMap) {
    if (t.includes(key)) { city = val; break; }
  }

  return { title, brand: brandFull, years, city, description: text };
}

app.post("/api/ai/parse-request", async (req, res) => {
  const text = safeText(req.body?.text);
  if (!text) return jsonError(res, 400, "Se requiere el campo 'text'");

  // Intentar con OpenAI si está disponible
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content: `Eres un asistente de Yonkers App, marketplace hondureño de piezas de autos.
Extrae información de piezas del texto del usuario. Devuelve SOLO JSON válido con estos campos:
{
  "title": "nombre exacto de la pieza necesaria (obligatorio, en español)",
  "brand": "marca y modelo del vehículo (ej: Honda Civic, Toyota Hilux)",
  "years": "año del vehículo solo número (ej: 2015)",
  "city": "ciudad en Honduras donde está el usuario (si la menciona)",
  "description": "descripción breve del problema o necesidad"
}
Si el usuario describe síntomas (ruidos, fallas), identifica qué pieza necesita.
Si no puedes extraer algún campo, usa cadena vacía "".
Responde SOLO el JSON sin markdown ni texto adicional.`,
          },
          { role: "user", content: text },
        ],
      });

      const raw = (completion.choices[0]?.message?.content || "{}").trim();
      // Limpiar posibles backticks de markdown
      const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(clean);
      return res.json({ ok: true, parsed, source: "ai" });
    } catch (err) {
      console.error("⚠️  OpenAI parse-request error, usando fallback:", err.message);
      // Fall through to rule-based extractor
    }
  }

  // Fallback: extracción basada en reglas
  const parsed = extractFromText(text);
  res.json({ ok: true, parsed, source: "rules" });
});

/* =========================
   404 API
========================= */

app.use("/api", (_req, res) => {
  jsonError(res, 404, "Ruta API no encontrada");
});

app.use((err, _req, res, _next) => {
  console.error("❌ Error no controlado:", err);
  jsonError(res, 500, "Error interno del servidor");
});

/* =========================
   START SERVER
========================= */

async function start() {
  try {
    await ensureBucket();
    await initDB();

    server.listen(PORT, "0.0.0.0", () => {
      const ip = FIXED_LAN_IP || getLocalIPv4();

      console.log("================================");
      console.log("🚀 Yonkers Backend PRO");
      console.log(`🌍 http://localhost:${PORT}`);
      console.log(`📱 http://${ip}:${PORT}`);
      console.log(`🛠️  NODE_ENV=${NODE_ENV}`);
      console.log("================================");
    });
  } catch (err) {
    console.error("❌ Error arrancando servidor:", err);
    process.exit(1);
  }
}

process.on("uncaughtException", (err) => {
  console.error("❌ uncaughtException:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ unhandledRejection:", reason);
});

start();
