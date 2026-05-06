#!/usr/bin/env node
// Manual save patcher — overwrite specific fields in a player's cloud
// gameState. Used to restore lost progress when no PITR snapshot is
// available and the player remembers what they had. Bumps `lastTick` so
// any zombie tab still firing periodic saves gets rejected by the
// stale-state guard on its next attempt.
//
// Usage:
//   node scripts/restore-save.mjs <username> [flags...] [--apply]
//
// Flags (repeatable):
//   --th <level>                  shorthand for --building town_hall=<level>
//   --building <id>=<level>       set a building's level (creates row if missing)
//   --adventurer "<name>"=<level> set an adventurer's level (xp resets to 0)
//   --resource <name>=<amount>    set gold/wood/stone (only these three)
//   --shards <amount>             set astralShards
//   --apply                       actually write. Without this it's a dry run.
//
// Examples:
//   node scripts/restore-save.mjs Ximena --th 6 \
//     --adventurer "Cedric Ashford"=5 --adventurer "Elara Foxglove"=5 \
//     --adventurer "Bramble Barrelhouse"=4 --shards 50
//   # (dry run — print diff)
//
//   node scripts/restore-save.mjs Ximena --th 6 ... --apply
//   # (writes)

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", "backend", ".env") });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL missing — check backend/.env (or export it)");
  process.exit(1);
}

const { PrismaClient } = await import(
  join(__dirname, "..", "backend", "node_modules", "@prisma", "client", "default.js")
);
const prisma = new PrismaClient();

// ─── Parse args ─────────────────────────────────────────────────
const argv = process.argv.slice(2);
const username = argv.shift();
if (!username || username.startsWith("--")) {
  console.error("Usage: node scripts/restore-save.mjs <username> [flags...]");
  process.exit(1);
}

const buildings = new Map();
const adventurers = new Map();
const resources = new Map();
let shards = null;
let apply = false;

while (argv.length > 0) {
  const flag = argv.shift();
  if (flag === "--apply") { apply = true; continue; }
  if (flag === "--th") {
    buildings.set("town_hall", Number(argv.shift()));
    continue;
  }
  const val = argv.shift();
  if (val === undefined) {
    console.error(`Missing value for ${flag}`);
    process.exit(1);
  }
  const [name, raw] = val.includes("=") ? val.split("=") : ["", val];
  if (flag === "--building") {
    buildings.set(name, Number(raw));
  } else if (flag === "--adventurer") {
    adventurers.set(name, Number(raw));
  } else if (flag === "--resource") {
    resources.set(name, Number(raw));
  } else if (flag === "--shards") {
    shards = Number(val); // --shards <amount>, no =
  } else {
    console.error(`Unknown flag: ${flag}`);
    process.exit(1);
  }
}

// ─── Load + edit ────────────────────────────────────────────────
const player = await prisma.player.findUnique({
  where: { username },
  include: { settlements: { orderBy: { updatedAt: "desc" }, take: 1 } },
});
if (!player) {
  console.error(`No player named ${JSON.stringify(username)}.`);
  process.exit(1);
}
const settlement = player.settlements[0];
if (!settlement) {
  console.error(`Player has no settlement.`);
  process.exit(1);
}

const gs = settlement.gameState;
if (!gs?.resources) {
  console.error("Settlement has no gameState — nothing to patch.");
  process.exit(1);
}

const diffs = [];

for (const [id, lvl] of buildings) {
  const b = (gs.buildings ??= []).find((x) => x.buildingId === id);
  if (b) {
    diffs.push(`building ${id}: L${b.level} → L${lvl}`);
    b.level = lvl;
  } else {
    diffs.push(`building ${id}: (missing) → L${lvl} (created)`);
    gs.buildings.push({ buildingId: id, level: lvl, upgrading: false, damaged: false });
  }
}

for (const [name, lvl] of adventurers) {
  const adv = (gs.adventurers ?? []).find((a) => a.name === name);
  if (!adv) {
    diffs.push(`adventurer "${name}": (not found) — skipped`);
    continue;
  }
  diffs.push(`adventurer "${name}": L${adv.level} (xp ${adv.xp}) → L${lvl} (xp 0)`);
  adv.level = lvl;
  adv.xp = 0;
}

for (const [name, amt] of resources) {
  if (name !== "gold" && name !== "wood" && name !== "stone") {
    diffs.push(`resource ${name}: unsupported — skipped`);
    continue;
  }
  diffs.push(`resource ${name}: ${gs.resources[name]} → ${amt}`);
  gs.resources[name] = amt;
}

if (shards !== null) {
  diffs.push(`astralShards: ${gs.astralShards ?? 0} → ${shards}`);
  gs.astralShards = shards;
}

// Bump lastTick so any open zombie tab's next save (with the OLD smaller
// lastTick) gets rejected by the server's stale-state guard.
const newTick = Math.max(Number(gs.lastTick ?? 0) + 1, Date.now());
diffs.push(`lastTick: ${gs.lastTick} → ${newTick}`);
gs.lastTick = newTick;

// ─── Report + write ─────────────────────────────────────────────
console.log(`# ${username}'s settlement (${settlement.id})`);
if (diffs.length === 0) {
  console.log("(no changes specified)");
  await prisma.$disconnect();
  process.exit(0);
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

console.log("\n✓ Written. Player should refresh to pull the patched state.");
await prisma.$disconnect();
