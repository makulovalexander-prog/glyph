import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-xs uppercase tracking-[0.3em] text-soft">Glyph</p>
      <h1 className="mt-4 font-display text-5xl text-ink">Tessera</h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-soft">
        Holographic collectibles that mark a venue&apos;s verified real-world presence. Venues design a
        card, get verified, and mint a limited edition. Guests tap once on site to collect it.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/t/demo" className="rounded-full bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-wider text-[#15130E]">
          Try the tap experience →
        </Link>
        <Link href="/editor" className="rounded-full border border-line px-6 py-3 text-sm uppercase tracking-wider text-ink hover:border-accent">
          Open the studio
        </Link>
        <Link href="/collection" className="rounded-full border border-line px-6 py-3 text-sm uppercase tracking-wider text-ink hover:border-accent">
          My collection
        </Link>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {[
          ["Design", "Per-venue theme engine — colors, type, frame, hero art, rarity. One template, every identity."],
          ["Verify", "Real-world presence is checked before an edition can go live. That gate is the whole promise."],
          ["Collect", "A guest taps the NFC tag / QR on site. One serialized, holographic Tessera per collector."],
        ].map(([h, b]) => (
          <div key={h} className="rounded-2xl border border-line bg-panel p-5">
            <div className="text-sm font-semibold text-ink">{h}</div>
            <p className="mt-2 text-sm leading-relaxed text-soft">{b}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
