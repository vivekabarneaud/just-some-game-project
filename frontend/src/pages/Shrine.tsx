import { Show, For, onMount } from "solid-js";
import { useGame } from "~/engine/gameState";
import { playPageMountSound } from "~/engine/sounds";
import { getCurrentDeity, getSeasonDeities, getDeity } from "~/data/deities";
import { IS_DEV, getGlobalSeason, SEASON_META } from "~/data/seasons";
import { getTotalFood } from "~/data/foods";
import Pantheon from "~/components/Pantheon";

const RESOURCE_ICONS: Record<string, string> = {
  gold: "🪙", food: "🍖", wood: "🪵", stone: "🪨",
  wool: "🐑", iron: "⚒️", weapons: "⚔️", clothing: "🧥", astralShards: "💠",
};

export default function Shrine() {
  const { state, actions } = useGame();
  onMount(() => playPageMountSound("bell"));

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
        {/* Compact deity strip — single row with offering button */}
        <div class="shrine-deity-strip">
          <div class="shrine-deity-strip-icon">{currentDeity().icon}</div>
          <div class="shrine-deity-strip-info">
            <div class="shrine-deity-strip-name">
              {currentDeity().name}
              <span style={{ color: "var(--text-muted)", "margin-left": "6px", "font-weight": "normal" }}>
                {currentDeity().title}
              </span>
            </div>
            <div class="shrine-deity-strip-blessing">
              <span style={{ color: "var(--accent-green)" }}>{currentDeity().blessingName}:</span>{" "}
              <span style={{ color: "var(--text-secondary)" }}>{currentDeity().blessingDescription}</span>
            </div>
            <div class="shrine-deity-strip-offering">
              <span style={{ color: "var(--text-muted)" }}>Offering:</span>{" "}
              <For each={currentDeity().offeringCost}>
                {(cost, i) => (
                  <>
                    {i() > 0 && <span style={{ color: "var(--text-muted)" }}>, </span>}
                    <span>{RESOURCE_ICONS[cost.resource] ?? ""} {cost.amount}</span>
                  </>
                )}
              </For>
              <span style={{ color: "var(--text-muted)", "margin-left": "10px" }}>
                · Changes in {timeUntilRotation()}
              </span>
            </div>
          </div>
          <div class="shrine-deity-strip-action">
            <Show when={isCurrentDeityActive()} fallback={
              <button
                class="upgrade-btn"
                disabled={!canAffordOffering()}
                onClick={() => actions.makeOffering(currentDeity().id)}
                style={{ padding: "6px 14px", "font-size": "0.85rem" }}
              >
                Make Offering
              </button>
            }>
              <span style={{ color: "var(--accent-green)", "font-size": "0.85rem", "white-space": "nowrap" }}>
                ✓ Blessed
              </span>
            </Show>
          </div>
        </div>

        {/* Carryover blessing from a different deity */}
        <Show when={activeBlessing() && !isCurrentDeityActive()}>
          <div style={{
            padding: "8px 14px",
            background: "rgba(46, 204, 113, 0.08)",
            border: "1px solid rgba(46, 204, 113, 0.3)",
            "border-radius": "6px",
            "margin-top": "10px",
            "font-size": "0.82rem",
          }}>
            <span style={{ color: "var(--accent-green)" }}>Active blessing:</span>{" "}
            <span style={{ color: "var(--text-primary)" }}>
              {activeBlessing()!.icon} {activeBlessing()!.blessingName} — {activeBlessing()!.blessingDescription}
            </span>
          </div>
        </Show>

        {/* Season Calendar — kept always visible at top, before the pantheon */}
        <div style={{ "margin-top": "20px", "margin-bottom": "24px" }}>
          <h2 style={{
            "font-family": "var(--font-heading)",
            color: "var(--text-primary)",
            "margin-bottom": "10px",
            "font-size": "1.05rem",
          }}>
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

        {/* Pantheon — main content of the shrine */}
        <Pantheon />
      </Show>
    </div>
  );
}
