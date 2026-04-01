import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import auth from "./routes/auth.js";
import settlement from "./routes/settlement.js";
import world from "./routes/world.js";

const app = new Hono();

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

export default app;
