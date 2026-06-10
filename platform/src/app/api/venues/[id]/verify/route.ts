import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { verificationInput } from "@/lib/validation";
import { json, fail, guard } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/venues/:id/verify
// Owner submits evidence (status -> PENDING). Admin decision flips to VERIFIED.
// The verification gate IS the product promise — editions can only go LIVE for a
// VERIFIED venue (enforced again at claim time in lib/mint.ts).
export async function POST(req: Request, { params }: Ctx) {
  return guard(async () => {
    const user = await requireUser();
    const { id } = await params;
    const venue = await prisma.venue.findUnique({ where: { id } });
    if (!venue) return fail("Not found", 404);

    const isAdmin = user.role === "ADMIN";
    const isOwner = venue.ownerId === user.id;
    if (!isAdmin && !isOwner) throw new Error("FORBIDDEN");

    const body = verificationInput.parse(await req.json());

    const verification = await prisma.venueVerification.create({
      data: {
        venueId: id,
        method: body.method,
        evidenceUrl: body.evidenceUrl,
        note: body.note,
        decision: isAdmin ? "VERIFIED" : "PENDING",
        reviewedBy: isAdmin ? user.id : null,
      },
    });

    const newStatus = isAdmin ? "VERIFIED" : "PENDING";
    const updated = await prisma.venue.update({
      where: { id },
      data: { status: newStatus, verifiedAt: isAdmin ? new Date() : null },
    });

    return json({ venue: updated, verification });
  });
}
