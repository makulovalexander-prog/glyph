import { requireUser } from "@/lib/auth";
import { uploadInput } from "@/lib/validation";
import { putObject, newKey } from "@/lib/storage";
import { json, fail, guard } from "@/lib/api";

// POST /api/uploads — accept an already-resized (<=400px) data URL from the
// editor, decode it, and store the BYTES in object storage. Returns the key, not
// a data URL — the DB only ever holds keys (see schema/storage rationale).
//
// Re-encoding/rasterisation happens client-side (canvas) before upload, which
// also neutralises any SVG markup/scripts — same defense as the static app.
export async function POST(req: Request) {
  return guard(async () => {
    await requireUser();
    const { kind, dataUrl } = uploadInput.parse(await req.json());

    const m = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
    if (!m) return fail("Expected a base64 image data URL", 422);
    const contentType = m[1];
    const buf = Buffer.from(m[2], "base64");
    if (buf.byteLength > 2_000_000) return fail("Image too large", 413);

    const ext = contentType.split("/")[1]?.replace("+xml", "") ?? "png";
    const key = newKey(kind === "hero" ? "hero" : "logo", ext);
    await putObject(key, buf, contentType);
    return json({ key }, 201);
  });
}
