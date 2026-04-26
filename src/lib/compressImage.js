/**
 * compressImage.js
 * Reduce el tamaño de una imagen antes de subirla.
 * - Máximo 1280 px en el lado mayor (suficiente para cualquier tarjeta o detalle)
 * - JPEG calidad 0.78 (visualmente igual, ~85% más liviano)
 * - Si el archivo ya es pequeño (< 300 KB) o no es imagen, lo devuelve tal cual.
 *
 * Uso:
 *   import { compressImage } from "../lib/compressImage";
 *   const small = await compressImage(file);
 *   fd.append("images", small);
 */

const MAX_DIM     = 1280;   // px del lado mayor
const QUALITY     = 0.78;
const SKIP_BELOW  = 300 * 1024; // 300 KB

export async function compressImage(file) {
  // No tocar lo que no sea imagen o ya sea pequeño
  if (!file || !file.type?.startsWith("image/")) return file;
  if (file.size <= SKIP_BELOW) return file;

  try {
    const bitmap = await loadBitmap(file);
    const { width, height } = scaledSize(bitmap.width, bitmap.height, MAX_DIM);

    const canvas = document.createElement("canvas");
    canvas.width  = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, width, height);

    // Liberar bitmap
    if (bitmap.close) bitmap.close();

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    );

    if (!blob) return file;

    // Si por alguna razón quedó más grande, devolvemos el original
    if (blob.size >= file.size) return file;

    const newName = (file.name || "photo").replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
  } catch (err) {
    console.warn("compressImage: usando original por error →", err);
    return file;
  }
}

/* ── Helpers ── */
async function loadBitmap(file) {
  // createImageBitmap es la ruta rápida; fallback a <img> si no existe
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch (_) { /* fallback */ }
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src     = URL.createObjectURL(file);
  });
}

function scaledSize(w, h, max) {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w > h ? max / w : max / h;
  return {
    width:  Math.round(w * ratio),
    height: Math.round(h * ratio),
  };
}

/* Comprime un array de archivos en paralelo */
export async function compressImages(files) {
  if (!files?.length) return [];
  return Promise.all(Array.from(files).map(compressImage));
}
