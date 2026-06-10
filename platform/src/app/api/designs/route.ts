import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { designInput } from "@/lib/validation";
import { sanitizeTheme } from "@/lib/theme";
import { RARITY_ID_TO_DB } from "@/types/tessera";
import { toDesign } from "@/lib/mappers";
import { json, guard } from "@/lib/api";

// GET /api/designs — the signed-in user's designs (their gallery).
export async function GET() {
  return guard(async () => {
    const user = await requireUser();
    const rows = await prisma.design.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    return json(rows.map(toDesign));
  });
}

// POST /api/designs — create a design.
export async function POST(req: Request) {
  return guard(async () => {
    const user = await requireUser();
    const body = designInput.parse(await req.json());
    const row = await prisma.design.create({
      data: {
        ownerId: user.id,
        venueId: body.venueId ?? null,
        venueName: body.venueName,
        eventLine: body.eventLine,
        location: body.location,
        date: body.date,
        edition: body.edition,
        tagline: body.tagline,
        rarity: RARITY_ID_TO_DB[body.rarity] as any,
        logoKey: body.logoKey ?? null,
        heroArtKey: body.heroArtKey ?? null,
        theme: sanitizeTheme(body.theme) as any,
      },
    });
    return json(toDesign(row), 201);
  });
}
