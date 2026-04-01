import type { GameState } from "@medieval-realm/shared";
import { prisma } from "../lib/prisma.js";

const TICK_INTERVAL_MS = 60_000; // 60 seconds
const SKIP_IF_RECENT_MS = 30_000; // skip if client saved recently

// Simplified server-side tick for offline progress.
// Handles resource production, season advancement, building upgrades, and crafting.
// The client tick is more detailed — this covers what matters while offline.
export function applyServerTick(state: GameState, elapsedMs: number): GameState {
  const s = structuredClone(state);
  const elapsedHours = (elapsedMs / 1000 / 3600) * s.gameSpeed;
  const elapsedGameSeconds = (elapsedMs / 1000) * s.gameSpeed;

  if (elapsedHours <= 0) return s;

  // ─── Building upgrades ──────────────────────────────────────
  for (const b of s.buildings) {
    if (b.upgrading && b.upgradeRemaining != null) {
      b.upgradeRemaining -= elapsedGameSeconds;
      if (b.upgradeRemaining <= 0) {
        b.level += 1;
        b.upgrading = false;
        b.upgradeRemaining = undefined;
      }
    }
  }

  // ─── Field/Garden/Pen upgrades ──────────────────────────────
  for (const f of s.fields) {
    if (f.upgrading && f.upgradeRemaining != null) {
      f.upgradeRemaining -= elapsedGameSeconds;
      if (f.upgradeRemaining <= 0) {
        f.level += 1;
        f.upgrading = false;
        f.upgradeRemaining = undefined;
      }
    }
  }
  for (const g of s.gardens) {
    if (g.upgrading && g.upgradeRemaining != null) {
      g.upgradeRemaining -= elapsedGameSeconds;
      if (g.upgradeRemaining <= 0) {
        g.level += 1;
        g.upgrading = false;
        g.upgradeRemaining = undefined;
      }
    }
  }
  for (const p of s.pens) {
    if (p.upgrading && p.upgradeRemaining != null) {
      p.upgradeRemaining -= elapsedGameSeconds;
      if (p.upgradeRemaining <= 0) {
        p.level += 1;
        p.upgrading = false;
        p.upgradeRemaining = undefined;
      }
    }
  }

  // ─── Crafting queue ─────────────────────────────────────────
  for (const craft of s.craftingQueue) {
    craft.remaining -= elapsedGameSeconds;
  }
  s.craftingQueue = s.craftingQueue.filter((c) => c.remaining > 0);

  // ─── Mission timers ─────────────────────────────────────────
  for (const m of s.activeMissions) {
    m.remaining -= elapsedGameSeconds;
  }

  // ─── Raid timers ────────────────────────────────────────────
  for (const r of s.incomingRaids) {
    r.remaining -= elapsedGameSeconds;
  }

  // ─── Season advancement ─────────────────────────────────────
  s.seasonElapsed += elapsedHours;
  // HOURS_PER_SEASON = 24 (from the frontend constants)
  const HOURS_PER_SEASON = 24;
  while (s.seasonElapsed >= HOURS_PER_SEASON) {
    s.seasonElapsed -= HOURS_PER_SEASON;
    const order: GameState["season"][] = ["spring", "summer", "autumn", "winter"];
    const idx = order.indexOf(s.season);
    s.season = order[(idx + 1) % 4];
    if (s.season === "spring") {
      s.year += 1;
    }
  }

  // ─── Resource production (simplified) ───────────────────────
  // We compute a basic rate from building levels.
  // The client has the full detailed logic — this is a reasonable approximation.
  const getBuildingLevel = (id: string) =>
    s.buildings.find((b) => b.buildingId === id)?.level ?? 0;

  const lumbermillLvl = getBuildingLevel("lumbermill");
  const quarryLvl = getBuildingLevel("quarry");
  const farmLvl = getBuildingLevel("farm");
  const townHallLvl = getBuildingLevel("town_hall");

  // Base rates per hour (from building definitions — simplified)
  const woodPerHour = lumbermillLvl * 10;
  const stonePerHour = quarryLvl * 8;
  const foodPerHour = farmLvl * 12;
  const goldPerHour = Math.floor(s.population) * 0.2; // tax
  const foodConsumed = Math.floor(s.population) * 2;

  // Happiness modifier (simplified)
  const happinessMod = s.happiness >= 50 ? 1.0 : 0.6 + (s.happiness / 50) * 0.4;

  s.resources.wood += woodPerHour * elapsedHours * happinessMod;
  s.resources.stone += stonePerHour * elapsedHours * happinessMod;
  s.resources.food += (foodPerHour - foodConsumed) * elapsedHours * happinessMod;
  s.resources.gold += goldPerHour * elapsedHours * happinessMod;

  // Clamp to zero (no negatives)
  s.resources.wood = Math.max(0, s.resources.wood);
  s.resources.stone = Math.max(0, s.resources.stone);
  s.resources.food = Math.max(0, s.resources.food);
  s.resources.gold = Math.max(0, s.resources.gold);

  // Update lastTick
  s.lastTick = Date.now();

  return s;
}

export async function tickAllSettlements() {
  const now = new Date();
  const settlements = await prisma.settlement.findMany({
    select: { id: true, gameState: true, lastTickAt: true, updatedAt: true },
  });

  for (const settlement of settlements) {
    // Skip if the client saved recently (client is more accurate while online)
    const msSinceUpdate = now.getTime() - settlement.updatedAt.getTime();
    if (msSinceUpdate < SKIP_IF_RECENT_MS) continue;

    const elapsedMs = now.getTime() - settlement.lastTickAt.getTime();
    if (elapsedMs < SKIP_IF_RECENT_MS) continue;

    const state = settlement.gameState as unknown as GameState;
    const updatedState = applyServerTick(state, elapsedMs);

    await prisma.settlement.update({
      where: { id: settlement.id },
      data: {
        gameState: updatedState as any,
        lastTickAt: now,
      },
    });
  }
}

let tickInterval: ReturnType<typeof setInterval> | null = null;

export function startTickLoop() {
  if (tickInterval) return;
  console.log(`Server tick loop started (every ${TICK_INTERVAL_MS / 1000}s)`);
  tickInterval = setInterval(async () => {
    try {
      await tickAllSettlements();
    } catch (err) {
      console.error("Tick error:", err);
    }
  }, TICK_INTERVAL_MS);
}

export function stopTickLoop() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}
