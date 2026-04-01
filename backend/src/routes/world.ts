import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { getOrCreateDefaultWorld } from "../services/world.js";
import type { WorldMapResponse } from "@medieval-realm/shared";
import type { AuthEnv } from "../types.js";

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
      player: { select: { username: true } },
    },
  });

  return c.json<WorldMapResponse>({
    world: {
      id: w.id,
      name: w.name,
      width: w.width,
      height: w.height,
    },
    settlements: settlements.map((s) => ({
      id: s.id,
      name: s.name,
      x: s.x,
      y: s.y,
      playerName: s.player.username,
    })),
  });
});

export default world;
