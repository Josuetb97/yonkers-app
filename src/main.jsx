import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

/* =========================
   MAPBOX CSS (CLAVE)
   🔒 cargar una sola vez
========================= */
import "mapbox-gl/dist/mapbox-gl.css";

/* =========================
   STYLES APP
========================= */
import "./styles/theme.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/responsive.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);
 