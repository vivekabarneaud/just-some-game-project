import type { AuthResponse, RegisterRequest, LoginRequest } from "@medieval-realm/shared";
import { apiFetch, setToken } from "./client";
import { wsClient } from "./ws";

/** Google OAuth web client ID — public identifier, safe to ship. */
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  "698020239210-inpdh9bl812bl8on47hg2ivmoh4nam07.apps.googleusercontent.com";

/** Exchange a Google Identity Services credential for our session token. */
export async function googleLogin(credential: string): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
  setToken(res.token);
  localStorage.setItem("medieval-realm-username", res.player.username);
  wsClient.connect();
  return res;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setToken(res.token);
  localStorage.setItem("medieval-realm-username", res.player.username);
  wsClient.connect();
  return res;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setToken(res.token);
  localStorage.setItem("medieval-realm-username", res.player.username);
  wsClient.connect();
  return res;
}

export function logout() {
  wsClient.disconnect();
  setToken(null);
  localStorage.removeItem("medieval-realm-save");
  localStorage.removeItem("medieval-realm-username");
  window.location.href = "/login";
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem("medieval-realm-token");
}

export function getUsername(): string | null {
  return localStorage.getItem("medieval-realm-username");
}
