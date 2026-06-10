// Map DB rows → the front-end `Design` shape the card engine consumes.
// Resolves storage keys to public URLs and the Rarity enum to its lowercase id.

import type { Design as DbDesign } from "@prisma/client";
import type { Design } from "@/types/tessera";
import { RARITY_DB_TO_ID } from "@/types/tessera";
import { getTheme } from "@/lib/theme";
import { publicUrl } from "@/lib/storage";

export function toDesign(row: DbDesign): Design {
  return {
    id: row.id,
    venueName: row.venueName,
    eventLine: row.eventLine,
    location: row.location,
    date: row.date,
    edition: row.edition,
    tagline: row.tagline,
    rarity: RARITY_DB_TO_ID[row.rarity] ?? "common",
    logoUrl: publicUrl(row.logoKey),
    heroArtUrl: publicUrl(row.heroArtKey),
    theme: getTheme(row.theme),
  };
}

/** A design overlaid with an edition's rarity (so a card renders as minted). */
export function toDesignWithRarity(row: DbDesign, rarityDb: string): Design {
  const d = toDesign(row);
  d.rarity = RARITY_DB_TO_ID[rarityDb] ?? d.rarity;
  return d;
}
