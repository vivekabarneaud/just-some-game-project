import { Hono } from "hono";
import type {
  CoopExpeditionInfo,
  CreateCoopInviteRequest,
  RespondCoopInviteRequest,
  CoopListResponse,
  CoopExpeditionStatus,
  CoopAdventurerSummary,
  CoopRosterEntry,
  UpdateCoopRosterRequest,
  CoopDetailResponse,
  CoopExpeditionDetail,
  CoopRuntimeState,
  CoopClaimResponse,
} from "@medieval-realm/shared";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { emit, emitMany } from "../lib/eventBus.js";
import type { AuthEnv } from "../types.js";

// ─── Helpers for roster work ────────────────────────────────────

const EMPTY_ROSTER: CoopRosterEntry = { adventurerIds: [], supplies: {} };

function parseRoster(v: unknown): CoopRosterEntry {
  if (!v || typeof v !== "object") return { ...EMPTY_ROSTER };
  const obj = v as any;
  return {
    adventurerIds: Array.isArray(obj.adventurerIds) ? obj.adventurerIds.filter((x: any) => typeof x === "string") : [],
    supplies: typeof obj.supplies === "object" && obj.supplies !== null ? obj.supplies : {},
  };
}

/** Pull adventurer summaries for the given player from their latest settlement. */
async function getAdventurerSummaries(playerId: string, adventurerIds: string[]): Promise<CoopAdventurerSummary[]> {
  if (adventurerIds.length === 0) return [];
  const settlement = await prisma.settlement.findFirst({
    where: { playerId },
    orderBy: { updatedAt: "desc" },
    select: { gameState: true },
  });
  if (!settlement) return [];
  const state = settlement.gameState as any;
  const advs: any[] = Array.isArray(state?.adventurers) ? state.adventurers : [];
  const out: CoopAdventurerSummary[] = [];
  for (const id of adventurerIds) {
    const a = advs.find((x) => x.id === id);
    if (!a) continue;
    const bonus = a.bonusStats ?? {};
    out.push({
      id: a.id,
      name: a.name,
      class: a.class,
      rank: a.rank ?? 1,
      level: a.level ?? 1,
      str: (a.stats?.str ?? 0) + (bonus.str ?? 0),
      dex: (a.stats?.dex ?? 0) + (bonus.dex ?? 0),
      int: (a.stats?.int ?? 0) + (bonus.int ?? 0),
      vit: (a.stats?.vit ?? 0) + (bonus.vit ?? 0),
      wis: (a.stats?.wis ?? 0) + (bonus.wis ?? 0),
      alive: a.alive !== false,
      image: a.portraitUrl,
    });
  }
  return out;
}

const coop = new Hono<AuthEnv>();
coop.use("/*", authMiddleware);

// ─── Helper ─────────────────────────────────────────────────────

function toCoopInfo(row: any, selfId: string): CoopExpeditionInfo {
  const iAmHost = row.hostId === selfId;
  return {
    id: row.id,
    expeditionId: row.expeditionId,
    status: row.status as CoopExpeditionStatus,
    hostId: row.hostId,
    hostUsername: row.host?.username ?? "unknown",
    guestId: row.guestId,
    guestUsername: row.guest?.username ?? "unknown",
    iAmHost,
    createdAt: row.createdAt.toISOString(),
    deployedAt: row.deployedAt?.toISOString(),
    completedAt: row.completedAt?.toISOString(),
    iAmClaimed: iAmHost ? !!row.hostClaimed : !!row.guestClaimed,
  };
}

function isFriendsWith(tx: typeof prisma, a: string, b: string) {
  return tx.friendship.findFirst({
    where: {
      status: "accepted",
      OR: [
        { requesterId: a, addresseeId: b },
        { requesterId: b, addresseeId: a },
      ],
    },
  });
}

// ─── GET /api/coop — list my coop expeditions (any status, as host or guest) ─

coop.get("/coop", async (c) => {
  const playerId = c.get("playerId");
  const rows = await prisma.coopExpedition.findMany({
    where: {
      OR: [{ hostId: playerId }, { guestId: playerId }],
      status: { notIn: ["cancelled"] },
    },
    include: {
      host: { select: { id: true, username: true } },
      guest: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  // Hide completed coops that I've already claimed — no point showing them anymore
  const filtered = rows.filter((r) => {
    if (r.status !== "complete") return true;
    const iAmHost = r.hostId === playerId;
    const iAmClaimed = iAmHost ? r.hostClaimed : r.guestClaimed;
    return !iAmClaimed;
  });
  const response: CoopListResponse = {
    coops: filtered.map((r) => toCoopInfo(r, playerId)),
  };
  return c.json(response);
});

// ─── POST /api/coop/invite — host creates invite for a friend ───

coop.post("/coop/invite", async (c) => {
  const hostId = c.get("playerId");
  const body = await c.req.json<CreateCoopInviteRequest>();
  const { expeditionId, friendUsername } = body;
  if (!expeditionId || !friendUsername) {
    return c.json({ error: "expeditionId and friendUsername required" }, 400);
  }

  const guest = await prisma.player.findUnique({
    where: { username: friendUsername },
    select: { id: true, username: true },
  });
  if (!guest) return c.json({ error: "No player with that username" }, 404);
  if (guest.id === hostId) return c.json({ error: "You can't invite yourself" }, 400);

  // Must be friends
  const fr = await isFriendsWith(prisma, hostId, guest.id);
  if (!fr) return c.json({ error: "You must be friends to invite them" }, 403);

  // Don't allow two simultaneous coops between the same pair for the same expedition (pending/preparing/active)
  const existing = await prisma.coopExpedition.findFirst({
    where: {
      expeditionId,
      status: { in: ["pending", "preparing", "active"] },
      OR: [
        { hostId, guestId: guest.id },
        { hostId: guest.id, guestId: hostId },
      ],
    },
  });
  if (existing) return c.json({ error: "You already have an active coop with this player for this expedition" }, 409);

  const row = await prisma.coopExpedition.create({
    data: {
      hostId,
      guestId: guest.id,
      expeditionId,
      status: "pending",
    },
    include: {
      host: { select: { id: true, username: true } },
      guest: { select: { id: true, username: true } },
    },
  });
  emit(guest.id, { type: "coop:invite", coopId: row.id });
  return c.json({ coop: toCoopInfo(row, hostId) });
});

// ─── POST /api/coop/:id/respond — guest accepts or declines ─────

coop.post("/coop/:id/respond", async (c) => {
  const playerId = c.get("playerId");
  const id = c.req.param("id");
  const body = await c.req.json<RespondCoopInviteRequest>();

  const row = await prisma.coopExpedition.findUnique({ where: { id } });
  if (!row) return c.json({ error: "Coop not found" }, 404);
  if (row.guestId !== playerId) return c.json({ error: "Only the invited guest can respond" }, 403);
  if (row.status !== "pending") return c.json({ error: "Invite already resolved" }, 409);

  if (body.accept) {
    const updated = await prisma.coopExpedition.update({
      where: { id },
      data: { status: "preparing" },
      include: {
        host: { select: { id: true, username: true } },
        guest: { select: { id: true, username: true } },
      },
    });
    emitMany([updated.hostId, updated.guestId], { type: "coop:update", coopId: id });
    return c.json({ coop: toCoopInfo(updated, playerId) });
  } else {
    await prisma.coopExpedition.update({
      where: { id },
      data: { status: "cancelled" },
    });
    emitMany([row.hostId, row.guestId], { type: "coop:cancelled", coopId: id });
    return c.json({ status: "declined" });
  }
});

// ─── DELETE /api/coop/:id — cancel (either side) ────────────────

coop.delete("/coop/:id", async (c) => {
  const playerId = c.get("playerId");
  const id = c.req.param("id");

  const row = await prisma.coopExpedition.findUnique({ where: { id } });
  if (!row) return c.json({ error: "Coop not found" }, 404);
  if (row.hostId !== playerId && row.guestId !== playerId) {
    return c.json({ error: "Not yours" }, 403);
  }
  // Only pending/preparing can be cancelled. Active/complete locked down until later sessions.
  if (row.status !== "pending" && row.status !== "preparing") {
    return c.json({ error: "Can't cancel once active" }, 409);
  }

  await prisma.coopExpedition.update({
    where: { id },
    data: { status: "cancelled" },
  });
  emitMany([row.hostId, row.guestId], { type: "coop:cancelled", coopId: id });
  return c.json({ ok: true });
});

// ─── GET /api/coop/:id — detailed view with rosters + summaries ──

coop.get("/coop/:id", async (c) => {
  const playerId = c.get("playerId");
  const id = c.req.param("id");
  const row = await prisma.coopExpedition.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, username: true } },
      guest: { select: { id: true, username: true } },
    },
  });
  if (!row) return c.json({ error: "Not found" }, 404);
  if (row.hostId !== playerId && row.guestId !== playerId) return c.json({ error: "Not yours" }, 403);

  const hostRoster = parseRoster(row.hostRoster);
  const guestRoster = parseRoster(row.guestRoster);
  const [hostAdvs, guestAdvs] = await Promise.all([
    getAdventurerSummaries(row.hostId, hostRoster.adventurerIds),
    getAdventurerSummaries(row.guestId, guestRoster.adventurerIds),
  ]);

  const detail: CoopExpeditionDetail = {
    ...toCoopInfo(row, playerId),
    hostReady: row.hostReady,
    guestReady: row.guestReady,
    hostRoster,
    guestRoster,
    hostContributedAdvs: hostAdvs,
    guestContributedAdvs: guestAdvs,
  };

  const response: CoopDetailResponse = { coop: detail };
  return c.json(response);
});

// ─── PATCH /api/coop/:id/roster — update my side's roster ─────

coop.patch("/coop/:id/roster", async (c) => {
  const playerId = c.get("playerId");
  const id = c.req.param("id");
  const body = await c.req.json<UpdateCoopRosterRequest>();

  const row = await prisma.coopExpedition.findUnique({ where: { id } });
  if (!row) return c.json({ error: "Not found" }, 404);
  const isHost = row.hostId === playerId;
  if (!isHost && row.guestId !== playerId) return c.json({ error: "Not yours" }, 403);
  if (row.status !== "preparing") return c.json({ error: "Roster is locked" }, 409);

  const roster: CoopRosterEntry = {
    adventurerIds: Array.isArray(body.adventurerIds) ? body.adventurerIds.filter((x) => typeof x === "string") : [],
    supplies: typeof body.supplies === "object" && body.supplies !== null ? body.supplies : {},
  };

  // Updating roster unreadies the current side (can't change roster while locked in as ready)
  await prisma.coopExpedition.update({
    where: { id },
    data: isHost
      ? { hostRoster: roster as any, hostReady: false }
      : { guestRoster: roster as any, guestReady: false },
  });

  emitMany([row.hostId, row.guestId], { type: "coop:update", coopId: id });
  return c.json({ ok: true });
});

// ─── POST /api/coop/:id/ready — toggle my ready state ─────────

coop.post("/coop/:id/ready", async (c) => {
  const playerId = c.get("playerId");
  const id = c.req.param("id");
  const body = await c.req.json<{ ready: boolean }>();

  const row = await prisma.coopExpedition.findUnique({ where: { id } });
  if (!row) return c.json({ error: "Not found" }, 404);
  const isHost = row.hostId === playerId;
  if (!isHost && row.guestId !== playerId) return c.json({ error: "Not yours" }, 403);
  if (row.status !== "preparing") return c.json({ error: "Can't change ready state" }, 409);

  // Can only mark ready if the roster has at least one adventurer
  const myRoster = parseRoster(isHost ? row.hostRoster : row.guestRoster);
  if (body.ready && myRoster.adventurerIds.length === 0) {
    return c.json({ error: "Contribute at least one adventurer before readying up" }, 400);
  }

  const newHostReady = isHost ? !!body.ready : row.hostReady;
  const newGuestReady = isHost ? row.guestReady : !!body.ready;

  // Auto-deploy when both ready
  const bothReady = newHostReady && newGuestReady;
  const updateData: any = isHost ? { hostReady: newHostReady } : { guestReady: newGuestReady };
  if (bothReady) {
    updateData.status = "active";
    updateData.deployedAt = new Date();
  }

  await prisma.coopExpedition.update({ where: { id }, data: updateData });

  emitMany([row.hostId, row.guestId], { type: "coop:update", coopId: id });
  return c.json({ ok: true, deployed: bothReady });
});

// ─── POST /api/coop/:id/claim — claim rewards (per-player) ───────
//
// Returns the caller's slice of the runtime state + full rewards.
// Idempotent: re-calling returns the same data with alreadyClaimed=true.
// The client applies HP/deaths/XP/rewards locally when the loot modal is confirmed.

coop.post("/coop/:id/claim", async (c) => {
  const playerId = c.get("playerId");
  const id = c.req.param("id");

  const row = await prisma.coopExpedition.findUnique({ where: { id } });
  if (!row) return c.json({ error: "Not found" }, 404);
  if (row.hostId !== playerId && row.guestId !== playerId) return c.json({ error: "Not yours" }, 403);
  if (row.status !== "complete") return c.json({ error: "Coop not yet complete" }, 409);
  if (!row.runtimeState) return c.json({ error: "No runtime state" }, 500);

  const isHost = row.hostId === playerId;
  const alreadyClaimed = isHost ? row.hostClaimed : row.guestClaimed;

  const runtime = row.runtimeState as unknown as CoopRuntimeState;
  const myAdventurers = runtime.advResults?.[playerId] ?? [];

  const response: CoopClaimResponse = {
    rewards: runtime.rewards ?? [],
    log: runtime.log ?? [],
    success: runtime.success ?? false,
    wiped: runtime.wiped ?? false,
    myAdventurers,
    alreadyClaimed,
  };

  if (!alreadyClaimed) {
    await prisma.coopExpedition.update({
      where: { id },
      data: isHost ? { hostClaimed: true } : { guestClaimed: true },
    });
    // No WS event needed — only the caller cares about their own claim flag.
  }

  return c.json(response);
});

export default coop;
