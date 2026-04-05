import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { getOrCreateDefaultWorld } from "../services/world.js";
import type { WorldMapResponse, GameState } from "@medieval-realm/shared";
import type { AuthEnv } from "../types.js";

const TIER_SCORES: Record<string, number> = { camp: 1, village: 2, town: 3, city: 4 };

function getTierFromTHLevel(level: number): string {
  if (level >= 7) return "city";
  if (level >= 5) return "town";
  if (level >= 3) return "village";
  return "camp";
}

function calcScore(state: GameState): number {
  const thLevel = state.buildings?.find((b) => b.buildingId === "town_hall")?.level ?? 1;
  const tier = getTierFromTHLevel(thLevel);
  const tierScore = (TIER_SCORES[tier] ?? 1) * 100;
  const buildingLevels = (state.buildings ?? []).reduce((sum, b) => sum + b.level, 0);
  const happiness = state.happiness ?? 50;
  return tierScore + buildingLevels * 5 + Math.round(happiness);
}

const world = new Hono<AuthEnv>();
world.use("/*", authMiddleware);

world.get("/world", async (c) => {
  const w = await getOrCreateDefaultWorld();

  const settlements = await prisma.settlement.findMany({
    where: { worldId: w.id },
    select: {
      id: true,
      name: true,
      x: true,
      y: true,
      gameState: true,
      player: { select: { username: true } },
    },
  });

  // Calculate scores and ranks
  const withScores = settlements.map((s) => {
    const state = s.gameState as unknown as GameState;
    const thLevel = state?.buildings?.find((b) => b.buildingId === "town_hall")?.level ?? 1;
    return {
      id: s.id,
      name: state?.villageName ?? s.name,
      x: s.x,
      y: s.y,
      playerName: s.player.username,
      score: calcScore(state),
      tier: getTierFromTHLevel(thLevel),
      rank: 0,
    };
  });

  // Assign ranks by score
  withScores.sort((a, b) => b.score - a.score);
  withScores.forEach((s, i) => { s.rank = i + 1; });

  return c.json<WorldMapResponse>({
    world: {
      id: w.id,
      name: w.name,
      width: w.width,
      height: w.height,
    },
    settlements: withScores,
  });
});

export default world;
