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

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}
