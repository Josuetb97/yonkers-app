import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  /* ===============================
     BUILD
  =============================== */
  build: {
    outDir: "dist",
    sourcemap: true,
  },

  /* ===============================
     DEV SERVER
  =============================== */
  server: {
    host: "0.0.0.0", // acceso desde red (celular)
    port: 5173,

    /* 🔥 FIX HMR — el servidor escucha en 0.0.0.0 pero el cliente
       se conecta a localhost (para evitar ERR_ADDRESS_INVALID en browser) */
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
      clientPort: 5173,
    },

    proxy: {
      /* ===============================
         API → BACKEND
      =============================== */
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        secure: false,

        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.error("❌ Proxy error:", err.message);
          });
        },
      },

      /* ===============================
         IMAGES → BACKEND
      =============================== */
      "/uploads": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  /* ===============================
     PREVIEW (PRODUCTION TEST)
  =============================== */
  preview: {
    host: true,
    port: 4173,
  },
});