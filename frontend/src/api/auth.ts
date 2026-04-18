import type { AuthResponse, RegisterRequest, LoginRequest } from "@medieval-realm/shared";
import { apiFetch, setToken } from "./client";
import { wsClient } from "./ws";

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
