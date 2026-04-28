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
  getMageTowerCost,
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

const R2_BASE = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings";
// Only walls.png and watchtower.png are on R2 today; barracks/mage_tower
// fall back to the icon-header layout until their art is generated.
const IMG: Record<string, string | undefined> = {
  wall: `${R2_BASE}/walls.png`,
  watchtower: `${R2_BASE}/watchtower.png`,
  barracks: undefined,
  mageTower: undefined,
};

/** Header for a defense card — mirrors the Buildings page pattern: image with
 *  overlay when art exists, icon-and-title row when it doesn't. */
function DefenseCardHeader(props: {
  image?: string;
  icon: string;
  name: string;
  level: number;
  /** Optional small badge appended to the level line (e.g. "Damaged"). */
  statusBadge?: string;
}) {
  return (
    <Show
      when={props.image}
      fallback={
        <div class="building-card-header">
          <div class="building-card-icon">{props.icon}</div>
          <div>
            <div class="building-card-title">{props.name}</div>
            <div class="building-card-level" classList={{ "not-built": props.level === 0 }}>
              {props.level === 0 ? "Not built" : `Level ${props.level}`}
              <Show when={props.statusBadge}>
                <span style={{ color: "var(--accent-red)", "margin-left": "6px" }}>· {props.statusBadge}</span>
              </Show>
            </div>
          </div>
        </div>
      }
    >
      <div class="building-card-image">
        <img src={props.image!} alt={props.name} loading="lazy" />
        <div class="building-card-image-overlay">
          <div>
            <div class="building-card-title">{props.name}</div>
            <div class="building-card-level" classList={{ "not-built": props.level === 0 }}>
              {props.level === 0 ? "Not built" : `Level ${props.level}`}
              <Show when={props.statusBadge}>
                <span style={{ color: "var(--accent-red)", "margin-left": "6px" }}>· {props.statusBadge}</span>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}

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
        <Show when={props.ring === "inner"}>
          <MageTowerCard disabled={!props.unlocked} />
        </Show>
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
      <DefenseCardHeader
        image={IMG.wall}
        icon="🧱"
        name="Wall"
        level={props.wall.level}
        statusBadge={damaged() ? "Damaged" : undefined}
      />
      <div class="building-card-desc">
        Soaks damage during a siege. Once it falls, raiders push to the next ring.
      </div>
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
  // Reason returns "" when recruiting is allowed, else a short explanation
  // for the tooltip / inline label so the player isn't confused by a silent
  // disabled button.
  const recruitBlocker = () => {
    if (state.archers >= maxArchers(state)) {
      return maxArchers(state) === 0
        ? "Build or repair a watchtower first"
        : "All tower slots are full";
    }
    if (availableCitizens(state) <= 0) return "No spare citizens — grow population first";
    if (state.resources.gold < ARCHER_COST.gold) return `Need ${ARCHER_COST.gold} gold`;
    return "";
  };
  const canRecruit = () => recruitBlocker() === "";

  return (
    <div class="building-card">
      <DefenseCardHeader
        image={IMG.watchtower}
        icon="🏰"
        name="Watchtower"
        level={props.tower.level}
        statusBadge={props.tower.damaged ? "Damaged" : undefined}
      />
      <div class="building-card-desc">
        Sentinels spot raids early and rain arrows during a siege. Higher levels see further.
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
          <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
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
                opacity: canRecruit() ? 1 : 0.5,
              }}
              title={canRecruit()
                ? `Recruit archer — ${ARCHER_COST.gold}g, takes 1 citizen`
                : recruitBlocker()}
            >
              +Archer ({ARCHER_COST.gold}g)
            </button>
            <Show when={!canRecruit()}>
              <span style={{ "font-size": "0.7rem", color: "var(--accent-red)", "padding-left": "2px" }}>
                {recruitBlocker()}
              </span>
            </Show>
          </div>
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

  const recruitBlocker = () => {
    if (state.soldiers >= maxSoldiers(state)) {
      return maxSoldiers(state) === 0
        ? "Build or repair a barracks first"
        : "All barracks slots are full";
    }
    if (availableCitizens(state) <= 0) return "No spare citizens — grow population first";
    if (state.resources.gold < SOLDIER_COST.gold) return `Need ${SOLDIER_COST.gold} gold`;
    return "";
  };
  const canRecruit = () => recruitBlocker() === "";

  return (
    <div class="building-card">
      <DefenseCardHeader
        image={IMG.barracks}
        icon="⚔️"
        name="Barracks"
        level={props.barracks.level}
        statusBadge={props.barracks.damaged ? "Damaged" : undefined}
      />
      <div class="building-card-desc">
        Trains and houses soldiers. Each level adds 3 melee slots; soldiers fight when the wall breaks.
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
          <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
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
                opacity: canRecruit() ? 1 : 0.5,
              }}
              title={canRecruit()
                ? `Recruit soldier — ${SOLDIER_COST.gold}g, takes 1 citizen`
                : recruitBlocker()}
            >
              +Soldier ({SOLDIER_COST.gold}g)
            </button>
            <Show when={!canRecruit()}>
              <span style={{ "font-size": "0.7rem", color: "var(--accent-red)", "padding-left": "2px" }}>
                {recruitBlocker()}
              </span>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}

function MageTowerCard(props: { disabled: boolean }) {
  const { state, actions } = useGame();
  const built = () => state.mageTower.level > 0;
  const upgradeCost = () => getMageTowerCost(state.mageTower.level);
  const repairCost = () => getDefensiveRepairCost(state.mageTower.level);
  const canUpgrade = () =>
    !props.disabled &&
    state.resources.wood >= upgradeCost().wood &&
    state.resources.stone >= upgradeCost().stone;
  const canRepair = () =>
    !props.disabled &&
    state.mageTower.damaged &&
    state.resources.wood >= repairCost().wood &&
    state.resources.stone >= repairCost().stone;

  return (
    <div class="building-card">
      <DefenseCardHeader
        image={IMG.mageTower}
        icon="🗼"
        name="Mage Tower"
        level={state.mageTower.level}
        statusBadge={state.mageTower.damaged ? "Damaged" : undefined}
      />
      <div class="building-card-desc">
        A spire of arcane research stationed inside the keep. Each level unlocks deeper enchanting recipes.
      </div>
      <Show when={built()}>
        <div style={{ "margin-top": "4px", "font-size": "0.78rem", color: "var(--text-muted)" }}>
          Unlocks enchantments up to Lv.{state.mageTower.level}
        </div>
      </Show>
      <div style={{ "margin-top": "auto", "padding-top": "10px", display: "flex", gap: "6px", "flex-wrap": "wrap" }}>
        <button
          class="upgrade-btn"
          disabled={!canUpgrade()}
          onClick={() => actions.buildOrUpgradeMageTower()}
          style={{ "font-size": "0.78rem", padding: "5px 10px" }}
        >
          {built()
            ? `Upgrade — ${upgradeCost().wood}🪵 ${upgradeCost().stone}🪨`
            : `Build — ${upgradeCost().wood}🪵 ${upgradeCost().stone}🪨`}
        </button>
        <Show when={state.mageTower.damaged}>
          <button
            disabled={!canRepair()}
            onClick={() => actions.repairMageTower()}
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
