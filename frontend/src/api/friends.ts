import type {
  FriendListResponse,
  SendFriendRequestRequest,
  RespondFriendRequestRequest,
} from "@medieval-realm/shared";
import { apiFetch } from "./client";

export async function fetchFriends(): Promise<FriendListResponse> {
  return apiFetch<FriendListResponse>("/friends");
}

export async function sendFriendRequest(username: string): Promise<{ friendshipId: string; status: string }> {
  return apiFetch("/friends/request", {
    method: "POST",
    body: JSON.stringify({ username } as SendFriendRequestRequest),
  });
}

export async function respondFriendRequest(friendshipId: string, accept: boolean): Promise<{ status: string }> {
  return apiFetch(`/friends/${friendshipId}/respond`, {
    method: "POST",
    body: JSON.stringify({ accept } as RespondFriendRequestRequest),
  });
}

export async function removeFriend(friendshipId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/friends/${friendshipId}`, { method: "DELETE" });
}
