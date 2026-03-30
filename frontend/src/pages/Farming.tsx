import { For, Show, createSignal } from "solid-js";
import { useGame, type PlayerField } from "~/engine/gameState";
import { CROPS, type CropId, getCrop, getFieldCost, getFieldBuildTime, getSeasonYield, MAX_FIELDS, FIELD_MAX_LEVEL } from "~/data/crops";
import { SEASON_META } from "~/data/seasons";
import Countdown from "~/components/Countdown";

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function fieldSeasonStatus(season: string, level: number): { label: string; color: string } {
  if (level === 0) return { label: "Under construction", color: "var(--accent-blue)" };
  switch (season) {
    case "spring": return { label: "Planted — growing", color: "var(--accent-green)" };
    case "summer": return { label: "Growing", color: "var(--accent-green)" };
    case "autumn": return { label: "Harvesting!", color: "#d4831a" };
    case "winter": return { label: "Dormant", color: "var(--text-muted)" };
    default: return { label: "", color: "" };
  }
}

function FieldCard(props: { field: PlayerField }) {
  const { actions, state } = useGame();
  const crop = () => getCrop(props.field.crop);
  const harvestYield = () =>
    props.field.level > 0 ? getSeasonYield(crop(), props.field.level) : 0;
  const nextHarvestYield = () =>
    props.field.level < FIELD_MAX_LEVEL
      ? getSeasonYield(crop(), props.field.level + 1)
      : null;
  const upgradeCost = () =>
    props.field.level < FIELD_MAX_LEVEL ? getFieldCost(props.field.level) : null;
  const canUpgrade = () => {
    if (props.field.upgrading || props.field.level >= FIELD_MAX_LEVEL) return false;
    const cost = upgradeCost();
    if (!cost) return false;
    return state.resources.wood >= cost.wood && state.resources.stone >= cost.stone;
  };
  const seasonStatus = () => fieldSeasonStatus(state.season, props.field.level);

  return (
    <div class="field-card" classList={{ upgrading: props.field.upgrading, harvesting: state.season === "autumn" && props.field.level > 0 }}>
      <div class="field-card-header">
        <span class="field-card-icon">{crop().icon}</span>
        <div>
          <div class="field-card-title">{crop().name} Field</div>
          <div class="field-card-level">
            {props.field.level === 0
              ? "Building..."
              : `Level ${props.field.level} / ${FIELD_MAX_LEVEL}`}
          </div>
        </div>
      </div>

      <Show when={props.field.upgrading && props.field.upgradeRemaining}>
        <div class="field-card-status upgrading-status">
          {props.field.level === 0 ? "Preparing field" : "Upgrading"} — <Countdown remainingSeconds={props.field.upgradeRemaining!} />
        </div>
      </Show>

      <Show when={!props.field.upgrading && props.field.level > 0}>
        <div class="field-card-status" style={{ color: seasonStatus().color }}>
          {seasonStatus().label}
        </div>
        <div class="field-card-harvest">
          Expected harvest: <strong>{harvestYield()}</strong> {crop().isFood ? "food" : "fiber"}
        </div>
      </Show>

      <Show when={!props.field.upgrading && props.field.level < FIELD_MAX_LEVEL}>
        <div class="field-card-upgrade">
          <div class="field-upgrade-info">
            <span class="field-upgrade-cost">
              🪵 {upgradeCost()!.wood} 🪨 {upgradeCost()!.stone}
            </span>
            <span class="field-upgrade-time">{formatTime(getFieldBuildTime(props.field.level))}</span>
            <Show when={nextHarvestYield()}>
              <span class="field-upgrade-yield">
                Harvest: {harvestYield()} → {nextHarvestYield()}
              </span>
            </Show>
          </div>
          <button
            class="field-upgrade-btn"
            disabled={!canUpgrade()}
            onClick={() => actions.upgradeField(props.field.id)}
          >
            Upgrade
          </button>
        </div>
      </Show>

      <Show when={!props.field.upgrading}>
        <button
          class="field-remove-btn"
          onClick={() => {
            if (confirm(`Remove this ${crop().name} field?`)) {
              actions.removeField(props.field.id);
            }
          }}
        >
          Remove
        </button>
      </Show>
    </div>
  );
}

export default function Farming() {
  const { state, actions } = useGame();
  const [showCropPicker, setShowCropPicker] = createSignal(false);

  const canBuildField = () => {
    if (state.fields.length >= MAX_FIELDS) return false;
    const cost = getFieldCost(0);
    return state.resources.wood >= cost.wood && state.resources.stone >= cost.stone;
  };

  const totalExpectedHarvest = () => {
    let total = 0;
    for (const field of state.fields) {
      if (field.level === 0) continue;
      const crop = getCrop(field.crop);
      if (crop.isFood) total += getSeasonYield(crop, field.level);
    }
    return total;
  };

  const buildCost = () => getFieldCost(0);
  const seasonMeta = () => SEASON_META[state.season];

  const handleBuildField = (cropId: CropId) => {
    actions.buildField(cropId);
    setShowCropPicker(false);
  };

  return (
    <div>
      <h1 class="page-title">Farming</h1>

      <div class="farming-summary">
        <div class="farming-stat">
          <span class="farming-stat-label">Fields</span>
          <span class="farming-stat-value">{state.fields.length} / {MAX_FIELDS}</span>
        </div>
        <div class="farming-stat">
          <span class="farming-stat-label">Season</span>
          <span class="farming-stat-value" style={{ color: seasonMeta().color }}>
            {seasonMeta().icon} {seasonMeta().name}
          </span>
        </div>
        <div class="farming-stat">
          <span class="farming-stat-label">Expected Harvest</span>
          <span class="farming-stat-value">{totalExpectedHarvest()} food</span>
        </div>
        <div class="farming-stat">
          <span class="farming-stat-label">New Field Cost</span>
          <span class="farming-stat-value">🪵 {buildCost().wood} 🪨 {buildCost().stone}</span>
        </div>
      </div>

      <Show when={state.season === "autumn" && actions.isHarvesting()}>
        <div class="harvest-banner">
          🍂 Harvest in progress! Your fields are yielding grain.
        </div>
      </Show>

      <Show when={state.season === "winter"}>
        <div class="winter-banner">
          ❄️ Winter — fields are dormant. Survive on stored food, hunting, and foraging.
        </div>
      </Show>

      <Show when={state.fields.length > 0}>
        <div class="fields-grid">
          <For each={state.fields}>
            {(field) => <FieldCard field={field} />}
          </For>
        </div>
      </Show>

      <Show when={state.fields.length === 0}>
        <div class="farming-empty">
          <p>No fields yet. Plant your first crop to start producing food!</p>
        </div>
      </Show>

      <Show when={state.fields.length < MAX_FIELDS}>
        <Show
          when={showCropPicker()}
          fallback={
            <button
              class="build-field-btn"
              disabled={!canBuildField()}
              onClick={() => setShowCropPicker(true)}
            >
              + Plant New Field
            </button>
          }
        >
          <div class="crop-picker">
            <h3 class="crop-picker-title">Choose a Crop</h3>
            <div class="crop-picker-grid">
              <For each={CROPS}>
                {(crop) => (
                  <button
                    class="crop-option"
                    disabled={!canBuildField()}
                    onClick={() => handleBuildField(crop.id)}
                  >
                    <span class="crop-option-icon">{crop.icon}</span>
                    <span class="crop-option-name">{crop.name}</span>
                    <span class="crop-option-desc">{crop.description}</span>
                    <span class="crop-option-yield">
                      Harvest: {getSeasonYield(crop, 1)} {crop.isFood ? "food" : "fiber"}/season
                    </span>
                  </button>
                )}
              </For>
            </div>
            <button class="crop-picker-cancel" onClick={() => setShowCropPicker(false)}>
              Cancel
            </button>
          </div>
        </Show>
      </Show>
    </div>
  );
}
