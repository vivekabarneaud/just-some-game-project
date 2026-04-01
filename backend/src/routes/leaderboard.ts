import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import type { GameState } from "@medieval-realm/shared";

const leaderboard = new Hono();

const TIER_SCORES: Record<string, number> = {
  camp: 1,
  village: 2,
  town: 3,
  city: 4,
};

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

leaderboard.get("/leaderboard", async (c) => {
  const settlements = await prisma.settlement.findMany({
    select: {
      id: true,
      name: true,
      gameState: true,
      player: { select: { username: true } },
    },
  });

  const entries = settlements
    .map((s) => {
      const state = s.gameState as unknown as GameState;
      return {
        playerName: s.player.username,
        settlementName: state?.villageName ?? s.name,
        score: calcScore(state),
        tier: getTierFromTHLevel(
          state?.buildings?.find((b) => b.buildingId === "town_hall")?.level ?? 1
        ),
        population: Math.floor(state?.population ?? 0),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  return c.json({ leaderboard: entries });
});

export default leaderboard;
