import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { editionInput } from "@/lib/validation";
import { RARITY_ID_TO_DB } from "@/types/tessera";
import { newTapSlug } from "@/lib/mint";
import { json, fail, guard } from "@/lib/api";

// POST /api/editions — mint a new edition (the run a venue issues to collectors).
// Requires: caller owns the venue, venue is VERIFIED, design belongs to caller.
// Goes LIVE immediately if within its time window; otherwise DRAFT.
export async function POST(req: Request) {
  return guard(async () => {
    const user = await requireUser();
    const body = editionInput.parse(await req.json());

    const venue = await prisma.venue.findUnique({ where: { id: body.venueId } });
    if (!venue) return fail("Venue not found", 404);
    if (venue.ownerId !== user.id && user.role !== "ADMIN") throw new Error("FORBIDDEN");
    if (venue.status !== "VERIFIED") return fail("Venue must be verified before minting", 409);

    const design = await prisma.design.findUnique({ where: { id: body.designId } });
    if (!design || (design.ownerId !== user.id && user.role !== "ADMIN")) return fail("Design not found", 404);

    // Retry tap-slug generation on the (rare) unique collision.
    for (let i = 0; i < 5; i++) {
      try {
        const row = await prisma.edition.create({
          data: {
            venueId: body.venueId,
            designId: body.designId,
            tapSlug: newTapSlug(),
            rarity: RARITY_ID_TO_DB[body.rarity] as any,
            maxSupply: body.maxSupply ?? null,
            startsAt: body.startsAt,
            endsAt: body.endsAt,
            requireGeo: body.requireGeo,
            geoRadiusM: body.geoRadiusM,
            status: "LIVE",
          },
        });
        return json(row, 201);
      } catch (e: any) {
        if (e?.code === "P2002") continue;
        throw e;
      }
    }
    return fail("Could not allocate tap slug, retry", 503);
  });
}
