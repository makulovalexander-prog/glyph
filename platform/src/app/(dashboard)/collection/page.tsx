import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { toDesignWithRarity } from "@/lib/mappers";
import { TesseraCard } from "@/components/TesseraCard";

export const dynamic = "force-dynamic";

// The collector's owned Tessera — one card per claim, with its serial.
export default async function CollectionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/collection");

  const claims = await prisma.claim.findMany({
    where: { ownerId: session.user.id, status: "CLAIMED" },
    orderBy: { claimedAt: "desc" },
    include: { edition: { include: { design: true, venue: true } } },
  });

  if (claims.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <div className="font-display text-5xl text-accent opacity-70">✦</div>
        <div className="text-ink">Your collection is empty</div>
        <p className="max-w-xs text-sm text-soft">Tap a venue&apos;s Tessera tag to collect your first card.</p>
        <Link href="/t/demo" className="mt-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#15130E]">Try the demo tap</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-6">
      {claims.map((c) => {
        const d = toDesignWithRarity(c.edition.design, c.edition.rarity);
        return (
          <div key={c.id} className="w-[180px]">
            <div className="relative h-[252px] w-[180px] overflow-hidden rounded-xl border border-line bg-[#0A0A0C]">
              <TesseraCard design={d} holo={false} back={false} thumb />
            </div>
            <div className="mt-2 text-xs text-ink">{c.edition.venue.name}</div>
            <div className="text-[11px] text-soft">
              No. {c.serial}
              {c.edition.maxSupply != null && <> / {c.edition.maxSupply}</>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
