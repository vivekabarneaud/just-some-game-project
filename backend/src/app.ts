import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import auth from "./routes/auth.js";
import settlement from "./routes/settlement.js";
import world from "./routes/world.js";
import leaderboard from "./routes/leaderboard.js";
import trade from "./routes/trade.js";
import friends from "./routes/friends.js";
import coop from "./routes/coop.js";

const app = new Hono();

// Global error safety net: log the real error server-side, hand the client
// a friendly, parseable JSON body. Without this, an unexpected throw (e.g.
// a Prisma schema drift) surfaces as a bare "error 500" in the UI.
app.onError((err, c) => {
  console.error(`[error] ${c.req.method} ${c.req.path}:`, err);
  return c.json({ error: "Something went wrong on our side. Give it a moment and try again." }, 500);
});
app.notFound((c) => c.json({ error: "Not found" }, 404));

app.use("*", logger());
const allowedOrigins = [
  "http://localhost:3000",
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : []),
];
app.use("*", cors({
  origin: (origin) => allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  credentials: true,
}));

// Health check (public, before auth routes)
app.get("/api/health", (c) => c.json({ ok: true }));

// Routes
app.route("/api/auth", auth);
app.route("/api", settlement);
app.route("/api", world);
app.route("/api", leaderboard);
app.route("/api", trade);
app.route("/api", friends);
app.route("/api", coop);

export default app;
