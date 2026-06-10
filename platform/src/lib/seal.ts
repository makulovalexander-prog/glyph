// Security seal — procedural guilloché + circular microtext.
// Ported from app.js. Pure functions → safe to run on server or client.
// Invariant: the seal is Glyph's CONSTANT mark. Same structure on every theme,
// drawn in the card's `ink` color so it always reads (on yellow or ivory alike).

export function seedFrom(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function guillochePath(seed: number): string {
  const r = rng(seed);
  const cx = 37;
  const cy = 37;
  const k1 = 4 + Math.floor(r() * 5);
  const k2 = 9 + Math.floor(r() * 9);
  const ph1 = r() * Math.PI * 2;
  const ph2 = r() * Math.PI * 2;
  const a = 1.0 + r() * 0.9;
  const b = 0.4 + r() * 0.6;
  const twist = 0.35 + r() * 0.5;
  const steps = 180;
  let d = "";
  let ring = 0;
  for (let R = 23.5; R >= 8.5; R -= 2.1) {
    const rot1 = ph1 + ring * twist;
    const rot2 = ph2 - ring * twist * 0.6;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const rr = R + a * Math.cos(k1 * t + rot1) + b * Math.cos(k2 * t + rot2);
      const x = cx + rr * Math.cos(t);
      const y = cy + rr * Math.sin(t);
      d += (i ? "L" : "M") + x.toFixed(2) + "," + y.toFixed(2);
    }
    d += "Z";
    ring++;
  }
  return d;
}

function escapeXml(s: string): string {
  return (s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
}

export function sealSVG(g: string, venue: string, date: string, col: string): string {
  const micro = ((venue || "GLYPH") + "   ·   " + (date || "") + "   ·   ").toUpperCase();
  const circ = 2 * Math.PI * 31;
  const charW = 3.0 * 0.6 + 0.45;
  const reps = Math.max(2, Math.ceil(circ / (micro.length * charW)) + 1);
  const microText = escapeXml(micro.repeat(reps));
  return `<svg viewBox="0 0 74 74" width="74" height="74">
    <defs>
      <clipPath id="sealclip"><circle cx="37" cy="37" r="25.5"/></clipPath>
      <path id="microring" d="M 37,6 a 31,31 0 1,1 -0.01,0" fill="none"/>
    </defs>
    <g clip-path="url(#sealclip)" fill="none" stroke="${col}" stroke-width="0.25" opacity="0.16">
      <path d="${g}"/>
    </g>
    <circle cx="37" cy="37" r="35" fill="none" stroke="${col}" stroke-width="0.8" opacity="0.55"/>
    <circle cx="37" cy="37" r="28" fill="none" stroke="${col}" stroke-width="0.4" opacity="0.32"/>
    <text font-family="Inter,sans-serif" font-size="3.05" letter-spacing="0.45" fill="${col}" opacity="0.5">
      <textPath href="#microring" startOffset="0">${microText}</textPath>
    </text>
    <text x="37" y="44" text-anchor="middle" font-family="'Cormorant Garamond',serif" font-size="20" fill="${col}" opacity="0.85">✦</text>
  </svg>`;
}

/** SVG mask URI used by the holo shimmer overlay (only for interactive cards). */
export function sealShimmerMaskUri(g: string): string {
  const maskSvg =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 74 74'><path d='" +
    g +
    "' fill='none' stroke='#fff' stroke-width='0.6' stroke-linejoin='round'/></svg>";
  return 'url("data:image/svg+xml,' + encodeURIComponent(maskSvg) + '")';
}
