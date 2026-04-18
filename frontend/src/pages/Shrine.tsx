import { Show, For } from "solid-js";
import { useGame } from "~/engine/gameState";
import { getCurrentDeity, getSeasonDeities, getDeity } from "~/data/deities";
import { IS_DEV, getGlobalSeason, SEASON_META } from "~/data/seasons";
import { getTotalFood } from "~/data/foods";

const RESOURCE_ICONS: Record<string, string> = {
  gold: "🪙", food: "🍖", wood: "🪵", stone: "🪨",
  wool: "🐑", iron: "⚒️", weapons: "⚔️", clothing: "🧥", astralShards: "💠",
};

export default function Shrine() {
  const { state, actions } = useGame();

  const shrineLvl = () => state.buildings.find((b) => b.buildingId === "shrine")?.level ?? 0;
  const seasonInfo = () => IS_DEV
    ? { season: state.season, progress: state.seasonElapsed / 24, year: state.year }
    : getGlobalSeason();
  const currentDeity = () => getCurrentDeity(seasonInfo().season, seasonInfo().progress);
  const seasonDeities = () => getSeasonDeities(seasonInfo().season);
  const activeBlessing = () => state.activeBlessing ? getDeity(state.activeBlessing.deityId) : null;
  const isCurrentDeityActive = () => state.activeBlessing?.deityId === currentDeity().id;

  const canAffordOffering = () => {
    const deity = currentDeity();
    for (const cost of deity.offeringCost) {
      if (cost.resource === "gold" && state.resources.gold < cost.amount) return false;
      if (cost.resource === "food" && getTotalFood(state.foods) < cost.amount) return false;
      if (cost.resource === "wood" && state.resources.wood < cost.amount) return false;
      if (cost.resource === "stone" && state.resources.stone < cost.amount) return false;
      if (cost.resource === "wool" && state.wool < cost.amount) return false;
      if (cost.resource === "iron" && state.iron < cost.amount) return false;
      if (cost.resource === "weapons" && state.weapons < cost.amount) return false;
      if (cost.resource === "clothing" && state.clothing < cost.amount) return false;
      if (cost.resource === "astralShards" && state.astralShards < cost.amount) return false;
    }
    return true;
  };

  const timeUntilRotation = () => {
    const progress = seasonInfo().progress;
    const nextRotation = progress < 0.5 ? 0.5 : 1.0;
    const remaining = nextRotation - progress;
    const hoursRemaining = remaining * 24 * 4; // 24 game-hours * 4 real hours per game hour
    if (hoursRemaining > 24) return `${Math.floor(hoursRemaining / 24)}d ${Math.floor(hoursRemaining % 24)}h`;
    return `${Math.floor(hoursRemaining)}h`;
  };

  return (
    <div>
      <h1 class="page-title">The Shrine</h1>

      <Show when={shrineLvl() === 0}>
        <div style={{ padding: "40px", "text-align": "center", color: "var(--text-secondary)" }}>
          <div style={{ "font-size": "3rem", "margin-bottom": "12px" }}>🔮</div>
          <p>Build a Shrine to commune with the echoes of the old gods.</p>
          <a href="/buildings#building-shrine" style={{ color: "var(--accent-gold)", "margin-top": "8px", display: "inline-block" }}>
            Go to Buildings →
          </a>
        </div>
      </Show>

      <Show when={shrineLvl() > 0}>
        {/* Current Deity */}
        <div class="shrine-deity-card">
          <div class="shrine-deity-header">
            <span class="shrine-deity-icon">{currentDeity().icon}</span>
            <div>
              <h2 style={{ "font-family": "var(--font-heading)", color: "var(--accent-gold)", margin: 0 }}>
                {currentDeity().name} {currentDeity().title}
              </h2>
              <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                Visiting the shrine · Changes in {timeUntilRotation()}
              </div>
            </div>
          </div>

          <p style={{ color: "var(--text-secondary)", "font-style": "italic", margin: "12px 0", "line-height": "1.5" }}>
            "{currentDeity().description}"
          </p>

          {/* Offering */}
          <div class="shrine-offering">
            <div class="shrine-offering-label">Offering</div>
            <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap", "margin-bottom": "10px" }}>
              <For each={currentDeity().offeringCost}>
                {(cost) => (
                  <span class="quest-reward-item">
                    {RESOURCE_ICONS[cost.resource] ?? ""} {cost.amount} {cost.resource}
                  </span>
                )}
              </For>
            </div>

            <div class="shrine-blessing-preview">
              <span class="shrine-offering-label">Blessing</span>
              <span style={{ color: "var(--accent-green)", "font-size": "0.9rem" }}>
                {currentDeity().blessingName}: {currentDeity().blessingDescription}
              </span>
            </div>

            <Show when={isCurrentDeityActive()}>
              <div style={{
                padding: "8px 12px",
                background: "rgba(46, 204, 113, 0.1)",
                border: "1px solid var(--accent-green)",
                "border-radius": "6px",
                color: "var(--accent-green)",
                "font-size": "0.85rem",
                "text-align": "center",
                "margin-top": "10px",
              }}>
                ✓ Blessing active — {currentDeity().blessingDescription}
              </div>
            </Show>

            <Show when={!isCurrentDeityActive()}>
              <button
                class="upgrade-btn"
                style={{ "margin-top": "10px" }}
                disabled={!canAffordOffering()}
                onClick={() => actions.makeOffering(currentDeity().id)}
              >
                Make Offering
              </button>
            </Show>
          </div>
        </div>

        {/* Active Blessing */}
        <Show when={activeBlessing() && !isCurrentDeityActive()}>
          <div style={{
            padding: "12px 16px",
            background: "rgba(46, 204, 113, 0.08)",
            border: "1px solid rgba(46, 204, 113, 0.3)",
            "border-radius": "8px",
            "margin-top": "16px",
            "font-size": "0.85rem",
          }}>
            <span style={{ color: "var(--accent-green)" }}>Active blessing:</span>{" "}
            <span style={{ color: "var(--text-primary)" }}>
              {activeBlessing()!.icon} {activeBlessing()!.blessingName} — {activeBlessing()!.blessingDescription}
            </span>
            <span style={{ color: "var(--text-muted)", "margin-left": "8px" }}>
              (from a previous offering, still active)
            </span>
          </div>
        </Show>

        {/* Season Calendar */}
        <div style={{ "margin-top": "24px" }}>
          <h2 style={{ "font-family": "var(--font-heading)", color: "var(--text-primary)", "margin-bottom": "12px" }}>
            Deity Calendar
          </h2>
          <div class="shrine-calendar">
            {(["spring", "summer", "autumn", "winter"] as const).map((season) => {
              const [first, second] = getSeasonDeities(season);
              const isCurrent = seasonInfo().season === season;
              return (
                <div class="shrine-calendar-season" classList={{ current: isCurrent }}>
                  <div class="shrine-calendar-season-name" style={{ color: SEASON_META[season].color }}>
                    {SEASON_META[season].icon} {SEASON_META[season].name}
                  </div>
                  <div class="shrine-calendar-deities">
                    <div class="shrine-calendar-deity" classList={{ active: isCurrent && seasonInfo().progress < 0.5 }}>
                      <span>{first.icon}</span> {first.name}
                    </div>
                    <div class="shrine-calendar-deity" classList={{ active: isCurrent && seasonInfo().progress >= 0.5 }}>
                      <span>{second.icon}</span> {second.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Show>
    </div>
  );
}
