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
const SNAPSHOT_CAP = 10;

settlement.put("/settlement/:id", async (c) => {
  const playerId = c.get("playerId");
  const id = c.req.param("id");
  const body = await c.req.json<SaveSettlementRequest>();

  const existing = await prisma.settlement.findUnique({ where: { id } });
  if (!existing || existing.playerId !== playerId) {
    return c.json({ error: "Settlement not found" }, 404);
  }

  // Stale-tab guard. A second tab/device that loaded this settlement at an
  // earlier moment can have an in-memory state that's hours behind reality;
  // its periodic save would otherwise clobber the live progress. Reject
  // saves whose lastTick is older than what we already have. Returning 409
  // lets the client know to reload from the server instead of retrying.
  const incomingTick = Number((body.gameState as any)?.lastTick ?? 0);
  const existingState = existing.gameState as any;
  const existingTick = Number(existingState?.lastTick ?? 0);
  if (incomingTick > 0 && existingTick > 0 && incomingTick < existingTick) {
    return c.json(
      {
        error: "stale_state",
        message: "Server has newer state.",
        serverLastTick: existingTick,
        incomingLastTick: incomingTick,
      },
      409,
    );
  }

  // Snapshot the *outgoing* state before replacing it, then prune to the
  // last SNAPSHOT_CAP rows. Best-effort: failures don't block the save.
  // We skip the empty-object case (newly created settlements).
  if (existingTick > 0) {
    try {
      await prisma.settlementSnapshot.create({
        data: { settlementId: id, gameState: existing.gameState as any },
      });
      const stale = await prisma.settlementSnapshot.findMany({
        where: { settlementId: id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
        skip: SNAPSHOT_CAP,
      });
      if (stale.length > 0) {
        await prisma.settlementSnapshot.deleteMany({
          where: { id: { in: stale.map((s) => s.id) } },
        });
      }
    } catch (err) {
      console.warn("[settlement] snapshot skipped:", err);
    }
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
