# Glyph Studio — Tessera

A single-page web app for designing and collecting **Tessera**: collectible cards
that mark a venue's verified real-world presence. Pure static files — no build
step, no framework.

> **Creative direction lives in [`CREATIVE-DIRECTION.md`](./CREATIVE-DIRECTION.md).**
> That document is the north star: *loud holographic object, quiet naturally-dyed
> vessel* (kxd × olderbrother). When art direction and the notes below disagree,
> the creative direction wins. **We are mid-pivot into a radically new look** —
> the visual identity below describes the *prototype*, which is being replaced.
> Treat it as movable scaffolding, not as taste to preserve.

## Status: prototype → radical redesign
Everything shipped so far (the two demo themes, the fonts, the fixed card frame,
the guilloché seal, the 300×420 composition) was a **prototype to prove the
mechanic**. None of it is sacred. New fonts, new card geometry, new structure,
new everything is on the table. Do not defend the old look on principle — build
toward `CREATIVE-DIRECTION.md`. The only things that are *not* up for grabs are
the engineering floor below.

## Engineering floor — the only hard rules
These are promises about quality, not taste, and survive any redesign:

1. **No runtime network.** No CDNs, no Google Fonts `<link>`, no analytics, no
   remote assets. The app must render identically offline. Fonts are self-hosted
   woff2; new fonts get a self-hosted `@font-face`. User images (logos / hero art)
   are resized (≤400px longest edge) and re-encoded to data URLs locally.
   Imported themes stay sanitized (`sanitizeTheme`; the font-name regex blocks
   `var()` CSS injection) — keep that even as the theme shape changes.
2. **The gallery stays smooth with 20+ cards.** Whatever the new look, expensive
   per-card effects (3D, pointer-driven holo, heavy blends) cannot all run at once
   across a full gallery. Reserve the heavy treatment for one focused card; keep
   gallery tiles cheap (and lazy-painted). This is perf, not style.
3. **Legibility: WCAG AA.** Body/label text must hit AA contrast against whatever
   ground it sits on, under every theme. Loud is fine; illegible is not.
4. **Respect `prefers-reduced-motion`.** All animation/transition — including any
   holo sweep or CRT effect — freezes, and the layout must read identically
   static. Keep keyboard operability and `:focus-visible` rings.

Everything else — the seal, the card size, the frame, the type hierarchy, the
specific holo gradients, the theme presets — is free to change.

## Architecture (current scaffolding — replaceable, but don't break it by accident)
This is how the code works *today*. Reuse what helps the redesign; rework what
doesn't. Just don't shatter the data flow without intending to.

- **`currentDesign`** is the single source of truth for the editor's card. Mutate
  via `update(patch)` or a wholesale replace on load/new; then
  `syncInputsFromState()` / `syncChipsFromState()` push state → DOM. `paintCard()`
  reads ONLY from a design object, never from the DOM inputs. (This separation is
  worth keeping regardless of look.)
- **One template (`cardMarkup`) + one painter (`paintCard`)** currently serve the
  editor card, gallery thumbnails, and focus view, with visual identity carried as
  CSS vars on the `.card` element (never global) so each card can differ. If the
  redesign wants separate templates per context, that's allowed — just keep the
  "identity is per-card data, not global CSS" idea, since it's what lets one page
  show many venues.
- **Persistence**: `localStorage` key `glyph.designs.v1` via `loadStore()` /
  `writeStore()`, with an in-memory fallback (Safari private mode). First run
  seeds demo designs, gated by `glyph.seeded.v1`. If the design/theme shape
  changes, bump the key or add a migration so old saves don't crash.
- **Views**: `editor` / `gallery` via `setView()`, plus a focus overlay.

## Theme engine (current shape — expected to evolve)
The front face is driven by a per-design theme object (`design.theme`);
`THEME_PRESETS` are starting points copied into the design (`themeCopy`) and then
independently editable + exported. Current shape:
```
{ preset, name,
  colors:{ bg, surface, ink, soft, accent, accent2, line },
  fonts:{ display, body, tagStyle:'italic'|'normal' },
  background:'solid'|'gradient'|'halftone',
  frame:{ weight:px, radius:px, frameless:bool },
  heroArt:bool,
  rarities:[…enabled rarity ids] }
```
`paintCard()` maps these to `--p-*` CSS vars and `data-*` attributes. Extend or
replace this shape freely for the new direction (e.g. dyed-paper tokens, new
background treatments, new holo tiers) — just migrate old saved designs and keep
`getTheme(d)` tolerant of legacy fields (older designs carry a `palette` string
mapped via `paletteToPreset`).

## Verify after visual changes
Match checks to the engineering floor, not the old aesthetic:
- offline load works — no network requests, fonts render (grep for `http`/CDN);
- a 20+ card gallery stays smooth; heavy effects aren't running per-tile;
- text meets WCAG AA on every theme's ground;
- `prefers-reduced-motion` freezes all motion and the layout still reads;
- any moving holo/foil tiles without a visible seam at full tilt (if you keep
  that effect, `background-size` larger than the box + a bounded centred position
  avoids crossing the repeat boundary).
