import { For, Show, createSignal } from "solid-js";
import { useGame, type PlayerField, type PlayerGarden, type PlayerPen, type PlayerHive, type PlayerOrchard } from "~/engine/gameState";
import { CROPS, type CropId, getCrop, getFieldCost, getFieldBuildTime, getSeasonYield, MAX_FIELDS, FIELD_MAX_LEVEL } from "~/data/crops";
import { VEGGIES, type VeggieId, getVeggie, getGardenCost, getGardenBuildTime, getGardenRate, isGardenActive, MAX_GARDENS, GARDEN_MAX_LEVEL } from "~/data/gardens";
import { ANIMALS, type AnimalId, getAnimal, getPenCost, getPenBuildTime, getPenProduction, MAX_PENS, PEN_MAX_LEVEL } from "@medieval-realm/shared/data/livestock";
import { getHiveCost, getHiveBuildTime, getHoneyRate, MAX_HIVES, HIVE_MAX_LEVEL } from "~/data/apiary";
import { FRUITS, type FruitId, getFruit, getOrchardCost, getOrchardBuildTime, getOrchardRate, getOrchardStatus, isOrchardActive, MAX_ORCHARDS, ORCHARD_MAX_LEVEL } from "~/data/orchards";
import { SEASON_META } from "~/data/seasons";
import Countdown from "~/components/Countdown";

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function fieldSeasonStatus(season: string, level: number, isHarvesting: boolean): { label: string; color: string } {
  if (level === 0) return { label: "Under construction", color: "var(--accent-blue)" };
  switch (season) {
    case "spring": return { label: "🌱 Planted — growing", color: "var(--accent-green)" };
    case "summer": return { label: "☀️ Growing", color: "var(--accent-green)" };
    case "autumn":
      if (isHarvesting) return { label: "🌾 Harvesting!", color: "#d4831a" };
      return { label: "✅ Harvest gathered — field resting", color: "var(--accent-red)" };
    case "winter": return { label: "❄️ Fallow — dormant until spring", color: "var(--text-muted)" };
    default: return { label: "", color: "" };
  }
}

// ─── Field Card ──────────────────────────────────────────────────

function FieldCard(props: { field: PlayerField }) {
  const { actions, state } = useGame();
  const [showPlantPicker, setShowPlantPicker] = createSignal(false);
  const crop = () => props.field.crop ? getCrop(props.field.crop) : null;
  const isEmpty = () => !props.field.crop && !props.field.fallow && props.field.level > 0 && !props.field.upgrading;
  const isFallow = () => props.field.fallow && props.field.level > 0 && !props.field.upgrading;
  const harvestYield = () => (props.field.level > 0 && crop()) ? getSeasonYield(crop()!, props.field.level) : 0;
  const upgradeCost = () => props.field.level < FIELD_MAX_LEVEL ? getFieldCost(props.field.level) : null;
  const canUpgrade = () => {
    if (props.field.crop !== null) return false; // can only upgrade empty/fallow fields
    if (props.field.upgrading || props.field.level >= FIELD_MAX_LEVEL) return false;
    const cost = upgradeCost();
    return cost ? state.resources.wood >= cost.wood && state.resources.stone >= cost.stone : false;
  };
  const isCurrentlyHarvesting = () => actions.isHarvesting();
  const seasonStatus = () => {
    if (isFallow()) return { label: "🌿 Fallow — resting this year", color: "#9b59b6" };
    if (isEmpty()) {
      if (state.season === "spring") return { label: "🌱 Ready to plant!", color: "var(--accent-green)" };
      return { label: "Empty — waiting for spring", color: "var(--text-muted)" };
    }
    return fieldSeasonStatus(state.season, props.field.level, isCurrentlyHarvesting());
  };

  return (
    <div class="field-card" classList={{
      upgrading: props.field.upgrading,
      harvesting: state.season === "autumn" && props.field.level > 0 && !!crop(),
    }}>
      <div class="field-card-header">
        <span class="field-card-icon">{crop()?.icon ?? "🟫"}</span>
        <div>
          <div class="field-card-title">{crop() ? `${crop()!.name} Field` : "Empty Field"}</div>
          <div class="field-card-level">
            {props.field.level === 0 ? "Building..." : `Level ${props.field.level} / ${FIELD_MAX_LEVEL}`}
          </div>
        </div>
      </div>
      <Show when={props.field.upgrading && props.field.upgradeRemaining}>
        <div class="field-card-status upgrading-status">
          {props.field.level === 0 ? "Preparing field" : "Upgrading"} — <Countdown remainingSeconds={props.field.upgradeRemaining!} />
        </div>
      </Show>
      <Show when={!props.field.upgrading && props.field.level > 0}>
        <div class="field-card-status" style={{ color: seasonStatus().color }}>{seasonStatus().label}</div>
        <Show when={crop()}>
          <div class="field-card-harvest">Expected harvest: <strong>{harvestYield()}</strong> {crop()!.isFood ? "food" : "fiber"}</div>
          <div style={{ "font-size": "0.7rem", color: props.field.harvestsBeforeFallow <= 1 ? "var(--accent-gold)" : "var(--text-muted)", "margin-top": "2px" }}>
            {props.field.harvestsBeforeFallow > 1
              ? `${props.field.harvestsBeforeFallow - 1} more harvest${props.field.harvestsBeforeFallow > 2 ? "s" : ""} before fallow`
              : "Last harvest before fallow"}
          </div>
        </Show>
      </Show>

      {/* Plant picker — spring only, empty fields */}
      <Show when={isEmpty() && state.season === "spring"}>
        <Show when={showPlantPicker()} fallback={
          <button class="field-upgrade-btn" style={{ "margin-top": "6px", width: "100%" }} onClick={() => setShowPlantPicker(true)}>
            Plant a crop
          </button>
        }>
          <div style={{ "margin-top": "6px", display: "flex", gap: "4px", "flex-wrap": "wrap" }}>
            <For each={CROPS}>
              {(c) => (
                <button
                  class="field-upgrade-btn"
                  style={{ "font-size": "0.75rem", padding: "4px 8px" }}
                  onClick={() => { actions.plantField(props.field.id, c.id); setShowPlantPicker(false); }}
                >
                  {c.icon} {c.name}
                </button>
              )}
            </For>
            <button
              style={{ "font-size": "0.75rem", padding: "4px 8px", background: "none", border: "1px solid var(--border-default)", color: "var(--text-muted)", "border-radius": "4px", cursor: "pointer" }}
              onClick={() => setShowPlantPicker(false)}
            >
              Cancel
            </button>
          </div>
        </Show>
      </Show>

      {/* Upgrade — empty (non-fallow) fields only */}
      <Show when={(isEmpty() || isFallow()) && !props.field.upgrading && props.field.level < FIELD_MAX_LEVEL}>
        <div class="field-card-upgrade">
          <div class="field-upgrade-info">
            <span class="field-upgrade-cost">🪵 {upgradeCost()!.wood} 🪨 {upgradeCost()!.stone}</span>
            <span class="field-upgrade-time">{formatTime(getFieldBuildTime(props.field.level))}</span>
          </div>
          <button class="field-upgrade-btn" disabled={!canUpgrade()} onClick={() => actions.upgradeField(props.field.id)}>Upgrade</button>
        </div>
      </Show>
      <Show when={!props.field.upgrading}>
        <button class="field-remove-btn" onClick={() => { if (confirm("Remove this field?")) actions.removeField(props.field.id); }}>Remove</button>
      </Show>
    </div>
  );
}

// ─── Garden Card (uses FarmCard) ────────────────────────────────

function GardenCard(props: { garden: PlayerGarden }) {
  const { actions, state } = useGame();
  const veggie = () => getVeggie(props.garden.veggie);
  const rate = () => props.garden.level > 0 ? getGardenRate(veggie(), props.garden.level) : 0;
  const active = () => props.garden.level > 0 && isGardenActive(veggie(), state.season);
  const cost = () => props.garden.level < GARDEN_MAX_LEVEL ? getGardenCost(props.garden.level) : null;
  const canUpgrade = () => {
    if (props.garden.upgrading || props.garden.level >= GARDEN_MAX_LEVEL) return false;
    const c = cost();
    return c ? state.resources.wood >= c.wood && state.resources.stone >= c.stone : false;
  };

  return (
    <FarmCard
      icon={veggie().icon}
      title={`${veggie().name} Garden`}
      level={props.garden.level}
      maxLevel={GARDEN_MAX_LEVEL}
      upgrading={props.garden.upgrading}
      upgradeRemaining={props.garden.upgradeRemaining}
      buildLabel="Planting"
      statusLine={active() ? `Producing +${rate()}/h` : `Dormant (grows in ${veggie().activeSeasons.join(", ")})`}
      statusColor={active() ? "var(--accent-green)" : "var(--text-muted)"}
      detailLine={`Seasons: ${veggie().activeSeasons.map((s) => SEASON_META[s].icon).join(" ")}`}
      upgradeCost={cost() ? `🪵 ${cost()!.wood} 🪨 ${cost()!.stone}` : undefined}
      upgradeTime={cost() ? formatTime(getGardenBuildTime(props.garden.level)) : undefined}
      upgradeYield={cost() ? `→ +${getGardenRate(veggie(), props.garden.level + 1)}/h` : undefined}
      canUpgrade={canUpgrade()}
      onUpgrade={() => actions.upgradeGarden(props.garden.id)}
      onRemove={() => actions.removeGarden(props.garden.id)}
      removeLabel={`Remove this ${veggie().name} garden?`}
    />
  );
}

// ─── Pen Card (uses FarmCard) ───────────────────────────────────

function PenCard(props: { pen: PlayerPen }) {
  const { actions, state } = useGame();
  const animal = () => getAnimal(props.pen.animal);
  const prod = () => props.pen.level > 0 ? getPenProduction(animal(), props.pen.level) : { produced: 0, consumed: 0 };
  const cost = () => props.pen.level < PEN_MAX_LEVEL ? getPenCost(props.pen.level) : null;
  const canUpgrade = () => {
    if (props.pen.upgrading || props.pen.level >= PEN_MAX_LEVEL) return false;
    const c = cost();
    return c ? state.resources.wood >= c.wood && state.resources.stone >= c.stone && state.resources.gold >= c.gold : false;
  };
  const statusLine = () => {
    const p = prod();
    let line = `+${p.produced}/h ${animal().foodLabel}`;
    if (p.secondary) line += ` · +${p.secondary.amount}/h ${p.secondary.resource}`;
    line += ` (eats ${p.consumed}/h)`;
    return line;
  };
  const detailLine = () => {
    const p = prod();
    let line = `Net: +${p.produced - p.consumed}/h food`;
    if (p.secondary) line += ` · +${p.secondary.amount}/h ${p.secondary.resource}`;
    return line;
  };

  return (
    <FarmCard
      icon={animal().icon}
      title={`${animal().name} Pen`}
      level={props.pen.level}
      maxLevel={PEN_MAX_LEVEL}
      upgrading={props.pen.upgrading}
      upgradeRemaining={props.pen.upgradeRemaining}
      buildLabel="Building pen"
      statusLine={statusLine()}
      statusColor="var(--accent-green)"
      detailLine={detailLine()}
      detailColor="var(--accent-green)"
      upgradeCost={cost() ? `🪵 ${cost()!.wood} 🪨 ${cost()!.stone} 🪙 ${cost()!.gold}` : undefined}
      upgradeTime={cost() ? formatTime(getPenBuildTime(props.pen.level)) : undefined}
      canUpgrade={canUpgrade()}
      onUpgrade={() => actions.upgradePen(props.pen.id)}
      onRemove={() => actions.removePen(props.pen.id)}
      removeLabel={`Remove this ${animal().name} pen?`}
    />
  );
}

// ─── Picker Component ────────────────────────────────────────────

function Picker<T extends { id: string; name: string; icon: string; description: string }>(props: {
  title: string;
  items: T[];
  disabled: boolean;
  getYieldLabel: (item: T) => string;
  onSelect: (id: string) => void;
  onCancel: () => void;
}) {
  return (
    <div class="crop-picker">
      <h3 class="crop-picker-title">{props.title}</h3>
      <div class="crop-picker-grid">
        <For each={props.items}>
          {(item) => (
            <button class="crop-option" disabled={props.disabled} onClick={() => props.onSelect(item.id)}>
              <span class="crop-option-icon">{item.icon}</span>
              <span class="crop-option-name">{item.name}</span>
              <span class="crop-option-desc">{item.description}</span>
              <span class="crop-option-yield">{props.getYieldLabel(item)}</span>
            </button>
          )}
        </For>
      </div>
      <button class="crop-picker-cancel" onClick={props.onCancel}>Cancel</button>
    </div>
  );
}

// ─── Generic Farm Card ───────────────────────────────────────────
// Shared component for gardens, pens, hives, and orchards.

interface FarmCardProps {
  icon: string;
  title: string;
  level: number;
  maxLevel: number;
  upgrading: boolean;
  upgradeRemaining?: number;
  buildLabel?: string;        // "Building pen", "Planting", etc.
  /** Status line when built and not upgrading */
  statusLine?: string;
  statusColor?: string;
  /** Secondary info line (e.g., seasons, net food) */
  detailLine?: string;
  detailColor?: string;
  /** Upgrade cost display */
  upgradeCost?: string;
  upgradeTime?: string;
  upgradeYield?: string;      // e.g., "→ +12/h"
  canUpgrade: boolean;
  onUpgrade: () => void;
  onRemove: () => void;
  removeLabel?: string;
}

function FarmCard(props: FarmCardProps) {
  return (
    <div class="field-card" classList={{ upgrading: props.upgrading }}>
      <div class="field-card-header">
        <span class="field-card-icon">{props.icon}</span>
        <div>
          <div class="field-card-title">{props.title}</div>
          <div class="field-card-level">
            {props.level === 0 ? (props.buildLabel ?? "Building...") : `Level ${props.level} / ${props.maxLevel}`}
          </div>
        </div>
      </div>
      <Show when={props.upgrading && props.upgradeRemaining !== undefined}>
        <div class="field-card-status upgrading-status">
          {props.level === 0 ? (props.buildLabel ?? "Building") : "Upgrading"} — <Countdown remainingSeconds={props.upgradeRemaining!} />
        </div>
      </Show>
      <Show when={!props.upgrading && props.level > 0 && props.statusLine}>
        <div class="field-card-status" style={{ color: props.statusColor ?? "var(--text-secondary)" }}>
          {props.statusLine}
        </div>
      </Show>
      <Show when={!props.upgrading && props.level > 0 && props.detailLine}>
        <div class="field-card-harvest" style={{ "font-size": "0.75rem", color: props.detailColor ?? "var(--text-muted)" }}>
          {props.detailLine}
        </div>
      </Show>
      <Show when={!props.upgrading && props.level > 0 && props.level < props.maxLevel && props.upgradeCost}>
        <div class="field-card-upgrade">
          <div class="field-upgrade-info">
            <span class="field-upgrade-cost">{props.upgradeCost}</span>
            <Show when={props.upgradeTime}><span class="field-upgrade-time">{props.upgradeTime}</span></Show>
            <Show when={props.upgradeYield}><span class="field-upgrade-yield">{props.upgradeYield}</span></Show>
          </div>
          <button class="field-upgrade-btn" disabled={!props.canUpgrade} onClick={props.onUpgrade}>Upgrade</button>
        </div>
      </Show>
      <Show when={!props.upgrading}>
        <button class="field-remove-btn" onClick={() => { if (confirm(props.removeLabel ?? "Remove this?")) props.onRemove(); }}>Remove</button>
      </Show>
    </div>
  );
}

// ─── Hive Card (uses FarmCard) ──────────────────────────────────

function HiveCard(props: { hive: PlayerHive }) {
  const { actions, state } = useGame();
  const honeyRate = () => props.hive.level > 0 ? getHoneyRate(props.hive.level, state.season) : 0;
  const cost = () => props.hive.level < HIVE_MAX_LEVEL ? getHiveCost(props.hive.level) : null;
  const canUpgrade = () => {
    const c = cost();
    if (!c || props.hive.upgrading) return false;
    return state.resources.wood >= c.wood && state.resources.stone >= c.stone && state.resources.gold >= c.gold;
  };
  const isDormant = () => props.hive.level > 0 && !props.hive.upgrading && honeyRate() === 0;

  return (
    <FarmCard
      icon="🐝"
      title="Beehive"
      level={props.hive.level}
      maxLevel={HIVE_MAX_LEVEL}
      upgrading={props.hive.upgrading}
      upgradeRemaining={props.hive.upgradeRemaining}
      buildLabel="Building hive"
      statusLine={isDormant() ? "❄️ Dormant (winter)" : `🍯 +${honeyRate()}/h honey`}
      statusColor={isDormant() ? "var(--text-muted)" : "var(--accent-gold)"}
      upgradeCost={cost() ? `🪵 ${cost()!.wood} 🪨 ${cost()!.stone} 🪙 ${cost()!.gold}` : undefined}
      upgradeTime={cost() ? formatTime(getHiveBuildTime(props.hive.level)) : undefined}
      canUpgrade={canUpgrade()}
      onUpgrade={() => actions.upgradeHive(props.hive.id)}
      onRemove={() => actions.removeHive(props.hive.id)}
      removeLabel="Remove this beehive?"
    />
  );
}

// ─── Orchard Card (uses FarmCard) ───────────────────────────────

function OrchardCard(props: { orchard: PlayerOrchard }) {
  const { actions, state } = useGame();
  const fruitDef = () => getFruit(props.orchard.fruit);
  const rate = () => props.orchard.level > 0 && props.orchard.mature && isOrchardActive(fruitDef(), state.season)
    ? getOrchardRate(fruitDef(), props.orchard.level) : 0;
  const status = () => props.orchard.level > 0 && !props.orchard.upgrading
    ? getOrchardStatus(fruitDef(), state.season, props.orchard.mature, props.orchard.seasonsGrown) : "";
  const cost = () => props.orchard.level < ORCHARD_MAX_LEVEL ? getOrchardCost(props.orchard.level) : null;
  const canUpgrade = () => {
    const c = cost();
    if (!c || props.orchard.upgrading) return false;
    return state.resources.wood >= c.wood && state.resources.stone >= c.stone && state.resources.gold >= c.gold;
  };

  return (
    <FarmCard
      icon={fruitDef().icon}
      title={fruitDef().name}
      level={props.orchard.level}
      maxLevel={ORCHARD_MAX_LEVEL}
      upgrading={props.orchard.upgrading}
      upgradeRemaining={props.orchard.upgradeRemaining}
      buildLabel="Planting"
      statusLine={rate() > 0 ? `🍎 +${rate()}/h fruit` : status()}
      statusColor={rate() > 0 ? "var(--accent-green)" : "var(--text-muted)"}
      detailLine={props.orchard.level > 0 && !props.orchard.upgrading ? `Harvests: ${fruitDef().harvestSeasons.map((s) => SEASON_META[s].icon).join(" ")}` : undefined}
      upgradeCost={cost() ? `🪵 ${cost()!.wood} 🪨 ${cost()!.stone} 🪙 ${cost()!.gold}` : undefined}
      upgradeTime={cost() ? formatTime(getOrchardBuildTime(props.orchard.level)) : undefined}
      canUpgrade={canUpgrade()}
      onUpgrade={() => actions.upgradeOrchard(props.orchard.id)}
      onRemove={() => actions.removeOrchard(props.orchard.id)}
      removeLabel={`Remove this ${fruitDef().name} orchard?`}
    />
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function Farming() {
  const { state, actions } = useGame();
  // showFieldPicker removed — fields are built empty, crops chosen per-field in spring
  const [showGardenPicker, setShowGardenPicker] = createSignal(false);
  const [showPenPicker, setShowPenPicker] = createSignal(false);
  const [showOrchardPicker, setShowOrchardPicker] = createSignal(false);

  const seasonMeta = () => SEASON_META[state.season];

  const canBuildField = () => {
    if (state.fields.length >= MAX_FIELDS) return false;
    const cost = getFieldCost(0);
    return state.resources.wood >= cost.wood && state.resources.stone >= cost.stone;
  };

  const canBuildGarden = () => {
    if (state.gardens.length >= MAX_GARDENS) return false;
    const cost = getGardenCost(0);
    return state.resources.wood >= cost.wood && state.resources.stone >= cost.stone;
  };

  const canBuildHive = () => {
    if (state.hives.length >= MAX_HIVES) return false;
    const cost = getHiveCost(0);
    return state.resources.wood >= cost.wood && state.resources.stone >= cost.stone && state.resources.gold >= cost.gold;
  };

  const canBuildOrchard = () => {
    if (state.orchards.length >= MAX_ORCHARDS) return false;
    const cost = getOrchardCost(0);
    return state.resources.wood >= cost.wood && state.resources.stone >= cost.stone && state.resources.gold >= cost.gold;
  };

  const canBuildPen = () => {
    if (state.pens.length >= MAX_PENS) return false;
    const cost = getPenCost(0);
    return state.resources.wood >= cost.wood && state.resources.stone >= cost.stone && state.resources.gold >= cost.gold;
  };

  const totalExpectedHarvest = () => {
    let total = 0;
    for (const field of state.fields) {
      if (field.level === 0 || !field.crop) continue;
      const crop = getCrop(field.crop);
      if (crop.isFood) total += getSeasonYield(crop, field.level);
    }
    return total;
  };

  return (
    <div>
      <h1 class="page-title">Farming</h1>

      <div class="farming-summary">
        <div class="farming-stat">
          <span class="farming-stat-label">Season</span>
          <span class="farming-stat-value" style={{ color: seasonMeta().color }}>
            {seasonMeta().icon} {seasonMeta().name}, Year {state.year}
          </span>
        </div>
        <Show when={state.season === "spring" || state.season === "summer"}>
          <div class="farming-stat">
            <span class="farming-stat-label">Expected Harvest</span>
            <span class="farming-stat-value">{totalExpectedHarvest()} food</span>
          </div>
        </Show>
        <Show when={state.season === "autumn" && actions.isHarvesting()}>
          <div class="farming-stat">
            <span class="farming-stat-label">Harvesting</span>
            <span class="farming-stat-value" style={{ color: "#d4831a" }}>{totalExpectedHarvest()} food incoming</span>
          </div>
        </Show>
        <Show when={(state.season === "autumn" && !actions.isHarvesting()) || state.season === "winter"}>
          <div class="farming-stat">
            <span class="farming-stat-label">Harvested this year</span>
            <span class="farming-stat-value" style={{ color: "var(--accent-green)" }}>
              {Object.keys(state.yearHarvest).length > 0
                ? Object.entries(state.yearHarvest).map(([name, amt]) => `${amt} ${name}`).join(", ")
                : "Nothing"}
            </span>
          </div>
        </Show>
        <div class="farming-stat">
          <span class="farming-stat-label">Animal Feed</span>
          <span class="farming-stat-value rate-negative">-{actions.getAnimalFoodConsumption()}/h</span>
        </div>
      </div>

      <Show when={state.season === "autumn" && actions.isHarvesting()}>
        <div class="harvest-banner">🍂 Harvest in progress! Your fields are yielding grain.</div>
      </Show>
      <Show when={state.season === "winter"}>
        <div class="winter-banner">❄️ Winter — fields and gardens are dormant. Survive on stored food, hunting, fishing, and livestock.</div>
      </Show>

      {/* ── Fields ── */}
      <h2 class="farming-section-title">🌾 Fields ({state.fields.length}/{MAX_FIELDS})</h2>
      <Show when={state.fields.length === 0 && state.season !== "spring"}>
        <div style={{
          padding: "8px 12px",
          "margin-bottom": "10px",
          "border-radius": "6px",
          background: "rgba(245, 197, 66, 0.1)",
          border: "1px solid rgba(245, 197, 66, 0.3)",
          "font-size": "0.8rem",
          color: "var(--accent-gold)",
        }}>
          Fields can only be planted in spring. You can build one now, but it will sit empty until next spring. Consider building a <strong>garden</strong> instead — they produce food year-round (except winter).
        </div>
      </Show>
      <Show when={state.fields.length > 0}>
        <div style={{
          padding: "8px 12px",
          "margin-bottom": "10px",
          "border-radius": "6px",
          background: state.season === "spring" ? "rgba(124, 252, 0, 0.1)" :
            state.season === "winter" ? "rgba(135, 206, 235, 0.1)" : "rgba(212, 131, 26, 0.1)",
          border: `1px solid ${state.season === "spring" ? "#7CFC00" : state.season === "winter" ? "#87CEEB" : "#d4831a"}`,
          "font-size": "0.8rem",
          color: state.season === "spring" ? "#7CFC00" : state.season === "winter" ? "#87CEEB" : "#d4831a",
        }}>
          {state.season === "spring" && "🌱 Spring — planting season! Choose what to grow on your empty fields."}
          {state.season === "autumn" && actions.isHarvesting() && "🌾 Fields are being harvested!"}
          {state.season === "autumn" && !actions.isHarvesting() && "✅ Harvest complete. Fields are resting."}
          {state.season === "summer" && "☀️ Crops are growing. Patience..."}
          {state.season === "winter" && "❄️ Fields are dormant until spring."}
        </div>
      </Show>
      <div class="fields-grid">
        <For each={state.fields}>{(f) => <FieldCard field={f} />}</For>
        <Show when={state.fields.length < MAX_FIELDS}>
          <button class="add-card-btn" disabled={!canBuildField()} onClick={() => actions.buildField()}>
            <span class="add-card-icon">+</span>
            <span class="add-card-label">New Field</span>
            <span class="add-card-cost">🪵 {getFieldCost(0).wood} 🪨 {getFieldCost(0).stone}</span>
          </button>
        </Show>
      </div>

      {/* ── Gardens ── */}
      <h2 class="farming-section-title" style={{ "margin-top": "28px" }}>🥬 Gardens ({state.gardens.length}/{MAX_GARDENS})</h2>
      <div class="fields-grid">
        <For each={state.gardens}>{(g) => <GardenCard garden={g} />}</For>
        <Show when={state.gardens.length < MAX_GARDENS}>
          <Show when={showGardenPicker()} fallback={
            <button class="add-card-btn" disabled={!canBuildGarden()} onClick={() => setShowGardenPicker(true)}>
              <span class="add-card-icon">+</span>
              <span class="add-card-label">New Garden</span>
              <span class="add-card-cost">🪵 {getGardenCost(0).wood} 🪨 {getGardenCost(0).stone}</span>
            </button>
          }>
            <Picker title="Choose a Vegetable" items={VEGGIES} disabled={!canBuildGarden()}
              getYieldLabel={(v) => `+${getGardenRate(v, 1)}/h (${v.activeSeasons.map((s) => SEASON_META[s].icon).join(" ")})`}
              onSelect={(id) => { actions.buildGarden(id as VeggieId); setShowGardenPicker(false); }}
              onCancel={() => setShowGardenPicker(false)} />
          </Show>
        </Show>
      </div>

      {/* ── Livestock ── */}
      <h2 class="farming-section-title" style={{ "margin-top": "28px" }}>🐄 Livestock ({state.pens.length}/{MAX_PENS})</h2>
      <div class="fields-grid">
        <For each={state.pens}>{(p) => <PenCard pen={p} />}</For>
        <Show when={state.pens.length < MAX_PENS}>
          <Show when={showPenPicker()} fallback={
            <button class="add-card-btn" disabled={!canBuildPen()} onClick={() => setShowPenPicker(true)}>
              <span class="add-card-icon">+</span>
              <span class="add-card-label">New Pen</span>
              <span class="add-card-cost">🪵 {getPenCost(0).wood} 🪨 {getPenCost(0).stone} 🪙 {getPenCost(0).gold}</span>
            </button>
          }>
            <Picker title="Choose an Animal" items={ANIMALS} disabled={!canBuildPen()}
              getYieldLabel={(a) => {
                const prod = getPenProduction(a, 1);
                let label = `+${prod.produced}/h ${a.foodLabel}`;
                if (prod.secondary) label += ` · +${prod.secondary.amount}/h ${prod.secondary.resource}`;
                label += ` (eats ${prod.consumed}/h)`;
                return label;
              }}
              onSelect={(id) => { actions.buildPen(id as AnimalId); setShowPenPicker(false); }}
              onCancel={() => setShowPenPicker(false)} />
          </Show>
        </Show>
      </div>

      {/* ── Apiary ── */}
      <h2 class="farming-section-title" style={{ "margin-top": "28px" }}>🐝 Apiary ({state.hives.length}/{MAX_HIVES}) — 🍯 {Math.floor(state.honey)} honey</h2>
      <div class="fields-grid">
        <For each={state.hives}>{(h) => <HiveCard hive={h} />}</For>
        <Show when={state.hives.length < MAX_HIVES}>
          <button class="add-card-btn" disabled={!canBuildHive()} onClick={() => actions.buildHive()}>
            <span class="add-card-icon">+</span>
            <span class="add-card-label">New Beehive</span>
            <span class="add-card-cost">🪵 {getHiveCost(0).wood} 🪨 {getHiveCost(0).stone} 🪙 {getHiveCost(0).gold}</span>
          </button>
        </Show>
      </div>

      {/* ── Orchards ── */}
      <h2 class="farming-section-title" style={{ "margin-top": "28px" }}>🌳 Orchards ({state.orchards.length}/{MAX_ORCHARDS}) — 🍎 {Math.floor(state.fruit)} fruit</h2>
      <div class="fields-grid">
        <For each={state.orchards}>{(o) => <OrchardCard orchard={o} />}</For>
        <Show when={state.orchards.length < MAX_ORCHARDS}>
          <Show when={showOrchardPicker()} fallback={
            <button class="add-card-btn" disabled={!canBuildOrchard()} onClick={() => setShowOrchardPicker(true)}>
              <span class="add-card-icon">+</span>
              <span class="add-card-label">Plant Orchard</span>
              <span class="add-card-cost">🪵 {getOrchardCost(0).wood} 🪨 {getOrchardCost(0).stone} 🪙 {getOrchardCost(0).gold}</span>
            </button>
          }>
            <Picker title="Choose Fruit Trees" items={FRUITS} disabled={!canBuildOrchard()}
              getYieldLabel={(f) => {
                const rate = getOrchardRate(f, 1);
                const seasons = f.harvestSeasons.join(", ");
                return `+${rate}/h fruit (${seasons}) — ${f.maturationSeasons} seasons to mature`;
              }}
              onSelect={(id) => { actions.buildOrchard(id as FruitId); setShowOrchardPicker(false); }}
              onCancel={() => setShowOrchardPicker(false)} />
          </Show>
        </Show>
      </div>
    </div>
  );
}
