# Glyph Studio — Tessera

A single-page web app for designing and collecting **Tessera**: 3D holographic
collectible cards that mark a venue's verified real-world presence. Pure static
files — no build step, no framework, **no runtime network**.

## Run
Open `index.html` directly, or serve the folder statically
(`python3 -m http.server`). Files: `index.html`, `styles.css`, `app.js`,
`favicon.svg`, and `fonts/` (self-hosted woff2 + `fonts.css`).

## Architecture
- **`currentDesign`** is the single source of truth for the editor's card.
  Mutate it only via `update(patch)` (field edits) or a wholesale replace on
  load/new; then `syncInputsFromState()` / `syncChipsFromState()` push state → DOM.
  `paintCard()` reads ONLY from a design object, never from the DOM inputs.
- **One template (`cardMarkup`) + one painter (`paintCard`)** serve all three
  contexts: the live editor card, gallery thumbnails, and the focus view.
  Palette is applied per-card (CSS vars on the `.card` element), not globally.
- **Persistence**: `localStorage` key `glyph.designs.v1`, accessed only via
  `loadStore()` / `writeStore()`. Falls back to an in-memory store when storage
  is unavailable (Safari private mode). First run seeds demo designs, gated by
  `glyph.seeded.v1` so emptying the store yourself never re-seeds.
- **Views**: `editor` / `gallery` via `setView()`, plus a focus overlay.

## Invariants — do NOT break these
1. **Gallery tiles are static thumbnails.** They render a flattened front face
   (`cardMarkup({holo:false, back:false})`, scaled via `.thumb-card`) with NO
   holo / `mix-blend-mode` layers and NO 3D. Full 3D + pointer-driven holo is
   reserved for ONE card at a time (the focus view). This is a performance
   requirement — the gallery must stay smooth with 20+ cards. Thumbnails are
   lazy-painted via `IntersectionObserver`.
2. **Holo gradients must tile seamlessly.** The moving holo layers
   (`.holo-rainbow/-prism/-gold`) keep `background-size` (percentage
   `background-position` only moves when the image is larger than the box) and
   use a centred, bounded position so the sampled window never crosses the
   gradient's repeat boundary. Each gradient is a clean loop (first stop = last
   stop). Breaking this brings back a visible "reset" seam — test by tilting the
   card fully in every direction.
3. **The event line is never larger than the venue name.** Hierarchy is
   venue > event > location > date/edition. `fitEventIn` caps the event font
   size below the auto-fit venue-name size.
4. **Fonts are self-hosted** (`fonts/fonts.css`: Cormorant Garamond + Inter,
   woff2, latin + latin-ext). NEVER reintroduce a Google Fonts / CDN `<link>` —
   the app must render identically with no network (restaurant-wifi demos).
5. **No runtime network.** No CDNs, analytics, or remote assets. Logos are
   user-uploaded, resized to ≤400px longest edge and re-encoded (WebP→PNG)
   before being stored as data URLs.
6. **The card is a fixed 300×420 art composition.** Its internal spacing/radii
   are deliberately tuned. The 4px spacing scale and radius scale (8 / 12 / 16 /
   pill; shadows `--sh-pop` / `--sh-modal`) apply to the UI chrome, not the card
   face.

## Accessibility & motion
Palette/rarity chips are keyboard-operable (`role="button"`, Enter/Space,
`aria-pressed`). `:focus-visible` rings are global; Escape closes the focus view
and the overflow menu. `prefers-reduced-motion` turns off all animation/
transition and freezes the holographic sweep.

## When changing the card or holo, re-verify
- tilt the card fully in each direction — no holo seam (invariant 2);
- a gallery of 20+ cards stays smooth and its tiles contain no `.holo` layers (1);
- long venue name + long event still fit, event ≤ name (3);
- every palette's body text meets WCAG AA (Ivory is the tight one — it was tuned
  for this; recheck if you touch its `soft` / `line` colors).
