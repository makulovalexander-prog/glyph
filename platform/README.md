# Tessera Platform

Production-shaped MVP scaffold for **Glyph — Tessera**: holographic collectibles
that verify a venue's real-world presence. This is the multi-user, cloud-backed
evolution of the static `index.html` studio (kept in the repo root as the visual
reference). The hand-tuned card/holo/theme engine is ported here verbatim into
React; everything the static app deliberately omitted — accounts, a database, an
API, object storage, minting, and the on-site **tap experience** — is built out.

## Stack

| Concern        | Choice                                                        |
| -------------- | ------------------------------------------------------------ |
| Framework      | Next.js 15 (App Router, RSC) + TypeScript                    |
| Database       | Postgres + Prisma (pooled `DATABASE_URL`, direct `DIRECT_URL`) |
| Auth           | Auth.js / NextAuth v5 (email magic link; dev credentials shim) |
| Media          | Object storage (S3 / Cloudflare R2); `local` driver for dev |
| Styling        | Hand-tuned CSS for the card face + Tailwind for app chrome   |

## Quick start

```bash
cd platform
cp .env.example .env            # fill DATABASE_URL / DIRECT_URL / AUTH_SECRET
npm install
npm run db:push                 # or: npm run db:migrate
npm run db:seed                 # seeds a VERIFIED venue + LIVE edition at /t/demo
npm run dev
```

Then:

- **`/t/demo`** — the tap experience. This is the venue-facing demo: land on the
  edition, see the live 3D holographic Tessera, tap **Collect**, get a serialized
  card. (Sign in first via `/signin` — in dev, type any email.)
- **`/editor`** — the studio (the ported designer).
- **`/gallery`** — your saved designs (static thumbnails).
- **`/collection`** — the Tessera you've collected.

> Fonts are self-hosted (no CDN). `npm` setup copies nothing; the original
> `../fonts/*.woff2` were copied into `public/fonts/` already. Keep it that way —
> the card must render identically with no network (a core invariant).

## Architecture

```
Browser
  ├─ RSC pages (tap / gallery / collection / editor shell)  ── server-rendered, instant paint
  ├─ Client islands (TesseraCard, EditorClient, ClaimClient) ── holo + 3D + interactivity
  └─ fetch → Route Handlers (/api/*)
                    │
        Zod (trust boundary) ─ requireUser() ─ Prisma
                    │
        Postgres (pooled)        Object storage (S3/R2)
```

- **One card engine, three contexts.** `TesseraCard` replaces the static app's
  `cardMarkup` + `paintCard`. `interactive` → full holo + pointer 3D (editor,
  focus, tap); `thumb` → flattened, no holo, no 3D (gallery/collection grids —
  the performance invariant). Theme is applied as CSS vars on the element only,
  never globally, so every card on a page can differ.
- **The tap experience** (`/t/[slug]`) is the product's core loop. The physical
  NFC tag / QR encodes an edition's `tapSlug`. Landing there resolves the edition
  → venue → design, renders the live card, and `ClaimClient` POSTs to
  `/api/claims`. Optional geofencing (`requireGeo`) uses the browser's location.
- **Verification is the gate.** An edition can only go LIVE — and a claim only
  succeeds — for a `VERIFIED` venue. Enforced in the API *and* again in the mint
  transaction, so it can't be bypassed by a stale page.

### Data model (`prisma/schema.prisma`)

`User` ─< `Venue` ─< `Edition` ─< `Claim`, with `Design` (the artwork + theme
JSON) attachable to a venue and reused across editions. `VenueVerification`
records the audit trail. See inline comments for the scaling rationale.

### Scarcity & concurrency (`src/lib/mint.ts`)

Serials are allocated by atomically incrementing `Edition.mintedCount` inside a
transaction, then inserting the `Claim`. Two DB-level uniques are the backstop:

- `@@unique([editionId, serial])` — race-safe scarcity; a serial collision
  triggers a bounded retry.
- `@@unique([editionId, ownerId])` — one card per collector; a repeated tap is
  idempotent (returns the existing card, never a second).

## File structure

```
platform/
├─ prisma/
│  ├─ schema.prisma            # User/Venue/Design/Edition/Claim + Auth tables
│  └─ seed.ts                  # demo venue + LIVE edition (/t/demo)
├─ src/
│  ├─ types/tessera.ts         # Design/Theme types (mirror the static app)
│  ├─ lib/
│  │  ├─ db.ts auth.ts         # Prisma singleton, NextAuth config
│  │  ├─ storage.ts            # S3/R2 + local media adapter (keys, not data URLs)
│  │  ├─ theme.ts seal.ts      # ported theme engine + procedural seal
│  │  ├─ mint.ts               # race-safe claim/serial engine
│  │  ├─ validation.ts api.ts  # zod schemas + route helpers
│  │  ├─ mappers.ts            # DB row → front-end Design
│  │  └─ image-client.ts       # client resize≤400px + upload
│  ├─ components/
│  │  ├─ TesseraCard.tsx       # the one card engine (ported)
│  │  ├─ useCardInteraction.ts # 3D/holo pointer hook
│  │  └─ useAutoFit.ts         # name/event auto-fit (invariant 4)
│  └─ app/
│     ├─ page.tsx              # landing
│     ├─ t/[slug]/             # THE TAP EXPERIENCE (page + ClaimClient)
│     ├─ (dashboard)/          # editor, gallery, collection
│     ├─ signin/               # auth
│     └─ api/                  # designs, venues, venues/verify, editions, claims, uploads, auth
```

## Scaling to millions (what's already in the shape)

- **Stateless app tier** behind a pooler (`DATABASE_URL` via PgBouncer; migrations
  use the un-pooled `DIRECT_URL`). Scales horizontally; serverless-ready.
- **Reads are RSC + cacheable**; the hot tap path is a single indexed `tapSlug`
  lookup. Media is served from a CDN-backed bucket, never the app.
- **Writes funnel through Zod + Prisma transactions**; scarcity is DB-enforced,
  not application-enforced, so it survives concurrency and retries.
- **Media bytes never touch the DB** (keys only), unlike the static app's base64
  localStorage — the single biggest blocker to scale in the original.

## Deliberately stubbed (next steps)

- **Rate limiting** on `/api/claims` and `/api/uploads` (add Upstash/Redis token
  bucket — noted in `validation.ts`/`api.ts`).
- **Admin verification console** (the API + audit model exist; UI is pending).
- **Marketplace / transfers** (the `Claim` ownership model supports it).
- **Presigned direct-to-S3 uploads** for large originals (current path proxies
  already-resized bytes, which is fine at MVP volume).
- **Tests** (the mint engine is the priority unit/integration target).
