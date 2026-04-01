import "dotenv/config";
import { serve } from "@hono/node-server";
import app from "./app.js";
import { env } from "./lib/env.js";
import { startTickLoop } from "./services/tick.js";

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Backend running at http://localhost:${info.port}`);
  startTickLoop();
});
