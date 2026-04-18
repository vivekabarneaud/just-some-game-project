/**
 * In-memory per-player event bus.
 *
 * Subscribers (WebSocket connections) register by playerId and receive events
 * emitted to that player. Events are JSON-serialisable objects — the WS layer
 * turns them into messages.
 *
 * Single-node only. If we scale horizontally, swap for Redis pub/sub with the
 * same emit/subscribe surface.
 */

export type BusEvent =
  | { type: "coop:invite"; coopId: string }
  | { type: "coop:update"; coopId: string }
  | { type: "coop:cancelled"; coopId: string }
  | { type: "friend:update" };

type Listener = (event: BusEvent) => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribe(playerId: string, listener: Listener): () => void {
  let set = listeners.get(playerId);
  if (!set) {
    set = new Set();
    listeners.set(playerId, set);
  }
  set.add(listener);
  return () => {
    const s = listeners.get(playerId);
    if (!s) return;
    s.delete(listener);
    if (s.size === 0) listeners.delete(playerId);
  };
}

export function emit(playerId: string, event: BusEvent): void {
  const set = listeners.get(playerId);
  if (!set) return;
  for (const l of set) {
    try { l(event); } catch (e) { console.error("eventBus listener error:", e); }
  }
}

export function emitMany(playerIds: string[], event: BusEvent): void {
  const seen = new Set<string>();
  for (const id of playerIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    emit(id, event);
  }
}
