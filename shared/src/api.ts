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


// ─── Friends ────────────────────────────────────────────────────

export interface FriendInfo {
  id: string;                // friendship row id
  friendId: string;          // the other player's id
  friendUsername: string;    // the other player's username
  createdAt: string;
}

export interface FriendRequestInfo {
  id: string;                // friendship row id
  otherPlayerId: string;     // the other party
  otherUsername: string;
  createdAt: string;
}

export interface FriendListResponse {
  friends: FriendInfo[];
  incoming: FriendRequestInfo[];  // requests sent TO me
  outgoing: FriendRequestInfo[];  // requests I sent
}

export interface SendFriendRequestRequest {
  username: string;
}

export interface RespondFriendRequestRequest {
  accept: boolean;
}


// ─── Co-op Expeditions ──────────────────────────────────────────

export type CoopExpeditionStatus = "pending" | "preparing" | "active" | "complete" | "cancelled";

export interface CoopExpeditionInfo {
  id: string;
  expeditionId: string;            // template ID from EXPEDITION_POOL
  status: CoopExpeditionStatus;
  hostId: string;
  hostUsername: string;
  guestId: string;
  guestUsername: string;
  iAmHost: boolean;                // convenience for frontend
  createdAt: string;
  deployedAt?: string;
  completedAt?: string;
  /** Whether I've already claimed my rewards (only meaningful when status=complete). */
  iAmClaimed?: boolean;
}

export interface CreateCoopInviteRequest {
  expeditionId: string;            // template ID
  friendUsername: string;
}

export interface RespondCoopInviteRequest {
  accept: boolean;
}

export interface CoopListResponse {
  coops: CoopExpeditionInfo[];     // all mine — as host or guest, any status
}


// ─── Co-op rosters (Session 2b) ────────────────────────────────

/** A lightweight adventurer summary for display on the shared coop panel (either player's view). */
export interface CoopAdventurerSummary {
  id: string;
  name: string;
  class: "warrior" | "wizard" | "priest" | "archer" | "assassin";
  rank: number;
  level: number;
  str: number;
  dex: number;
  int: number;
  vit: number;
  wis: number;
  alive: boolean;
  image?: string; // portrait url
}

export interface CoopRosterEntry {
  adventurerIds: string[];
  supplies: Record<string, { potion?: string; food?: string; recovery?: string }>;
}

export interface UpdateCoopRosterRequest {
  adventurerIds: string[];
  supplies: Record<string, { potion?: string; food?: string; recovery?: string }>;
}

/** Extended coop info (returned alongside the base info when detailed view is requested). */
export interface CoopExpeditionDetail extends CoopExpeditionInfo {
  hostReady: boolean;
  guestReady: boolean;
  hostRoster: CoopRosterEntry;
  guestRoster: CoopRosterEntry;
  /** Summaries of adventurers currently in the host's roster. */
  hostContributedAdvs: CoopAdventurerSummary[];
  /** Summaries of adventurers currently in the guest's roster. */
  guestContributedAdvs: CoopAdventurerSummary[];
}

export interface CoopDetailResponse {
  coop: CoopExpeditionDetail;
}

// ─── Co-op resolution & claim (Session 2c) ─────────────────────

/** Per-adventurer outcome from a resolved coop expedition — what the client applies on claim. */
export interface CoopAdventurerOutcome {
  id: string;
  finalHp: number;
  maxHp: number;
  died: boolean;
  xpGained: number;
}

/** The full stored runtime state after a coop expedition resolves.
 *  Host and guest each receive their own slice + a shared copy of rewards/log on claim. */
export interface CoopRuntimeState {
  /** Shared rewards pool — each player gets a full copy (the "everyone wins" model). */
  rewards: { resource: string; amount: number }[];
  /** Shared expedition event log (combat results, encounters, etc.). */
  log: { kind: string; summary: string; icon: string; success: boolean }[];
  /** Team wiped before finishing all events. */
  wiped: boolean;
  /** Per-player adventurer outcomes keyed by playerId. */
  advResults: Record<string, CoopAdventurerOutcome[]>;
  /** Whether the overall run is a success (some enemies remain standing = failure). */
  success: boolean;
}

/** Returned by POST /coop/:id/claim — the requesting player's slice + shared data. */
export interface CoopClaimResponse {
  rewards: { resource: string; amount: number }[];
  log: { kind: string; summary: string; icon: string; success: boolean }[];
  success: boolean;
  wiped: boolean;
  /** Only the caller's adventurers (not the other player's). */
  myAdventurers: CoopAdventurerOutcome[];
  /** Whether this claim already happened — idempotent re-read. */
  alreadyClaimed: boolean;
}
