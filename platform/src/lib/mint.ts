// Mint / claim engine — the heart of the tap experience.
//
// Scarcity & concurrency: serials are allocated by atomically incrementing
// Edition.mintedCount inside a transaction, then inserting the Claim with that
// serial. @@unique([editionId, serial]) is the backstop — if two taps race past
// the supply check, at most one insert per serial survives and we retry. The
// @@unique([editionId, ownerId]) makes a repeated tap by the same collector
// idempotent (they get their existing card back, not a second one).

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ClaimResult =
  | { ok: true; claimToken: string; serial: number; alreadyOwned: boolean }
  | { ok: false; reason: ClaimError };

export type ClaimError =
  | "NOT_FOUND"
  | "NOT_LIVE"
  | "NOT_STARTED"
  | "ENDED"
  | "SOLD_OUT"
  | "OUT_OF_RANGE"
  | "VENUE_UNVERIFIED";

function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

interface ClaimArgs {
  tapSlug: string;
  userId: string;
  lat?: number;
  lng?: number;
  deviceHash?: string;
}

export async function claimByTapSlug(args: ClaimArgs): Promise<ClaimResult> {
  const edition = await prisma.edition.findUnique({
    where: { tapSlug: args.tapSlug },
    include: { venue: true },
  });
  if (!edition) return { ok: false, reason: "NOT_FOUND" };
  if (edition.venue.status !== "VERIFIED") return { ok: false, reason: "VENUE_UNVERIFIED" };
  if (edition.status !== "LIVE") return { ok: false, reason: "NOT_LIVE" };

  const now = new Date();
  if (edition.startsAt && now < edition.startsAt) return { ok: false, reason: "NOT_STARTED" };
  if (edition.endsAt && now > edition.endsAt) return { ok: false, reason: "ENDED" };

  if (edition.requireGeo) {
    if (args.lat == null || args.lng == null || edition.venue.lat == null || edition.venue.lng == null)
      return { ok: false, reason: "OUT_OF_RANGE" };
    const dist = haversineM(args.lat, args.lng, edition.venue.lat, edition.venue.lng);
    if (dist > edition.geoRadiusM) return { ok: false, reason: "OUT_OF_RANGE" };
  }

  // Idempotency: already own one from this edition? Return it.
  const existing = await prisma.claim.findUnique({
    where: { editionId_ownerId: { editionId: edition.id, ownerId: args.userId } },
  });
  if (existing) {
    return { ok: true, claimToken: existing.claimToken, serial: existing.serial, alreadyOwned: true };
  }

  // Allocate a serial with bounded retries against the unique constraints.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const ed = await tx.edition.update({
          where: { id: edition.id },
          data: { mintedCount: { increment: 1 } },
          select: { mintedCount: true, maxSupply: true },
        });
        if (ed.maxSupply != null && ed.mintedCount > ed.maxSupply) {
          // Roll back the increment by throwing — transaction is atomic.
          throw new SoldOut();
        }
        const claim = await tx.claim.create({
          data: {
            editionId: edition.id,
            ownerId: args.userId,
            serial: ed.mintedCount,
            tapLat: args.lat,
            tapLng: args.lng,
            deviceHash: args.deviceHash,
          },
          select: { claimToken: true, serial: true },
        });
        return claim;
      });
      return { ok: true, claimToken: result.claimToken, serial: result.serial, alreadyOwned: false };
    } catch (e) {
      if (e instanceof SoldOut) return { ok: false, reason: "SOLD_OUT" };
      // Unique violation (serial or owner raced us) → retry / return existing.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const again = await prisma.claim.findUnique({
          where: { editionId_ownerId: { editionId: edition.id, ownerId: args.userId } },
        });
        if (again) return { ok: true, claimToken: again.claimToken, serial: again.serial, alreadyOwned: true };
        continue; // serial collision — try the next one
      }
      throw e;
    }
  }
  return { ok: false, reason: "SOLD_OUT" };
}

class SoldOut extends Error {}

/** Generate a short, URL-safe tap slug for an edition (printed on the NFC/QR). */
export function newTapSlug(): string {
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyz"; // no ambiguous chars
  let s = "";
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}
