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

  // Verify the Google ID token. PRIMARY path: Google's `tokeninfo` endpoint on
  // oauth2.googleapis.com — because Render's shared free-tier egress IP is 403'd
  // by www.googleapis.com (the JWKS host), so local signature verification can't
  // fetch the certs there. tokeninfo validates the token server-side (signature
  // + expiry) on a different host; we still re-check issuer + audience ourselves.
  // FALLBACK: local JWKS verification, for environments where the cert host is
  // reachable (local dev, or if the block lifts).
  let claims: { sub: string; email?: string; email_verified?: boolean; name?: string } | null = null;

  try {
    const r = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.credential)}`,
    );
    if (r.ok) {
      const t = (await r.json()) as Record<string, string>;
      const issOk = t.iss === "accounts.google.com" || t.iss === "https://accounts.google.com";
      const audOk = t.aud === env.GOOGLE_CLIENT_ID;
      const notExpired = Number(t.exp) * 1000 > Date.now();
      if (issOk && audOk && notExpired && t.sub) {
        claims = { sub: t.sub, email: t.email, email_verified: t.email_verified === "true", name: t.name };
      } else {
        console.error(`[auth/google] tokeninfo rejected token: iss=${issOk} aud=${audOk} notExpired=${notExpired}`);
      }
    } else {
      console.error(`[auth/google] tokeninfo → ${r.status} ${r.statusText}`);
    }
  } catch (e) {
    console.error(`[auth/google] tokeninfo fetch threw: ${(e as Error)?.message ?? e}`);
  }

  if (!claims) {
    try {
      const { payload } = await jwtVerify(body.credential, GOOGLE_JWKS, {
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience: env.GOOGLE_CLIENT_ID,
      });
      claims = payload as { sub: string; email?: string; email_verified?: boolean; name?: string };
    } catch (e) {
      console.error(`[auth/google] JWKS fallback verification failed: ${(e as Error)?.message ?? e}`);
    }
  }

  if (!claims) {
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
