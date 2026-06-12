const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

let token: string | null = localStorage.getItem("medieval-realm-token");

export function setToken(t: string | null) {
  token = t;
  if (t) {
    localStorage.setItem("medieval-realm-token", t);
  } else {
    localStorage.removeItem("medieval-realm-token");
  }
}

export function getToken(): string | null {
  return token;
}

/** Friendly fallback messages when the server doesn't send an `error` body
 *  (crashes, proxies, mid-deploy). Player-facing — keep them human. */
function friendlyStatusMessage(status: number): string {
  if (status === 502 || status === 503 || status === 504) {
    return "The server is waking up or being updated. Try again in a moment.";
  }
  if (status >= 500) {
    return "Something went wrong on our side. Give it a moment and try again.";
  }
  if (status === 429) {
    return "Too many attempts. Catch your breath and try again shortly.";
  }
  return `Request failed (${status}). Please try again.`;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    // fetch itself rejected: offline, DNS failure, server down mid-deploy.
    throw new Error("We cannot reach the server right now. Check your connection, or give it a moment and try again.");
  }

  // A 401 on game endpoints means "session invalid" -> back to login.
  // On the auth endpoints themselves a 401 is just "wrong credentials" and
  // must be SHOWN, not swallowed by a redirect (the old behavior reloaded
  // the login page and ate the error message).
  if (res.status === 401 && !path.startsWith("/auth/")) {
    setToken(null);
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? friendlyStatusMessage(res.status));
  }

  return res.json();
}
