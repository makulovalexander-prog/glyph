"use client";
// Client-side image pipeline — ported from app.js `processLogo`.
// Resize to <=400px longest edge + re-encode (WebP→PNG). Rasterising also
// neutralises any SVG markup/scripts before the bytes ever reach the server.

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

export async function processImage(file: File): Promise<string> {
  const img = await loadImage(await readFileAsDataURL(file));
  const max = 400;
  let w = img.naturalWidth || img.width || 0;
  let h = img.naturalHeight || img.height || 0;
  if (!w || !h) w = h = max;
  if (Math.max(w, h) > max) {
    const s = max / Math.max(w, h);
    w = Math.max(1, Math.round(w * s));
    h = Math.max(1, Math.round(h * s));
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  let out = canvas.toDataURL("image/webp", 0.9);
  if (out.slice(0, 15) !== "data:image/webp") out = canvas.toDataURL("image/png");
  return out;
}

/** Process → upload → return the storage key. */
export async function uploadImage(file: File, kind: "logo" | "hero"): Promise<{ key: string; dataUrl: string }> {
  const dataUrl = await processImage(file);
  const res = await fetch("/api/uploads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind, dataUrl }),
  });
  if (!res.ok) throw new Error("upload failed");
  const { key } = await res.json();
  return { key, dataUrl };
}
