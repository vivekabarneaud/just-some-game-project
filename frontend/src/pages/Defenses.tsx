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
  getWallBuildTime,
  getWatchtowerBuildTime,
  getBarracksBuildTime,
  getMageTowerBuildTime,
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
import { getBuildingImageById, applyMasonCostReduction, applyMasonTimeReduction } from "~/data/buildings";
import HpBar from "~/components/HpBar";
import Countdown from "~/components/Countdown";

const RINGS: DefenseRing[] = ["outer", "middle", "inner"];

/** Header for a defense card — mirrors the Buildings page pattern: image with
 *  overlay when art exists, icon-and-title row when it doesn't. The image is
 *  resolved per current settlement tier via getBuildingImageById, so a Town
 *  player sees barracks_town.png, a City player sees barracks_city.png, etc. */
function DefenseCardHeader(props: {
  buildingId: string;
  icon: string;
  name: string;
  level: number;
  statusBadge?: string;
}) {
  const { actions } = useGame();
  const image = () => getBuildingImageById(props.buildingId, actions.getSettlementTier());
  return (
    <Show
      when={image()}
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
        <img src={image()!} alt={props.name} loading="lazy" />
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

/** Build/Upgrade button that shows a countdown when the slot is upgrading,
 *  the cost on the button face, and a hover tooltip explaining either the
 *  next-level details (when affordable) or the blocker (when disabled).
 *  Mirrors the Buildings page tooltip pattern via .upgrade-indicator hover. */
function UpgradeButton(props: {
  built: boolean;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
  canUpgrade: boolean;
  /** Empty string when canUpgrade. Otherwise a short reason for the tooltip. */
  blocker: string;
  costLabel: string;
  buildTimeSeconds: number;
  onUpgrade: () => void;
}) {
  return (
    <Show
      when={props.upgrading && props.upgradeRemaining !== undefined}
      fallback={
        <div class="upgrade-indicator" style={{ position: "relative", display: "inline-block" }}>
          <button
            class="upgrade-btn"
            disabled={!props.canUpgrade}
            onClick={props.onUpgrade}
            style={{ "font-size": "0.78rem", padding: "5px 10px" }}
          >
            {props.built ? `Upgrade — ${props.costLabel}` : `Build — ${props.costLabel}`}
          </button>
          <div class="upgrade-tooltip" style={{
            position: "absolute",
            left: 0,
            top: "calc(100% + 4px)",
            "min-width": "180px",
            padding: "6px 10px",
            background: "var(--bg-panel)",
            border: `1px solid ${props.canUpgrade ? "var(--accent-green)" : "var(--accent-gold)"}`,
            "border-radius": "6px",
            "font-size": "0.75rem",
            color: "var(--text-secondary)",
            "z-index": 10,
            display: "none",
            "box-shadow": "0 4px 12px rgba(0,0,0,0.3)",
            "white-space": "nowrap",
          }}>
            <Show when={props.canUpgrade}>
              <div style={{ color: "var(--accent-green)", "font-weight": "bold", "margin-bottom": "2px" }}>
                {props.built ? `Upgrade to Lv.${props.level + 1}` : "Build Lv.1"}
              </div>
              <div>{props.costLabel}</div>
              <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-top": "2px" }}>
                Build time: {Math.ceil(props.buildTimeSeconds)}s
              </div>
            </Show>
            <Show when={!props.canUpgrade}>
              <div style={{ color: "var(--accent-gold)" }}>{props.blocker}</div>
              <div style={{ "margin-top": "2px" }}>Cost: {props.costLabel}</div>
            </Show>
          </div>
        </div>
      }
    >
      <div style={{ "font-size": "0.78rem", color: "var(--accent-gold)", "font-style": "italic", display: "flex", "align-items": "center", gap: "6px" }}>
        Upgrading…
        <Countdown remainingSeconds={props.upgradeRemaining!} />
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
  const masonLvl = () => state.buildings.find((b) => b.buildingId === "masons_guild")?.level ?? 0;
  const upgradeCost = () => applyMasonCostReduction(getWallCost(props.wall.level), masonLvl());
  const buildTime = () => applyMasonTimeReduction(getWallBuildTime(props.wall.level), masonLvl());
  const repairCost = () => getWallRepairCost(props.wall.level);
  const upgradeBlocker = () => {
    if (props.disabled) return "Ring locked at this tier";
    if (props.wall.upgrading) return "Already upgrading";
    if (state.resources.wood < upgradeCost().wood) return `Need ${upgradeCost().wood} wood`;
    if (state.resources.stone < upgradeCost().stone) return `Need ${upgradeCost().stone} stone`;
    return "";
  };
  const canUpgrade = () => upgradeBlocker() === "";
  const canRepair = () =>
    !props.disabled &&
    damaged() &&
    state.resources.wood >= repairCost().wood &&
    state.resources.stone >= repairCost().stone;

  return (
    <div class="building-card">
      <DefenseCardHeader
        buildingId="walls"
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
        <UpgradeButton
          built={built()}
          level={props.wall.level}
          upgrading={props.wall.upgrading}
          upgradeRemaining={props.wall.upgradeRemaining}
          canUpgrade={canUpgrade()}
          blocker={upgradeBlocker()}
          costLabel={`${upgradeCost().wood}🪵 ${upgradeCost().stone}🪨`}
          buildTimeSeconds={buildTime()}
          onUpgrade={() => actions.buildOrUpgradeWall(props.ring)}
        />
        <Show when={damaged() && !props.wall.upgrading}>
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
  const masonLvl = () => state.buildings.find((b) => b.buildingId === "masons_guild")?.level ?? 0;
  const upgradeCost = () => applyMasonCostReduction(getWatchtowerCost(props.tower.level), masonLvl());
  const buildTime = () => applyMasonTimeReduction(getWatchtowerBuildTime(props.tower.level), masonLvl());
  const repairCost = () => getDefensiveRepairCost(props.tower.level);
  const upgradeBlocker = () => {
    if (props.disabled) return "Ring locked at this tier";
    if (props.tower.upgrading) return "Already upgrading";
    if (state.resources.wood < upgradeCost().wood) return `Need ${upgradeCost().wood} wood`;
    if (state.resources.stone < upgradeCost().stone) return `Need ${upgradeCost().stone} stone`;
    return "";
  };
  const canUpgrade = () => upgradeBlocker() === "";
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
        buildingId="watchtower"
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
        <UpgradeButton
          built={built()}
          level={props.tower.level}
          upgrading={props.tower.upgrading}
          upgradeRemaining={props.tower.upgradeRemaining}
          canUpgrade={canUpgrade()}
          blocker={upgradeBlocker()}
          costLabel={`${upgradeCost().wood}🪵 ${upgradeCost().stone}🪨`}
          buildTimeSeconds={buildTime()}
          onUpgrade={() => actions.buildOrUpgradeWatchtower(props.ring)}
        />
        <Show when={props.tower.damaged && !props.tower.upgrading}>
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
  const masonLvl = () => state.buildings.find((b) => b.buildingId === "masons_guild")?.level ?? 0;
  const baseCost = () => getBarracksCost(props.barracks.level);
  const upgradeCost = () => {
    const c = baseCost();
    const reduced = applyMasonCostReduction({ wood: c.wood, stone: c.stone }, masonLvl());
    return { wood: reduced.wood, stone: reduced.stone, iron: c.iron };
  };
  const buildTime = () => applyMasonTimeReduction(getBarracksBuildTime(props.barracks.level), masonLvl());
  const repairCost = () => getDefensiveRepairCost(props.barracks.level);
  const upgradeBlocker = () => {
    if (props.disabled) return "Ring locked at this tier";
    if (props.barracks.upgrading) return "Already upgrading";
    if (state.resources.wood < upgradeCost().wood) return `Need ${upgradeCost().wood} wood`;
    if (state.resources.stone < upgradeCost().stone) return `Need ${upgradeCost().stone} stone`;
    if (state.iron < upgradeCost().iron) return `Need ${upgradeCost().iron} iron`;
    return "";
  };
  const canUpgrade = () => upgradeBlocker() === "";
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
        buildingId="barracks"
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
        <UpgradeButton
          built={built()}
          level={props.barracks.level}
          upgrading={props.barracks.upgrading}
          upgradeRemaining={props.barracks.upgradeRemaining}
          canUpgrade={canUpgrade()}
          blocker={upgradeBlocker()}
          costLabel={`${upgradeCost().wood}🪵 ${upgradeCost().stone}🪨 ${upgradeCost().iron}⚒️`}
          buildTimeSeconds={buildTime()}
          onUpgrade={() => actions.buildOrUpgradeBarracks(props.ring)}
        />
        <Show when={props.barracks.damaged && !props.barracks.upgrading}>
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
  const masonLvl = () => state.buildings.find((b) => b.buildingId === "masons_guild")?.level ?? 0;
  const upgradeCost = () => applyMasonCostReduction(getMageTowerCost(state.mageTower.level), masonLvl());
  const buildTime = () => applyMasonTimeReduction(getMageTowerBuildTime(state.mageTower.level), masonLvl());
  const repairCost = () => getDefensiveRepairCost(state.mageTower.level);
  const upgradeBlocker = () => {
    if (props.disabled) return "Inner ring locks the Mage Tower until Town tier";
    if (state.mageTower.upgrading) return "Already upgrading";
    if (state.resources.wood < upgradeCost().wood) return `Need ${upgradeCost().wood} wood`;
    if (state.resources.stone < upgradeCost().stone) return `Need ${upgradeCost().stone} stone`;
    return "";
  };
  const canUpgrade = () => upgradeBlocker() === "";
  const canRepair = () =>
    !props.disabled &&
    state.mageTower.damaged &&
    state.resources.wood >= repairCost().wood &&
    state.resources.stone >= repairCost().stone;

  return (
    <div class="building-card">
      <DefenseCardHeader
        buildingId="mage_tower"
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
        <UpgradeButton
          built={built()}
          level={state.mageTower.level}
          upgrading={state.mageTower.upgrading}
          upgradeRemaining={state.mageTower.upgradeRemaining}
          canUpgrade={canUpgrade()}
          blocker={upgradeBlocker()}
          costLabel={`${upgradeCost().wood}🪵 ${upgradeCost().stone}🪨`}
          buildTimeSeconds={buildTime()}
          onUpgrade={() => actions.buildOrUpgradeMageTower()}
        />
        <Show when={state.mageTower.damaged && !state.mageTower.upgrading}>
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
