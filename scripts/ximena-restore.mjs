#!/usr/bin/env node
// One-off restore for Ximena's settlement after the stale-tab regression.
// Applies the full list of changes she remembered (TH L6, houses L4,
// goats pen, leveled gardens & orchards, all crafting at L2, lumber/
// quarry L4, iron mine L2, plus Maren Greystone as a level-3 assassin).
// Bumps `lastTick` past Date.now() so any zombie tab gets bounced.
//
// Usage:
//   DATABASE_URL='<preprod-url>' node scripts/ximena-restore.mjs           # dry run
//   DATABASE_URL='<preprod-url>' node scripts/ximena-restore.mjs --apply   # write
//
// Or, if backend/.env.ppd has DATABASE_URL set:
//   node scripts/ximena-restore.mjs --env ppd --apply

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
const envFlagIdx = argv.indexOf("--env");
const envSuffix = envFlagIdx >= 0 ? argv[envFlagIdx + 1] : null;
const apply = argv.includes("--apply");

if (envSuffix) {
  config({ path: join(__dirname, "..", "backend", `.env.${envSuffix}`) });
}
if (!process.env.DATABASE_URL) {
  config({ path: join(__dirname, "..", "backend", ".env") });
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL missing — pass via env or --env <suffix> matching backend/.env.<suffix>");
  process.exit(1);
}

const { PrismaClient } = await import(
  join(__dirname, "..", "backend", "node_modules", "@prisma", "client", "default.js")
);
const prisma = new PrismaClient();

const USERNAME = "Ximena";

// ─── What to restore ────────────────────────────────────────────
const BUILDING_LEVELS = {
  // Settlement
  town_hall: 6,
  houses: 4,
  // Gathering
  lumber_mill: 4,
  quarry: 4,
  iron_mine: 2,
  // Crafting tier-2 across the board
  woodworker: 2,
  blacksmith: 2,
  tailoring_shop: 2,
  leatherworking: 2,
  alchemy_lab: 2,
  kitchen: 2,
};

const PEN_LEVELS = { goats: 1 };

const GARDEN_LEVELS = {
  // peas already L3 in her save; bump fava + cabbages to L1 (4 leveled gardens
  // total counting peas + an existing one if any).
  fava: 1,
  cabbages: 1,
};

const ORCHARD_PLANTED = {
  apples: { level: 1, seasonsGrown: 1, mature: false },
  pears:  { level: 1, seasonsGrown: 1, mature: false },
};

// New adventurer — Maren Greystone, assassin from the premade pool.
const NEW_ADVENTURER = {
  id: null, // assigned below to next free adv_<n>
  xp: 0,
  age: "middle",
  name: "Maren Greystone",
  race: "human",
  rank: 1,
  alive: true,
  class: "assassin",
  level: 3,
  quirk: "Keeps a list of names. Crosses one off after every job.",
  trait: "elemental_attuned",
  origin: "ashwick",
  loyalty: 0,
  talents: [],
  portrait: "maren_greystone",
  backstory: "Maren kept the books for a Hearthlands merchant guild until she discovered they were laundering coin for the Church's Inquisition — she made sure certain ledgers disappeared, and then so did she.",
  equipment: {
    head: null, legs: null, boots: null, chest: "thick_pelt",
    cloak: null, ring1: null, ring2: null, amulet: null,
    offHand: null, trinket: null, mainHand: null,
  },
  onMission: false,
  premadeId: "char_006",
  bonusStats: {},
  foodPreference: "spicy",
};

// ─── Load + edit ────────────────────────────────────────────────
const player = await prisma.player.findUnique({
  where: { username: USERNAME },
  include: { settlements: { orderBy: { updatedAt: "desc" }, take: 1 } },
});
if (!player) { console.error(`No player ${USERNAME}.`); process.exit(1); }
const settlement = player.settlements[0];
if (!settlement) { console.error("No settlement."); process.exit(1); }

const gs = settlement.gameState;
const diffs = [];

// Buildings
gs.buildings ??= [];
for (const [id, lvl] of Object.entries(BUILDING_LEVELS)) {
  const b = gs.buildings.find((x) => x.buildingId === id);
  if (b) {
    if (b.level < lvl) {
      diffs.push(`building ${id}: L${b.level} → L${lvl}`);
      b.level = lvl;
      b.damaged = false;
    }
  } else {
    diffs.push(`building ${id}: (missing) → L${lvl} (created)`);
    gs.buildings.push({ buildingId: id, level: lvl, upgrading: false, damaged: false });
  }
}

// Pens
for (const [animal, lvl] of Object.entries(PEN_LEVELS)) {
  const p = (gs.pens ??= []).find((x) => x.animal === animal);
  if (p) {
    if (p.level < lvl) {
      diffs.push(`pen ${animal}: L${p.level} → L${lvl}`);
      p.level = lvl;
    }
  } else {
    diffs.push(`pen ${animal}: (missing) — skipped (slot doesn't exist)`);
  }
}

// Gardens
for (const [veggie, lvl] of Object.entries(GARDEN_LEVELS)) {
  const g = (gs.gardens ??= []).find((x) => x.veggie === veggie);
  if (g) {
    if (g.level < lvl) {
      diffs.push(`garden ${veggie}: L${g.level} → L${lvl}`);
      g.level = lvl;
    }
  } else {
    diffs.push(`garden ${veggie}: (missing) — skipped`);
  }
}

// Orchards
for (const [fruit, target] of Object.entries(ORCHARD_PLANTED)) {
  const o = (gs.orchards ??= []).find((x) => x.fruit === fruit);
  if (o) {
    diffs.push(`orchard ${fruit}: L${o.level} (s${o.seasonsGrown ?? 0}) → L${target.level} (s${target.seasonsGrown})`);
    o.level = target.level;
    o.seasonsGrown = target.seasonsGrown;
    o.mature = target.mature;
  } else {
    diffs.push(`orchard ${fruit}: (missing) — skipped`);
  }
}

// New adventurer (only if not already present by name)
gs.adventurers ??= [];
if (gs.adventurers.some((a) => a.name === NEW_ADVENTURER.name)) {
  diffs.push(`adventurer "${NEW_ADVENTURER.name}": already exists — skipped`);
} else {
  // Pick the next adv_<n> id past anything already in use.
  let maxId = 0;
  for (const a of [...gs.adventurers, ...(gs.recruitCandidates ?? [])]) {
    const m = /^adv_(\d+)$/.exec(a.id ?? "");
    if (m) maxId = Math.max(maxId, Number(m[1]));
  }
  const adv = { ...NEW_ADVENTURER, id: `adv_${maxId + 1}` };
  diffs.push(`adventurer "${adv.name}": (missing) → L${adv.level} ${adv.class} added as ${adv.id}`);
  gs.adventurers.push(adv);
}

// Bump lastTick so any zombie tab's next save is rejected.
const newTick = Math.max(Number(gs.lastTick ?? 0) + 1, Date.now());
diffs.push(`lastTick: ${gs.lastTick} → ${newTick}`);
gs.lastTick = newTick;

// ─── Report + write ─────────────────────────────────────────────
console.log(`# Ximena's settlement (${settlement.id})`);
if (diffs.length === 1) { // only the lastTick bump
  console.log("(no field changes — everything already matches the target)");
}
for (const d of diffs) console.log(`  ${d}`);

if (!apply) {
  console.log("\n(dry run — re-run with --apply to write)");
  await prisma.$disconnect();
  process.exit(0);
}

await prisma.settlement.update({
  where: { id: settlement.id },
  data: { gameState: gs, lastTickAt: new Date() },
});

console.log("\n✓ Written. Have Ximena refresh the page to pull the patched state.");
await prisma.$disconnect();
