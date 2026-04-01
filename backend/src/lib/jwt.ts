import { SignJWT, jwtVerify } from "jose";
import { env } from "./env.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function signToken(payload: { playerId: string; username: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<{ playerId: string; username: string }> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as { playerId: string; username: string };
}
