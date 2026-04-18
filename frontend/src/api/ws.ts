/**
 * Realtime WebSocket client — singleton.
 *
 * The backend pushes tiny trigger messages (no payloads). Listeners receive
 * the event and typically refetch via REST. This keeps the server as the
 * single source of truth and survives dropped messages: reconnecting yields
 * fresh state on next user action or poll fallback.
 *
 * Usage:
 *   import { wsClient } from "~/api/ws";
 *   wsClient.connect();                      // after login
 *   const off = wsClient.on("coop:update", (e) => { ... });
 *   off();                                   // unsubscribe when component unmounts
 *   wsClient.disconnect();                   // on logout
 */

import { getToken } from "./client";

export type WsEvent =
  | { type: "hello"; playerId: string }
  | { type: "error"; reason: string }
  | { type: "coop:invite"; coopId: string }
  | { type: "coop:update"; coopId: string }
  | { type: "coop:cancelled"; coopId: string }
  | { type: "friend:update" };

type Listener = (event: WsEvent) => void;

function buildWsUrl(token: string): string {
  // Derive ws(s):// from the API base. Note: WS is mounted at /ws (not /api/ws)
  // to sidestep the /api/* auth middleware from sub-routers.
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  let base: string;
  if (apiUrl) {
    base = apiUrl.replace(/^http/, "ws");
  } else {
    base = (window.location.protocol === "https:" ? "wss:" : "ws:") + "//" + window.location.host;
  }
  return `${base}/ws?token=${encodeURIComponent(token)}`;
}

class WsClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private anyListeners = new Set<Listener>();
  private reconnectTimer: number | null = null;
  private backoff = 500; // ms — doubles up to 15s
  private desired = false; // true = we want to be connected

  connect() {
    this.desired = true;
    this.open();
  }

  disconnect() {
    this.desired = false;
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.ws) {
      try { this.ws.close(1000, "client disconnect"); } catch {}
      this.ws = null;
    }
  }

  on(type: WsEvent["type"], listener: Listener): () => void {
    let set = this.listeners.get(type);
    if (!set) { set = new Set(); this.listeners.set(type, set); }
    set.add(listener);
    return () => { set!.delete(listener); };
  }

  onAny(listener: Listener): () => void {
    this.anyListeners.add(listener);
    return () => { this.anyListeners.delete(listener); };
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private open() {
    if (!this.desired) return;
    const token = getToken();
    if (!token) {
      // try again later, once the user logs in
      this.scheduleReconnect();
      return;
    }
    try {
      const ws = new WebSocket(buildWsUrl(token));
      this.ws = ws;

      ws.addEventListener("open", () => {
        this.backoff = 500;
      });
      ws.addEventListener("message", (msg) => {
        let event: WsEvent;
        try { event = JSON.parse(msg.data); } catch { return; }
        this.dispatch(event);
      });
      ws.addEventListener("close", () => {
        this.ws = null;
        if (this.desired) this.scheduleReconnect();
      });
      ws.addEventListener("error", () => {
        // close will follow
      });
    } catch (e) {
      console.error("[ws] open failed:", e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(this.backoff, 15000);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.backoff = Math.min(this.backoff * 2, 15000);
      this.open();
    }, delay);
  }

  private dispatch(event: WsEvent) {
    const set = this.listeners.get(event.type);
    if (set) for (const l of set) { try { l(event); } catch (e) { console.error("[ws] listener error", e); } }
    for (const l of this.anyListeners) { try { l(event); } catch (e) { console.error("[ws] listener error", e); } }
  }
}

export const wsClient = new WsClient();
