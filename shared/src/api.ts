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
  }[];
}
