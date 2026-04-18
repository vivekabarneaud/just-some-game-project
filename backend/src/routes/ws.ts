import type { Hono } from "hono";
import { verifyToken } from "../lib/jwt.js";
import { subscribe, type BusEvent } from "../lib/eventBus.js";

/**
 * Registers the WebSocket route on the given app using the provided
 * upgradeWebSocket helper from @hono/node-ws.
 *
 * Auth: the client includes the JWT in the query string (?token=...)
 * because browsers can't attach custom headers to WebSocket handshakes.
 */
export function registerWsRoutes(
  app: Hono<any>,
  upgradeWebSocket: (createEvents: (c: any) => any) => any,
): void {
  app.get(
    "/ws",
    upgradeWebSocket(async (c: any) => {
      const token = c.req.query("token");
      let playerId: string | null = null;
      if (token) {
        try {
          const payload = await verifyToken(token);
          playerId = payload.playerId;
        } catch {
          // invalid token — we'll close the socket in onOpen
        }
      }

      let unsubscribe: (() => void) | null = null;

      return {
        onOpen(_evt: Event, ws: any) {
          if (!playerId) {
            try { ws.send(JSON.stringify({ type: "error", reason: "unauthenticated" })); } catch {}
            ws.close(1008, "unauthenticated");
            return;
          }
          try { ws.send(JSON.stringify({ type: "hello", playerId })); } catch {}
          unsubscribe = subscribe(playerId, (event: BusEvent) => {
            try { ws.send(JSON.stringify(event)); } catch {}
          });
        },
        onClose() {
          if (unsubscribe) { unsubscribe(); unsubscribe = null; }
        },
        onError() {
          if (unsubscribe) { unsubscribe(); unsubscribe = null; }
        },
      };
    }),
  );
}
