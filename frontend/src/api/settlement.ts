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

// Guard so concurrent in-flight saves don't trigger N reloads when they all
// 409 at once.
let _reloadingForStaleState = false;

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
    // 409 stale_state — server was written by another tab or device since
    // we last loaded. The simplest correct fix is to reload the page so
    // the normal load path pulls fresh state with all migrations applied.
    // Anything in-flight in this tab was destined to be rejected anyway.
    if (err instanceof Error && err.message === "stale_state") {
      console.warn("[settlement] save rejected (stale state) — reloading to sync");
      if (typeof window !== "undefined" && !_reloadingForStaleState) {
        _reloadingForStaleState = true;
        window.location.reload();
      }
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
