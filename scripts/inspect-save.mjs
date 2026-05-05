#!/usr/bin/env node
// Read-only diagnostic — dump a player's current cloud save so we can spot
// regressions vs what the player remembers. Uses backend's Prisma client +
// DATABASE_URL from backend/.env.
//
// Usage:
//   node scripts/inspect-save.mjs <username>
//   node scripts/inspect-save.mjs Ximena

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", "backend", ".env") });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL missing — check backend/.env");
  process.exit(1);
}

const { PrismaClient } = await import(
  join(__dirname, "..", "backend", "node_modules", "@prisma", "client", "default.js")
);
const prisma = new PrismaClient();

const username = process.argv[2];
if (!username) {
  console.error("Usage: node scripts/inspect-save.mjs <username>");
  process.exit(1);
}

const fmt = (d) => d ? new Date(d).toISOString() : "—";

async function main() {
  const player = await prisma.player.findUnique({
    where: { username },
    include: { settlements: { orderBy: { updatedAt: "desc" } } },
  });
  if (!player) {
    console.error(`No player named ${JSON.stringify(username)}.`);
    process.exit(1);
  }

  console.log(`# Player: ${player.username}`);
  console.log(`  id:        ${player.id}`);
  console.log(`  email:     ${player.email}`);
  console.log(`  createdAt: ${fmt(player.createdAt)}`);
  console.log(`  updatedAt: ${fmt(player.updatedAt)}`);
  console.log(`  settlements: ${player.settlements.length}`);
  console.log();

  for (const s of player.settlements) {
    console.log(`# Settlement: ${s.name} (${s.id})`);
    console.log(`  createdAt:  ${fmt(s.createdAt)}`);
    console.log(`  updatedAt:  ${fmt(s.updatedAt)}   ← server row last touched`);
    console.log(`  lastTickAt: ${fmt(s.lastTickAt)}`);
    const gs = s.gameState ?? {};
    console.log(`  state.lastTick: ${fmt(gs.lastTick)}`);
    console.log(`  villageName: ${gs.villageName ?? "—"}`);
    console.log(`  year:        ${gs.year ?? "—"}`);
    console.log(`  season:      ${gs.season ?? "—"}`);
    console.log();

    console.log(`  ## Adventurers (${(gs.adventurers ?? []).length})`);
    for (const a of gs.adventurers ?? []) {
      const tag = a.alive ? "alive" : "FALLEN";
      console.log(`    [${tag}] ${a.name?.padEnd(18) ?? "?"} ${(a.class ?? "?").padEnd(10)} L${String(a.level ?? "?").padStart(2)}  XP ${a.xp ?? 0}`);
    }
    console.log();

    console.log(`  ## Chapters`);
    for (const cs of gs.chapters ?? []) {
      console.log(`    ${cs.storyline.padEnd(11)} current=${cs.current}  completed=[${cs.completedChapters?.join(", ") ?? ""}]`);
    }
    console.log();

    console.log(`  ## Buildings (${(gs.buildings ?? []).length})`);
    const interesting = ["town_hall", "warehouse", "lumber_mill", "quarry", "houses", "pantry", "shrine", "tailoring_shop", "adventurers_guild", "woodworker", "alchemy_lab"];
    for (const id of interesting) {
      const b = (gs.buildings ?? []).find((bb) => bb.buildingId === id);
      if (b) {
        const dmg = b.damaged ? " (damaged)" : "";
        const upg = b.upgrading ? " (upgrading)" : "";
        console.log(`    ${id.padEnd(20)} L${b.level}${dmg}${upg}`);
      } else {
        console.log(`    ${id.padEnd(20)} —  (not in array)`);
      }
    }
    console.log();

    console.log(`  ## Pens (${(gs.pens ?? []).length})`);
    for (const p of gs.pens ?? []) {
      console.log(`    ${(p.animal ?? "?").padEnd(10)} L${p.level ?? 0}`);
    }
    console.log();

    console.log(`  ## Quest claims: ${(gs.questRewardsClaimed ?? []).length}`);
    if ((gs.questRewardsClaimed ?? []).length > 0) {
      console.log(`    ${gs.questRewardsClaimed.join(", ")}`);
    }
    console.log();
  }
}

await main();
await prisma.$disconnect();
