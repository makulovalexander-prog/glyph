// THE TAP EXPERIENCE (server component).
// This is what a venue sees when pitched: a guest taps the NFC tag / QR printed
// with this edition's slug, lands here, sees the live holographic Tessera, and
// claims one serialized copy. The page is server-rendered for instant first
// paint; the card + claim button hydrate as a client island.

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { toDesignWithRarity } from "@/lib/mappers";
import { ClaimClient } from "./ClaimClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function TapPage({ params }: Props) {
  const { slug } = await params;
  const edition = await prisma.edition.findUnique({
    where: { tapSlug: slug },
    include: { venue: true, design: true },
  });
  if (!edition) notFound();

  const design = toDesignWithRarity(edition.design, edition.rarity);
  const remaining = edition.maxSupply == null ? null : Math.max(0, edition.maxSupply - edition.mintedCount);

  const now = new Date();
  const live =
    edition.status === "LIVE" &&
    edition.venue.status === "VERIFIED" &&
    (!edition.startsAt || now >= edition.startsAt) &&
    (!edition.endsAt || now <= edition.endsAt) &&
    (remaining == null || remaining > 0);

  const session = await auth();

  // Has this collector already claimed from this edition?
  let alreadyOwned: { claimToken: string; serial: number } | null = null;
  if (session?.user?.id) {
    const existing = await prisma.claim.findUnique({
      where: { editionId_ownerId: { editionId: edition.id, ownerId: session.user.id } },
      select: { claimToken: true, serial: true },
    });
    if (existing) alreadyOwned = existing;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center px-5 py-10">
      <p className="text-xs uppercase tracking-[0.3em] text-soft">{edition.venue.location ?? "Verified venue"}</p>
      <h1 className="mt-2 font-display text-3xl text-ink">{edition.venue.name}</h1>

      <ClaimClient
        slug={slug}
        design={design}
        live={live}
        requireGeo={edition.requireGeo}
        remaining={remaining}
        maxSupply={edition.maxSupply}
        signedIn={!!session?.user?.id}
        alreadyOwned={alreadyOwned}
      />
    </main>
  );
}
