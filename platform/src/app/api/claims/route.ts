import { requireUser } from "@/lib/auth";
import { claimInput } from "@/lib/validation";
import { claimByTapSlug, type ClaimError } from "@/lib/mint";
import { json, fail, guard } from "@/lib/api";

const ERR_STATUS: Record<ClaimError, number> = {
  NOT_FOUND: 404,
  NOT_LIVE: 409,
  NOT_STARTED: 409,
  ENDED: 410,
  SOLD_OUT: 409,
  OUT_OF_RANGE: 403,
  VENUE_UNVERIFIED: 409,
};

// POST /api/claims — claim a Tessera from a tap. Idempotent per (edition, user).
export async function POST(req: Request) {
  return guard(async () => {
    const user = await requireUser();
    const body = claimInput.parse(await req.json());
    const result = await claimByTapSlug({
      tapSlug: body.tapSlug,
      userId: user.id,
      lat: body.lat,
      lng: body.lng,
      deviceHash: body.deviceHash,
    });
    if (!result.ok) return fail(result.reason, ERR_STATUS[result.reason]);
    return json(result, 201);
  });
}
