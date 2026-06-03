# Glyph Studio — Tessera

A single-page web app for designing and collecting **Tessera**: 3D holographic
collectible cards that mark a venue's verified real-world presence. Pure static
files — no build step, no framework, **no runtime network**.

## Run
Open `index.html` directly, or serve the folder statically
(`python3 -m http.server`). Files: `index.html`, `styles.css`, `app.js`,
`favicon.svg`, `hero-hanuman.svg`, and `fonts/` (self-hosted woff2 + `fonts.css`).

## Architecture
- **`currentDesign`** is the single source of truth for the editor's card.
  Mutate it only via `update(patch)` (field edits) or a wholesale replace on
  load/new; then `syncInputsFromState()` / `syncChipsFromState()` push state → DOM.
  `paintCard()` reads ONLY from a design object, never from the DOM inputs.
- **One template (`cardMarkup`) + one painter (`paintCard`)** serve all three
  contexts: the live editor card, gallery thumbnails, and the focus view. The
  whole visual identity is data (the theme) applied as CSS vars on the `.card`
  element — never globally, so each card on a page can look different.
- **Persistence**: `localStorage` key `glyph.designs.v1`, accessed only via
  `loadStore()` / `writeStore()`. Falls back to an in-memory store when storage
  is unavailable (Safari private mode). First run seeds demo designs, gated by
  `glyph.seeded.v1` so emptying the store yourself never re-seeds.
- **Views**: `editor` / `gallery` via `setView()`, plus a focus overlay.

## Themes — the per-venue visual engine
Venues differ too much for one frame (loud punk-Thai vs minimal fine-dining), so
the front face is driven by a **theme object embedded in each design**
(`design.theme`). `THEME_PRESETS` are starting points; selecting one copies it
into the design (`themeCopy`), and that copy is independently editable + exported.

Theme shape:
```
{ preset, name,
  colors:{ bg, surface, ink, soft, accent, accent2, line },
  fonts:{ display, body, tagStyle:'italic'|'normal' },   // CSS font-family strings
  background:'solid'|'gradient'|'halftone',
  frame:{ weight:px, radius:px, frameless:bool },
  heroArt:bool,                       // whether the hero-art slot is active
  rarities:[…enabled rarity ids] }
```
- `paintCard()` maps `colors`→`--p-*` vars, `fonts`→`--p-display/--p-body/--p-tag-style`,
  `frame`→`--p-frame-w/--p-frame-r` (+ `data-frameless`), and sets `data-bg` for
  the background treatment. The front-face CSS reads these vars.
- **Hero art** (`design.heroArtUrl`, an uploaded PNG/SVG → data URL, or a bundled
  path) renders in `.f-hero-art` at `z-index:1` — above the background, below the
  text. Only shown when the theme's `heroArt` is true.
- **Legacy migration**: older designs carry a `palette` string; `getTheme(d)`
  maps it to a preset on the fly (`paletteToPreset`). Never assume `design.palette`.
- Reference themes: **hanuman** (loud — acid yellow + red, self-hosted Anton
  display, halftone grain, skull hero, bold frame) and **bandol** (quiet — ivory,
  fine Cormorant serif, solid bg, hairline frame, no hero).

## Invariants — do NOT break these
1. **Gallery tiles are static thumbnails.** They render a flattened front face
   (`cardMarkup({holo:false, back:false})`, scaled via `.thumb-card`) with NO
   holo / `mix-blend-mode` layers and NO 3D. Full 3D + pointer-driven holo is
   reserved for ONE card at a time (the focus view). This is a performance
   requirement — the gallery must stay smooth with 20+ cards. Thumbnails are
   lazy-painted via `IntersectionObserver`.
2. **The back face and the guilloché seal are Glyph's constant.** Themes restyle
   the FRONT only. The seal keeps its identical structure (guilloché + microtext +
   ✦ emblem) on every theme and is drawn in the card's **ink** color (`getTheme`
   `.colors.ink`) so it always reads, on yellow or ivory alike.
3. **Holo gradients must tile seamlessly.** The moving holo layers
   (`.holo-rainbow/-prism/-gold`) keep `background-size` (percentage
   `background-position` only moves when the image is larger than the box) and
   use a centred, bounded position so the sampled window never crosses the
   gradient's repeat boundary. Each gradient is a clean loop (first stop = last
   stop). Breaking this brings back a visible "reset" seam — tilt fully to test.
4. **The event line is never larger than the venue name.** Hierarchy is
   venue > event > location > date/edition. `fitEventIn` caps the event font
   size below the auto-fit venue-name size. Themes change styling, never the
   front-face structure or the auto-fit/reflow logic.
5. **Fonts are self-hosted** (`fonts/fonts.css`: Cormorant Garamond, Inter, Anton;
   woff2, latin + latin-ext). NEVER reintroduce a Google Fonts / CDN `<link>` —
   the app must render identically with no network. A theme's display/body font
   must reference a self-hosted family (add an `@font-face` when adding one).
6. **No runtime network.** No CDNs, analytics, or remote assets. Logos and hero
   art are user-uploaded, resized to ≤400px longest edge and re-encoded
   (WebP→PNG) before being stored as data URLs. Imported themes are sanitized
   (`sanitizeTheme`) — note the font-name regex blocks CSS injection via `var()`.
7. **The card is a fixed 300×420 art composition.** Its internal spacing/radii
   are deliberately tuned. The 4px spacing scale and radius scale (8 / 12 / 16 /
   pill; shadows `--sh-pop` / `--sh-modal`) apply to the UI chrome, not the card
   face.

## Accessibility & motion
Theme/rarity chips are keyboard-operable (`role="button"`, Enter/Space,
`aria-pressed`); rarities disabled by the active theme are dimmed + inert.
`:focus-visible` rings are global; Escape closes the focus view and the overflow
menu. `prefers-reduced-motion` turns off all animation/transition and freezes the
holographic sweep.

## When changing the card, theme, or holo, re-verify
- tilt the card fully in each direction — no holo seam (invariant 3);
- a gallery of 20+ cards stays smooth and its tiles contain no `.holo` layers (1);
- long venue name + long event still fit, event ≤ name (4), under every theme's font;
- each theme's body text meets WCAG AA against its background (Ivory/Bandol are the
  tight ones — recheck `soft` / `accent` if you touch their colors);
- the seal stays legible on the theme's background (invariant 2).
