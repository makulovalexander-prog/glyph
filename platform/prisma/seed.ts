// Seed: a demo collector, a demo venue owner, a VERIFIED venue, four ported
// designs, and a LIVE edition with a fixed tap slug ("demo") so you can hit
// http://localhost:3000/t/demo immediately to show venues the tap experience.

import { PrismaClient } from "@prisma/client";
import { THEME_PRESETS } from "../src/lib/theme";

const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: "venue@glyph.cards" },
    update: { role: "VENUE_OWNER" },
    create: { email: "venue@glyph.cards", name: "Hanuman (owner)", role: "VENUE_OWNER" },
  });

  await prisma.user.upsert({
    where: { email: "collector@glyph.cards" },
    update: {},
    create: { email: "collector@glyph.cards", name: "Demo Collector" },
  });

  const venue = await prisma.venue.upsert({
    where: { slug: "hanuman-berlin" },
    update: { status: "VERIFIED", verifiedAt: new Date() },
    create: {
      ownerId: owner.id,
      slug: "hanuman-berlin",
      name: "Hanuman",
      location: "Kreuzberg · Berlin",
      city: "Berlin",
      country: "DE",
      lat: 52.4934,
      lng: 13.4233,
      status: "VERIFIED",
      verifiedAt: new Date(),
    },
  });

  const defs = [
    { venueName: "Hanuman", eventLine: "Tasting Menu", location: "Kreuzberg · Berlin", date: "28 May 2026", edition: "No. 247", tagline: "Not a Trend; A Tradition", theme: THEME_PRESETS.hanuman, rarity: "HOLO" },
    { venueName: "Bandol sur mer", eventLine: "À la carte", location: "Mitte · Berlin", date: "12 Jun 2026", edition: "No. 031", tagline: "Petite, by the sea", theme: THEME_PRESETS.bandol, rarity: "COMMON" },
    { venueName: "Coro Wine & Vinyls", eventLine: "Vinyl & Natural Wine", location: "Neukölln · Berlin", date: "05 Jul 2026", edition: "No. 112", tagline: "Spin slow, pour low", theme: THEME_PRESETS.verdant, rarity: "PRISMATIC" },
    { venueName: "Ernst", eventLine: "Chef's Counter", location: "Wedding · Berlin", date: "19 Sep 2026", edition: "No. 008", tagline: "Ten seats, one night", theme: THEME_PRESETS.onyx, rarity: "GOLD" },
  ] as const;

  const designs = [];
  for (const d of defs) {
    const design = await prisma.design.create({
      data: {
        ownerId: owner.id,
        venueId: venue.id,
        venueName: d.venueName,
        eventLine: d.eventLine,
        location: d.location,
        date: d.date,
        edition: d.edition,
        tagline: d.tagline,
        rarity: d.rarity as any,
        theme: d.theme as any,
      },
    });
    designs.push(design);
  }

  // The demo edition: fixed slug "demo", LIVE, capped at 250 → /t/demo
  await prisma.edition.upsert({
    where: { tapSlug: "demo" },
    update: { status: "LIVE" },
    create: {
      venueId: venue.id,
      designId: designs[0].id,
      tapSlug: "demo",
      rarity: "HOLO",
      maxSupply: 250,
      status: "LIVE",
      startsAt: new Date("2026-01-01"),
    },
  });

  console.log("Seeded. Tap demo → /t/demo");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
