import type { WorldMapResponse } from "@medieval-realm/shared";
import { apiFetch } from "./client";

export type WorldSettlement = WorldMapResponse["settlements"][number];

export async function fetchWorldMap(): Promise<WorldMapResponse> {
  return apiFetch<WorldMapResponse>("/world");
}
