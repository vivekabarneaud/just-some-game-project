import { createMiddleware } from "hono/factory";
import { verifyToken } from "../lib/jwt.js";
import type { AuthEnv } from "../types.js";

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  try {
    const token = header.slice(7);
    const payload = await verifyToken(token);
    c.set("playerId", payload.playerId);
    c.set("username", payload.username);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});
