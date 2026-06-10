// Shared Tessera types — mirror the static app's `currentDesign` / `theme` shapes
// so the ported card engine round-trips losslessly with the database.

export type RarityId = "common" | "holo" | "reverse" | "prismatic" | "gold";

export interface ThemeColors {
  bg: string;
  surface: string;
  ink: string;
  soft: string;
  accent: string;
  accent2: string;
  line: string;
}

export interface ThemeFonts {
  display: string;
  body: string;
  tagStyle: "italic" | "normal";
}

export interface ThemeFrame {
  weight: number;
  radius: number;
  frameless: boolean;
}

export type BackgroundTreatment = "solid" | "gradient" | "halftone";

export interface Theme {
  preset: string;
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  background: BackgroundTreatment;
  frame: ThemeFrame;
  heroArt: boolean;
  rarities: RarityId[];
}

/** The editable design object. `*Url` fields are resolved public URLs (from
 *  storage keys) at render time; the DB stores keys, the client renders URLs. */
export interface Design {
  id: string;
  venueName: string;
  eventLine: string;
  location: string;
  date: string;
  edition: string;
  tagline: string;
  rarity: RarityId;
  logoUrl?: string | null;
  heroArtUrl?: string | null;
  theme: Theme;
}

export interface RarityMeta {
  id: RarityId;
  label: string;
  sym: string;
}

/** DB rarity enum <-> front-end rarity id. */
export const RARITY_DB_TO_ID: Record<string, RarityId> = {
  COMMON: "common",
  HOLO: "holo",
  REVERSE: "reverse",
  PRISMATIC: "prismatic",
  GOLD: "gold",
};
export const RARITY_ID_TO_DB: Record<RarityId, string> = {
  common: "COMMON",
  holo: "HOLO",
  reverse: "REVERSE",
  prismatic: "PRISMATIC",
  gold: "GOLD",
};
