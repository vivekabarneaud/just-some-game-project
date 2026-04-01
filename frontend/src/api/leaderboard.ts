import { apiFetch } from "./client";

export interface LeaderboardEntry {
  playerName: string;
  settlementName: string;
  score: number;
  tier: string;
  population: number;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await apiFetch<{ leaderboard: LeaderboardEntry[] }>("/leaderboard");
  return res.leaderboard;
}
