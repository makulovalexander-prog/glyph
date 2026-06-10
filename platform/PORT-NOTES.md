# Porting studio-v2 designs into platform/ — working notes

*(Prepared 2026-06-10. The schema already stores design payloads as JSONB, so no
Prisma migration is needed for the v2 shape — this is a contract note.)*

## The v2 design shape (source of truth: `studio-v2.html` `D`)

```json
{
  "theme": "hanuman" | null,
  "arch": "classic|poster|minimal|vinyl|neon|transit|polaroid|postcard",
  "foil": "rainbow|gold|none",
  "colors": { "bg1": "#…", "bg2": "#…", "ink": "#…", "soft": "#…", "line": "#…",
              "accents": ["#…", "…max 5"] },
  "text": { "name": "", "event": "", "loc": "", "date": "", "tag": "", "album": "" },
  "hero": { "src": "data:image/… | null", "x": 0, "y": 0, "scale": 1 },
  "name": { "x": 0, "y": 0, "scale": 1 }
}
```

New since today: four art modules (`neon`, `transit`, `polaroid`, `postcard`).
`polaroid`/`postcard` are **light-grounded**: the renderer overrides ground/ink
to fixed AA-safe paper tones and keeps venue identity in `colors.accents` only.
Any `TesseraCard` port must reproduce that override, or light cards will fail AA.

## Rules the React `TesseraCard` must keep

1. Paint reads ONLY from the design object — never from DOM/inputs.
2. Identity is per-card data (CSS vars set on the card element), never global CSS.
3. `getTheme(d)` stays tolerant of legacy fields: v1 designs carry a `palette`
   string (`paletteToPreset` in app.js) and the v1 theme shape from CLAUDE.md.
   Treat missing `arch` as `classic`, missing `accents` as `[accent]`.
4. Sanitize on import exactly like studio-v2: hex-validate accents, only
   `data:image/` hero src, whitelist arch/foil ids, String() all text fields.
   (The font-name regex / no-`var()` rule from `sanitizeTheme` applies if fonts
   ever become per-design.)
5. Engineering floor travels with the component: no runtime network, one heavy
   card per view (gallery tiles cheap), AA on every ground, reduced-motion
   freezes flicker/flap/spin/holo.

## Mint/edition note

`text.album` generalizes into "per-event dynamic field" (PLATFORM-FRAMEWORK §3.3
— set list, menu, guest, weather). When the platform issues editions, move it to
`edition.dynamicField` and keep `album` as a legacy alias on read.
