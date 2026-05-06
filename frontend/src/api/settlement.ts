import type {
  SettlementListResponse,
  SettlementResponse,
  SaveSettlementRequest,
  SaveSettlementResponse,
  GameState,
} from "@medieval-realm/shared";
import { apiFetch } from "./client";

// ─── Optimistic concurrency token ──────────────────────────────
// Server-managed `updatedAt` of the most recently loaded or saved
// settlement. Echoed on each save as `expectedUpdatedAt`; if the server's
// current value doesn't match, our view is stale and the save 409s. We
// reset it to undefined when there's nothing loaded yet (legacy fallback
// of last-write-wins on the server).

let _expectedUpdatedAt: string | undefined;

export function getExpectedUpdatedAt(): string | undefined {
  return _expectedUpdatedAt;
}

export function clearExpectedUpdatedAt() {
  _expectedUpdatedAt = undefined;
}

export async function listSettlements(): Promise<SettlementListResponse> {
  return apiFetch<SettlementListResponse>("/settlements");
}

export async function loadSettlement(id: string): Promise<SettlementResponse> {
  const res = await apiFetch<SettlementResponse>(`/settlement/${id}`);
  _expectedUpdatedAt = res.settlement.updatedAt;
  return res;
}

export async function saveSettlement(id: string, gameState: GameState): Promise<void> {
  try {
    const res = await apiFetch<SaveSettlementResponse>(`/settlement/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        gameState,
        expectedUpdatedAt: _expectedUpdatedAt,
      } satisfies SaveSettlementRequest),
    });
    _expectedUpdatedAt = res.updatedAt;
  } catch (err) {
    // 409 stale_state — server has newer data than what this client most
    // recently saw. Almost always a stale tab/device that loaded the
    // settlement hours ago and is firing periodic saves with old state.
    // We don't try to merge — the call sites .catch silently and the
    // client keeps tab in its forked state until the player reloads.
    if (err instanceof Error && err.message === "stale_state") {
      console.warn("[settlement] save rejected (stale state) — another tab or device wrote in between; reload to sync");
    }
    throw err;
  }
}

export async function createSettlement(): Promise<SettlementResponse> {
  const res = await apiFetch<SettlementResponse>("/settlement/create", {
    method: "POST",
  });
  _expectedUpdatedAt = res.settlement.updatedAt;
  return res;
}
