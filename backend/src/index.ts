import "dotenv/config";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import app from "./app.js";
import { env } from "./lib/env.js";
import { startTickLoop } from "./services/tick.js";
import { registerWsRoutes } from "./routes/ws.js";

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
registerWsRoutes(app, upgradeWebSocket as any);

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Backend running at http://localhost:${info.port}`);
  startTickLoop();
});

injectWebSocket(server);
