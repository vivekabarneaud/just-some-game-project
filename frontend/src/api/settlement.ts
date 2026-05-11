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

/** Read-only check used on tab wake-up: returns the server's current updatedAt
 *  without touching the cached etag. If this differs from getExpectedUpdatedAt()
 *  the local state is stale (another tab/device wrote while we slept) and the
 *  caller should reload before letting the player act on doomed local state. */
export async function peekSettlementUpdatedAt(id: string): Promise<string> {
  const res = await apiFetch<SettlementResponse>(`/settlement/${id}`);
  return res.settlement.updatedAt;
}

// Guard so concurrent in-flight saves don't trigger N reloads when they all
// 409 at once.
let _reloadingForStaleState = false;

// Save serialization. With multiple save sources (1s debounced action,
// 15s periodic, visibilitychange) two saves can be in flight at once;
// the second one's `expectedUpdatedAt` is still the value from before
// the first one's response landed, so the server 409s it as stale. The
// fix is to never overlap saves: a second call while one is in flight
// is coalesced into a "pending" slot that the running save drains when
// it finishes. Latest call wins (older calls' state is dropped, since
// it's a strict subset of newer state for an action-driven game).
let _inflight: Promise<void> | null = null;
let _pending: { id: string; gameState: GameState } | null = null;

async function putSave(id: string, gameState: GameState): Promise<void> {
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
    // 409 stale_state — another tab or device wrote in between. Reload so
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

export async function saveSettlement(id: string, gameState: GameState): Promise<void> {
  if (_inflight) {
    // Coalesce — replace any earlier pending save with this one. The
    // running save will pick it up after its current request lands.
    _pending = { id, gameState };
    return;
  }
  _inflight = (async () => {
    try {
      await putSave(id, gameState);
      // Drain anything queued during the round-trip. Loop because each
      // drained save can itself admit a new pending entry.
      while (_pending) {
        const next = _pending;
        _pending = null;
        await putSave(next.id, next.gameState);
      }
    } finally {
      _inflight = null;
      // If the chain errored mid-drain, drop any pending state. The next
      // periodic / action save will re-issue from the live in-memory state,
      // which is at least as fresh as anything we'd be flushing here.
      _pending = null;
    }
  })();
  await _inflight;
}

export async function createSettlement(): Promise<SettlementResponse> {
  const res = await apiFetch<SettlementResponse>("/settlement/create", {
    method: "POST",
  });
  _expectedUpdatedAt = res.settlement.updatedAt;
  return res;
}
