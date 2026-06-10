# Glyph — Platform Framework

*The operating manual for everything that isn't talking to venues. Alex sells and
directs taste; this document + the AI does the rest. Drafted by Claude 2026-06-10;
Alex edits, reality wins.*

## 0. Division of labor

Alex: venue conversations, partnerships, taste calls, campaign presence.
AI (any session, via `.claude/agents/`): code, content drafts, theme generation,
deploy mechanics, monitoring. The founder checklist (§8) is the short list of
things only Alex can legally/practically do — everything else is delegable.

## 1. Product thesis (one paragraph, keep it honest)

Glyph is **presence-verified digital art**. The card is the product — a unique
piece designed per venue, from corporate-minimal to a spinning vinyl deck. The
cryptography is the *watermark*, not the pitch: it guarantees the art was
acquired by being there. Never say NFT/blockchain/token in anything public; the
moment we need those words, we've drifted off-thesis.

## 2. Tech stack (already half-built — finish, don't rebuild)

| Layer | Choice | Status / why |
|---|---|---|
| Card engine | `studio-v2.html` layered model → port into `platform/` React `TesseraCard` | v2 adds archetypes (poster/classic/minimal/**vinyl module**), 1–5 accent colors, per-layer transforms (the "PowerPoint" feel). Same data-driven invariant: identity = per-card data, never global CSS. |
| App | `platform/` — Next.js 15 + Prisma + Postgres + Auth.js | Exists. Tap page `/t/[slug]`, editor, collection. |
| Hosting | Vercel (app) + Neon (Postgres) + Cloudflare R2 (media) | All have real free tiers; zero servers to manage; deploy = `git push`. |
| Presence crypto | **NFC NTAG 424 DNA** tap points | Each tap emits a one-time cryptographically signed URL (SUN). Server verifies the signature → presence is provable, replay-proof, **no blockchain required**. ~€2–4/chip. This is the "encrypted platform," for real. |
| Theme pipeline | `tools/venue_to_theme.py` | Venue folder → palette + AA-enforced theme + logo data-URL → `themes/generated.js`. Run per new venue. |
| Floor gate | `tools/check_floor.py` + pre-commit | Offline / AA / reduced-motion, enforced on every commit. |

**Migration note:** porting studio-v2's schema into `platform/` needs a Prisma
migration + `getTheme()` tolerance for v1 designs (CLAUDE.md rule). The
tech-lead agent has this context.

## 3. Card engine roadmap (the art platform)

1. **Now (done):** archetypes + arrange mode + venue pipeline + vinyl module.
2. **Next:** more art modules, each a coded template with venue parameters —
   `neon-sign` (flickering tube type), `transit` (departure-board flip),
   `polaroid` (light-grounded, for the quiet venues), `postcard` ("Greetings
   from ___" with stamp + postmark — the campaign motif). A module is ~a day
   each; commission modules like editorial pieces, not features.
3. **Dynamic data on cards:** the vinyl module's "album played that night" is
   the template — small per-event fields the venue sets when issuing an edition
   (set list, menu, guest, weather). This is what makes each card *that night's*
   artifact, not generic merch.
4. **Real artists:** the pipeline generates the *base* theme; the vault note
   [[Collectibles should feature real artists, not AI slop]] stays policy —
   pipeline output is a starting file an artist (or Alex) finishes in the studio.

## 4. AI in the loop

- **Theme generation:** pipeline (mechanical part) + creative-director agent
  reviewing output against the venue's actual vibe (taste part).
- **Venue onboarding:** drop a venue folder in the mood board → run pipeline →
  open studio → adjust → export. Target: under 30 minutes per venue draft.
- **Content:** marketing copy drafts from the campaign brief's language rules
  (never the word NFT; banned-words check is grep-able and in check_floor's
  spirit — keep copy in repo so it's checkable).
- **Ops:** daily brief + journal spine already wired; add a `glyph-pilot` log
  section to the vault project note after each venue meeting (Alex dictates,
  AI files).

## 5. Money

- **Pilot (now):** free for anchor venues. The product is unproven; charge in
  credibility. Costs: chips (~€3 × 10–20), domain (~€10/yr), hosting €0.
- **v1 pricing (test after pilot):** venue subscription €29–79/mo by size —
  includes the design, the tap point, unlimited standard editions; special
  editions (events, artist collabs) as one-off packages €150–500. Collectors
  never pay — scarcity of presence is the value, paywalling collectors kills it.
- **Later options (decide with data):** artist-collab revenue share; event/
  conference packages (the minimal archetype exists for exactly this market —
  conferences pay real money for attendance proof + branded keepsakes).
- **Stripe** when first euro changes hands, not before. (Setup is a founder
  task — §8.)
- *Not financial/legal advice; check German Kleingewerbe/UG thresholds with a
  Steuerberater before invoicing.*

## 6. Signals (what to measure, privacy-light)

- **Per venue:** taps/week, unique collectors, repeat collectors (the retention
  proof venues are buying), edition completion rate.
- **Per card:** collection rate of an edition, time-to-collect-out.
- **Platform:** weekly active collectors, venues live, tap→signup conversion.
- Tooling: own tap events in Postgres (they're already the product's spine) +
  Plausible (cookieless) on the web app. No ad-tech, ever — it would poison the
  "real & rights-based" brand spine ([[MOC - Glyph and the EU vision]]).
- The morning-brief task can read a weekly signals digest into the vault once
  the platform writes a `signals.json` — wire when first venue is live.

## 7. Distribution

1. **The campaign** (see vault: [[Glyph Campaign Brief]]) — pilot-as-spine:
   document the real rollout at 3 anchor venues; postcard visual language;
   manifesto voice. `campaign.html` is the public face; put it at the domain root.
2. **Venue-led distribution is the engine:** every tap point on a counter is a
   billboard the venue *wants* there. Optimize the physical object's design.
3. **Collector loop:** share-a-card renders a flat image with venue branding —
   shared cards advertise the venue, venue reposts, loop closes.
4. **Berlin sequencing:** Kreuzberg/Neukölln independents first (the mood-board
   ten are the target list), then one conference to test the corporate-minimal
   market, then artists' venues (Glyph as exhibition medium).

## 8. Founder checklist — only Alex can do these

1. Domain (suggest: glyph.berlin if free, else getglyph.app) — any registrar.
2. GitHub account/org + push this repo (it's still local-only; this is the
   single biggest operational risk right now — no offsite backup).
3. Vercel account (sign in with GitHub → import repo → `platform/` builds).
4. Neon (or Supabase) Postgres — paste `DATABASE_URL` into Vercel env.
5. Cloudflare account for R2 (media bucket) — keys into Vercel env.
6. Order NTAG 424 DNA tags (e.g. 10–20 units; NXP-authorized sellers).
7. Later, when charging: Stripe + Gewerbe registration.

Each is a sign-up + a paste; the AI can walk any of them click-by-click, but
account creation and credentials are founder-only by design.

## 9. Risks worth respecting

- **Only Alex's laptop holds the code** until §8.2 is done. Do that one today.
- The vinyl card is a demo of a *rights question*: album art/track names on
  cards may need care commercially. Use venue-owned art for pilots.
- "Encrypted art platform" drift: if a pitch starts needing crypto vocabulary
  to sound exciting, return to §1.
- NFC chips can be unglued and walked away with: pilot the boring mitigation
  (venue checks weekly; server flags geographically impossible tap bursts).
