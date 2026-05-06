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
  try {
    await apiFetch<{ ok: boolean }>(`/settlement/${id}`, {
      method: "PUT",
      body: JSON.stringify({ gameState } satisfies SaveSettlementRequest),
    });
  } catch (err) {
    // Stale-state 409 — server already has newer data than what we're
    // sending. Almost certainly a stale tab that loaded the settlement
    // hours ago and is firing periodic saves with old in-memory state.
    // Log a breadcrumb (the call sites still .catch silently) so we can
    // spot it in DevTools without crashing the app.
    if (err instanceof Error && err.message === "stale_state") {
      console.warn("[settlement] save rejected (stale state) — another tab may be authoritative");
    }
    throw err;
  }
}

export async function createSettlement(): Promise<SettlementResponse> {
  return apiFetch<SettlementResponse>("/settlement/create", {
    method: "POST",
  });
}
