import { For, Show, createSignal } from "solid-js";
import { useGame, type PlayerField, type PlayerGarden, type PlayerPen } from "~/engine/gameState";
import { CROPS, type CropId, getCrop, getFieldCost, getFieldBuildTime, getSeasonYield, MAX_FIELDS, FIELD_MAX_LEVEL } from "~/data/crops";
import { VEGGIES, type VeggieId, getVeggie, getGardenCost, getGardenBuildTime, getGardenRate, isGardenActive, MAX_GARDENS, GARDEN_MAX_LEVEL } from "~/data/gardens";
import { ANIMALS, type AnimalId, getAnimal, getPenCost, getPenBuildTime, getPenProduction, MAX_PENS, PEN_MAX_LEVEL } from "~/data/livestock";
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

// ─── Garden Card ─────────────────────────────────────────────────

function GardenCard(props: { garden: PlayerGarden }) {
  const { actions, state } = useGame();
  const veggie = () => getVeggie(props.garden.veggie);
  const rate = () => props.garden.level > 0 ? getGardenRate(veggie(), props.garden.level) : 0;
  const active = () => props.garden.level > 0 && isGardenActive(veggie(), state.season);
  const upgradeCost = () => props.garden.level < GARDEN_MAX_LEVEL ? getGardenCost(props.garden.level) : null;
  const canUpgrade = () => {
    if (props.garden.upgrading || props.garden.level >= GARDEN_MAX_LEVEL) return false;
    const cost = upgradeCost();
    return cost ? state.resources.wood >= cost.wood && state.resources.stone >= cost.stone : false;
  };

  return (
    <div class="field-card" classList={{ upgrading: props.garden.upgrading }}>
      <div class="field-card-header">
        <span class="field-card-icon">{veggie().icon}</span>
        <div>
          <div class="field-card-title">{veggie().name} Garden</div>
          <div class="field-card-level">
            {props.garden.level === 0 ? "Building..." : `Level ${props.garden.level} / ${GARDEN_MAX_LEVEL}`}
          </div>
        </div>
      </div>
      <Show when={props.garden.upgrading && props.garden.upgradeRemaining}>
        <div class="field-card-status upgrading-status">
          {props.garden.level === 0 ? "Planting" : "Upgrading"} — <Countdown remainingSeconds={props.garden.upgradeRemaining!} />
        </div>
      </Show>
      <Show when={!props.garden.upgrading && props.garden.level > 0}>
        <div class="field-card-status" style={{ color: active() ? "var(--accent-green)" : "var(--text-muted)" }}>
          {active() ? `Producing +${rate()}/h` : `Dormant (grows in ${veggie().activeSeasons.join(", ")})`}
        </div>
        <div class="field-card-harvest" style={{ "font-size": "0.7rem" }}>
          Seasons: {veggie().activeSeasons.map((s) => SEASON_META[s].icon).join(" ")}
        </div>
      </Show>
      <Show when={!props.garden.upgrading && props.garden.level > 0 && props.garden.level < GARDEN_MAX_LEVEL}>
        <div class="field-card-upgrade">
          <div class="field-upgrade-info">
            <span class="field-upgrade-cost">🪵 {upgradeCost()!.wood} 🪨 {upgradeCost()!.stone}</span>
            <span class="field-upgrade-time">{formatTime(getGardenBuildTime(props.garden.level))}</span>
            <span class="field-upgrade-yield">→ +{getGardenRate(veggie(), props.garden.level + 1)}/h</span>
          </div>
          <button class="field-upgrade-btn" disabled={!canUpgrade()} onClick={() => actions.upgradeGarden(props.garden.id)}>Upgrade</button>
        </div>
      </Show>
      <Show when={!props.garden.upgrading}>
        <button class="field-remove-btn" onClick={() => { if (confirm(`Remove this ${veggie().name} garden?`)) actions.removeGarden(props.garden.id); }}>Remove</button>
      </Show>
    </div>
  );
}

// ─── Pen Card ────────────────────────────────────────────────────

function PenCard(props: { pen: PlayerPen }) {
  const { actions, state } = useGame();
  const animal = () => getAnimal(props.pen.animal);
  const prod = () => props.pen.level > 0 ? getPenProduction(animal(), props.pen.level) : { produced: 0, consumed: 0 };
  const upgradeCost = () => props.pen.level < PEN_MAX_LEVEL ? getPenCost(props.pen.level) : null;
  const canUpgrade = () => {
    if (props.pen.upgrading || props.pen.level >= PEN_MAX_LEVEL) return false;
    const cost = upgradeCost();
    return cost ? state.resources.wood >= cost.wood && state.resources.stone >= cost.stone && state.resources.gold >= cost.gold : false;
  };

  return (
    <div class="field-card" classList={{ upgrading: props.pen.upgrading }}>
      <div class="field-card-header">
        <span class="field-card-icon">{animal().icon}</span>
        <div>
          <div class="field-card-title">{animal().name} Pen</div>
          <div class="field-card-level">
            {props.pen.level === 0 ? "Building..." : `Level ${props.pen.level} / ${PEN_MAX_LEVEL}`}
          </div>
        </div>
      </div>
      <Show when={props.pen.upgrading && props.pen.upgradeRemaining}>
        <div class="field-card-status upgrading-status">
          {props.pen.level === 0 ? "Building pen" : "Upgrading"} — <Countdown remainingSeconds={props.pen.upgradeRemaining!} />
        </div>
      </Show>
      <Show when={!props.pen.upgrading && props.pen.level > 0}>
        <div class="field-card-production">
          <span class="rate-positive">+{prod().produced}/h {animal().foodLabel}</span>
          {prod().secondary && (
            <span class="rate-positive" style={{ "margin-left": "6px" }}>+{prod().secondary!.amount}/h {prod().secondary!.resource}</span>
          )}
          <span style={{ color: "var(--text-muted)", "margin-left": "8px", "font-size": "0.8rem" }}>
            (eats {prod().consumed}/h)
          </span>
        </div>
        <div class="field-card-harvest" style={{ "font-size": "0.75rem", color: "var(--accent-green)" }}>
          Net: +{prod().produced - prod().consumed}/h food
          {prod().secondary && ` · +${prod().secondary!.amount}/h ${prod().secondary!.resource}`}
        </div>
      </Show>
      <Show when={!props.pen.upgrading && props.pen.level > 0 && props.pen.level < PEN_MAX_LEVEL}>
        <div class="field-card-upgrade">
          <div class="field-upgrade-info">
            <span class="field-upgrade-cost">🪵 {upgradeCost()!.wood} 🪨 {upgradeCost()!.stone} 🪙 {upgradeCost()!.gold}</span>
            <span class="field-upgrade-time">{formatTime(getPenBuildTime(props.pen.level))}</span>
          </div>
          <button class="field-upgrade-btn" disabled={!canUpgrade()} onClick={() => actions.upgradePen(props.pen.id)}>Upgrade</button>
        </div>
      </Show>
      <Show when={!props.pen.upgrading}>
        <button class="field-remove-btn" onClick={() => { if (confirm(`Remove this ${animal().name} pen?`)) actions.removePen(props.pen.id); }}>Remove</button>
      </Show>
    </div>
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

// ─── Main Page ───────────────────────────────────────────────────

export default function Farming() {
  const { state, actions } = useGame();
  // showFieldPicker removed — fields are built empty, crops chosen per-field in spring
  const [showGardenPicker, setShowGardenPicker] = createSignal(false);
  const [showPenPicker, setShowPenPicker] = createSignal(false);

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
    </div>
  );
}
