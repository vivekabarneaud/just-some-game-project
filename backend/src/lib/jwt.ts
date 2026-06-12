import { SignJWT, jwtVerify } from "jose";
import { env } from "./env.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function signToken(payload: { playerId: string; username: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    // 60 days: the old 7d expiry silently logged players out weekly and (in
    // dev) stranded throwaway accounts. Tokens live in per-device localStorage.
    .setExpirationTime("60d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<{ playerId: string; username: string }> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as { playerId: string; username: string };
}
