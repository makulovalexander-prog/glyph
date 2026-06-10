// Storage adapter for venue logos + hero art.
//
// In the static app these were base64 data URLs in localStorage — fine for one
// device, fatal at scale (every design row would carry hundreds of KB, and
// localStorage is per-browser). Here, bytes live in object storage (S3/R2) and
// the DB stores only the *key*. `local` driver writes to ./public/uploads for
// dev so you don't need cloud creds to start.
//
// Images are still resized to <=400px longest edge + re-encoded BEFORE upload —
// that happens client-side (see EditorClient) so we never accept raw user bytes.

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const DRIVER = process.env.STORAGE_DRIVER ?? "local";

let s3: S3Client | null = null;
function client(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return s3;
}

export function newKey(prefix: string, ext: string): string {
  const id = crypto.randomBytes(16).toString("hex");
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "bin";
  return `${prefix}/${id}.${safeExt}`;
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  if (DRIVER === "s3") {
    await client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return;
  }
  // local
  const full = path.join(process.cwd(), "public", "uploads", key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, body);
}

export async function deleteObject(key: string): Promise<void> {
  if (DRIVER === "s3") {
    await client().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    return;
  }
  try {
    await unlink(path.join(process.cwd(), "public", "uploads", key));
  } catch {
    /* already gone */
  }
}

/** Resolve a stored key to a public URL the browser can fetch. */
export function publicUrl(key?: string | null): string | null {
  if (!key) return null;
  if (key.startsWith("http")) return key; // already absolute
  if (DRIVER === "s3") {
    const base = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
    return base ? `${base}/${key}` : null;
  }
  return `/uploads/${key}`;
}
