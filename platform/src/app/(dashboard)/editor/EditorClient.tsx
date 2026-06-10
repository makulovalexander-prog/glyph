"use client";
// The studio — ported editor. `design` is the single source of truth; the card
// reads only from it (never from the inputs). Mutate exclusively via update().

import { useRef, useState, useCallback } from "react";
import { TesseraCard, type TesseraCardHandle } from "@/components/TesseraCard";
import { THEME_PRESETS, THEME_ORDER, themeCopy, RARITIES } from "@/lib/theme";
import { RARITY_ID_TO_DB } from "@/types/tessera";
import type { Design, RarityId } from "@/types/tessera";
import { uploadImage } from "@/lib/image-client";

function blankDesign(): Design {
  return {
    id: "draft",
    venueName: "HANUMAN",
    eventLine: "Tasting Menu N° 7",
    location: "Kreuzberg · Berlin",
    date: "28 May 2026",
    edition: "No. 247",
    tagline: "Not a Trend; A Tradition",
    rarity: "holo",
    logoUrl: null,
    heroArtUrl: null,
    theme: themeCopy("onyx"),
  };
}

export function EditorClient({ initial }: { initial?: Design | null }) {
  const cardRef = useRef<TesseraCardHandle>(null);
  const [design, setDesign] = useState<Design>(initial ?? blankDesign());
  const [keys, setKeys] = useState<{ logoKey?: string | null; heroArtKey?: string | null }>({});
  const [savedId, setSavedId] = useState<string | null>(initial?.id ?? null);
  const [status, setStatus] = useState<string>("");

  const update = useCallback((patch: Partial<Design>) => setDesign((d) => ({ ...d, ...patch })), []);

  function selectTheme(id: string) {
    const theme = themeCopy(id);
    const patch: Partial<Design> = { theme };
    if (!theme.rarities.includes(design.rarity)) patch.rarity = theme.rarities[0];
    update(patch);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>, kind: "logo" | "hero") {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const { key, dataUrl } = await uploadImage(f, kind);
      if (kind === "logo") {
        setKeys((k) => ({ ...k, logoKey: key }));
        update({ logoUrl: dataUrl });
      } else {
        setKeys((k) => ({ ...k, heroArtKey: key }));
        update({ heroArtUrl: dataUrl });
      }
    } catch {
      setStatus("Upload failed — try another image.");
    }
  }

  async function save() {
    setStatus("Saving…");
    const payload = {
      venueName: design.venueName,
      eventLine: design.eventLine,
      location: design.location,
      date: design.date,
      edition: design.edition,
      tagline: design.tagline,
      rarity: design.rarity,
      logoKey: keys.logoKey ?? null,
      heroArtKey: keys.heroArtKey ?? null,
      theme: design.theme,
    };
    const res = await fetch(savedId ? `/api/designs/${savedId}` : "/api/designs", {
      method: savedId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) {
      window.location.href = "/signin?callbackUrl=/editor";
      return;
    }
    if (!res.ok) { setStatus("Save failed."); return; }
    const saved = (await res.json()) as Design;
    setSavedId(saved.id);
    setStatus(`${design.venueName || "Design"} saved ✓`);
  }

  return (
    <div className="grid gap-7 md:grid-cols-[340px_1fr]">
      {/* controls */}
      <div className="flex flex-col gap-3">
        <UploadField label="Venue logo (transparent PNG ideal)" onChange={(e) => onFile(e, "logo")} attached={!!design.logoUrl} onClear={() => { setKeys((k) => ({ ...k, logoKey: null })); update({ logoUrl: null }); }} />
        {design.theme.heroArt && (
          <UploadField label="Hero art (central illustration)" onChange={(e) => onFile(e, "hero")} attached={!!design.heroArtUrl} onClear={() => { setKeys((k) => ({ ...k, heroArtKey: null })); update({ heroArtUrl: null }); }} />
        )}

        <Field label="Venue name" value={design.venueName} onChange={(v) => update({ venueName: v })} />
        <Field label="Event" value={design.eventLine} onChange={(v) => update({ eventLine: v })} />
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Location" value={design.location} onChange={(v) => update({ location: v })} />
          <Field label="Date" value={design.date} onChange={(v) => update({ date: v })} />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Edition" value={design.edition} onChange={(v) => update({ edition: v })} />
          <Field label="Tagline" value={design.tagline} onChange={(v) => update({ tagline: v })} />
        </div>

        <div>
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-soft">Theme</span>
          <div className="flex flex-wrap gap-2">
            {THEME_ORDER.map((id) => {
              const t = THEME_PRESETS[id];
              const sel = design.theme.preset === id;
              return (
                <button
                  key={id}
                  onClick={() => selectTheme(id)}
                  style={{ background: t.colors.bg, color: t.colors.ink, border: "0.5px solid " + t.colors.line, boxShadow: sel ? `0 0 0 1.5px ${t.colors.ink}` : undefined }}
                  className="min-w-[60px] flex-1 rounded-lg px-1 py-2 text-[10px] font-medium tracking-wide"
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-soft">Rarity</span>
          <div className="grid grid-cols-2 gap-2">
            {RARITIES.map((r) => {
              const on = design.theme.rarities.includes(r.id);
              const sel = design.rarity === r.id;
              return (
                <button
                  key={r.id}
                  disabled={!on}
                  onClick={() => on && update({ rarity: r.id as RarityId })}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] tracking-wide ${sel ? "border-accent bg-accent/10 text-ink" : "border-line text-soft"} ${!on ? "cursor-not-allowed opacity-30" : ""}`}
                >
                  <span className="text-[13px]">{r.sym}</span> {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-1 flex gap-2">
          <button onClick={save} className="flex-1 rounded-full bg-accent px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#15130E]">Save</button>
          <button onClick={() => { setDesign(blankDesign()); setSavedId(null); setKeys({}); }} className="flex-1 rounded-full border border-line px-4 py-2.5 text-[11px] uppercase tracking-wider text-ink hover:border-accent">New</button>
        </div>
        {status && <p className="text-xs text-soft">{status}</p>}
      </div>

      {/* stage */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-[radial-gradient(circle_at_50%_30%,#1A1A1E_0%,#0A0A0C_70%)] p-8" style={{ minHeight: 560 }}>
        <p className="mb-4 text-[11px] tracking-wider text-soft opacity-70">Drag to rotate · move across to shift the light</p>
        <TesseraCard ref={cardRef} design={design} interactive holo back />
        <div className="mt-6 flex gap-2.5">
          <button onClick={() => cardRef.current?.flip()} className="rounded-full bg-accent px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#15130E]">Flip card</button>
          <button onClick={() => cardRef.current?.reset()} className="rounded-full border border-line px-5 py-2 text-[11px] uppercase tracking-wider text-ink hover:border-accent">Reset</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-soft">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
      />
    </label>
  );
}

function UploadField({ label, onChange, attached, onClear }: { label: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; attached: boolean; onClear: () => void }) {
  return (
    <div>
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-soft">{label}</span>
      <label className="block cursor-pointer rounded-xl border border-dashed border-line bg-panel p-3 text-center hover:border-accent">
        <input type="file" accept="image/*" className="hidden" onChange={onChange} />
        <div className="text-xs text-ink">Tap to upload</div>
        <div className="mt-1 text-[10px] text-soft">resized to ≤400px · stored in object storage</div>
      </label>
      {attached && (
        <div className="mt-2 flex items-center justify-between text-[11px] text-soft">
          <span>Image attached</span>
          <button onClick={onClear} className="rounded border border-line px-2 py-1 text-[10px]">Remove</button>
        </div>
      )}
    </div>
  );
}
