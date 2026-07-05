import { Hono } from "hono";
import bcrypt from "bcrypt";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { env } from "../lib/env.js";
import type { RegisterRequest, LoginRequest, GoogleAuthRequest, AuthResponse } from "@medieval-realm/shared";

const auth = new Hono();

// Google's public signing keys, fetched lazily and cached by jose.
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

/** Derive a unique, rule-compliant username from the Google profile.
 *  Falls back to the email local-part, then suffixes a counter. */
async function uniqueUsername(name: string | undefined, email: string): Promise<string> {
  const base = (name ?? email.split("@")[0])
    .replace(/[^a-zA-Z0-9_ ]/g, "")
    .trim()
    .slice(0, 20) || "Settler";
  let candidate = base.length >= 3 ? base : `${base}123`.slice(0, 20);
  for (let i = 2; ; i++) {
    const existing = await prisma.player.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
    const suffix = ` ${i}`;
    candidate = `${base.slice(0, 20 - suffix.length)}${suffix}`;
  }
}

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
  let player;
  try {
    player = await prisma.player.create({
      data: { username, email, passwordHash },
    });
  } catch (err: any) {
    // Unique-constraint race (someone claimed the name/email between our
    // check and the insert). P2002 = Prisma unique violation.
    if (err?.code === "P2002") {
      return c.json({ error: "Username or email already taken" }, 409);
    }
    throw err;
  }

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
  if (!player.passwordHash) {
    return c.json({ error: "This account signs in with Google. Use the Google button below." }, 401);
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

/** Sign in / sign up with Google. The frontend sends the Google Identity
 *  Services ID-token credential; we verify its signature against Google's
 *  JWKS and its audience against our client ID, then find-or-create the
 *  player. Linking: an existing password account with the same VERIFIED
 *  email gets its googleId attached (so both methods reach one account). */
auth.post("/google", async (c) => {
  const body = await c.req.json<GoogleAuthRequest>();
  if (!body.credential) {
    return c.json({ error: "Missing Google credential" }, 400);
  }

  let claims: { sub: string; email?: string; email_verified?: boolean; name?: string };
  try {
    const { payload } = await jwtVerify(body.credential, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: env.GOOGLE_CLIENT_ID,
    });
    claims = payload as typeof claims;
  } catch (e) {
    // Surface WHY it failed (server logs only — the player still sees the
    // generic message). jose messages are specific: "unexpected 'aud' claim
    // value" = client-ID mismatch (frontend VITE_GOOGLE_CLIENT_ID vs backend
    // GOOGLE_CLIENT_ID), JWKS/timeout = can't reach Google's certs, exp = clock
    // skew. The message may include the public client IDs, never the token.
    console.error(
      `[auth/google] ID-token verification failed: ${(e as Error)?.message ?? e} ` +
      `(backend expects aud=${env.GOOGLE_CLIENT_ID})`,
    );
    // DIAGNOSTIC: the JWKS fetch got a 403 from Google's edge. Distinguish a
    // missing-User-Agent block (fixable) from an IP-reputation block (infra) by
    // fetching with and without a UA. Runs only on the failure path.
    try {
      const noUa = await fetch("https://www.googleapis.com/oauth2/v3/certs");
      const withUa = await fetch("https://www.googleapis.com/oauth2/v3/certs", {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; medieval-realm-backend/1.0)" },
      });
      console.error(`[auth/google] JWKS probe → no-UA=${noUa.status}, with-UA=${withUa.status}`);
    } catch (pe) {
      console.error(`[auth/google] JWKS probe fetch threw: ${(pe as Error)?.message ?? pe}`);
    }
    return c.json({ error: "Invalid Google sign-in. Please try again." }, 401);
  }

  if (!claims.email || claims.email_verified !== true) {
    return c.json({ error: "Your Google account has no verified email" }, 401);
  }

  // 1) Returning Google player
  let player = await prisma.player.findUnique({ where: { googleId: claims.sub } });

  // 2) Existing password account with the same verified email -> link it
  if (!player) {
    const byEmail = await prisma.player.findUnique({ where: { email: claims.email } });
    if (byEmail) {
      player = await prisma.player.update({
        where: { id: byEmail.id },
        data: { googleId: claims.sub },
      });
    }
  }

  // 3) Brand-new player
  if (!player) {
    const username = await uniqueUsername(claims.name, claims.email);
    player = await prisma.player.create({
      data: { username, email: claims.email, googleId: claims.sub },
    });
  }

  const token = await signToken({ playerId: player.id, username: player.username });

  return c.json<AuthResponse>({
    token,
    player: { id: player.id, username: player.username },
  });
});

export default auth;
