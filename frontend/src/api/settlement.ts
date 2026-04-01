import type {
  SettlementListResponse,
  SettlementResponse,
  SaveSettlementRequest,
  GameState,
} from "@medieval-realm/shared";
import { apiFetch } from "./client";

export async function listSettlements(): Promise<SettlementListResponse> {
  return apiFetch<SettlementListResponse>("/settlements");
}

export async function loadSettlement(id: string): Promise<SettlementResponse> {
  return apiFetch<SettlementResponse>(`/settlement/${id}`);
}

export async function saveSettlement(id: string, gameState: GameState): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/settlement/${id}`, {
    method: "PUT",
    body: JSON.stringify({ gameState } satisfies SaveSettlementRequest),
  });
}

export async function createSettlement(): Promise<SettlementResponse> {
  return apiFetch<SettlementResponse>("/settlement/create", {
    method: "POST",
  });
}
