import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { designInput } from "@/lib/validation";
import { sanitizeTheme } from "@/lib/theme";
import { RARITY_ID_TO_DB } from "@/types/tessera";
import { toDesign } from "@/lib/mappers";
import { json, fail, guard } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

async function ownedDesign(id: string, userId: string) {
  const row = await prisma.design.findUnique({ where: { id } });
  if (!row) return null;
  if (row.ownerId !== userId) throw new Error("FORBIDDEN");
  return row;
}

export async function GET(_req: Request, { params }: Ctx) {
  return guard(async () => {
    const user = await requireUser();
    const { id } = await params;
    const row = await ownedDesign(id, user.id);
    if (!row) return fail("Not found", 404);
    return json(toDesign(row));
  });
}

export async function PATCH(req: Request, { params }: Ctx) {
  return guard(async () => {
    const user = await requireUser();
    const { id } = await params;
    const existing = await ownedDesign(id, user.id);
    if (!existing) return fail("Not found", 404);
    const body = designInput.partial().parse(await req.json());
    const row = await prisma.design.update({
      where: { id },
      data: {
        venueName: body.venueName,
        eventLine: body.eventLine,
        location: body.location,
        date: body.date,
        edition: body.edition,
        tagline: body.tagline,
        rarity: body.rarity ? (RARITY_ID_TO_DB[body.rarity] as any) : undefined,
        logoKey: body.logoKey,
        heroArtKey: body.heroArtKey,
        venueId: body.venueId,
        theme: body.theme ? (sanitizeTheme(body.theme) as any) : undefined,
      },
    });
    return json(toDesign(row));
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return guard(async () => {
    const user = await requireUser();
    const { id } = await params;
    const existing = await ownedDesign(id, user.id);
    if (!existing) return fail("Not found", 404);
    await prisma.design.delete({ where: { id } });
    return json({ ok: true });
  });
}
