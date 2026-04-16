import { Hono } from "hono";
import type {
  GameState,
  CreateTradeOfferRequest,
  AcceptTradeOfferRequest,
  TradeListResponse,
  OwnTradeListResponse,
  TradeOfferResponse,
  TradeResourceKey,
} from "@medieval-realm/shared";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { isValidResource, getResource, deductResource, addResource } from "../lib/resources.js";
import type { AuthEnv } from "../types.js";

const CARAVAN_SPEED = 10; // map units per minute

const trade = new Hono<AuthEnv>();
trade.use("/*", authMiddleware);

// ─── Helper ─────────────────────────────────────────────────────

function getMarketLevel(state: GameState): number {
  return (state.buildings as any[])?.find((b: any) => b.buildingId === "marketplace")?.level ?? 0;
}

function euclidean(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function toOwnInfo(t: any) {
  return {
    id: t.id,
    giveResource: t.giveResource as TradeResourceKey,
    giveAmount: t.giveAmount,
    receiveResource: t.receiveResource as TradeResourceKey,
    receiveAmount: t.receiveAmount,
    status: t.status,
    buyerName: t.buyer?.username,
    caravanArrivesAt: t.caravanArrivesAt?.toISOString(),
    createdAt: t.createdAt.toISOString(),
  };
}

// ─── Browse open offers ─────────────────────────────────────────

trade.get("/trades", async (c) => {
  const playerId = c.get("playerId");
  const settlementId = c.req.query("settlementId");
  if (!settlementId) return c.json({ error: "settlementId required" }, 400);

  const mySett = await prisma.settlement.findFirst({ where: { id: settlementId, playerId } });
  if (!mySett) return c.json({ error: "Settlement not found" }, 404);

  const offers = await prisma.tradeOffer.findMany({
    where: { status: "open", sellerId: { not: playerId } },
    include: {
      seller: { select: { username: true } },
      sellerSett: { select: { name: true, x: true, y: true, gameState: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const mapped = offers.map((o) => {
    const dist = euclidean(mySett.x, mySett.y, o.sellerSett.x, o.sellerSett.y);
    const settState = o.sellerSett.gameState as any;
    return {
      id: o.id,
      sellerName: o.seller.username,
      sellerSettlementName: settState?.villageName || o.sellerSett.name,
      giveResource: o.giveResource as TradeResourceKey,
      giveAmount: o.giveAmount,
      receiveResource: o.receiveResource as TradeResourceKey,
      receiveAmount: o.receiveAmount,
      distance: Math.round(dist),
      travelMinutes: Math.ceil(dist / CARAVAN_SPEED),
      createdAt: o.createdAt.toISOString(),
    };
  });

  return c.json<TradeListResponse>({ offers: mapped });
});

// ─── Own offers + incoming caravans ─────────────────────────────

trade.get("/trades/mine", async (c) => {
  const playerId = c.get("playerId");
  const settlementId = c.req.query("settlementId");
  if (!settlementId) return c.json({ error: "settlementId required" }, 400);

  const mySett = await prisma.settlement.findFirst({ where: { id: settlementId, playerId } });
  if (!mySett) return c.json({ error: "Settlement not found" }, 404);

  const state = mySett.gameState as unknown as GameState;
  const marketLevel = getMarketLevel(state);

  // Own offers (open or accepted)
  const ownOffers = await prisma.tradeOffer.findMany({
    where: { sellerId: playerId, status: { in: ["open", "accepted"] } },
    include: { buyer: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Incoming caravans: trades I accepted as buyer (receiving giveResource)
  const buyerTrades = await prisma.tradeOffer.findMany({
    where: { buyerId: playerId, status: "accepted", caravanArrivesAt: { not: null } },
    include: { sellerSett: { select: { name: true, gameState: true } } },
    orderBy: { caravanArrivesAt: "asc" },
  });

  // Incoming caravans: trades where I'm the seller and someone accepted (receiving receiveResource)
  const sellerAccepted = await prisma.tradeOffer.findMany({
    where: { sellerId: playerId, status: "accepted", caravanArrivesAt: { not: null } },
    include: { buyerSett: { select: { name: true, gameState: true } } },
    orderBy: { caravanArrivesAt: "asc" },
  });

  const caravans = [
    ...buyerTrades.map((t) => {
      const settState = t.sellerSett.gameState as any;
      return {
        tradeId: t.id,
        fromSettlementName: settState?.villageName || t.sellerSett.name,
        resource: t.giveResource as TradeResourceKey,
        amount: t.giveAmount,
        arrivesAt: t.caravanArrivesAt!.toISOString(),
      };
    }),
    ...sellerAccepted.map((t) => {
      const settState = t.buyerSett?.gameState as any;
      return {
        tradeId: t.id,
        fromSettlementName: settState?.villageName || t.buyerSett?.name || "Unknown",
        resource: t.receiveResource as TradeResourceKey,
        amount: t.receiveAmount,
        arrivesAt: t.caravanArrivesAt!.toISOString(),
      };
    }),
  ].sort((a, b) => new Date(a.arrivesAt).getTime() - new Date(b.arrivesAt).getTime());

  const activeCount = ownOffers.filter((o) => o.status === "open").length;

  return c.json<OwnTradeListResponse>({
    offers: ownOffers.map(toOwnInfo),
    caravans,
    activeCount,
    maxOffers: 1 + marketLevel,
  });
});

// ─── Create trade offer ─────────────────────────────────────────

trade.post("/trades", async (c) => {
  const playerId = c.get("playerId");
  const body = await c.req.json<CreateTradeOfferRequest>();

  if (!isValidResource(body.giveResource) || !isValidResource(body.receiveResource)) {
    return c.json({ error: "Invalid resource" }, 400);
  }
  if (body.giveResource === body.receiveResource) {
    return c.json({ error: "Cannot trade a resource for itself" }, 400);
  }
  if (!Number.isInteger(body.giveAmount) || body.giveAmount < 1 ||
      !Number.isInteger(body.receiveAmount) || body.receiveAmount < 1) {
    return c.json({ error: "Amounts must be positive integers" }, 400);
  }

  const sett = await prisma.settlement.findFirst({ where: { id: body.settlementId, playerId } });
  if (!sett) return c.json({ error: "Settlement not found" }, 404);

  const state = sett.gameState as unknown as GameState;
  const marketLevel = getMarketLevel(state);
  if (marketLevel === 0) return c.json({ error: "Marketplace not built" }, 403);

  const openCount = await prisma.tradeOffer.count({ where: { sellerId: playerId, status: "open" } });
  if (openCount >= 1 + marketLevel) {
    return c.json({ error: "Maximum offers reached" }, 400);
  }

  const modified = structuredClone(state);
  if (!deductResource(modified, body.giveResource, body.giveAmount)) {
    return c.json({ error: "Insufficient resources" }, 400);
  }

  const [offer] = await prisma.$transaction([
    prisma.tradeOffer.create({
      data: {
        sellerId: playerId,
        sellerSettId: sett.id,
        giveResource: body.giveResource,
        giveAmount: body.giveAmount,
        receiveResource: body.receiveResource,
        receiveAmount: body.receiveAmount,
      },
    }),
    prisma.settlement.update({
      where: { id: sett.id },
      data: { gameState: modified as any },
    }),
  ]);

  return c.json<TradeOfferResponse>({ offer: toOwnInfo(offer) });
});

// ─── Accept trade offer ─────────────────────────────────────────

trade.post("/trades/:id/accept", async (c) => {
  const playerId = c.get("playerId");
  const tradeId = c.req.param("id");
  const body = await c.req.json<AcceptTradeOfferRequest>();

  const offer = await prisma.tradeOffer.findUnique({
    where: { id: tradeId },
    include: { sellerSett: true },
  });
  if (!offer || offer.status !== "open") {
    return c.json({ error: "Offer not available" }, 409);
  }
  if (offer.sellerId === playerId) {
    return c.json({ error: "Cannot accept your own offer" }, 400);
  }

  const buyerSett = await prisma.settlement.findFirst({ where: { id: body.settlementId, playerId } });
  if (!buyerSett) return c.json({ error: "Settlement not found" }, 404);

  // Deduct buyer's resources
  const buyerState = buyerSett.gameState as unknown as GameState;
  const buyerModified = structuredClone(buyerState);
  if (!deductResource(buyerModified, offer.receiveResource as TradeResourceKey, offer.receiveAmount)) {
    return c.json({ error: "Insufficient resources" }, 400);
  }

  const dist = euclidean(buyerSett.x, buyerSett.y, offer.sellerSett.x, offer.sellerSett.y);
  const travelMs = Math.ceil(dist / CARAVAN_SPEED) * 60_000;
  const arrivesAt = new Date(Date.now() + travelMs);

  // Push event to seller's game state
  const sellerState = offer.sellerSett.gameState as unknown as GameState;
  const sellerModified = structuredClone(sellerState);
  const buyerName = c.get("username");
  const buyerSettName = (buyerSett.gameState as any)?.villageName || buyerSett.name;
  if (!sellerModified.eventLog) sellerModified.eventLog = [];
  sellerModified.eventLog.unshift({
    type: "trade_accepted",
    icon: "🤝",
    message: `${buyerName} of ${buyerSettName} accepted your trade! ${offer.receiveAmount} ${offer.receiveResource} incoming.`,
    timestamp: Date.now(),
  });
  if (sellerModified.eventLog.length > 50) sellerModified.eventLog.length = 50;

  const [updated] = await prisma.$transaction([
    prisma.tradeOffer.update({
      where: { id: tradeId },
      data: {
        status: "accepted",
        buyerId: playerId,
        buyerSettId: buyerSett.id,
        distance: dist,
        caravanArrivesAt: arrivesAt,
      },
    }),
    prisma.settlement.update({
      where: { id: buyerSett.id },
      data: { gameState: buyerModified as any },
    }),
    prisma.settlement.update({
      where: { id: offer.sellerSettId },
      data: { gameState: sellerModified as any },
    }),
  ]);

  return c.json<TradeOfferResponse>({ offer: toOwnInfo(updated) });
});

// ─── Cancel own offer ───────────────────────────────────────────

trade.post("/trades/:id/cancel", async (c) => {
  const playerId = c.get("playerId");
  const tradeId = c.req.param("id");

  const offer = await prisma.tradeOffer.findUnique({ where: { id: tradeId } });
  if (!offer || offer.sellerId !== playerId) {
    return c.json({ error: "Offer not found" }, 404);
  }
  if (offer.status !== "open") {
    return c.json({ error: "Can only cancel open offers" }, 400);
  }

  const sett = await prisma.settlement.findUnique({ where: { id: offer.sellerSettId } });
  if (!sett) return c.json({ error: "Settlement not found" }, 404);

  const state = sett.gameState as unknown as GameState;
  const modified = structuredClone(state);
  addResource(modified, offer.giveResource as TradeResourceKey, offer.giveAmount);

  await prisma.$transaction([
    prisma.tradeOffer.update({
      where: { id: tradeId },
      data: { status: "cancelled" },
    }),
    prisma.settlement.update({
      where: { id: sett.id },
      data: { gameState: modified as any },
    }),
  ]);

  return c.json({ ok: true });
});

export default trade;
