# Glyph — Retro spectacle: research & implementation guide

*How to get the Balatro / kxd / pixel-CRT energy into Tessera without breaking
the two-register system or the engineering floor. Researched 2026-06-10.
Working demo: `crt-lab.html`.*

## 0. Where retro lives (the one decision that matters)

CREATIVE-DIRECTION.md already made the call: **the app is a quiet dark room;
the spectacle lives on the object.** The retro direction doesn't change that —
it *sharpens what the object's spectacle is*. CRT, pixel grit, fluorescent
tubes, unfold animations: all of it belongs to the tessera, the focus moment,
the mint moment, and the physical tap point. Never the nav bar.

This is also strategically right (your point): physical interaction — the tap,
a gameboy-style card exchange — feels *more* physical when the digital object
looks like it came from a machine with mass. Flat-design cards feel like web
pages; CRT-glow cards feel like hardware.

## 1. What each reference is actually doing

### Balatro (CRT + catchy cards)
- One full-screen GLSL pipeline: background swirl shader + CRT pass
  (pixelation → RGB mask → scanlines → curvature → chromatic aberration →
  vignette → bloom). Cards themselves get separate foil/holo/polychrome
  shaders — **the same vessel/object split we already use.**
- Key numbers from shader references: curvature factor 0–0.1; scanline
  `sin(uv.y * res * 1.5) * 0.05`; bloom via dual-Kawase blur.
- Lesson: the *table* effect is subtle and constant; the *card* effects are
  loud and per-rarity. Players screenshot cards, not the table.

### kxd (warm fluorescent logo redesigns)
- Recipe per logo: near-black void → ONE warm-fluorescent material (tube glow,
  gradient chrome) → period-correct letterforms → **the unfold animation is
  the product**: logos assemble from their own logic (a tube flickers on, a
  flag unfurls, a stroke draws itself, elements arrive in z-depth).
- The charm is *narrative assembly*, not easing curves: each mark answers
  "how would this object physically turn on?"
- Already applied in `logo-lab.html` (five marks, each with its own assembly
  story). The same principle scales to venue logos on cards: **each venue's
  tessera can have a bespoke "turn-on" choreography** in the focus view.

### The hydra poster (the aesthetic north)
- CRT-photographed-screen look: heavy halftone/dither grid, thermal
  orange-red on black, slight RGB split, bloom blowout on hot areas. It's
  *texture maximalism on one subject* against pure black — exactly the
  poster archetype + thermal palette we have. The takeaway: dither/halftone
  IS the holo-tier texture for loud venues (Hanuman, Ari's).

### Claude Code crab (pixel mascot)
- Tiny pixel sprite, few frames, lots of personality; renders crisp with
  `image-rendering: pixelated`. Takeaway: **the glyph figure (the Ÿ person)
  as an 8×8/16×16 sprite** — walks onto the card on mint, raises arms when
  the tap verifies. A mascot moment, cheap to ship, huge charm-per-byte.

## 2. Implementation matrix (web, offline, floor-safe)

| Effect | Cheapest faithful tech | Cost | Where allowed |
|---|---|---|---|
| Scanlines | `repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 1px, transparent 1px 3px)` overlay | ~0 | focus view, mint, crt-lab |
| Aperture grille (RGB mask) | 3px vertical repeating gradient of faint R/G/B columns, `mix-blend-mode: overlay` | ~0 | same |
| Vignette | one radial-gradient overlay | ~0 | same |
| Curvature | CSS: `border-radius` + slight `perspective` scale; honest barrel distortion needs SVG `feDisplacementMap` or WebGL | low / med | bezel illusion is enough; skip true warp |
| Chromatic aberration | layered `text-shadow` (-1px red, +1px cyan) or duplicated SVG with offsets | ~0 | display type on cards |
| Bloom | `filter: drop-shadow()` ×2 (done in logo-lab); true bloom = SVG `feGaussianBlur` on a brightness-thresholded copy | low | one element at a time |
| Phosphor grain/noise | static: SVG `feTurbulence` baked to a data-URL tile; animated: tiny `<canvas>` noise (~1ms/frame at 160×120 upscaled) | low | crt-lab; static-only on cards |
| Dither/halftone | radial-gradient dot tile (shipped: poster archetype) or ordered-dither the hero image offline through the pipeline | ~0 / build-time | loud venues |
| Pixelation | render small, upscale with `image-rendering: pixelated` | ~0 | sprites, hero art variants |
| Flicker/turn-on | CSS keyframes with steps() (logo-lab `neonFlicker`, `hum`) | ~0 | object register only |
| Split-flap / mechanical | per-char spans + rotateX keyframes (shipped: transit archetype) | low | cards |
| True CRT pipeline (curvature+mask+bloom in one) | WebGL fragment shader on a single `<canvas>` behind ONE card | med-high | **only** the focus/mint moment, never the gallery |

**Floor mapping:** every effect above is local, offline, and freezable. The
rule of thumb that keeps rule 2 (gallery perf): *gradients and overlays
everywhere; filters on one element; canvas/WebGL on one card max; nothing
pointer-driven outside the focused card.* `prefers-reduced-motion` ends every
animation at its resting frame (pattern already used in logo-lab/studio).

## 3. The "turn-on" grammar (kxd applied to Tessera)

Make "collecting" feel like powering on a machine. The focus/mint sequence:

1. **Black.** 2. **Degauss wobble** (one 300ms hue/scale pulse). 3. **Scanlines
resolve** (opacity ramps in). 4. **The venue's own assembly** — neon flickers
on for the neon archetype, flaps spin for transit, platter starts for vinyl,
waveform draws for unkompress. 5. **Foil awakens** (holo opacity 0→full as the
tilt becomes live). 6. **Meta line types itself** (mono, caret, 12 chars/s).

Each archetype already owns step 4 — the grammar is just sequencing what's
built. Estimated work: one `mint.css` + ~40 lines of orchestration JS.

## 4. What NOT to do

- No scanlines/CRT on app chrome (v2's mistake, already reverted).
- No screen-wide WebGL swirl à la Balatro's table — our vessel is matte calm;
  the mood-board's quiet gradients do that job.
- No fake terminal/HUD copy ("SYSTEM ONLINE") — the grit voice lives on cards
  in the collectible register (§7 of CREATIVE-DIRECTION).
- Don't ship animated noise on every card — static grain tile is 95% of the
  look at 0% of the cost.

## 5. Next concrete steps

1. `crt-lab.html` (shipped today) — the focus-moment prototype: bezel,
   scanlines, grille, vignette, turn-on sequence, sprite cameo. Use it to
   tune intensity numbers, then port the chosen values into the studio's
   focus view as `mint.css`.
2. Pipeline addition: optional ordered-dither pass for hero art
   (`venue_to_theme.py --dither`) for the hydra-poster look on loud venues.
3. Pixel sprite sheet for the glyph figure (idle / walk / arms-up), 16×16,
   3 frames each — commission or draw; integrate at mint.

Sources: [Balatro-style GLSL background](https://gist.github.com/mar1lusk1/4677e482375bff4a01956107aef35699) · [GM Shaders CRT mini](https://mini.gmshaders.com/p/gm-shaders-mini-crt) · [Libretro CRT shader docs](https://docs.libretro.com/shader/crt/) · [Advanced CRT shader breakdown](https://sittingduck.itch.io/advanced-crt-shader-for-gamemaker)
