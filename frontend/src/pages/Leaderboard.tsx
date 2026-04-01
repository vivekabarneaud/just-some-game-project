import { createSignal, onMount, For, Show } from "solid-js";
import { fetchLeaderboard, type LeaderboardEntry } from "~/api/leaderboard";

const TIER_ICONS: Record<string, string> = {
  camp: "🏕️",
  village: "🏘️",
  town: "🏙️",
  city: "🏰",
};

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [entries, setEntries] = createSignal<LeaderboardEntry[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");

  onMount(async () => {
    try {
      const data = await fetchLeaderboard();
      setEntries(data);
    } catch (err: any) {
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  });

  return (
    <div>
      <h1 class="page-title">Leaderboard</h1>

      <Show when={loading()}>
        <div style={{ color: "var(--text-secondary)", padding: "40px", "text-align": "center" }}>
          Loading rankings...
        </div>
      </Show>

      <Show when={error()}>
        <div style={{ color: "var(--accent-red)", padding: "20px" }}>{error()}</div>
      </Show>

      <Show when={!loading() && !error()}>
        <Show when={entries().length === 0}>
          <div style={{ color: "var(--text-secondary)", padding: "40px", "text-align": "center" }}>
            No settlements yet. Be the first!
          </div>
        </Show>

        <Show when={entries().length > 0}>
          <div class="leaderboard-table">
            <div class="leaderboard-header">
              <span class="lb-rank">Rank</span>
              <span class="lb-player">Player</span>
              <span class="lb-settlement">Settlement</span>
              <span class="lb-tier">Tier</span>
              <span class="lb-pop">Pop.</span>
              <span class="lb-score">Score</span>
            </div>
            <For each={entries()}>
              {(entry, i) => (
                <div class="leaderboard-row" classList={{ "top-three": i() < 3 }}>
                  <span class="lb-rank">
                    {i() < 3 ? RANK_MEDALS[i()] : `#${i() + 1}`}
                  </span>
                  <span class="lb-player">{entry.playerName}</span>
                  <span class="lb-settlement">{entry.settlementName}</span>
                  <span class="lb-tier">
                    {TIER_ICONS[entry.tier] ?? "🏕️"} {entry.tier}
                  </span>
                  <span class="lb-pop">{entry.population}</span>
                  <span class="lb-score">{entry.score}</span>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
}
