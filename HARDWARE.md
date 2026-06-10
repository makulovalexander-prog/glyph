# Glyph — Tap-point hardware rundown

*Sourcing + physical design for the presence layer. Researched 2026-06-10.
Ordering is founder checklist §8.6 — this doc makes that a 15-minute task.*

## 1. Chip choice (confirmed: NTAG 424 DNA)

| Chip | Crypto | Use in Glyph |
|---|---|---|
| **NTAG 424 DNA** | AES-128, SUN/SDM: per-tap URL with UID + tap counter + CMAC | **Verified venue tap points.** The signature *is* the product promise. |
| NTAG 424 DNA **TagTamper** | same + one-time tamper loop status in the signed message | Optional later: detects a peeled/moved tag. ~30–50% dearer; pilot can skip. |
| NTAG 213/215 | none (just NDEF) | **Informal tier** (house parties / "any event worth commemorating", vault note [[Glyph - bright green tags and Tap in Tap out]]). Nothing to verify, €0.15–0.35/pc. |

### How the security actually works (server side)
Each tap, the chip rewrites its own URL: `…/t/<slug>?picc_data=<AES-enc(UID+counter)>&cmac=<8-byte CMAC>`.
The server decrypts PICCData with the app's AES key, recomputes the CMAC (NIST
SP 800-38B, even-numbered bytes of the 16-byte output), and checks the counter
is **strictly greater** than the last seen value → replay-proof, clone-resistant,
no app install needed (works from the bare camera/NFC reader).

Reference implementations to crib from when wiring `platform/`:
- NXP application note **AN12196** (the canonical features/hints doc, includes test vectors)
- Python/Flask backends: `lucashenning/ntag424-backend`, `randhawp/ntag424-backend`
- Node: `MxAshUp/ntag424-js` (CMAC verify + SUN decrypt — fits the Next.js stack directly)

**Key management:** tags ship with factory default keys; SDM must be configured
and keys changed at provisioning. Either (a) pay the supplier to pre-encode
(Shop NFC offers preconfigured keys/SUN parameters on request) or (b) provision
ourselves with an Android phone (AndroidCrypto's `Ntag424SdmFeature` app/series
walks the whole flow). For 10–20 pilot tags, self-provisioning is fine and keeps
keys out of third-party hands; key per venue, master key offline.

## 2. Where to buy (EU-friendly, small quantities)

| Supplier | What | Price ballpark | Notes |
|---|---|---|---|
| **Shop NFC** (IT, ships DE) | 424 DNA stickers ø22/ø29mm, on-metal variants, epoxy | **€1.29/pc @ 10 → €0.88 @ 5k** | Cleanest small-batch EU source; preconfiguration service available. |
| **RFID Label** | ø17mm 424 DNA labels | similar | Small-format option for the informal/discreet tier. |
| **ID Cards Direct** (UK) | 424 DNA labels/stickers | similar | UK post-Brexit customs friction — prefer EU. |
| **GoToTags** (US) | inlays, printed cards, holographic overlays | good catalog | Useful later for **holographic overlay** printing (very on-brand); US shipping. |
| Mouser / Digi-Key / Farnell | raw NTAG 424 DNA ICs | <€1/chip | Bare ICs, not converted tags — only relevant at manufacturing scale. |

Pilot math: 20 × ~€1.30 + shipping ≈ **€30–40 all-in** for every anchor venue
plus spares — matches PLATFORM-FRAMEWORK §5.

## 3. The physical object (concepts)

The tap point is a billboard the venue wants on its counter (§7.2). Two tiers:

### a) The verified puck — "the seal"
- **Form:** 30–40mm epoxy-domed disc or hex, 3mm profile, 3M adhesive.
  **Hexagon ties it to the hex-seal mark in `logo-lab.html`** — the physical
  object and the card-back become the same shape. Epoxy dome = glossy, scratch-
  resistant, waterproof, wipeable (bar counters).
- **Anti-metal (ferrite-backed) version mandatory for metal counters/taps** —
  a plain sticker dies on metal. Shop NFC stocks 424 DNA on-metal variants.
- **Finish:** bright **Glyph green** ground (vault: instant recognizability)
  with the glyph figure or hex seal; suppliers (Shop NFC, Seritag, scivas)
  custom-print epoxy tags in custom shapes. Optional v2: golden/silver epoxy
  on-metal for the fine-dining venues (Bandol, Dae Mon) where acid green is wrong.
- **Copy on the puck:** just "**TAP IN**" + the mark. The puck is the campaign.

### b) The informal sticker — "the spore"
NTAG 213 paper/PET stickers, same green + figure, sold/given in sheets. They
write a plain URL (no crypto, marked "unverified" in the app). House parties,
guitar cases, dorm doors — distribution as graffiti. ~€0.20/pc means they can
be given away free at every pilot venue.

### Mounting & theft (framework §9 mitigation)
3M 468MP adhesive + epoxy dome is effectively single-use to remove (destroys
itself). Server flags geographically-impossible tap bursts; venue glance-check
weekly. TagTamper upgrade only if pilots show actual walk-offs.

## 4. Pilot order (when you do §8.6)

1. **20 × NTAG 424 DNA ø29mm stickers** (Shop NFC) — provisioning stock + flat mounts. ~€26
2. **10 × NTAG 424 DNA on-metal epoxy discs** — the real counter pucks. ~€25–35
3. **50 × NTAG 213 stickers** (any EU shop) — informal tier experiments. ~€10
4. Later, custom-printed hex pucks once the mark is locked (MOQ usually 100;
   ~€1.5–2.5/pc printed — order after 2–3 venues are live, not before).

Sources: [NXP NTAG 424 DNA](https://www.nxp.com/products/rfid-nfc/nfc-hf/ntag-for-tags-and-labels/ntag-424-dna-424-dna-tagtamper-advanced-security-and-privacy-for-trusted-iot-applications:NTAG424DNA) · [AN12196](https://www.nxp.com/docs/en/application-note/AN12196.pdf) · [Shop NFC NTAG DNA](https://shopnfc.com/en/70-ntag-dna) · [ø29mm stickers](https://www.shopnfc.com/en/nfc-stickers/313-nfc-stickers-ntag424-dna-29mm.html) · [on-metal range](https://shopnfc.com/en/6-on-metal-nfc-tags) · [RFID Label ø17mm](https://www.rfidlabel.com/product/iso14443a-nfc-label-17mm-nxp-ntag424-dna/) · [GoToTags](https://store.gototags.com/nfc-tags/nfc-tags-by-use/nxp-ntag-424-dna-nfc-tags/) · [ID Cards Direct](https://www.idcardsdirect.co.uk/ntag-424-dna-rfid-nfc-labels-stickers.html) · [ntag424-backend (Flask)](https://github.com/lucashenning/ntag424-backend) · [ntag424-js (Node)](https://github.com/MxAshUp/ntag424-js) · [Ntag424SdmFeature (provisioning)](https://github.com/AndroidCrypto/Ntag424SdmFeature) · [Seritag epoxy table tags](https://seritag.com/nfc-tags/epoxy-nfc-table-tag)
