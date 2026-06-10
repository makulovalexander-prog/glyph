import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-6">
      <header className="flex items-center justify-between border-b border-line pb-4">
        <Link href="/" className="font-display text-xl text-ink">
          Glyph <span className="text-soft">Studio</span>
        </Link>
        <nav className="flex gap-1 rounded-full border border-line bg-panel p-1">
          {[
            ["Editor", "/editor"],
            ["Gallery", "/gallery"],
            ["Collection", "/collection"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-4 py-2 text-xs uppercase tracking-wider text-soft hover:text-ink"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mt-6">{children}</div>
    </div>
  );
}
