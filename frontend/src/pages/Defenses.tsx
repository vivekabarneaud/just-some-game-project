import { For, Show, createSignal, onMount } from "solid-js";
import { useGame } from "~/engine/gameState";
import { playPageMountSound } from "~/engine/sounds";
import type { DefenseRing, PlayerWall, PlayerWatchtower, PlayerBarracks } from "~/engine/gameState";
import { WALL_BASE_HP } from "~/engine/gameState";
import GarrisonDetailModal from "~/components/GarrisonDetailModal";

// Module-scoped signal so any card can pop the manager modal without
// prop-drilling. One modal at a time — re-clicking another building swaps it.
const [openGarrison, setOpenGarrison] = createSignal<{ kind: "watchtower" | "barracks"; ring: DefenseRing } | null>(null);
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
  getWatchtowerArcherCap,
  getBarracksSoldierCap,
} from "~/data/defenses";
import { getBuildingImageById, applyMasonCostReduction, applyMasonTimeReduction } from "~/data/buildings";
import HpBar from "~/components/HpBar";
import Countdown from "~/components/Countdown";

const RINGS: DefenseRing[] = ["outer", "middle", "inner"];

/** Header for a defense card — mirrors the Buildings page pattern: image with
 *  overlay when art exists, icon-and-title row when it doesn't. The image is
 *  resolved per current settlement tier via getBuildingImageById, so a Town
 *  player sees barracks_town.png, a City player sees barracks_city.png, etc. */
/** A single cost line in the upgrade/repair tooltip. `sufficient: false`
 *  renders the amount in red so the player can see what's missing at a
 *  glance. */
interface CostPart {
  amount: number;
  icon: string;
  /** Human label used in the blocker sentence ("wood", "stone", "iron"). */
  label: string;
  sufficient: boolean;
}

/** Render a row of cost parts, colouring shortfalls red. Shared by upgrade
 *  and repair tooltips so the visuals stay consistent. */
function CostLine(props: { parts: CostPart[] }) {
  return (
    <span>
      <For each={props.parts}>
        {(p, i) => (
          <>
            <span style={{ color: p.sufficient ? "inherit" : "var(--accent-red)" }}>
              {p.amount}{p.icon}
            </span>
            <Show when={i() < props.parts.length - 1}>{" "}</Show>
          </>
        )}
      </For>
    </span>
  );
}

/** Build the "Need X wood, Y stone" blocker sentence from the cost parts.
 *  Returns "" when nothing is missing. */
function shortageBlocker(parts: CostPart[]): string {
  const missing = parts.filter((p) => !p.sufficient);
  if (missing.length === 0) return "";
  return `Need ${missing.map((p) => `${p.amount} ${p.label}`).join(", ")}`;
}

/** Small +/↑ button on the card header. Matches the Buildings page indicator:
 *  green tint when affordable, muted when blocked, hover tooltip showing
 *  either next-level details + cost (affordable) or the blocker reason. */
function UpgradeIndicator(props: {
  built: boolean;
  level: number;
  /** Soft blocker (ring locked, already upgrading) — overrides the resource
   *  shortage line when set. Empty string when no soft blocker. */
  softBlocker: string;
  costParts: CostPart[];
  buildTimeSeconds: number;
  onUpgrade: () => void;
  /** True when rendered inside building-card-image-overlay (tooltip pops
   *  upward); false when at the top-right corner of an icon-header card
   *  (tooltip pops downward). */
  inOverlay: boolean;
}) {
  const blocker = () => props.softBlocker || shortageBlocker(props.costParts);
  const canUpgrade = () => blocker() === "";
  return (
    <div
      class="upgrade-indicator"
      style={props.inOverlay
        ? { position: "relative", "z-index": 5 } as any
        : { position: "absolute", top: "8px", right: "8px", "z-index": 5 } as any}
      onClick={(e) => {
        if (canUpgrade()) {
          e.preventDefault();
          e.stopPropagation();
          props.onUpgrade();
        }
      }}
    >
      <div style={{
        width: "22px",
        height: "22px",
        "border-radius": "4px",
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        "font-size": "0.75rem",
        background: canUpgrade() ? "rgba(46, 204, 113, 0.3)" : "rgba(106, 100, 88, 0.3)",
        border: `1px solid ${canUpgrade() ? "var(--accent-green)" : "var(--text-muted)"}`,
        color: canUpgrade() ? "var(--accent-green)" : "var(--text-muted)",
        cursor: canUpgrade() ? "pointer" : "default",
      }}>
        {props.built ? "↑" : "+"}
      </div>
      <div class="upgrade-tooltip" style={{
        position: "absolute",
        right: 0,
        ...(props.inOverlay ? { bottom: "28px" } : { top: "28px" }),
        "min-width": "180px",
        padding: "6px 10px",
        background: "var(--bg-panel)",
        border: `1px solid ${canUpgrade() ? "var(--accent-green)" : "var(--accent-gold)"}`,
        "border-radius": "6px",
        "font-size": "0.75rem",
        color: "var(--text-secondary)",
        "z-index": 10,
        display: "none",
        "box-shadow": "0 4px 12px rgba(0,0,0,0.3)",
        "white-space": "nowrap",
      }}>
        <Show when={canUpgrade()}>
          <div style={{ color: "var(--accent-green)", "font-weight": "bold", "margin-bottom": "2px" }}>
            {props.built ? `Upgrade to Lv.${props.level + 1}` : "Build Lv.1"}
          </div>
          <div><CostLine parts={props.costParts} /></div>
          <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-top": "2px" }}>
            Build time: {Math.ceil(props.buildTimeSeconds)}s · Click to start
          </div>
        </Show>
        <Show when={!canUpgrade()}>
          <div style={{ color: "var(--accent-gold)" }}>{blocker()}</div>
          <div style={{ "margin-top": "2px" }}>Cost: <CostLine parts={props.costParts} /></div>
        </Show>
      </div>
    </div>
  );
}

/** Repair button with hover tooltip listing the cost — same shortage
 *  colouring as the upgrade tooltip so a stuck player can see what's
 *  missing without guessing. */
function RepairButton(props: {
  costParts: CostPart[];
  onRepair: () => void;
  /** Optional label override (the wall card shows the cost inline; the
   *  tower / barracks cards just show "Repair"). */
  label?: string;
}) {
  const blocker = () => shortageBlocker(props.costParts);
  const canRepair = () => blocker() === "";
  return (
    <div class="upgrade-indicator" style={{ position: "relative", display: "inline-block" }}>
      <button
        disabled={!canRepair()}
        onClick={(e) => {
          if (canRepair()) {
            e.preventDefault();
            e.stopPropagation();
            props.onRepair();
          }
        }}
        style={{
          "font-size": "0.78rem",
          padding: "5px 10px",
          background: "transparent",
          border: "1px solid var(--accent-gold)",
          color: "var(--accent-gold)",
          "border-radius": "4px",
          cursor: canRepair() ? "pointer" : "not-allowed",
          opacity: canRepair() ? 1 : 0.55,
        }}
      >
        🔨 {props.label ?? "Repair"}
      </button>
      <div class="upgrade-tooltip" style={{
        position: "absolute",
        left: 0,
        top: "calc(100% + 4px)",
        "min-width": "180px",
        padding: "6px 10px",
        background: "var(--bg-panel)",
        border: `1px solid ${canRepair() ? "var(--accent-green)" : "var(--accent-gold)"}`,
        "border-radius": "6px",
        "font-size": "0.75rem",
        color: "var(--text-secondary)",
        "z-index": 10,
        display: "none",
        "box-shadow": "0 4px 12px rgba(0,0,0,0.3)",
        "white-space": "nowrap",
      }}>
        <Show when={canRepair()}>
          <div style={{ color: "var(--accent-green)", "font-weight": "bold", "margin-bottom": "2px" }}>
            Repair
          </div>
          <div><CostLine parts={props.costParts} /></div>
        </Show>
        <Show when={!canRepair()}>
          <div style={{ color: "var(--accent-gold)" }}>{blocker()}</div>
          <div style={{ "margin-top": "2px" }}>Cost: <CostLine parts={props.costParts} /></div>
        </Show>
      </div>
    </div>
  );
}

/** Header for a defense card — image-with-overlay when art exists, icon row
 *  otherwise. Optional `indicator` slot is placed inside the overlay (image
 *  case) or at the top-right corner of the card root (icon case). */
function DefenseCardHeader(props: {
  buildingId: string;
  icon: string;
  name: string;
  level: number;
  statusBadge?: string;
  /** Render-prop. Receives `inOverlay` so the tooltip can pop the right way. */
  indicator?: (inOverlay: boolean) => any;
}) {
  const image = () => getBuildingImageById(props.buildingId, props.level);
  return (
    <Show
      when={image()}
      fallback={
        <div class="building-card-header" style={{ position: "relative" }}>
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
          <Show when={props.indicator}>{props.indicator!(false)}</Show>
        </div>
      }
    >
      <div class="building-card-image">
        <img src={image()!} alt={props.name} loading="lazy" />
        <div
          class="building-card-image-overlay"
          style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end" }}
        >
          <div>
            <div class="building-card-title">{props.name}</div>
            <div class="building-card-level" classList={{ "not-built": props.level === 0 }}>
              {props.level === 0 ? "Not built" : `Level ${props.level}`}
              <Show when={props.statusBadge}>
                <span style={{ color: "var(--accent-red)", "margin-left": "6px" }}>· {props.statusBadge}</span>
              </Show>
            </div>
          </div>
          <Show when={props.indicator}>{props.indicator!(true)}</Show>
        </div>
      </div>
    </Show>
  );
}

export default function Defenses() {
  const { state, actions } = useGame();
  const tier = () => actions.getSettlementTier();
  onMount(() => playPageMountSound("dagger"));

  return (
    <div>
      <h1 class="page-title">The Defenses</h1>

      <Summary />

      <For each={RINGS}>
        {(ring) => <RingSection ring={ring} unlocked={ringUnlocked(ring, tier())} />}
      </For>

      <Show when={openGarrison()}>
        {(g) => (
          <GarrisonDetailModal
            kind={g().kind}
            ring={g().ring}
            onClose={() => setOpenGarrison(null)}
          />
        )}
      </Show>
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
      <span
        style={{ "margin-left": "auto" }}
        title={`Children, toddlers, and elderly are not combat-eligible.\nBreakdown: ${state.citizens.toddlers} 👶 / ${state.citizens.children} 🧒 / ${state.citizens.adults} 🧑 / ${state.citizens.elderly} 👵`}
      >
        <span style={{ color: "var(--text-muted)" }}>🧑 Adults available: </span>
        <strong style={{ color: free() > 0 ? "var(--accent-green)" : "var(--accent-red)" }}>{free()} / {state.citizens.adults}</strong>
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
  const upgradeCostParts = (): CostPart[] => [
    { amount: upgradeCost().wood, icon: "🪵", label: "wood", sufficient: state.resources.wood >= upgradeCost().wood },
    { amount: upgradeCost().stone, icon: "🪨", label: "stone", sufficient: state.resources.stone >= upgradeCost().stone },
  ];
  const repairCostParts = (): CostPart[] => [
    { amount: repairCost().wood, icon: "🪵", label: "wood", sufficient: state.resources.wood >= repairCost().wood },
    { amount: repairCost().stone, icon: "🪨", label: "stone", sufficient: state.resources.stone >= repairCost().stone },
  ];
  const softBlocker = () => {
    if (props.disabled) return "Ring locked at this tier";
    if (props.wall.upgrading) return "Already upgrading";
    return "";
  };

  return (
    <div class="building-card" style={{ position: "relative" }}>
      <DefenseCardHeader
        buildingId="walls"
        icon="🧱"
        name="Wall"
        level={props.wall.level}
        statusBadge={damaged() ? "Damaged" : undefined}
        indicator={props.wall.upgrading ? undefined : (inOverlay) => (
          <UpgradeIndicator
            built={built()}
            level={props.wall.level}
            softBlocker={softBlocker()}
            costParts={upgradeCostParts()}
            buildTimeSeconds={buildTime()}
            onUpgrade={() => actions.buildOrUpgradeWall(props.ring)}
            inOverlay={inOverlay}
          />
        )}
      />
      <div class="building-card-desc">
        Soaks damage during a siege. Once it falls, raiders push to the next ring.
      </div>
      <Show when={built()}>
        <div style={{ "margin-top": "6px", display: "flex", "align-items": "center", gap: "6px" }}>
          <HpBar current={props.wall.hp} max={fullHp()} width="100px" showText />
        </div>
      </Show>
      <Show when={props.wall.upgrading && props.wall.upgradeRemaining !== undefined}>
        <div class="building-card-upgrading">
          {built() ? `Upgrading to Lv.${props.wall.level + 1}` : "Building Lv.1"} —{" "}
          <Countdown remainingSeconds={props.wall.upgradeRemaining!} />
        </div>
      </Show>
      <Show when={damaged() && !props.wall.upgrading}>
        <div style={{ "margin-top": "auto", "padding-top": "10px" }}>
          <RepairButton
            costParts={repairCostParts()}
            onRepair={() => actions.repairWall(props.ring)}
          />
        </div>
      </Show>
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
  const upgradeCostParts = (): CostPart[] => [
    { amount: upgradeCost().wood, icon: "🪵", label: "wood", sufficient: state.resources.wood >= upgradeCost().wood },
    { amount: upgradeCost().stone, icon: "🪨", label: "stone", sufficient: state.resources.stone >= upgradeCost().stone },
  ];
  const repairCostParts = (): CostPart[] => [
    { amount: repairCost().wood, icon: "🪵", label: "wood", sufficient: state.resources.wood >= repairCost().wood },
    { amount: repairCost().stone, icon: "🪨", label: "stone", sufficient: state.resources.stone >= repairCost().stone },
  ];
  const softBlocker = () => {
    if (props.disabled) return "Ring locked at this tier";
    if (props.tower.upgrading) return "Already upgrading";
    return "";
  };

  // Per-tower archer recruitment — each tower has its own roster + cap.
  const towerCap = () => getWatchtowerArcherCap(props.tower.level);
  const recruitBlocker = () => {
    if (!built()) return "Build or repair a watchtower first";
    if (props.tower.damaged) return "Repair the watchtower first";
    if (props.tower.garrison.count >= towerCap()) return "This tower is full";
    if (availableCitizens(state) <= 0) return "No spare citizens — grow population first";
    if (state.resources.gold < ARCHER_COST.gold) return `Need ${ARCHER_COST.gold} gold`;
    return "";
  };
  const canRecruit = () => recruitBlocker() === "";

  return (
    <div class="building-card" style={{ position: "relative" }}>
      <DefenseCardHeader
        buildingId="watchtower"
        icon="🏰"
        name="Watchtower"
        level={props.tower.level}
        statusBadge={props.tower.damaged ? "Damaged" : undefined}
        indicator={props.tower.upgrading ? undefined : (inOverlay) => (
          <UpgradeIndicator
            built={built()}
            level={props.tower.level}
            softBlocker={softBlocker()}
            costParts={upgradeCostParts()}
            buildTimeSeconds={buildTime()}
            onUpgrade={() => actions.buildOrUpgradeWatchtower(props.ring)}
            inOverlay={inOverlay}
          />
        )}
      />
      <div class="building-card-desc">
        Sentinels spot raids early and rain arrows during a siege. Higher levels see further.
      </div>
      <Show when={built()}>
        <div style={{ "margin-top": "4px", "font-size": "0.78rem", color: "var(--text-muted)" }}>
          Archers: {props.tower.garrison.count} / {towerCap()}
        </div>
      </Show>
      <Show when={props.tower.upgrading && props.tower.upgradeRemaining !== undefined}>
        <div class="building-card-upgrading">
          {built() ? `Upgrading to Lv.${props.tower.level + 1}` : "Building Lv.1"} —{" "}
          <Countdown remainingSeconds={props.tower.upgradeRemaining!} />
        </div>
      </Show>
      <div style={{ "margin-top": "auto", "padding-top": "10px", display: "flex", gap: "6px", "flex-wrap": "wrap" }}>
        <Show when={props.tower.damaged && !props.tower.upgrading}>
          <RepairButton
            costParts={repairCostParts()}
            onRepair={() => actions.repairWatchtower(props.ring)}
          />
        </Show>
        {/* Recruit archer (global pool) — shown for any tower with capacity */}
        <Show when={built() && !props.disabled}>
          <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
            <button
              disabled={!canRecruit()}
              onClick={() => actions.recruitArcher(props.ring)}
              style={{
                "font-size": "0.78rem",
                padding: "5px 10px",
                background: "rgba(218, 165, 32, 0.1)",
                border: "1px solid var(--accent-gold)",
                color: "var(--accent-gold)",
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
          <button
            onClick={() => setOpenGarrison({ kind: "watchtower", ring: props.ring })}
            style={{
              "font-size": "0.78rem", padding: "5px 10px",
              background: "transparent",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
              "border-radius": "4px", cursor: "pointer",
            }}
            title="Open the watchtower garrison panel"
          >
            ⚙ Manage
          </button>
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
  const upgradeCostParts = (): CostPart[] => [
    { amount: upgradeCost().wood, icon: "🪵", label: "wood", sufficient: state.resources.wood >= upgradeCost().wood },
    { amount: upgradeCost().stone, icon: "🪨", label: "stone", sufficient: state.resources.stone >= upgradeCost().stone },
    { amount: upgradeCost().iron, icon: "⚒️", label: "iron", sufficient: state.iron >= upgradeCost().iron },
  ];
  const repairCostParts = (): CostPart[] => [
    { amount: repairCost().wood, icon: "🪵", label: "wood", sufficient: state.resources.wood >= repairCost().wood },
    { amount: repairCost().stone, icon: "🪨", label: "stone", sufficient: state.resources.stone >= repairCost().stone },
  ];
  const softBlocker = () => {
    if (props.disabled) return "Ring locked at this tier";
    if (props.barracks.upgrading) return "Already upgrading";
    return "";
  };

  // Per-barracks soldier recruitment — each barracks has its own roster + cap.
  const barracksCap = () => getBarracksSoldierCap(props.barracks.level);
  const recruitBlocker = () => {
    if (!built()) return "Build or repair a barracks first";
    if (props.barracks.damaged) return "Repair the barracks first";
    if (props.barracks.garrison.count >= barracksCap()) return "This barracks is full";
    if (availableCitizens(state) <= 0) return "No spare citizens — grow population first";
    if (state.resources.gold < SOLDIER_COST.gold) return `Need ${SOLDIER_COST.gold} gold`;
    return "";
  };
  const canRecruit = () => recruitBlocker() === "";

  return (
    <div class="building-card" style={{ position: "relative" }}>
      <DefenseCardHeader
        buildingId="barracks"
        icon="⚔️"
        name="Barracks"
        level={props.barracks.level}
        statusBadge={props.barracks.damaged ? "Damaged" : undefined}
        indicator={props.barracks.upgrading ? undefined : (inOverlay) => (
          <UpgradeIndicator
            built={built()}
            level={props.barracks.level}
            softBlocker={softBlocker()}
            costParts={upgradeCostParts()}
            buildTimeSeconds={buildTime()}
            onUpgrade={() => actions.buildOrUpgradeBarracks(props.ring)}
            inOverlay={inOverlay}
          />
        )}
      />
      <div class="building-card-desc">
        Trains and houses soldiers. Each level adds 3 melee slots; soldiers fight when the wall breaks.
      </div>
      <Show when={built()}>
        <div style={{ "margin-top": "4px", "font-size": "0.78rem", color: "var(--text-muted)" }}>
          Soldiers: {props.barracks.garrison.count} / {barracksCap()}
        </div>
      </Show>
      <Show when={props.barracks.upgrading && props.barracks.upgradeRemaining !== undefined}>
        <div class="building-card-upgrading">
          {built() ? `Upgrading to Lv.${props.barracks.level + 1}` : "Building Lv.1"} —{" "}
          <Countdown remainingSeconds={props.barracks.upgradeRemaining!} />
        </div>
      </Show>
      <div style={{ "margin-top": "auto", "padding-top": "10px", display: "flex", gap: "6px", "flex-wrap": "wrap" }}>
        <Show when={props.barracks.damaged && !props.barracks.upgrading}>
          <RepairButton
            costParts={repairCostParts()}
            onRepair={() => actions.repairBarracks(props.ring)}
          />
        </Show>
        <Show when={built() && !props.disabled}>
          <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
            <button
              disabled={!canRecruit()}
              onClick={() => actions.recruitSoldier(props.ring)}
              style={{
                "font-size": "0.78rem",
                padding: "5px 10px",
                background: "rgba(218, 165, 32, 0.1)",
                border: "1px solid var(--accent-gold)",
                color: "var(--accent-gold)",
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
          <button
            onClick={() => setOpenGarrison({ kind: "barracks", ring: props.ring })}
            style={{
              "font-size": "0.78rem", padding: "5px 10px",
              background: "transparent",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
              "border-radius": "4px", cursor: "pointer",
            }}
            title="Open the barracks garrison panel"
          >
            ⚙ Manage
          </button>
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
  const upgradeCostParts = (): CostPart[] => [
    { amount: upgradeCost().wood, icon: "🪵", label: "wood", sufficient: state.resources.wood >= upgradeCost().wood },
    { amount: upgradeCost().stone, icon: "🪨", label: "stone", sufficient: state.resources.stone >= upgradeCost().stone },
  ];
  const repairCostParts = (): CostPart[] => [
    { amount: repairCost().wood, icon: "🪵", label: "wood", sufficient: state.resources.wood >= repairCost().wood },
    { amount: repairCost().stone, icon: "🪨", label: "stone", sufficient: state.resources.stone >= repairCost().stone },
  ];
  const softBlocker = () => {
    if (props.disabled) return "Inner ring locks the Mage Tower until Town tier";
    if (state.mageTower.upgrading) return "Already upgrading";
    return "";
  };

  return (
    <div class="building-card" style={{ position: "relative" }}>
      <DefenseCardHeader
        buildingId="mage_tower"
        icon="🗼"
        name="Mage Tower"
        level={state.mageTower.level}
        statusBadge={state.mageTower.damaged ? "Damaged" : undefined}
        indicator={state.mageTower.upgrading ? undefined : (inOverlay) => (
          <UpgradeIndicator
            built={built()}
            level={state.mageTower.level}
            softBlocker={softBlocker()}
            costParts={upgradeCostParts()}
            buildTimeSeconds={buildTime()}
            onUpgrade={() => actions.buildOrUpgradeMageTower()}
            inOverlay={inOverlay}
          />
        )}
      />
      <div class="building-card-desc">
        A spire of war-wards and watchful magic, raised inside the keep. Its arcane defenses help turn back raids and the stranger things that come with them.
      </div>
      <Show when={state.mageTower.upgrading && state.mageTower.upgradeRemaining !== undefined}>
        <div class="building-card-upgrading">
          {built() ? `Upgrading to Lv.${state.mageTower.level + 1}` : "Building Lv.1"} —{" "}
          <Countdown remainingSeconds={state.mageTower.upgradeRemaining!} />
        </div>
      </Show>
      <Show when={state.mageTower.damaged && !state.mageTower.upgrading}>
        <div style={{ "margin-top": "auto", "padding-top": "10px" }}>
          <RepairButton
            costParts={repairCostParts()}
            onRepair={() => actions.repairMageTower()}
          />
        </div>
      </Show>
    </div>
  );
}
