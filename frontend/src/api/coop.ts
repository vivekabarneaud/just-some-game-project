import type {
  CoopListResponse,
  CoopExpeditionInfo,
  CreateCoopInviteRequest,
  RespondCoopInviteRequest,
  CoopDetailResponse,
  UpdateCoopRosterRequest,
  CoopClaimResponse,
} from "@medieval-realm/shared";
import { apiFetch } from "./client";

export async function fetchCoops(): Promise<CoopListResponse> {
  return apiFetch<CoopListResponse>("/coop");
}

export async function fetchCoopDetail(id: string): Promise<CoopDetailResponse> {
  return apiFetch<CoopDetailResponse>(`/coop/${id}`);
}

export async function inviteCoop(req: CreateCoopInviteRequest): Promise<{ coop: CoopExpeditionInfo }> {
  return apiFetch("/coop/invite", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function respondCoop(id: string, accept: boolean): Promise<unknown> {
  return apiFetch(`/coop/${id}/respond`, {
    method: "POST",
    body: JSON.stringify({ accept } as RespondCoopInviteRequest),
  });
}

export async function cancelCoop(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/coop/${id}`, { method: "DELETE" });
}

export async function updateCoopRoster(id: string, req: UpdateCoopRosterRequest): Promise<{ ok: boolean }> {
  return apiFetch(`/coop/${id}/roster`, {
    method: "PATCH",
    body: JSON.stringify(req),
  });
}

export async function setCoopReady(id: string, ready: boolean): Promise<{ ok: boolean; deployed: boolean }> {
  return apiFetch(`/coop/${id}/ready`, {
    method: "POST",
    body: JSON.stringify({ ready }),
  });
}

export async function claimCoop(id: string): Promise<CoopClaimResponse> {
  return apiFetch<CoopClaimResponse>(`/coop/${id}/claim`, { method: "POST" });
}
