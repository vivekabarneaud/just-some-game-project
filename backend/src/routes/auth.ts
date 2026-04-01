import { Hono } from "hono";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import type { RegisterRequest, LoginRequest, AuthResponse } from "@medieval-realm/shared";

const auth = new Hono();

auth.post("/register", async (c) => {
  const body = await c.req.json<RegisterRequest>();
  const { username, email, password } = body;

  // Validation
  if (!username || username.length < 3 || username.length > 20) {
    return c.json({ error: "Username must be 3-20 characters" }, 400);
  }
  if (!/^[a-zA-Z0-9_ ]+$/.test(username)) {
    return c.json({ error: "Username can only contain letters, numbers, spaces, and underscores" }, 400);
  }
  if (!email || !email.includes("@")) {
    return c.json({ error: "Invalid email" }, 400);
  }
  if (!password || password.length < 6) {
    return c.json({ error: "Password must be at least 6 characters" }, 400);
  }

  // Check uniqueness
  const existing = await prisma.player.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    const field = existing.username === username ? "Username" : "Email";
    return c.json({ error: `${field} already taken` }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const player = await prisma.player.create({
    data: { username, email, passwordHash },
  });

  const token = await signToken({ playerId: player.id, username: player.username });

  return c.json<AuthResponse>({
    token,
    player: { id: player.id, username: player.username },
  });
});

auth.post("/login", async (c) => {
  const body = await c.req.json<LoginRequest>();
  const { email, password } = body;

  const player = await prisma.player.findUnique({ where: { email } });
  if (!player) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const valid = await bcrypt.compare(password, player.passwordHash);
  if (!valid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const token = await signToken({ playerId: player.id, username: player.username });

  return c.json<AuthResponse>({
    token,
    player: { id: player.id, username: player.username },
  });
});

export default auth;
