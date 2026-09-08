import { For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { getClassMeta,
  getPortraitUrl,
  RANK_NAMES,
  RANK_COLORS,
  RACE_NAMES,
  type Adventurer,
  type DeathRecord,
} from "@medieval-realm/shared/data/adventurers";
import { SEASON_META } from "~/data/seasons";

/** "X days ago" / "X weeks ago" — falls back to absolute date for older. */
function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const day = 86_400_000;
  if (diff < day) return "today";
  if (diff < 2 * day) return "yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
  if (diff < 28 * day) return `${Math.floor(diff / (7 * day))} weeks ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Build the flavor sentence for the pantheon card from a death record. */
function flavorText(rec: DeathRecord): string {
  const ability = rec.killedByAbility ? ` (${rec.killedByAbility})` : "";
  return `Slain by ${rec.killedBy}${ability}, while on ${rec.missionName}.`;
}

/** In-game date label — "Spring, Year 2" — falls back to relative time when missing. */
function inGameDate(rec: DeathRecord): string {
  if (rec.season && rec.year != null) {
    const meta = SEASON_META[rec.season as keyof typeof SEASON_META];
    const seasonLabel = meta ? `${meta.icon} ${meta.name}` : rec.season;
    return `${seasonLabel}, Year ${rec.year}`;
  }
  return relativeTime(rec.diedAt);
}

/**
 * Memorial wall of fallen adventurers. Cards in reverse chronological order.
 * Lives inside the Shrine page (the religious building → memorial space).
 */
export default function Pantheon() {
  const { state } = useGame();

  const fallen = () =>
    state.adventurers
      .filter((a) => !a.alive)
      .sort((a, b) => (b.deathRecord?.diedAt ?? 0) - (a.deathRecord?.diedAt ?? 0));

  return (
    <div>
      <h2 style={{
        "font-family": "var(--font-heading)",
        color: "var(--accent-gold)",
        "margin-bottom": "6px",
        "font-size": "1.2rem",
      }}>
        🪦 In Memoriam
      </h2>
      <p style={{ color: "var(--text-muted)", "font-size": "0.85rem", "margin-bottom": "16px", "font-style": "italic" }}>
        Fallen heroes of the settlement. May their stories outlast the cold.
      </p>

      <Show
        when={fallen().length > 0}
        fallback={
          <div style={{
            padding: "28px 16px",
            "text-align": "center",
            color: "var(--text-muted)",
            "font-style": "italic",
            background: "rgba(0, 0, 0, 0.18)",
            "border-radius": "8px",
            border: "1px dashed var(--border-color)",
          }}>
            No heroes have fallen yet. May the gods keep them safe.
          </div>
        }
      >
        <div class="pantheon-grid">
          <For each={fallen()}>
            {(adv) => <PantheonCard adv={adv} />}
          </For>
        </div>
      </Show>
    </div>
  );
}

function PantheonCard(props: { adv: Adventurer }) {
  const cls = getClassMeta(props.adv.class);
  const rec = props.adv.deathRecord;
  return (
    <div class="pantheon-card">
      <div class="pantheon-card-portrait">
        <img
          src={getPortraitUrl(props.adv)}
          alt={props.adv.name}
          loading="lazy"
        />
      </div>
      <div class="pantheon-card-content">
        <div class="pantheon-card-name" style={{ color: RANK_COLORS[props.adv.rank] }}>
          {props.adv.name}
        </div>
        <div class="pantheon-card-meta">
          {props.adv.race ? `${RACE_NAMES[props.adv.race]} ` : ""}{cls.name} · {RANK_NAMES[props.adv.rank]} · Lv.{props.adv.level}
        </div>
        <Show when={rec}>
          {(r) => (
            <>
              <div class="pantheon-card-flavor">{flavorText(r())}</div>
              <div class="pantheon-card-date">{inGameDate(r())}</div>
            </>
          )}
        </Show>
        <Show when={!rec}>
          <div class="pantheon-card-flavor">No record was kept of how they fell.</div>
        </Show>
      </div>
    </div>
  );
}
