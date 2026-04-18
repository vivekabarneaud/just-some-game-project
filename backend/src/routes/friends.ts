import { Hono } from "hono";
import type {
  FriendListResponse,
  SendFriendRequestRequest,
  RespondFriendRequestRequest,
} from "@medieval-realm/shared";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { emitMany } from "../lib/eventBus.js";
import type { AuthEnv } from "../types.js";

const friends = new Hono<AuthEnv>();
friends.use("/*", authMiddleware);

// ─── GET /api/friends — list accepted + pending (both directions) ──

friends.get("/friends", async (c) => {
  const playerId = c.get("playerId");

  const rows = await prisma.friendship.findMany({
    where: {
      OR: [{ requesterId: playerId }, { addresseeId: playerId }],
    },
    include: {
      requester: { select: { id: true, username: true } },
      addressee: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const response: FriendListResponse = {
    friends: [],
    incoming: [],
    outgoing: [],
  };

  for (const row of rows) {
    const isRequester = row.requesterId === playerId;
    const other = isRequester ? row.addressee : row.requester;

    if (row.status === "accepted") {
      response.friends.push({
        id: row.id,
        friendId: other.id,
        friendUsername: other.username,
        createdAt: row.createdAt.toISOString(),
      });
    } else if (row.status === "pending") {
      const entry = {
        id: row.id,
        otherPlayerId: other.id,
        otherUsername: other.username,
        createdAt: row.createdAt.toISOString(),
      };
      if (isRequester) response.outgoing.push(entry);
      else response.incoming.push(entry);
    }
  }

  return c.json(response);
});

// ─── POST /api/friends/request — send a friend request ──────────

friends.post("/friends/request", async (c) => {
  const playerId = c.get("playerId");
  const body = await c.req.json<SendFriendRequestRequest>();
  const targetUsername = body.username?.trim();
  if (!targetUsername) return c.json({ error: "Username required" }, 400);

  const target = await prisma.player.findUnique({
    where: { username: targetUsername },
    select: { id: true, username: true },
  });
  if (!target) return c.json({ error: "No player with that username" }, 404);
  if (target.id === playerId) return c.json({ error: "You can't friend yourself" }, 400);

  // Check existing friendship in either direction
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: playerId, addresseeId: target.id },
        { requesterId: target.id, addresseeId: playerId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "accepted") return c.json({ error: "Already friends" }, 409);
    if (existing.requesterId === playerId) return c.json({ error: "Request already sent" }, 409);
    // They sent me a request — auto-accept
    const updated = await prisma.friendship.update({
      where: { id: existing.id },
      data: { status: "accepted" },
    });
    emitMany([updated.requesterId, updated.addresseeId], { type: "friend:update" });
    return c.json({ friendshipId: updated.id, status: "accepted" });
  }

  const row = await prisma.friendship.create({
    data: {
      requesterId: playerId,
      addresseeId: target.id,
      status: "pending",
    },
  });
  emitMany([row.requesterId, row.addresseeId], { type: "friend:update" });
  return c.json({ friendshipId: row.id, status: "pending" });
});

// ─── POST /api/friends/:id/respond — accept or decline ───────────

friends.post("/friends/:id/respond", async (c) => {
  const playerId = c.get("playerId");
  const id = c.req.param("id");
  const body = await c.req.json<RespondFriendRequestRequest>();

  const row = await prisma.friendship.findUnique({ where: { id } });
  if (!row) return c.json({ error: "Friendship not found" }, 404);
  if (row.addresseeId !== playerId) return c.json({ error: "Not your request to respond to" }, 403);
  if (row.status !== "pending") return c.json({ error: "Request already resolved" }, 409);

  if (body.accept) {
    await prisma.friendship.update({
      where: { id },
      data: { status: "accepted" },
    });
    emitMany([row.requesterId, row.addresseeId], { type: "friend:update" });
    return c.json({ status: "accepted" });
  } else {
    await prisma.friendship.delete({ where: { id } });
    emitMany([row.requesterId, row.addresseeId], { type: "friend:update" });
    return c.json({ status: "declined" });
  }
});

// ─── DELETE /api/friends/:id — remove friend or cancel outgoing request ──

friends.delete("/friends/:id", async (c) => {
  const playerId = c.get("playerId");
  const id = c.req.param("id");

  const row = await prisma.friendship.findUnique({ where: { id } });
  if (!row) return c.json({ error: "Friendship not found" }, 404);
  if (row.requesterId !== playerId && row.addresseeId !== playerId) {
    return c.json({ error: "Not yours" }, 403);
  }

  await prisma.friendship.delete({ where: { id } });
  emitMany([row.requesterId, row.addresseeId], { type: "friend:update" });
  return c.json({ ok: true });
});

export default friends;
