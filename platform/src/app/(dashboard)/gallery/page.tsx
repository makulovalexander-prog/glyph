import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { toDesign } from "@/lib/mappers";
import { TesseraCard } from "@/components/TesseraCard";

export const dynamic = "force-dynamic";

// Static thumbnails only (invariant 1): no holo, no 3D. Full holo is reserved for
// one card at a time (the editor / tap view).
export default async function GalleryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/gallery");

  const rows = await prisma.design.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  const designs = rows.map(toDesign);

  if (designs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <div className="font-display text-5xl text-accent opacity-70">✦</div>
        <div className="text-ink">No designs yet</div>
        <p className="max-w-xs text-sm text-soft">Design a Tessera in the editor and hit Save.</p>
        <Link href="/editor" className="mt-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#15130E]">Create one</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-6">
      {designs.map((d) => (
        <div key={d.id} className="w-[180px]">
          <Link href={`/editor?id=${d.id}`} className="relative block h-[252px] w-[180px] overflow-hidden rounded-xl border border-line bg-[#0A0A0C] transition hover:-translate-y-0.5 hover:border-accent">
            <TesseraCard design={d} holo={false} back={false} thumb />
          </Link>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="truncate text-xs text-ink">{d.venueName || "Untitled"}</span>
            <span className="text-[13px]" style={{ color: d.theme.colors.accent }}>
              {{ common: "●", holo: "◆", reverse: "◈", prismatic: "✦", gold: "★" }[d.rarity]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
