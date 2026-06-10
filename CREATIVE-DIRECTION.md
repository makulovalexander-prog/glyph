# Glyph — Creative Direction

*Tessera: holographic collectibles that mark a venue's verified real-world presence.*

> **One-line thesis:** A calm, modern dark app — and inside it, holographic
> collectibles that carry the loud energy of 80s foil and gaming culture.
> **The interface is restraint; the tessera is the spectacle.** Chrome, gloss,
> shine, and CRT belong to the cards and *nowhere else*.

This is the north star. It sits beside `CLAUDE.md`: that file governs *what the
code may not break* (the engineering floor); this one governs *what we're trying
to make people feel*. When they disagree, creative direction wins — except the
four engineering-floor rules, which are inviolable.

---

## 1. The core principle — two registers, kept apart

There are exactly two visual registers, and the whole design depends on not
mixing them:

**The vessel (the app)** — a modern, muted, tasteful dark interface. Deep,
near-black grounds with soft ambient gradients (the smooth dark Pinterest
wallpapers — low-saturation indigo / violet / teal washes that bleed quietly into
black). Matte surfaces, hairline borders, generous space, calm typography. It
should feel like a premium contemporary app, not a game menu. **No gloss, no
bevels, no chrome, no scanlines, no HUD telemetry, no “system” glow.** Its job is
to disappear and let the collectibles shine.

**The object (the tessera)** — the spectacle. This is where 80s holographic foil
(kxd) meets gaming-collectible culture (older-brother-core): iridescent oil-slick,
liquid chrome, bloom, CRT shimmer, neon, the rare-pull thrill. All the loudness
the v2 mistakenly smeared across the UI lives *here*, in the card and its focus
moment.

**The relationship:** the app is the dark, quiet room; the tessera is the foil
card catching the light when you pick it up. Gamification refers to gaming culture
*through the collectibles* — not by dressing the chrome up as a console.

### What changed from v2 (read this)
v2 was too "gamer / tryhard": green system glow, beveled faceplates, HUD readouts,
"Blades," scanlines on panels. **All of that is removed from the interface.** The
gaming references didn't disappear — they moved *into the cards*, where they
belong.

### Vessel vs. object (the fork, unchanged)
- **App chrome → muted dark.** Ambient gradients, near-monochrome, one restrained
  accent. Always.
- **Cards → loud, but free to go light.** A venue's tessera can be pale/ivory when
  the place demands it (fine dining, a gallery). The app stays dark regardless.

---

## 2. What the Pinterest tells us (and where each part goes)

The board reads as loud and dark — but now we route each thread to the right
register:

1. **Iridescence / liquid chrome** (oil-slick swirls, "Radiant Drift," CD-glitch
   rainbows) → **the tessera's foil.** The single most-pinned motif; it *is* the
   holo.
2. **Soft dark gradients / neon-lit voids** (UV-purple subway, deep moody washes)
   → **the app background.** This is the tasteful half of the board, and it's the
   model for the interface: black + a quiet, low-saturation glow, never flatly lit.
3. **Thermal reds** (burning "TRUST," rocket exhaust, molten peak) → **card
   accent / rare-tier heat.** A danger note for the loudest cards, not UI color.
4. **Post-Soviet / brat grit** (Tsoi, Бодров, "Я ЗНАЮ КАК НАДО," Cyrillic) →
   **the collectible voice** — card titles, rare-pull copy, achievement moments.
   The app's own copy stays plain and modern.
5. **Aerospace-speed** (Concorde, ARMADA, the jet, alpine precision) → **motion
   feel and card detailing** — velocity + engineering, used with restraint.

**Operating principle (unchanged):** each tessera must be unmistakably *its
venue* — recognizable to a regular before they read the name.

---

## 3. Palette

Two palettes, kept strictly apart by register.

### 3a. The vessel — muted modern dark (the entire app)

```
--bg            #0a0c10   near-black ground (very slightly cool)
--bg-grad-1     #161a2e   muted indigo wash (ambient, low opacity)
--bg-grad-2     #241a30   muted violet wash
--bg-grad-3     #122428   muted teal wash
--surface       #14171d   raised surfaces (panels, sheets)
--surface-2     #1b1f27   inputs, hover
--border        rgba(255,255,255,.07)   hairline only — no bevels
--text          #eceef2   primary
--muted         #9aa0ab   secondary
--faint         #868d9a   tertiary / metadata (AA-safe on dark surfaces)
--accent        #8b8cf0   ONE restrained cool accent (focus/active/links)
--accent-dim    #4a4b86   recessed accent
```
Surfaces are **matte**: soft tonal elevation + a hairline border + a soft, diffuse
shadow. The background carries large, blurred ambient gradients (the three muted
washes) that drift very slowly. The accent is used sparingly — selection, focus
rings, the active nav item — never as decoration. **If the interface has anything
glossy, chrome, or beveled, it's wrong.**

### 3b. The object — the scream (tessera foil + venue accents only)

```
--holo-oilslick   full-spectrum oil-slick sweep (the Radiant-Drift look)
--holo-chrome     liquid silver→steel→white blowout
--neon-uv         #7a3cff   ultraviolet
--neon-cyan       #00e5ff   electric cyan
--neon-acid       #b6ff00   acid green
--thermal         #ff3b1f → #ff8a00   molten red→orange (rare-tier heat)
```
These appear **only** on a card's foil and venue art, and most intensely in the
focus view. They must never leak into the app chrome. (This replaces v2's "system
green" — there is no green in the UI anymore.)

---

## 4. Typography

Calm in the app, loud on the cards.

```
Display →  Anton (self-hosted), used SPARINGLY — the wordmark and the card's venue
           name. Chrome/heat treatments on display type happen on CARDS only; in
           the app the wordmark is flat and quiet.
Body/UI →  Inter (self-hosted) for everything in the interface — nav, labels,
           prose, buttons. Modern, unfussy, mostly sentence case.
Mono →     a self-hosted mono, used only for real data (edition numbers, dates,
           coordinates) at small sizes — NOT as decorative "telemetry."
```
The app's type is mostly Inter at comfortable sizes with real hierarchy and
whitespace — like a well-made modern app. Save ALL-CAPS, chrome gradients, and
heat-warp for the tessera. **Hierarchy on cards stays fixed: venue name > event >
location > date/edition; the event line is never larger than the venue name.** All
fonts self-hosted — no network.

---

## 5. Texture & material — split by register

**The app (matte & quiet):** soft ambient gradients, hairline borders, diffuse
soft shadows, optionally a *very* faint grain for richness (the kind premium dark
apps use — barely perceptible). That's it. No bevels, no brushed metal, no
scanlines, no lens flare in the chrome.

**The tessera (the render):** this is where the 2000s/80s spectacle lives —
- iridescent oil-slick foil + liquid chrome;
- bloom / HDR overexposure on the card's glowing elements;
- chromatic aberration on edges of the focused card and its hero type;
- a CRT scanline shimmer **on the card-focus reveal only** (the "pick it up"
  moment);
- subtle grit/JPEG-crush in the card art so it feels ripped, not sterile.

The contrast between matte room and glossy object is the entire effect. Don't
soften it by leaking shine into the UI, and don't flatten the card to match the UI.

---

## 6. Motion

**App:** smooth, modern, restful. Gentle fades and soft slides, calm easing, no
mechanical overshoot. Ambient background gradients drift slowly. Reduced, tasteful.

**Tessera:** the only thing that moves fast and loud — pointer-driven 3D tilt,
live oil-slick holo, a CRT wink and a little bloom on focus. The rare-pull / mint
moment is allowed to be a genuine spectacle (this is the gamification beat).

`prefers-reduced-motion` freezes all of it (engineering floor): gradients hold,
holo and bloom hold static, transitions become instant, layout reads identically.

---

## 7. Voice & attitude — lives on the collectibles

The board's grit is a *tone*, and it belongs to the **collectible layer**, not the
app shell. Card titles, rare-pull lines, and achievement/mint moments can be
confident, ironic, hard-romantic, anti-conformist — "TRUST — ESTABLISHED," "IT'S
ALREADY YOURS," "Я ЗНАЮ КАК НАДО." That's where gaming/brat culture speaks.

The **app's own copy stays plain and modern** — clear nav, honest empty states,
no meme voice in the settings screen. The personality is concentrated where the
spectacle is, so it reads as intentional rather than try-hard.

---

## 8. Tessera design rules — making a card *be* its venue

1. **Source the palette from the venue's actual light**, then push it loud — the
   foil and accents can be as saturated as the place wants.
2. **Match type/treatment to the venue's voice.** Loud/printed places get heavy
   display + chrome/heat. Fine/quiet places get a lighter cut (and may go
   light-grounded — see the fork in §1).
3. **Hero art = the venue's emblem, not its photo.** One evocative mark, uploaded,
   resized ≤400px, re-encoded to a data URL locally (engineering floor). Holo and
   bloom happen in the foil layers, not the asset.
4. **Background treatment encodes mood:** `neon-void`, `oilslick`, or `solid`/light
   per venue.
5. **Frame/finish carries register:** rich foil edge for loud; thin or frameless
   for quiet/light.
6. **The back is the constant** — one consistent back so a stack of wildly
   different fronts still reads as one collection. (Form open; constancy is the
   point.)
7. **Holo tiles seamlessly** (engineering floor): `background-size` larger than the
   box + bounded centred position; test at full tilt in all four directions.

### Worked translations (the three anchor venues)

**HANUMAN — loud.** Dark ground, acid-green + thermal-red glow, the mortar-pestle
skull as a chrome/heat hero, heavy display, full oil-slick holo. The ceiling for
loud, on purpose.

**The Icelandic bar — cozy.** Near-black wood-shadow ground lit by one warm amber
glow + the single flag-blue cold note; subtle holo as warm light on foil. The
candidate for a **light-grounded** card if you want contrast.

**Schuh Reparaturen / the Institut — romantic-industrial.** Dark ground with one
ember-amber window-glow (from the night shot), brick-red thermal accent, hand-set
condensed display, candle-warm holo. Grandeur glowing from the dark.

---

## 9. Guardrails — where loud stops

Radical is not a license to break what makes Tessera work. The `CLAUDE.md`
engineering floor is inviolable and this direction is built *around* it:

- Gloss/chrome/CRT live on the tessera; the app interface stays matte and muted.
- One card runs the heavy treatment (3D/holo/bloom); gallery tiles stay cheap.
- Holo tiles seamlessly — no reset seam at full tilt.
- Event line ≤ venue name; hierarchy never inverts.
- **WCAG AA** body/label contrast on every ground — easy on the dark app, but
  RE-CHECK any light-grounded card and any text on a glow.
- Fonts self-hosted; **no runtime network, no CDN, ever.**
- `prefers-reduced-motion` freezes all motion; layout reads identically static.

---

*A quiet dark room. A foil card that catches the light. Keep them apart.*
