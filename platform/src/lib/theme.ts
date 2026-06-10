// Theme engine — ported verbatim in spirit from the static app's `app.js`.
// The whole visual identity is data (a Theme) applied as CSS vars on the card.
// `sanitizeTheme` keeps the CSS-injection-safe font regex from the original.

import type { Theme, RarityId, RarityMeta } from "@/types/tessera";

export const SERIF = "'Cormorant Garamond',Georgia,serif";
export const SANS = "'Inter',system-ui,sans-serif";

export const ALL_RARITIES: RarityId[] = ["common", "holo", "reverse", "prismatic", "gold"];

export const RARITIES: RarityMeta[] = [
  { id: "common", label: "Common", sym: "●" },
  { id: "holo", label: "Holographic", sym: "◆" },
  { id: "reverse", label: "Reverse Holo", sym: "◈" },
  { id: "prismatic", label: "Prismatic", sym: "✦" },
  { id: "gold", label: "Gold Secret", sym: "★" },
];

export const THEME_PRESETS: Record<string, Theme> = {
  hanuman: {
    preset: "hanuman",
    name: "Hanuman",
    colors: { bg: "#FFD400", surface: "#F2B500", ink: "#1A1206", soft: "#7A2A12", accent: "#E4002B", accent2: "#1A1206", line: "#1A1206" },
    fonts: { display: "'Anton','Inter Tight',sans-serif", body: SANS, tagStyle: "normal" },
    background: "halftone",
    frame: { weight: 3, radius: 6, frameless: false },
    heroArt: true,
    rarities: ["common", "holo", "prismatic", "gold"],
  },
  bandol: {
    preset: "bandol",
    name: "Bandol",
    colors: { bg: "#F4F1EA", surface: "#ECE7DB", ink: "#1B1A17", soft: "#5C5849", accent: "#8C6E33", accent2: "#9A7B3F", line: "#CBBBA1" },
    fonts: { display: SERIF, body: SANS, tagStyle: "italic" },
    background: "solid",
    frame: { weight: 0.5, radius: 3, frameless: false },
    heroArt: false,
    rarities: ["common", "holo"],
  },
  onyx: {
    preset: "onyx",
    name: "Onyx",
    colors: { bg: "#16161A", surface: "#0A0A0C", ink: "#ECEAE3", soft: "#86847C", accent: "#C9A876", accent2: "#C9A876", line: "#C9A876" },
    fonts: { display: SERIF, body: SANS, tagStyle: "italic" },
    background: "gradient",
    frame: { weight: 1, radius: 11, frameless: false },
    heroArt: false,
    rarities: ALL_RARITIES,
  },
  ivory: {
    preset: "ivory",
    name: "Ivory",
    colors: { bg: "#F2EEE4", surface: "#E2DCCE", ink: "#1B1A17", soft: "#5C5849", accent: "#8C6E33", accent2: "#9A7B3F", line: "#8C6E33" },
    fonts: { display: SERIF, body: SANS, tagStyle: "italic" },
    background: "gradient",
    frame: { weight: 1, radius: 11, frameless: false },
    heroArt: false,
    rarities: ALL_RARITIES,
  },
  bordeaux: {
    preset: "bordeaux",
    name: "Bordeaux",
    colors: { bg: "#26121A", surface: "#150A0F", ink: "#ECD8C6", soft: "#A98C7A", accent: "#C9A172", accent2: "#D9B488", line: "#C9A172" },
    fonts: { display: SERIF, body: SANS, tagStyle: "italic" },
    background: "gradient",
    frame: { weight: 1, radius: 11, frameless: false },
    heroArt: false,
    rarities: ALL_RARITIES,
  },
  verdant: {
    preset: "verdant",
    name: "Verdant",
    colors: { bg: "#16221C", surface: "#0C140F", ink: "#DDE7DD", soft: "#7E948A", accent: "#AEC6A4", accent2: "#AEC6A4", line: "#AEC6A4" },
    fonts: { display: SERIF, body: SANS, tagStyle: "italic" },
    background: "gradient",
    frame: { weight: 1, radius: 11, frameless: false },
    heroArt: false,
    rarities: ALL_RARITIES,
  },
};

export const THEME_ORDER = ["hanuman", "bandol", "onyx", "ivory", "bordeaux", "verdant"];

export function themeCopy(id: string): Theme {
  return structuredClone(THEME_PRESETS[id] ?? THEME_PRESETS.onyx);
}

export function paletteToPreset(pal?: string): string {
  return ({ Onyx: "onyx", Ivory: "ivory", Bordeaux: "bordeaux", Verdant: "verdant" } as Record<string, string>)[pal ?? ""] ?? "onyx";
}

/** Resolve a (possibly legacy / partial) theme, never throwing. */
export function getTheme(raw: unknown): Theme {
  const d = raw as { theme?: Theme; palette?: string } | Theme | null;
  if (d && typeof d === "object") {
    if ("colors" in d && (d as Theme).colors) return d as Theme;
    if ("theme" in d && (d as any).theme?.colors) return (d as any).theme as Theme;
    if ("palette" in d && typeof (d as any).palette === "string") return themeCopy(paletteToPreset((d as any).palette));
  }
  return themeCopy("onyx");
}

/** Build a clean theme from untrusted JSON. Font regex blocks var()/CSS injection. */
export function sanitizeTheme(raw: unknown): Theme {
  const base = themeCopy("onyx");
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, any>;
  const hex = (v: unknown) => (typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : null);
  const font = (v: unknown) => (typeof v === "string" && /^[\w\s,'"().-]{1,120}$/.test(v) ? v : null);

  if (typeof r.preset === "string") base.preset = r.preset.slice(0, 24);
  if (typeof r.name === "string") base.name = r.name.slice(0, 40);
  if (r.colors && typeof r.colors === "object") {
    for (const k of ["bg", "surface", "ink", "soft", "accent", "accent2", "line"] as const) {
      const h = hex(r.colors[k]);
      if (h) base.colors[k] = h;
    }
  }
  if (r.fonts && typeof r.fonts === "object") {
    const df = font(r.fonts.display);
    const bf = font(r.fonts.body);
    if (df) base.fonts.display = df;
    if (bf) base.fonts.body = bf;
    if (r.fonts.tagStyle === "normal" || r.fonts.tagStyle === "italic") base.fonts.tagStyle = r.fonts.tagStyle;
  }
  if (["solid", "gradient", "halftone"].includes(r.background)) base.background = r.background;
  if (r.frame && typeof r.frame === "object") {
    if (typeof r.frame.weight === "number") base.frame.weight = Math.max(0, Math.min(8, r.frame.weight));
    if (typeof r.frame.radius === "number") base.frame.radius = Math.max(0, Math.min(40, r.frame.radius));
    base.frame.frameless = !!r.frame.frameless;
  }
  base.heroArt = !!r.heroArt;
  if (Array.isArray(r.rarities)) {
    const ok = r.rarities.filter((x: unknown) => ALL_RARITIES.includes(x as RarityId)) as RarityId[];
    if (ok.length) base.rarities = ok;
  }
  return base;
}
