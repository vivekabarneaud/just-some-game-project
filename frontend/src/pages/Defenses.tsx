import { For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import type { DefenseRing, PlayerWall, PlayerWatchtower, PlayerBarracks } from "~/engine/gameState";
import { WALL_BASE_HP } from "~/engine/gameState";
import {
  getWallCost,
  getWatchtowerCost,
  getBarracksCost,
  getWallRepairCost,
  getDefensiveRepairCost,
  SOLDIER_COST,
  ARCHER_COST,
  maxSoldiers,
  maxArchers,
  availableCitizens,
  ringUnlocked,
  ringUnlockTier,
  RING_LABELS,
  RING_DESCRIPTIONS,
} from "~/data/defenses";
import HpBar from "~/components/HpBar";

const RINGS: DefenseRing[] = ["outer", "middle", "inner"];

export default function Defenses() {
  const { state, actions } = useGame();
  const tier = () => actions.getSettlementTier();

  return (
    <div>
      <h1 class="page-title">The Defenses</h1>

      <Summary />

      <For each={RINGS}>
        {(ring) => <RingSection ring={ring} unlocked={ringUnlocked(ring, tier())} />}
      </For>
    </div>
  );
}

// ─── Header summary ──────────────────────────────────────────────

function Summary() {
  const { state, actions } = useGame();
  const sCap = () => maxSoldiers(state);
  const aCap = () => maxArchers(state);
  const free = () => availableCitizens(state);

  return (
    <div style={{
      display: "flex",
      gap: "16px",
      "flex-wrap": "wrap",
      "margin-bottom": "20px",
      padding: "12px 14px",
      background: "var(--bg-panel)",
      border: "1px solid var(--border-color)",
      "border-radius": "8px",
      "font-size": "0.85rem",
    }}>
      <span>
        <span style={{ color: "var(--text-muted)" }}>⚔️ Soldiers: </span>
        <strong>{state.soldiers}/{sCap()}</strong>
      </span>
      <span>
        <span style={{ color: "var(--text-muted)" }}>🏹 Archers: </span>
        <strong>{state.archers}/{aCap()}</strong>
      </span>
      <span style={{ "margin-left": "auto" }}>
        <span style={{ color: "var(--text-muted)" }}>👤 Available citizens: </span>
        <strong style={{ color: free() > 0 ? "var(--accent-green)" : "var(--accent-red)" }}>{free()}</strong>
      </span>
    </div>
  );
}

// ─── Per-ring section ─────────────────────────────────────────────

function RingSection(props: { ring: DefenseRing; unlocked: boolean }) {
  const { state, actions } = useGame();
  const wall = () => state.walls.find((w) => w.ring === props.ring)!;
  const tower = () => state.watchtowers.find((t) => t.ring === props.ring)!;
  const barracks = () => state.barracks.find((b) => b.ring === props.ring)!;

  return (
    <section style={{ "margin-bottom": "20px" }}>
      <header style={{ "margin-bottom": "8px" }}>
        <h2 style={{
          "font-family": "var(--font-heading)",
          "font-size": "1.1rem",
          color: props.unlocked ? "var(--accent-gold)" : "var(--text-muted)",
          margin: 0,
        }}>
          {RING_LABELS[props.ring]}
          <Show when={!props.unlocked}>
            <span style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-left": "10px", "font-weight": "normal" }}>
              🔒 Unlock at {ringUnlockTier(props.ring)} tier
            </span>
          </Show>
        </h2>
        <p style={{ color: "var(--text-muted)", "font-size": "0.8rem", margin: "2px 0 0", "font-style": "italic" }}>
          {RING_DESCRIPTIONS[props.ring]}
        </p>
      </header>

      <div style={{
        display: "grid",
        "grid-template-columns": "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "10px",
        opacity: props.unlocked ? 1 : 0.55,
      }}>
        <WallCard wall={wall()} ring={props.ring} disabled={!props.unlocked} />
        <WatchtowerCard tower={tower()} ring={props.ring} disabled={!props.unlocked} />
        <BarracksCard barracks={barracks()} ring={props.ring} disabled={!props.unlocked} />
      </div>
    </section>
  );
}

// ─── Building cards ──────────────────────────────────────────────

function WallCard(props: { wall: PlayerWall; ring: DefenseRing; disabled: boolean }) {
  const { state, actions } = useGame();
  const fullHp = () => props.wall.level * WALL_BASE_HP;
  const built = () => props.wall.level > 0;
  const damaged = () => built() && props.wall.hp < fullHp();
  const upgradeCost = () => getWallCost(props.wall.level);
  const repairCost = () => getWallRepairCost(props.wall.level);
  const canUpgrade = () =>
    !props.disabled &&
    state.resources.wood >= upgradeCost().wood &&
    state.resources.stone >= upgradeCost().stone;
  const canRepair = () =>
    !props.disabled &&
    damaged() &&
    state.resources.wood >= repairCost().wood &&
    state.resources.stone >= repairCost().stone;

  return (
    <div class="building-card">
      <div class="building-card-title">🧱 {built() ? `Wall (Lv.${props.wall.level})` : "Wall — unbuilt"}</div>
      <Show when={built()}>
        <div style={{ "margin-top": "6px", display: "flex", "align-items": "center", gap: "6px" }}>
          <HpBar current={props.wall.hp} max={fullHp()} width="100px" showText />
        </div>
      </Show>
      <div style={{ "margin-top": "auto", "padding-top": "10px", display: "flex", gap: "6px", "flex-wrap": "wrap" }}>
        <button
          class="upgrade-btn"
          disabled={!canUpgrade()}
          onClick={() => actions.buildOrUpgradeWall(props.ring)}
          style={{ "font-size": "0.78rem", padding: "5px 10px" }}
        >
          {built() ? `Upgrade — ${upgradeCost().wood}🪵 ${upgradeCost().stone}🪨` : `Build — ${upgradeCost().wood}🪵 ${upgradeCost().stone}🪨`}
        </button>
        <Show when={damaged()}>
          <button
            disabled={!canRepair()}
            onClick={() => actions.repairWall(props.ring)}
            style={{
              "font-size": "0.78rem",
              padding: "5px 10px",
              background: "transparent",
              border: "1px solid var(--accent-gold)",
              color: "var(--accent-gold)",
              "border-radius": "4px",
              cursor: canRepair() ? "pointer" : "not-allowed",
            }}
          >
            🔨 Repair — {repairCost().wood}🪵 {repairCost().stone}🪨
          </button>
        </Show>
      </div>
    </div>
  );
}

function WatchtowerCard(props: { tower: PlayerWatchtower; ring: DefenseRing; disabled: boolean }) {
  const { state, actions } = useGame();
  const built = () => props.tower.level > 0;
  const upgradeCost = () => getWatchtowerCost(props.tower.level);
  const repairCost = () => getDefensiveRepairCost(props.tower.level);
  const canUpgrade = () =>
    !props.disabled &&
    state.resources.wood >= upgradeCost().wood &&
    state.resources.stone >= upgradeCost().stone;
  const canRepair = () =>
    !props.disabled &&
    props.tower.damaged &&
    state.resources.wood >= repairCost().wood &&
    state.resources.stone >= repairCost().stone;

  // Archer recruitment — global pool, but the slot belongs here visually.
  const canRecruit = () =>
    state.archers < maxArchers(state) &&
    availableCitizens(state) > 0 &&
    state.resources.gold >= ARCHER_COST.gold &&
    state.iron >= ARCHER_COST.iron;

  return (
    <div class="building-card">
      <div class="building-card-title">
        🏰 {built() ? `Watchtower (Lv.${props.tower.level})` : "Watchtower — unbuilt"}
        <Show when={props.tower.damaged}>
          <span style={{ color: "var(--accent-red)", "font-size": "0.75rem", "margin-left": "6px" }}>
            Damaged
          </span>
        </Show>
      </div>
      <Show when={built()}>
        <div style={{ "margin-top": "4px", "font-size": "0.78rem", color: "var(--text-muted)" }}>
          Archer slots: {props.tower.level}
        </div>
      </Show>
      <div style={{ "margin-top": "auto", "padding-top": "10px", display: "flex", gap: "6px", "flex-wrap": "wrap" }}>
        <button
          class="upgrade-btn"
          disabled={!canUpgrade()}
          onClick={() => actions.buildOrUpgradeWatchtower(props.ring)}
          style={{ "font-size": "0.78rem", padding: "5px 10px" }}
        >
          {built() ? `Upgrade — ${upgradeCost().wood}🪵 ${upgradeCost().stone}🪨` : `Build — ${upgradeCost().wood}🪵 ${upgradeCost().stone}🪨`}
        </button>
        <Show when={props.tower.damaged}>
          <button
            disabled={!canRepair()}
            onClick={() => actions.repairWatchtower(props.ring)}
            style={{
              "font-size": "0.78rem",
              padding: "5px 10px",
              background: "transparent",
              border: "1px solid var(--accent-gold)",
              color: "var(--accent-gold)",
              "border-radius": "4px",
              cursor: canRepair() ? "pointer" : "not-allowed",
            }}
          >
            🔨 Repair
          </button>
        </Show>
        {/* Recruit archer (global pool) — shown for any tower with capacity */}
        <Show when={built() && !props.disabled}>
          <button
            disabled={!canRecruit()}
            onClick={() => actions.recruitArcher()}
            style={{
              "font-size": "0.78rem",
              padding: "5px 10px",
              background: "rgba(167, 139, 250, 0.1)",
              border: "1px solid #a78bfa",
              color: "#a78bfa",
              "border-radius": "4px",
              cursor: canRecruit() ? "pointer" : "not-allowed",
            }}
            title={`Recruit archer — ${ARCHER_COST.gold}g + ${ARCHER_COST.iron} iron, takes 1 citizen`}
          >
            +Archer
          </button>
        </Show>
      </div>
    </div>
  );
}

function BarracksCard(props: { barracks: PlayerBarracks; ring: DefenseRing; disabled: boolean }) {
  const { state, actions } = useGame();
  const built = () => props.barracks.level > 0;
  const upgradeCost = () => getBarracksCost(props.barracks.level);
  const repairCost = () => getDefensiveRepairCost(props.barracks.level);
  const canUpgrade = () =>
    !props.disabled &&
    state.resources.wood >= upgradeCost().wood &&
    state.resources.stone >= upgradeCost().stone &&
    state.iron >= upgradeCost().iron;
  const canRepair = () =>
    !props.disabled &&
    props.barracks.damaged &&
    state.resources.wood >= repairCost().wood &&
    state.resources.stone >= repairCost().stone;

  const canRecruit = () =>
    state.soldiers < maxSoldiers(state) &&
    availableCitizens(state) > 0 &&
    state.resources.gold >= SOLDIER_COST.gold &&
    state.iron >= SOLDIER_COST.iron;

  return (
    <div class="building-card">
      <div class="building-card-title">
        ⚔️ {built() ? `Barracks (Lv.${props.barracks.level})` : "Barracks — unbuilt"}
        <Show when={props.barracks.damaged}>
          <span style={{ color: "var(--accent-red)", "font-size": "0.75rem", "margin-left": "6px" }}>
            Damaged
          </span>
        </Show>
      </div>
      <Show when={built()}>
        <div style={{ "margin-top": "4px", "font-size": "0.78rem", color: "var(--text-muted)" }}>
          Soldier slots: {props.barracks.level * 3}
        </div>
      </Show>
      <div style={{ "margin-top": "auto", "padding-top": "10px", display: "flex", gap: "6px", "flex-wrap": "wrap" }}>
        <button
          class="upgrade-btn"
          disabled={!canUpgrade()}
          onClick={() => actions.buildOrUpgradeBarracks(props.ring)}
          style={{ "font-size": "0.78rem", padding: "5px 10px" }}
        >
          {built()
            ? `Upgrade — ${upgradeCost().wood}🪵 ${upgradeCost().stone}🪨 ${upgradeCost().iron}⚒️`
            : `Build — ${upgradeCost().wood}🪵 ${upgradeCost().stone}🪨 ${upgradeCost().iron}⚒️`}
        </button>
        <Show when={props.barracks.damaged}>
          <button
            disabled={!canRepair()}
            onClick={() => actions.repairBarracks(props.ring)}
            style={{
              "font-size": "0.78rem",
              padding: "5px 10px",
              background: "transparent",
              border: "1px solid var(--accent-gold)",
              color: "var(--accent-gold)",
              "border-radius": "4px",
              cursor: canRepair() ? "pointer" : "not-allowed",
            }}
          >
            🔨 Repair
          </button>
        </Show>
        <Show when={built() && !props.disabled}>
          <button
            disabled={!canRecruit()}
            onClick={() => actions.recruitSoldier()}
            style={{
              "font-size": "0.78rem",
              padding: "5px 10px",
              background: "rgba(231, 76, 60, 0.1)",
              border: "1px solid var(--accent-red)",
              color: "var(--accent-red)",
              "border-radius": "4px",
              cursor: canRecruit() ? "pointer" : "not-allowed",
            }}
            title={`Recruit soldier — ${SOLDIER_COST.gold}g + ${SOLDIER_COST.iron} iron, takes 1 citizen`}
          >
            +Soldier
          </button>
        </Show>
      </div>
    </div>
  );
}
