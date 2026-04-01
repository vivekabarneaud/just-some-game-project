import { Hono } from "hono";
import type { GameState, SettlementResponse, SettlementListResponse, SaveSettlementRequest } from "@medieval-realm/shared";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { getOrCreateDefaultWorld, randomPosition } from "../services/world.js";
import type { AuthEnv } from "../types.js";

const settlement = new Hono<AuthEnv>();
settlement.use("/*", authMiddleware);

// List all settlements for the current player
settlement.get("/settlements", async (c) => {
  const playerId = c.get("playerId");
  const settlements = await prisma.settlement.findMany({
    where: { playerId },
    select: { id: true, name: true, x: true, y: true, worldId: true },
  });
  return c.json<SettlementListResponse>({ settlements });
});

// Load a specific settlement
settlement.get("/settlement/:id", async (c) => {
  const playerId = c.get("playerId");
  const id = c.req.param("id");

  const s = await prisma.settlement.findUnique({ where: { id } });
  if (!s || s.playerId !== playerId) {
    return c.json({ error: "Settlement not found" }, 404);
  }

  return c.json<SettlementResponse>({
    settlement: {
      id: s.id,
      name: s.name,
      x: s.x,
      y: s.y,
      worldId: s.worldId,
      gameState: s.gameState as unknown as GameState,
    },
  });
});

// Save game state for a settlement
settlement.put("/settlement/:id", async (c) => {
  const playerId = c.get("playerId");
  const id = c.req.param("id");
  const body = await c.req.json<SaveSettlementRequest>();

  const existing = await prisma.settlement.findUnique({ where: { id } });
  if (!existing || existing.playerId !== playerId) {
    return c.json({ error: "Settlement not found" }, 404);
  }

  await prisma.settlement.update({
    where: { id },
    data: {
      gameState: body.gameState as any,
      lastTickAt: new Date(),
      name: body.gameState.villageName || existing.name,
    },
  });

  return c.json({ ok: true });
});

// Auto-create a settlement if the player has none (called during initial load)
settlement.post("/settlement/create", async (c) => {
  const playerId = c.get("playerId");
  const username = c.get("username");

  const world = await getOrCreateDefaultWorld();

  // Check world capacity
  const count = await prisma.settlement.count({ where: { worldId: world.id } });
  if (count >= world.maxSettlements) {
    return c.json({ error: "World is full" }, 409);
  }

  const pos = await randomPosition(world.id, world.width, world.height);

  const s = await prisma.settlement.create({
    data: {
      playerId,
      worldId: world.id,
      name: `${username}'s Settlement`,
      x: pos.x,
      y: pos.y,
      gameState: {}, // empty — client will send the initial state on first save
      lastTickAt: new Date(),
    },
  });

  return c.json<SettlementResponse>({
    settlement: {
      id: s.id,
      name: s.name,
      x: s.x,
      y: s.y,
      worldId: s.worldId,
      gameState: s.gameState as unknown as GameState,
    },
  });
});

export default settlement;
