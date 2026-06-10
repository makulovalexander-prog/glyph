// Zod schemas — the trust boundary for every write. API routes and server actions
// parse untrusted input through these before touching the DB.

import { z } from "zod";

const rarity = z.enum(["common", "holo", "reverse", "prismatic", "gold"]);

export const themeSchema = z.object({
  preset: z.string().max(24),
  name: z.string().max(40),
  colors: z.object({
    bg: z.string(),
    surface: z.string(),
    ink: z.string(),
    soft: z.string(),
    accent: z.string(),
    accent2: z.string(),
    line: z.string(),
  }),
  fonts: z.object({
    display: z.string().max(120),
    body: z.string().max(120),
    tagStyle: z.enum(["italic", "normal"]),
  }),
  background: z.enum(["solid", "gradient", "halftone"]),
  frame: z.object({
    weight: z.number().min(0).max(8),
    radius: z.number().min(0).max(40),
    frameless: z.boolean(),
  }),
  heroArt: z.boolean(),
  rarities: z.array(rarity).min(1),
});

export const designInput = z.object({
  venueName: z.string().max(80).default(""),
  eventLine: z.string().max(120).default(""),
  location: z.string().max(80).default(""),
  date: z.string().max(40).default(""),
  edition: z.string().max(40).default(""),
  tagline: z.string().max(120).default(""),
  rarity: rarity.default("holo"),
  logoKey: z.string().max(200).nullable().optional(),
  heroArtKey: z.string().max(200).nullable().optional(),
  venueId: z.string().cuid().nullable().optional(),
  theme: themeSchema,
});
export type DesignInput = z.infer<typeof designInput>;

export const venueInput = z.object({
  name: z.string().min(1).max(120),
  location: z.string().max(160).optional(),
  city: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const verificationInput = z.object({
  method: z.enum(["MANUAL_REVIEW", "POSTCARD_CODE", "GEO_CHECKIN", "PARTNER_API"]),
  evidenceUrl: z.string().url().optional(),
  note: z.string().max(500).optional(),
});

export const editionInput = z.object({
  venueId: z.string().cuid(),
  designId: z.string().cuid(),
  rarity: rarity,
  maxSupply: z.number().int().positive().max(1_000_000).nullable().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  requireGeo: z.boolean().default(false),
  geoRadiusM: z.number().int().min(20).max(5000).default(150),
});

export const claimInput = z.object({
  tapSlug: z.string().min(3).max(64),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  deviceHash: z.string().max(128).optional(),
});

export const uploadInput = z.object({
  kind: z.enum(["logo", "hero"]),
  // base64 data URL of an already-resized (<=400px) image, produced client-side.
  dataUrl: z.string().startsWith("data:image/").max(2_500_000),
});
