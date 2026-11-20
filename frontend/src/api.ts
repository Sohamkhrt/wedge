import type { DecideResponse, Demo, HumanDecision, StartResponse, StartupInput } from "./types";

// Empty base = same origin (Vite dev proxy forwards /api to FastAPI). Override with VITE_API_URL.
const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new Error("Cannot reach the Wedge backend. Is `uvicorn app.main:app --reload` running on port 8000?");
  }
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? body);
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ status: string }>("/api/health"),
  demos: () => request<Demo[]>("/api/demos"),
  start: (input: StartupInput) => request<StartResponse>("/api/session/start", { method: "POST", body: JSON.stringify(input) }),
  decide: (threadId: string, decision: HumanDecision) =>
    request<DecideResponse>(`/api/session/${threadId}/decide`, { method: "POST", body: JSON.stringify(decision) }),
  exportUrl: (threadId: string) => `${BASE}/api/session/${threadId}/export`,
};
