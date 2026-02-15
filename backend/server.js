/**
 * Yonkers Backend - server.js
 * Express + Mock IA + Search API (ESTABLE)
 */
const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

/* =========================
   MOCK DATA
========================= */
const pieces = [
  {
    id: 1,
    title: "Caja automática Corolla",
    brand: "Toyota",
    years: "2010–2013",
    yonker: "Yonker El Norte",
    distance: 3.8,
    rating: 4.6,
    status: "alta",
    lat: 15.617,
    lng: -87.952,
  },
  {
    id: 2,
    title: "Puerta delantera Hilux",
    brand: "Toyota",
    years: "2015–2020",
    yonker: "Yonker Los Amigos",
    distance: 2.5,
    rating: 4.8,
    status: "normal",
    lat: 15.611,
    lng: -87.948,
  },
];

/* =========================
   SEARCH PIECES
========================= */
app.get("/api/pieces", (req, res) => {
  try {
    const {
      query = "",
      maxKm = 50,
      rating = 0,
      status = "all",
    } = req.query;

    const q = String(query).toLowerCase();

    const results = pieces.filter((p) => {
      const text = `${p.title} ${p.brand} ${p.years} ${p.yonker}`.toLowerCase();

      if (q && !text.includes(q)) return false;
      if (Number(p.distance) > Number(maxKm)) return false;
      if (Number(p.rating) < Number(rating)) return false;
      if (status !== "all" && p.status !== status) return false;

      return true;
    });

    res.json(results);
  } catch (err) {
    console.error("❌ Error en /api/pieces", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/* =========================
   SEARCH BY PHOTO (MOCK IA)
========================= */
app.post("/api/search/photo", upload.single("image"), async (req, res) => {
  try {
    console.log("📸 Foto recibida:", req.file?.originalname);

    // Simulación IA
    await new Promise((r) => setTimeout(r, 800));

    res.json({
      query: "caja automática toyota corolla",
    });
  } catch (err) {
    console.error("❌ Error en búsqueda por foto", err);
    res.status(500).json({ error: "Error procesando imagen" });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = 3001;
app.listen(PORT, () => {
  console.log(
    `🚀 Backend Yonkers corriendo en http://localhost:${PORT}`
  );
});
