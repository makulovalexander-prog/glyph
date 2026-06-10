import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { venueInput } from "@/lib/validation";
import { json, guard } from "@/lib/api";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "venue";
}

export async function GET() {
  return guard(async () => {
    const user = await requireUser();
    const rows = await prisma.venue.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { editions: true } } },
    });
    return json(rows);
  });
}

// POST /api/venues — register a venue (status starts UNVERIFIED).
export async function POST(req: Request) {
  return guard(async () => {
    const user = await requireUser();
    const body = venueInput.parse(await req.json());
    let slug = slugify(body.name);
    // Ensure uniqueness without leaking a race: append a suffix on collision.
    if (await prisma.venue.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    const row = await prisma.venue.create({
      data: {
        ownerId: user.id,
        slug,
        name: body.name,
        location: body.location,
        city: body.city,
        country: body.country,
        lat: body.lat,
        lng: body.lng,
      },
    });
    // Promote the user so they can manage editions.
    await prisma.user.update({ where: { id: user.id }, data: { role: "VENUE_OWNER" } });
    return json(row, 201);
  });
}
