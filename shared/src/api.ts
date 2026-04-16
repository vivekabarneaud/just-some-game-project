import type { GameState } from "./gameState.js";

// ─── Auth ───────────────────────────────────────────────────────

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  player: {
    id: string;
    username: string;
  };
}

// ─── Settlement ─────────────────────────────────────────────────

export interface SettlementInfo {
  id: string;
  name: string;
  x: number;
  y: number;
  worldId: string;
}

export interface SettlementResponse {
  settlement: SettlementInfo & {
    gameState: GameState;
  };
}

export interface SettlementListResponse {
  settlements: SettlementInfo[];
}

export interface SaveSettlementRequest {
  gameState: GameState;
}

// ─── World ──────────────────────────────────────────────────────

export interface WorldMapResponse {
  world: {
    id: string;
    name: string;
    width: number;
    height: number;
  };
  settlements: {
    id: string;
    name: string;
    x: number;
    y: number;
    playerName: string;
    score: number;
    rank: number;
    tier: string;
  }[];
}

// ─── Trade ─────────────────────────────────────────────────────

export type TradeResourceKey = "gold" | "wood" | "stone" | "food" | "iron" | "wool" | "fiber" | "ale" | "honey" | "fruit";

export interface CreateTradeOfferRequest {
  settlementId: string;
  giveResource: TradeResourceKey;
  giveAmount: number;
  receiveResource: TradeResourceKey;
  receiveAmount: number;
}

export interface AcceptTradeOfferRequest {
  settlementId: string;
}

export interface TradeOfferInfo {
  id: string;
  sellerName: string;
  sellerSettlementName: string;
  giveResource: TradeResourceKey;
  giveAmount: number;
  receiveResource: TradeResourceKey;
  receiveAmount: number;
  distance: number;
  travelMinutes: number;
  createdAt: string;
}

export interface OwnTradeOfferInfo {
  id: string;
  giveResource: TradeResourceKey;
  giveAmount: number;
  receiveResource: TradeResourceKey;
  receiveAmount: number;
  status: "open" | "accepted" | "completed" | "cancelled";
  buyerName?: string;
  caravanArrivesAt?: string;
  createdAt: string;
}

export interface CaravanInfo {
  tradeId: string;
  fromSettlementName: string;
  resource: TradeResourceKey;
  amount: number;
  arrivesAt: string;
}

export interface TradeListResponse {
  offers: TradeOfferInfo[];
}

export interface OwnTradeListResponse {
  offers: OwnTradeOfferInfo[];
  caravans: CaravanInfo[];
  activeCount: number;
  maxOffers: number;
}

export interface TradeOfferResponse {
  offer: OwnTradeOfferInfo;
}
