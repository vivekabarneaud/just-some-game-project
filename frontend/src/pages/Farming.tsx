import { For, Show, createSignal } from "solid-js";
import { useGame, type PlayerField } from "~/engine/gameState";
import { CROPS, type CropId, getCrop, getFieldCost, getFieldBuildTime, getFieldYield, MAX_FIELDS, FIELD_MAX_LEVEL } from "~/data/crops";
import Countdown from "~/components/Countdown";

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function FieldCard(props: { field: PlayerField }) {
  const { actions, state } = useGame();
  const crop = () => getCrop(props.field.crop);
  const yieldRate = () =>
    props.field.level > 0 && !props.field.upgrading
      ? getFieldYield(crop(), props.field.level)
      : 0;
  const nextYield = () =>
    props.field.level < FIELD_MAX_LEVEL
      ? getFieldYield(crop(), props.field.level + 1)
      : null;
  const upgradeCost = () =>
    props.field.level < FIELD_MAX_LEVEL ? getFieldCost(props.field.level) : null;
  const canUpgrade = () => {
    if (props.field.upgrading || props.field.level >= FIELD_MAX_LEVEL) return false;
    const cost = upgradeCost();
    if (!cost) return false;
    return state.resources.wood >= cost.wood && state.resources.stone >= cost.stone;
  };

  return (
    <div class="field-card" classList={{ upgrading: props.field.upgrading }}>
      <div class="field-card-header">
        <span class="field-card-icon">{crop().icon}</span>
        <div>
          <div class="field-card-title">{crop().name} Field</div>
          <div class="field-card-level">
            {props.field.level === 0
              ? "Under construction"
              : `Level ${props.field.level} / ${FIELD_MAX_LEVEL}`}
          </div>
        </div>
      </div>

      <Show when={props.field.upgrading && props.field.upgradeRemaining}>
        <div class="field-card-status upgrading-status">
          {props.field.level === 0 ? "Planting" : "Upgrading"} — <Countdown remainingSeconds={props.field.upgradeRemaining!} />
        </div>
      </Show>

      <Show when={!props.field.upgrading && props.field.level > 0}>
        <div class="field-card-production">
          {crop().isFood ? (
            <span class="rate-positive">+{yieldRate()}/h food</span>
          ) : (
            <span style={{ color: "var(--accent-purple)" }}>+{yieldRate()}/h fiber</span>
          )}
        </div>
      </Show>

      <Show when={!props.field.upgrading && props.field.level < FIELD_MAX_LEVEL}>
        <div class="field-card-upgrade">
          <div class="field-upgrade-info">
            <span class="field-upgrade-cost">
              🪵 {upgradeCost()!.wood} 🪨 {upgradeCost()!.stone}
            </span>
            <span class="field-upgrade-time">{formatTime(getFieldBuildTime(props.field.level))}</span>
            <Show when={nextYield()}>
              <span class="field-upgrade-yield">
                → {crop().isFood ? "+" : ""}{nextYield()}/h
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

  const totalFoodFromFields = () => {
    let total = 0;
    for (const field of state.fields) {
      if (field.level === 0 || field.upgrading) continue;
      const crop = getCrop(field.crop);
      if (crop.isFood) total += getFieldYield(crop, field.level);
    }
    return total;
  };

  const buildCost = () => getFieldCost(0);

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
          <span class="farming-stat-label">Total Food Production</span>
          <span class="farming-stat-value rate-positive">+{totalFoodFromFields()}/h</span>
        </div>
        <div class="farming-stat">
          <span class="farming-stat-label">New Field Cost</span>
          <span class="farming-stat-value">🪵 {buildCost().wood} 🪨 {buildCost().stone}</span>
        </div>
      </div>

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
                      {crop.isFood
                        ? `+${getFieldYield(crop, 1)}/h food`
                        : `+${getFieldYield(crop, 1)}/h fiber`}
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
