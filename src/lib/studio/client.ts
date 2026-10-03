"use client";

/**
 * Préparation de la photo côté client : décodage, redimensionnement
 * (max 900 px) et compression JPEG avant envoi au backend.
 */

const MAX_DIM = 900;
const QUALITY = 0.85;

async function blobToDataUrl(blob: Blob): Promise<string> {
  const img = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible.");
  ctx.drawImage(img, 0, 0, w, h);
  img.close();

  return canvas.toDataURL("image/jpeg", QUALITY);
}

/** Fichier choisi par le styliste → data URL JPEG compacte. */
export async function fileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choisissez une image (JPEG ou PNG).");
  }
  return blobToDataUrl(file);
}

/** Image d'exemple servie depuis /public → data URL compacte. */
export async function urlToDataUrl(url: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Exemple indisponible.");
  return blobToDataUrl(await r.blob());
}
