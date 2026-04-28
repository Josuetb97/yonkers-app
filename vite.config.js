import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  cacheDir: "/tmp/vite-cache",
  build: { outDir: "dist", sourcemap: true },
  server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: { protocol: "ws", host: "localhost", port: 5173, clientPort: 5173 },
    proxy: {
      "/api": { target: "http://127.0.0.1:3001", changeOrigin: true, secure: false },
      "/uploads": { target: "http://127.0.0.1:3001", changeOrigin: true, secure: false },
    },
  },
  preview: { host: true, port: 4173 },
});
