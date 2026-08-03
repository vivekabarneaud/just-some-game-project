import { For, Show, onMount, createSignal } from "solid-js";
import { useGame, type GameState, type PlayerField, type PlayerGarden, type PlayerPen, type PlayerHive, type PlayerOrchard } from "~/engine/gameState";
import { CROPS, type CropId, getCrop, getFieldCost, getFieldBuildTime, getSeasonYield, getSoilMultiplier, getSoilStatus, getHayFromHarvest, MAX_FIELDS, FIELD_MAX_LEVEL } from "~/data/crops";
import { getVeggie, getGardenCost, getGardenBuildTime, getSeedCapacity, getEffectiveGardenRate, getLiveGardenRate, getSproutedPlants, getGerminationRate, canPlantVeggie, isVeggieProducing, isSeedUnlocked, MAX_GARDENS, GARDEN_MAX_LEVEL } from "~/data/gardens";
import { getAnimal, getPenCost, getPenBuildTime, getPenProduction, getPenCapacity, getAnimalBuyCost, getCullYield, getWoolSeasonMod, PEN_MAX_LEVEL, type AnimalId } from "@medieval-realm/shared/data/livestock";
import { ANIMAL_FEED, FEED_CATEGORY_ICON, FEED_CATEGORY_LABEL, FOOD_CATEGORY, isGrazer, type FeedCategory } from "~/data/animalFeed";
import type { FoodItemType } from "~/data/foods";
import { getHiveCost, getHiveBuildTime, getHoneyRate, HIVE_MAX_LEVEL, APIARY_IMAGE, APIARY } from "~/data/apiary";
import SeedIcon from "~/components/SeedIcon";
import SeasonIcon from "~/components/SeasonIcon";
import WeatherIcon from "~/components/WeatherIcon";
import StatCard from "~/components/StatCard";
import { resolveCurrentWeather, WEATHER_META } from "~/data/weather";
import { gardenWaterDemand, fieldWaterDemand, orchardWaterDemand, penWaterDemand, getWaterCap, CISTERN_ID, DELUGE_SAFE_FILL } from "~/data/water";

/** True once the settlement has a well or cistern — gates the per-plot water
 *  need lines so they don't confuse players who haven't started on water yet. */
function hasWaterInfra(buildings: { buildingId: string; level: number }[]): boolean {
  return buildings.some((b) => (b.buildingId === "well" || b.buildingId === "cistern") && b.level > 0);
}
/** Small "needs X/h water" line for a plot card. */
function WaterNeed(props: { amount: number }) {
  return (
    <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-top": "6px", "text-align": "center" }}>
      💧 needs {props.amount}/h water
    </div>
  );
}
import { getFruit, getOrchardCost, getOrchardBuildTime, getOrchardRate, getOrchardStatus, getOrchardTreeSlots, getFruitPerTreeRate, isFruitUnlocked, SAPLING_PLANT_SEASON, isOrchardActive, ORCHARD_MAX_LEVEL } from "~/data/orchards";
import { SEASON_META, HARVEST_DURATION_HOURS, type Season } from "~/data/seasons";
import { QUEST_DEFINITIONS, isQuestActive } from "~/data/quests";
import Countdown from "~/components/Countdown";
import PenManageModal from "~/components/PenManageModal";
import { UpgradeIndicator } from "~/components/UpgradeIndicator";
import Tooltip from "~/components/Tooltip";
import { formatTimeLong as formatTime } from "~/utils/format";
import type { JSX } from "solid-js";

// The fresh-plot art, shared by the unbuilt slot and empty/resting built fields.
const EMPTY_FIELD_IMAGE = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/empty_field.png";

function fieldSeasonStatus(season: string, level: number, isHarvesting: boolean): { label: string; color: string } {
  if (level === 0) return { label: "Under construction", color: "var(--accent-blue)" };
  switch (season) {
    case "spring": return { label: "🌱 Planted, growing", color: "var(--accent-green)" };
    case "summer": return { label: "☀️ Growing", color: "var(--accent-green)" };
    case "autumn":
      if (isHarvesting) return { label: "🌾 Harvesting!", color: "#d4831a" };
      return { label: "✅ Harvest gathered", color: "var(--accent-red)" };
    case "winter": return { label: "❄️ Dormant until spring", color: "var(--text-muted)" };
    default: return { label: "", color: "" };
  }
}

// ─── Shared stat-box UI ──────────────────────────────────────────
// Every Farming card speaks the same visual language: little bordered fact
// boxes (echoing the Tavern's rooms/gold boxes) so a card reads at a glance
// instead of as a wall of stacked lines. `dim` greys a row for the
// not-yet-built preview.
const STAT_BOX: JSX.CSSProperties = {
  flex: "1", padding: "10px 12px", background: "var(--bg-card)",
  // Square, framed with the delicate common frame (matches the button tiers).
  // 6px (not 5) so the stretched top/bottom hairline doesn't fall sub-pixel and
  // drop out on wide boxes — same width the tertiary button uses.
  border: "6px solid transparent",
  "border-image": "url(/images/frames/item_frame_common.png) 40 stretch",
  "border-radius": "0", "text-align": "center",
  // Fixed height so every Eats/Produces box matches across cards (built,
  // unbuilt, 1-line or 2-line content). 84px clears the tallest case (the Eats
  // box with a grazing note), so 1-line boxes pad up to match. Centered.
  "min-height": "84px", "box-sizing": "border-box",
  display: "flex", "flex-direction": "column", "justify-content": "center",
};
const STAT_LABEL: JSX.CSSProperties = {
  "font-size": "0.66rem", color: "var(--text-muted)", "text-transform": "uppercase",
  "letter-spacing": "0.6px", "margin-bottom": "3px",
};

function StatRow(props: { dim?: boolean; children: JSX.Element }) {
  return (
    <div style={{ display: "flex", gap: "8px", "margin-top": "10px", opacity: props.dim ? "0.55" : "1" }}>
      {props.children}
    </div>
  );
}
function StatBox(props: { label: string; valColor?: string; warn?: boolean; children: JSX.Element }) {
  return (
    <div style={{
      ...STAT_BOX,
      // Label pinned to the top of the box (so all card titles line up across a
      // row regardless of value height); the value fills the rest and centers.
      "justify-content": "flex-start",
      ...(props.warn ? { border: "1px solid var(--accent-red)", background: "rgba(231, 76, 60, 0.12)" } : {}),
    }}>
      <div style={STAT_LABEL}>{props.label}</div>
      <div class="stat-values" style={props.valColor ? { color: props.valColor } : undefined}>
        {props.children}
      </div>
    </div>
  );
}
/** Cull-yield line for meat animals (pigs etc.) that don't produce hourly —
 *  shows what a slaughter returns, in place of a "+0/h" that reads as broken. */
function MeatYield(props: { animal: AnimalId }) {
  const cy = () => getCullYield(props.animal);
  const extras = () => [
    cy().leather ? `+${cy().leather} hide` : null,
    cy().bone ? `+${cy().bone} bone` : null,
  ].filter(Boolean).join(" · ");
  return (
    <>
      <div style={{ "font-size": "0.9rem", color: "var(--text-secondary)" }}>🥩 raised for meat</div>
      <div style={{ "font-weight": 400, "font-size": "0.72rem", "margin-top": "3px", "line-height": 1.4 }}>
        cull → +{cy().meat} meat{extras() ? ` · ${extras()}` : ""}
      </div>
    </>
  );
}
/** Full-width single box for a one-line fact with an inline icon/number
 *  (seed store, feed upkeep, etc.). `dim` greys it for the unbuilt preview. */
function WideBox(props: { dim?: boolean; children: JSX.Element }) {
  return (
    <div style={{
      ...STAT_BOX, "margin-top": "8px", display: "flex", "flex-direction": "row", "align-items": "center",
      "justify-content": "center", gap: "6px", "flex-wrap": "wrap", opacity: props.dim ? "0.55" : "1",
    }}>
      {props.children}
    </div>
  );
}
/** Season icons, optionally with full names, joined for a stat-box value. */
function seasonList(seasons: readonly Season[], withNames: boolean): JSX.Element {
  return (
    <span style={{ display: "inline-flex", "align-items": "center", "justify-content": "center", gap: "5px", "flex-wrap": "wrap" }}>
      <For each={seasons}>
        {(s, i) => (
          <>
            <Show when={withNames && i() > 0}><span style={{ color: "var(--text-muted)" }}>/</span></Show>
            <span style={{ display: "inline-flex", "align-items": "center", gap: "3px" }}>
              <SeasonIcon season={s} size={16} />
              <Show when={withNames}>{SEASON_META[s].name}</Show>
            </span>
          </>
        )}
      </For>
    </span>
  );
}

// ─── Field Card ──────────────────────────────────────────────────

function FieldCard(props: { field: PlayerField }) {
  const { actions, state } = useGame();
  const crop = () => props.field.crop ? getCrop(props.field.crop) : null;
  const isEmpty = () => !props.field.crop && props.field.level > 0 && !props.field.upgrading;
  /** Expected yield at harvest — base yield × soil multiplier (streak penalty + rest bonus). */
  const harvestYield = () => {
    if (!crop() || props.field.level === 0) return 0;
    const base = getSeasonYield(crop()!, props.field.level);
    const mult = getSoilMultiplier(props.field.sameCropStreak, props.field.restBonus);
    // Harsh weather (heat waves, downpours) thins the standing crop; the accrued
    // loss scales the harvest down.
    const weather = 1 - (props.field.weatherLoss ?? 0);
    return Math.max(0, Math.floor(base * mult * weather));
  };
  /** Preview yield for a candidate crop, applied via what the streak WOULD become. */
  const previewYield = (candidateCropId: CropId) => {
    const c = getCrop(candidateCropId);
    const base = getSeasonYield(c, props.field.level);
    // If candidate matches lastCrop, streak grows by 1; else resets to 0.
    const nextStreak = props.field.lastCrop === candidateCropId ? props.field.sameCropStreak + 1 : 0;
    const mult = getSoilMultiplier(nextStreak, props.field.restBonus);
    return Math.max(0, Math.floor(base * mult));
  };
  /** Hay (winter fodder) this field's harvest is expected to leave behind. */
  const harvestHay = () => crop() ? getHayFromHarvest(crop()!, harvestYield()) : 0;
  // Harvest arrives as a burst over the first HARVEST_DURATION_HOURS of autumn.
  // These drive the "currently harvesting" readout: the per-hour rate and how
  // much of the expected total has come in so far.
  const harvestFrac = () => Math.min(1, Math.max(0, state.seasonElapsed / HARVEST_DURATION_HOURS));
  const harvestRate = () => harvestYield() > 0 ? Math.max(1, Math.round(harvestYield() / HARVEST_DURATION_HOURS)) : 0;
  const harvested = () => Math.min(harvestYield(), Math.round(harvestYield() * harvestFrac()));
  const previewHay = (candidateCropId: CropId) => getHayFromHarvest(getCrop(candidateCropId), previewYield(candidateCropId));
  const soilStatus = () => getSoilStatus(props.field.sameCropStreak);
  /** Effective max level — gated by the Town Hall level just like buildings.
   *  FIELD_MAX_LEVEL remains the absolute ceiling. */
  const effectiveMax = () => Math.min(actions.getTownHallLevel(), FIELD_MAX_LEVEL);
  const upgradeCost = () => props.field.level < FIELD_MAX_LEVEL ? getFieldCost(props.field.level) : null;
  const canUpgrade = () => {
    if (props.field.crop !== null) return false; // can only upgrade empty/fallow fields
    if (props.field.upgrading || props.field.level >= effectiveMax()) return false;
    const cost = upgradeCost();
    return cost ? state.resources.wood >= cost.wood && state.resources.stone >= cost.stone : false;
  };
  /** Human-readable reason the upgrade button is disabled. Shown on hover/tooltip. */
  const upgradeBlockedReason = () => {
    if (props.field.level >= FIELD_MAX_LEVEL) return "Max level reached";
    if (props.field.level >= effectiveMax()) return `Upgrade Town Hall to lvl ${actions.getTownHallLevel() + 1} to raise this cap`;
    if (props.field.upgrading) return "Already upgrading…";
    if (props.field.crop !== null) return "Can't upgrade a planted field";
    const cost = upgradeCost();
    if (cost && (state.resources.wood < cost.wood || state.resources.stone < cost.stone)) return "Not enough resources";
    return "";
  };
  const isCurrentlyHarvesting = () => actions.isHarvesting();
  const seasonStatus = () => {
    if (isEmpty()) {
      // In spring the crop picker replaces the status line — no need to also say "Ready to plant".
      if (state.season === "spring") return null;
      if (state.season === "winter") return { label: "❄️ Dormant, time to upgrade", color: "#a5d8ff" };
      return { label: "Resting, ready for next spring", color: "#9b59b6" };
    }
    return fieldSeasonStatus(state.season, props.field.level, isCurrentlyHarvesting());
  };

  // Banner image: only shown when there's an active crop. We deliberately do
  // NOT use lastCrop here — an empty field showing a wheat banner looks
  // identical to a planted one, hiding the crop picker / upgrade button. The
  // rotation memory lives in the soil-status pill below ("Depleted from wheat"),
  // which is more informative anyway.
  const bannerImage = () => crop()?.image;
  // Empty / resting / dormant / building fields have no crop banner. Rather than
  // leave them as a bare text card, fall back to the fresh-plot image (the same
  // one the unbuilt slot uses) so every field card carries a banner.
  const displayImage = () => bannerImage() ?? EMPTY_FIELD_IMAGE;

  const cardTitle = () => {
    if (crop()) return `${crop()!.name} Field`;
    if (state.season === "spring" && !props.field.upgrading && props.field.level > 0) return "Choose a crop";
    if (state.season === "winter" && props.field.level > 0) return "Dormant Field";
    return "Empty Field";
  };

  return (
    <div
      class="building-card"
      classList={{
        upgrading: props.field.upgrading,
        harvesting: state.season === "autumn" && props.field.level > 0 && !!crop(),
      }}
      style={{ cursor: "default" }}
    >
      {/* Banner image — title + level sit in the gradient overlay at the bottom,
          matching the mission/building card visual language. */}
      <Show when={displayImage()}>
        <div class="building-card-image">
          <img src={displayImage()} alt="" loading="lazy" />
          <div class="building-card-image-overlay" style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end" }}>
            <div>
              <div class="building-card-title">{cardTitle()}</div>
              <div class="building-card-level">
                {props.field.level === 0 ? "Building..." : `Level ${props.field.level} / ${effectiveMax()}`}
              </div>
            </div>
            <Show when={isEmpty() && !props.field.upgrading && props.field.level < FIELD_MAX_LEVEL && upgradeCost()}>
              <UpgradeIndicator
                level={props.field.level}
                canAct={canUpgrade()}
                costTip={`🪵 ${upgradeCost()!.wood} 🪨 ${upgradeCost()!.stone} · ${formatTime(getFieldBuildTime(props.field.level))}`}
                blockedReason={upgradeBlockedReason()}
                onClick={() => actions.upgradeField(props.field.id)}
                inOverlay
              />
            </Show>
          </div>
        </div>
      </Show>
      <Show when={props.field.upgrading && props.field.upgradeRemaining}>
        <div class="field-card-status upgrading-status">
          {props.field.level === 0 ? "Preparing field" : "Upgrading"}: <Countdown remainingSeconds={props.field.upgradeRemaining!} />
        </div>
      </Show>
      <Show when={!props.field.upgrading && props.field.level > 0}>
        <Show when={seasonStatus()}>
          {(s) => <div class="field-card-status" style={{ color: s().color }}>{s().label}</div>}
        </Show>
        {/* Season hint — green when it's spring (can plant), red otherwise.
            Only shown on empty fields since planted ones speak for themselves. */}
        <Show when={isEmpty()}>
          <div style={{
            "font-size": "0.72rem",
            color: state.season === "spring" ? "var(--accent-green)" : "var(--accent-red)",
            "font-weight": 600,
            "margin-top": "2px",
          }}>
            {state.season === "spring" ? "🌱 Fields can be planted now (spring)" : "Fields can only be planted in spring"}
          </div>
        </Show>
        {/* Planted → Harvest + Soil boxes at a glance. Empty-with-history → keep
            the soil pill (the spring picker + hints own the empty states, and
            fields always plant in spring / harvest in autumn so a season box
            would say the same thing on every card). */}
        <Show when={crop()} fallback={
          // Always show a soil line for empty fields — never-planted ground reads
          // "Fresh soil" so the crop pickers below line up across every field.
          <div style={{
            "font-size": "0.7rem",
            color: props.field.lastCrop !== null ? soilStatus().color : "var(--accent-green)",
            "margin-top": "2px",
            display: "flex", gap: "6px", "align-items": "center", "flex-wrap": "wrap",
          }}>
            <Show when={props.field.lastCrop !== null} fallback={<span>🌾 Fresh soil</span>}>
              <span>🌾 {soilStatus().label}</span>
              <Show when={props.field.restBonus}>
                <span style={{ color: "var(--accent-green)" }}>· 🌿 Rested (+15% next harvest)</span>
              </Show>
            </Show>
          </div>
        }>
          <StatRow>
            {/* Once planted, the soil call is made — what matters now is the
                water the crop draws. Soil status still drives the empty-field
                line and the crop picker before sowing. */}
            <StatBox label="Water">💧 {fieldWaterDemand(props.field.level)}/h</StatBox>
            <StatBox label={isCurrentlyHarvesting() ? "Harvesting" : "Expected harvest"}>
              <Show
                when={isCurrentlyHarvesting()}
                fallback={
                  <>
                    <div>🍂 ~{harvestYield()} {crop()!.isFood ? "food" : "fiber"}</div>
                    <Show when={crop()!.isFood && harvestHay() > 0}>
                      <div style={{ "font-size": "0.72rem", color: "var(--accent-gold)", "margin-top": "2px", "font-weight": 400 }}>
                        🌾 ~{harvestHay()} hay
                      </div>
                    </Show>
                  </>
                }
              >
                {/* Harvest is coming in now: the live per-hour rate, with how much
                    of the expected total is already gathered. */}
                <div style={{ "font-size": "1.15rem", color: "var(--accent-green)" }}>+{harvestRate()}/h {crop()!.isFood ? "food" : "fiber"}</div>
                <div style={{ "font-weight": 400, "font-size": "0.68rem", "margin-top": "2px", color: "var(--text-muted)" }}>
                  {harvested()} / {harvestYield()} gathered
                </div>
              </Show>
            </StatBox>
          </StatRow>
        </Show>
        {/* Harsh weather is thinning the crop — surfaced so the falling expected
            harvest reads as the weather, not a bug. */}
        <Show when={crop() && (props.field.weatherLoss ?? 0) > 0.005}>
          <div style={{ "font-size": "0.72rem", color: "var(--accent-red)", "margin-top": "4px", "text-align": "center" }}>
            🌦️ {Math.round((props.field.weatherLoss ?? 0) * 100)}% of the crop lost to harsh weather
          </div>
        </Show>
        {/* Hay rick left on the field after harvest — the flock's winter fodder,
            drawn down through winter and cleared at spring replant. */}
        <Show when={!crop() && (props.field.hay ?? 0) > 0}>
          <div style={{ "font-size": "0.72rem", color: "var(--accent-gold)", "margin-top": "4px", display: "flex", gap: "6px", "align-items": "center" }}>
            <span>🌾 Hay stored: {Math.round(props.field.hay!)}</span>
            <span style={{ color: "var(--text-muted)" }}>· winter fodder</span>
          </div>
        </Show>
      </Show>

      {/* Plant picker — spring only, empty fields. Always-visible 3-tile grid,
          no gating button. Click a tile to plant immediately. */}
      {/* Plant picker — banner-style: negative horizontal margins take the
          tiles edge-to-edge with the card, tiles separated by a thin vertical
          divider, no colored per-tile border (the accent tint lives in the
          yield text instead). */}
      <Show when={isEmpty() && state.season === "spring"}>
        <div style={{
          "margin": "8px -16px 0",
          display: "grid",
          "grid-template-columns": "1fr 1fr 1fr",
          gap: "0",
          "border-top": "1px solid var(--border-color)",
          "border-bottom": "1px solid var(--border-color)",
        }}>
          <For each={CROPS}>
            {(c, i) => {
              const preview = () => previewYield(c.id);
              const wouldDeplete = () => props.field.lastCrop === c.id;
              const accent = () => wouldDeplete() ? "var(--accent-gold)" : "var(--accent-green)";
              return (
                <Tooltip block text={(wouldDeplete()
                  ? `Same crop as last season, soil depletes. Yield: ${preview()} ${c.isFood ? "food" : "fiber"}.`
                  : `Rotating to ${c.name}, fresh soil. Yield: ${preview()} ${c.isFood ? "food" : "fiber"}.`)
                  + (c.isFood && previewHay(c.id) > 0 ? ` Leaves ~${previewHay(c.id)} hay to fodder the flock through winter.` : "")}>
                <button
                  class="crop-picker-tile"
                  onClick={() => actions.plantField(props.field.id, c.id)}
                  style={{
                    width: "100%",
                    height: "160px",
                    padding: 0,
                    border: "none",
                    "border-right": i() < CROPS.length - 1 ? "1px solid var(--border-color)" : "none",
                    "border-radius": 0,
                    overflow: "hidden",
                    cursor: "pointer",
                    "background-image": c.image ? `url(${c.image})` : undefined,
                    "background-size": "cover",
                    "background-position": "center",
                    background: c.image ? undefined : "var(--bg-secondary)",
                  }}
                >
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)",
                  }} />
                  <div style={{
                    position: "absolute", top: "6px", left: "8px", right: "8px",
                    "font-size": "0.85rem", "font-weight": "bold",
                    color: "white", "text-shadow": "0 1px 2px rgba(0,0,0,0.8)",
                    "text-align": "left",
                    "white-space": "nowrap",
                    overflow: "hidden",
                    "text-overflow": "ellipsis",
                  }}>
                    {c.icon} {c.name}
                  </div>
                  <div style={{
                    position: "absolute", bottom: "6px", left: "8px", right: "8px",
                    "text-align": "left",
                  }}>
                    <div style={{
                      "font-size": "0.9rem", color: accent(), "font-weight": "bold",
                      "text-shadow": "0 1px 2px rgba(0,0,0,0.8)",
                      "white-space": "nowrap",
                    }}>
                      → {preview()} {c.isFood ? "🍞" : "🧵"}
                      <Show when={c.isFood && previewHay(c.id) > 0}>
                        <span style={{ color: "var(--accent-gold)", "font-weight": 600 }}> · {previewHay(c.id)} 🌾</span>
                      </Show>
                    </div>
                    <div style={{
                      "font-size": "0.68rem",
                      color: "white",
                      opacity: 0.85,
                      "text-shadow": "0 1px 2px rgba(0,0,0,0.8)",
                      "margin-top": "2px",
                      // Allow the reason to wrap to two lines if needed — cropping
                      // with ellipsis (as the yield line does) cut off meaningful words.
                      "line-height": "1.3",
                    }}>
                      {wouldDeplete() ? "Same as last, depletes" : "Rotation, fresh soil"}
                    </div>
                  </div>
                </button>
                </Tooltip>
              );
            }}
          </For>
        </div>
        {/* Level readout under the picker — only shown when there's no banner
            image. Every field now carries a banner (crop or fresh-plot), so the
            level lives on the overlay and this row is redundant. */}
        <Show when={!displayImage()}>
          <div class="building-card-level" style={{ "margin-top": "8px" }}>
            {props.field.level === 0 ? "Building..." : `Level ${props.field.level} / ${effectiveMax()}`}
          </div>
        </Show>
      </Show>

    </div>
  );
}

// ─── Empty Field Slot ──────────────────────────────────────────
// A visible placeholder for each of the MAX_FIELDS plots that haven't been
// built yet. Makes the 3-field cap discoverable at a glance and puts the
// build cost right where the field will eventually live.

/**
 * Empty plot placeholder. The whole card is the click target for building —
 * no separate button. An idle "Click to build" hint sits in place of where a
 * banner/content would be, and the hint brightens on hover to signal
 * interactivity. Disabled state shows why (not enough resources).
 */
function EmptyFieldSlot(props: { canBuild: boolean; isWinter: boolean; onBuild: () => void }) {
  const { state } = useGame();
  const cost = getFieldCost(0);
  const time = getFieldBuildTime(0);
  const blockedReason = () => !props.canBuild ? "Not enough resources" : "";
  const isSpring = () => state.season === "spring";
  return (
    <div class="building-card unbuilt-farm-card" style={{ cursor: "default", position: "relative" }}>
      <div class="building-card-image">
        <img
          src={EMPTY_FIELD_IMAGE}
          alt=""
          loading="lazy"
          style={{ filter: "brightness(0.55) saturate(0.6)" }}
        />
        <div class="building-card-image-overlay" style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end" }}>
          <div>
            <div class="building-card-title">Unbuilt plot</div>
            <div class="building-card-level not-built">Not built yet</div>
          </div>
          <UpgradeIndicator
            level={0}
            canAct={props.canBuild}
            costTip={`🪵 ${cost.wood} 🪨 ${cost.stone} · ${formatTime(time)}`}
            blockedReason={blockedReason()}
            onClick={props.onBuild}
            inOverlay
          />
        </div>
      </div>
      <div class="building-card-desc">
        A fresh plot, waiting for a crop.{" "}
        <span style={{ color: isSpring() ? "var(--accent-green)" : "var(--accent-red)", "font-weight": 600 }}>
          {isSpring() ? "🌱 Fields are planted in spring, plant now!" : "Fields are planted in spring."}
        </span>
      </div>
    </div>
  );
}

// ─── Garden Card (uses FarmCard) ────────────────────────────────

function GardenCard(props: { garden: PlayerGarden }) {
  const { actions, state } = useGame();
  const veggie = () => getVeggie(props.garden.veggie);
  const effectiveMax = () => Math.min(actions.getTownHallLevel(), GARDEN_MAX_LEVEL);

  // Specialty crops stay hidden as a "???" mystery slot until the player
  // acquires their seed (a quest/mission reward or the market). Only unbuilt
  // slots hide — once a garden is somehow built it always shows.
  const locked = () =>
    props.garden.level === 0 &&
    !props.garden.upgrading &&
    !isSeedUnlocked(veggie(), state.seedsUnlocked);

  // ── Unbuilt (level 0) path: dashed placeholder, click to build. Same
  //    pattern as EmptyFieldSlot but specific to a pre-attributed veggie. ──
  const isUnbuilt = () => props.garden.level === 0 && !props.garden.upgrading;
  const buildCost = () => getGardenCost(0);
  const canBuild = () => {
    const c = buildCost();
    // Don't let players build a garden they can't sow yet — no point raising a
    // plot out of its planting season (the build is instant-ish, so waiting for
    // the season costs nothing).
    return inPlantSeason() && state.resources.wood >= c.wood && state.resources.stone >= c.stone;
  };

  // ── Built path: level >= 1. Plant/produce cycle driven by the veggie. ──
  // "Planted" = the same source of truth the SIM uses (production + water draw
  // both key off `plantedYear != null`; the annual reset in advanceSeason is what
  // clears it when a new cycle is due). We deliberately do NOT compare to
  // state.year here: in a save that syncs the server's global year on top of
  // dev's local season ticks, state.year can drift from the year stamped at sow
  // time, which made the card read "not planted" while the plot was still
  // producing. Trusting plantedYear keeps the card and the sim in lockstep.
  const planted = () => props.garden.plantedYear != null;
  const inPlantSeason = () => canPlantVeggie(veggie(), state.season);
  const producing = () => planted() && isVeggieProducing(veggie(), state.season);
  // Seed-driven sowing: the plot holds `capacity` seeds; sow up to that from
  // your stock. Yield scales with how full it is.
  const seedStock = () => state.seeds?.[props.garden.veggie] ?? 0;
  const capacity = () => getSeedCapacity(Math.max(1, props.garden.level));
  // Seeds already sown this cycle (0 if not planted this year), and the room
  // still left to fill — so the player can top up a partially-sown plot (e.g.
  // after an upgrade raised the capacity, or once more seed comes in).
  // Living-plant model: seedsPlanted = seeds committed this cycle; sprouted = how
  // many came up (germination); plantsAlive = how many still stand (weather /
  // deficit deaths decrement it). Empty slots (never sprouted OR died) =
  // capacity − plantsAlive, re-sowable during the plant season.
  const sownThisYear = () => planted() ? props.garden.seedsPlanted : 0;
  const sprouted = () => planted() ? (props.garden.sprouted ?? 0) : 0;
  const alivePlants = () => planted() ? (props.garden.plantsAlive ?? 0) : 0;
  // Plants at a full sow — previews the water draw before anything is sown.
  const fullSprouted = () => getSproutedPlants(veggie(), capacity());
  const germPct = () => Math.round(getGerminationRate(veggie()) * 100);
  const roomLeft = () => capacity() - alivePlants();
  const sowAmount = () => Math.min(seedStock(), roomLeft()); // what we'd sow right now
  // Current /h from the living plants; the in-season reference is a full plot.
  const liveRate = () => getLiveGardenRate(Math.max(1, props.garden.level), alivePlants());
  const fullRate = () => getLiveGardenRate(Math.max(1, props.garden.level), capacity());
  const canPlant = () =>
    props.garden.level > 0 &&
    !props.garden.upgrading &&
    inPlantSeason() &&
    roomLeft() > 0 &&
    seedStock() > 0;
  const plantBlockedReason = () => {
    if (props.garden.level === 0) return "Build the garden first";
    if (props.garden.upgrading) return "Garden is being built";
    if (!inPlantSeason()) return `${veggie().name} are planted in ${veggie().plantSeasons.join(", ")}`;
    if (roomLeft() <= 0) return "Sown to capacity this cycle";
    if (seedStock() <= 0) return `No ${veggie().name.toLowerCase()} seed in store. A harvested plot saves seed for next year`;
    return "";
  };

  const upgradeCost = () => props.garden.level < GARDEN_MAX_LEVEL ? getGardenCost(props.garden.level) : null;
  const canUpgrade = () => {
    if (props.garden.upgrading || props.garden.level >= GARDEN_MAX_LEVEL) return false;
    if (props.garden.level >= effectiveMax()) return false;
    const c = upgradeCost();
    return c ? state.resources.wood >= c.wood && state.resources.stone >= c.stone : false;
  };
  const upgradeBlockedReason = () => {
    if (props.garden.level >= GARDEN_MAX_LEVEL) return "Max level reached";
    if (props.garden.level >= effectiveMax()) return `Upgrade Town Hall to lvl ${actions.getTownHallLevel() + 1}`;
    if (props.garden.upgrading) return "Already upgrading…";
    const c = upgradeCost();
    if (c && (state.resources.wood < c.wood || state.resources.stone < c.stone)) return "Not enough resources";
    return "";
  };

  // ── Status line ─────────────────────────────────────────────────────
  const statusLine = (): { label: string; color: string } | null => {
    // Sown, but nothing is standing — never germinated, or the crop was lost to
    // weather/deficit. A clear amber warning, not a green "Producing +0/h".
    if (planted() && alivePlants() === 0) {
      return inPlantSeason()
        ? { label: "Nothing came up — sow again", color: "#d4831a" }
        : { label: `No crop this season — sow in ${veggie().plantSeasons.join(", ")}`, color: "#d4831a" };
    }
    if (producing()) {
      return { label: `Producing: +${liveRate()}/h ${veggie().name.toLowerCase()}`, color: "var(--accent-green)" };
    }
    if (planted() && !isVeggieProducing(veggie(), state.season)) {
      return { label: "Planted, waiting to produce", color: "var(--text-secondary)" };
    }
    if (props.garden.level > 0 && inPlantSeason() && !planted()) {
      return { label: `Time to plant: ${sowAmount()}/${capacity()} seed ready`, color: "var(--accent-gold)" };
    }
    if (props.garden.level > 0) return { label: `Not planted, sow in ${veggie().plantSeasons.join(", ")}`, color: "var(--text-muted)" };
    return null;
  };


  const showUpgradeIndicator = () =>
    !props.garden.upgrading &&
    props.garden.level < GARDEN_MAX_LEVEL;
  const indicatorCostTip = () => {
    const c = props.garden.level === 0 ? buildCost() : upgradeCost();
    return c ? `🪵 ${c.wood} 🪨 ${c.stone} · ${formatTime(getGardenBuildTime(props.garden.level))}` : "";
  };
  const indicatorBlockedReason = () => props.garden.level === 0
    ? (!inPlantSeason()
        ? `Can't sow ${veggie().name.toLowerCase()} this season, build when it's ${veggie().plantSeasons.join(" or ")}`
        : (canBuild() ? "" : "Not enough resources"))
    : upgradeBlockedReason();
  const indicatorCanAct = () => props.garden.level === 0 ? canBuild() : canUpgrade();

  // Season fact-boxes + seed-store box, shared by the built and unbuilt cards so
  // they can't drift. `dim` greys them out for the not-yet-built preview.
  const seasonBoxes = (rate: number, dim: boolean, planted = false) => (
    <StatRow dim={dim}>
      {/* Water draw — always shown so the cost is visible BEFORE sowing: the
          current draw once planted, else the draw at a full sow. (The "when to
          sow" nudge lives in the sow box / the unbuilt preview line below.) */}
      <StatBox label="Water">💧 {gardenWaterDemand(veggie().id, planted ? alivePlants() : fullSprouted())}/h</StatBox>
      <StatBox label="Produces">
        {seasonList(veggie().produceSeasons, false)}
        {(() => {
          // Built card: the current rate leads (green only while actually
          // producing), with the full-plot in-season potential as a muted
          // reference so an out-of-season / thinned plot reads "0 now, 9 in season".
          // Unbuilt preview (dim): just the potential, greyed.
          const cur = dim ? rate : (producing() ? liveRate() : 0);
          const potential = dim ? rate : fullRate();
          return (
            <>
              <span style={{ color: cur > 0 && !dim ? "var(--accent-green)" : "var(--text-muted)", "margin-left": "6px" }}>+{cur}/h</span>
              <Show when={!dim && cur < potential && potential > 0}>
                <div style={{ "font-weight": 400, "font-size": "0.68rem", "margin-top": "2px", color: "var(--text-muted)" }}>+{potential}/h in season</div>
              </Show>
            </>
          );
        })()}
      </StatBox>
    </StatRow>
  );
  const seedBoxEl = (cap: number, dim: boolean) => (
    <WideBox dim={dim}>
      <SeedIcon id={veggie().id} size={16} />
      <span style={{ "font-size": "0.8rem", color: "var(--text-secondary)" }}>
        <b style={{ color: "var(--text-primary)" }}>{sownThisYear()}/{cap}</b> sown
        {" · "}
        <b style={{ color: "var(--text-primary)" }}>{seedStock()}</b> seed in store
      </span>
    </WideBox>
  );

  return (
    <Show when={!locked()} fallback={
      <div class="building-card unbuilt-farm-card garden-locked-card" style={{ cursor: "default", position: "relative", "text-align": "center", opacity: 0.85 }}>
        <div class="building-card-image">
          <img
            src="https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/empty_garden.png"
            alt=""
            loading="lazy"
            style={{ filter: "grayscale(0.7) brightness(0.55)" }}
          />
        </div>
        <div class="building-card-title" style={{ "letter-spacing": "0.15em" }}>??? Garden</div>
        <div class="building-card-desc" style={{ "margin-top": "6px", color: "var(--text-muted)", "font-style": "italic" }}>
          A patch of bare earth, waiting on a seed we do not have yet. Some crops must be found or brought home before they can be sown here.
        </div>
      </div>
    }>
    <Show when={!isUnbuilt()} fallback={
      <div class="building-card unbuilt-farm-card" style={{ cursor: "default", position: "relative" }}>
        <Show when={veggie().image} fallback={
          <>
            <UpgradeIndicator
              level={0}
              canAct={canBuild()}
              costTip={indicatorCostTip()}
              blockedReason={indicatorBlockedReason()}
              onClick={() => actions.upgradeGarden(props.garden.id)}
            />
            <div style={{ "margin-bottom": "4px" }}>
              <div class="building-card-title">{veggie().name} Garden</div>
              <div class="building-card-level not-built">Not built yet</div>
            </div>
          </>
        }>
          <div class="building-card-image">
            {/* Dim the banner so unbuilt state reads as "placeholder" without losing the art */}
            <img src={veggie().image} alt="" loading="lazy" style={{ filter: "brightness(0.55) saturate(0.6)" }} />
            <div class="building-card-image-overlay" style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end" }}>
              <div>
                <div class="building-card-title">{veggie().name} Garden</div>
                <div class="building-card-level not-built">Not built yet</div>
              </div>
              <UpgradeIndicator
                level={0}
                canAct={canBuild()}
                costTip={indicatorCostTip()}
                blockedReason={indicatorBlockedReason()}
                onClick={() => actions.upgradeGarden(props.garden.id)}
                inOverlay
              />
            </div>
          </div>
        </Show>

        <div class="building-card-desc" style={{ flex: "0 0 auto", "min-height": "76px" }}>{veggie().description}</div>
        {/* Same stat boxes as a built plot, greyed — previews the sow/produce
            seasons and the yield-and-capacity you'd get once it's raised. */}
        {seasonBoxes(getEffectiveGardenRate(veggie(), 1, getSeedCapacity(1)), true)}
        {seedBoxEl(getSeedCapacity(1), true)}
        {/* When to sow — kept on the unbuilt preview (the built card carries this
            in its sow box). Green when it's the season to build and sow. */}
        <div style={{
          display: "flex", "align-items": "center", "justify-content": "center", gap: "5px",
          "font-size": "0.78rem", "font-weight": 600, "margin-top": "8px",
          color: inPlantSeason() ? "var(--accent-green)" : "var(--text-muted)",
        }}>
          <span>Sow in</span>{seasonList(veggie().plantSeasons, true)}
        </div>
      </div>
    }>
      <div class="building-card" classList={{ upgrading: props.garden.upgrading }} style={{ cursor: "default", position: "relative" }}>
        <Show when={veggie().image} fallback={
          <>
            <Show when={showUpgradeIndicator()}>
              <UpgradeIndicator
                level={props.garden.level}
                canAct={indicatorCanAct()}
                costTip={indicatorCostTip()}
                blockedReason={indicatorBlockedReason()}
                onClick={() => actions.upgradeGarden(props.garden.id)}
              />
            </Show>
            <div style={{ "margin-bottom": "4px" }}>
              <div class="building-card-title">{veggie().name} Garden</div>
              <div class="building-card-level">Level {props.garden.level} / {effectiveMax()}</div>
            </div>
          </>
        }>
          <div class="building-card-image">
            <img src={veggie().image} alt="" loading="lazy" />
            <div class="building-card-image-overlay" style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end" }}>
              <div>
                <div class="building-card-title">{veggie().name} Garden</div>
                <div class="building-card-level">Level {props.garden.level} / {effectiveMax()}</div>
              </div>
              <Show when={showUpgradeIndicator()}>
                <UpgradeIndicator
                  level={props.garden.level}
                  canAct={indicatorCanAct()}
                  costTip={indicatorCostTip()}
                  blockedReason={indicatorBlockedReason()}
                  onClick={() => actions.upgradeGarden(props.garden.id)}
                  inOverlay
                />
              </Show>
            </div>
          </div>
        </Show>

        <div class="building-card-desc" style={{ flex: "0 0 auto", "min-height": "76px" }}>{veggie().description}</div>

        <Show when={props.garden.upgrading && props.garden.upgradeRemaining}>
          <div class="building-card-upgrading">
            {props.garden.level === 0 ? "Preparing garden" : "Upgrading"}: <Countdown remainingSeconds={props.garden.upgradeRemaining!} />
          </div>
        </Show>

        {/* ── The two season facts, each in its own box so they breathe ── */}
        <Show when={!props.garden.upgrading}>
          {seasonBoxes(fullRate(), false, planted())}
        </Show>

        {/* ── Seed store + Sow button in one framed box (echoes the pen's flock
            box): the seed tally on top, a season nudge, and the Sow action all
            live together so the card reads like the livestock cards. ── */}
        <Show when={!props.garden.upgrading && props.garden.level > 0}>
          <div style={{
            ...STAT_BOX, "margin-top": "8px",
            "flex-direction": "column", "align-items": "stretch", "justify-content": "flex-start",
            "text-align": "center", gap: "10px", "min-height": "auto",
          }}>
            {/* Plant tally — how many sown seeds came up (germination), and how
                many are still alive. A death drops the "alive" count (and turns it
                amber), distinct from a seed that never sprouted. Only while a crop
                stands this cycle. */}
            <Show when={planted() && sprouted() > 0}>
              <Tooltip block text={
                "Of the seed you sowed, some came up ('sprouted'); of those, some still stand ('alive'). "
                + "Plants can die between waterings: a heat wave scorches them even in watered beds, a downpour "
                + "drowns them when the cistern backs up, and a long dry spell wilts them once the reserve runs low. "
                + "The hardiest plant always pulls through, so you can re-sow the empty slots when the sow season comes round."
              }>
                <div style={{ display: "flex", "align-items": "center", "justify-content": "center", gap: "6px", "font-size": "0.8rem", color: "var(--text-secondary)" }}>
                  <SeedIcon id={veggie().id} size={16} />
                  <span>
                    <b style={{ color: "var(--text-primary)" }}>{sprouted()}/{sownThisYear()}</b> sprouted
                    {" · "}
                    <b style={{ color: alivePlants() < sprouted() ? "#d4831a" : "var(--text-primary)" }}>{alivePlants()}/{sprouted()}</b> alive
                  </span>
                </div>
              </Tooltip>
            </Show>
            {/* Season nudge (e.g. "Time to plant", "Producing +N/h"). */}
            <Show when={statusLine()}>
              {(s) => <div style={{ color: s().color, "font-size": "0.78rem", "font-weight": 600 }}>{s().label}</div>}
            </Show>
            {/* Out of the sow season: tell the player WHEN to sow instead of a
                dead button (mirrors the unbuilt card's nudge). */}
            <Show when={!inPlantSeason()}>
              <div style={{ display: "flex", "align-items": "center", "justify-content": "center", gap: "5px", "font-size": "0.78rem", color: "var(--text-muted)" }}>
                <span>Sow in</span>{seasonList(veggie().plantSeasons, true)}
              </div>
            </Show>
            {/* In the sow season with empty slots to fill (never-sprouted or died):
                an active Sow button when you have seed, else a "get seed" hint —
                never a dead "No seed to sow" button. */}
            <Show when={inPlantSeason() && roomLeft() > 0}>
              <Show
                when={seedStock() > 0}
                fallback={
                  <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "font-style": "italic" }}>
                    No {veggie().name.toLowerCase()} seed in store — a harvested plot saves seed for next year.
                  </div>
                }
              >
                <div style={{ "font-size": "0.72rem", color: "var(--text-muted)" }}>
                  <b style={{ color: "var(--text-primary)" }}>{seedStock()}</b> {veggie().name.toLowerCase()} seed in store · {germPct()}% take
                </div>
                <Tooltip block text={canPlant() ? "" : plantBlockedReason()}>
                  <button
                    class="btn-primary"
                    style={{ width: "100%", "justify-content": "center" }}
                    disabled={!canPlant()}
                    onClick={() => actions.plantGarden(props.garden.id)}
                  >
                    {alivePlants() > 0
                      ? `Sow ${sowAmount()} more into the empty rows`
                      : `Sow ${sowAmount()} ${veggie().name.toLowerCase()} seed${sowAmount() < capacity() ? ` (plot holds ${capacity()})` : ""}`}
                  </button>
                </Tooltip>
              </Show>
            </Show>
          </div>
        </Show>
      </div>
    </Show>
    </Show>
  );
}

// ─── Pen Card ────────────────────────────────────────────────────

function PenCard(props: { pen: PlayerPen }) {
  const { actions, state } = useGame();
  const [manageOpen, setManageOpen] = createSignal(false);
  const animal = () => getAnimal(props.pen.animal);
  const effectiveMax = () => Math.min(actions.getTownHallLevel(), PEN_MAX_LEVEL);

  const isUnbuilt = () => props.pen.level === 0 && !props.pen.upgrading;
  // Shepherd brings her own flock — first sheep pen is gold-free.
  const isFirstSheep = () => props.pen.animal === "sheep" && props.pen.level === 0;
  const buildCost = () => {
    const c = getPenCost(0);
    return isFirstSheep() ? { ...c, gold: 0 } : c;
  };
  const canBuild = () => {
    const c = buildCost();
    return state.resources.wood >= c.wood && state.resources.stone >= c.stone && state.resources.gold >= c.gold;
  };
  const buildBlockedReason = () => {
    const c = buildCost();
    const missing: string[] = [];
    if (state.resources.wood < c.wood) missing.push(`🪵 ${c.wood - Math.floor(state.resources.wood)} more wood`);
    if (state.resources.stone < c.stone) missing.push(`🪨 ${c.stone - Math.floor(state.resources.stone)} more stone`);
    if (state.resources.gold < c.gold) missing.push(`🪙 ${c.gold - Math.floor(state.resources.gold)} more gold`);
    return missing.length ? `Need ${missing.join(", ")}` : "";
  };

  const prod = () => props.pen.level > 0 ? getPenProduction(animal(), props.pen.count) : { produced: 0, consumed: 0, secondary: undefined as any };
  // Feed model: grazers (sheep/goats) live off free wild grass spring→autumn.
  // In winter the grass is gone and they eat the hay ricked on the fields at
  // harvest (then the larder, then starve). Non-grazers always eat the larder.
  const grazes = () => isGrazer(props.pen.animal);
  const isWinter = () => state.season === "winter";
  const onPasture = () => grazes() && !isWinter();          // fully fed by wild grass
  const hayStored = () => state.fields.reduce((sum, f) => sum + (f.hay ?? 0), 0);

  /** Does the pantry have any of this feed category in stock right now? */
  const categoryHasFood = (cat: FeedCategory): boolean => {
    const foods = state.foods ?? {} as Record<FoodItemType, number>;
    for (const [food, c] of Object.entries(FOOD_CATEGORY)) {
      if (c === cat && (foods[food as FoodItemType] ?? 0) > 0) return true;
    }
    return false;
  };

  const upgradeCost = () => props.pen.level < PEN_MAX_LEVEL ? getPenCost(props.pen.level) : null;
  const canUpgrade = () => {
    if (props.pen.upgrading || props.pen.level >= PEN_MAX_LEVEL) return false;
    if (props.pen.level >= effectiveMax()) return false;
    const c = upgradeCost();
    return c ? state.resources.wood >= c.wood && state.resources.stone >= c.stone && state.resources.gold >= c.gold : false;
  };
  const upgradeBlockedReason = () => {
    if (props.pen.level >= PEN_MAX_LEVEL) return "Max level reached";
    if (props.pen.level >= effectiveMax()) return `Upgrade Town Hall to lvl ${actions.getTownHallLevel() + 1}`;
    if (props.pen.upgrading) return "Already upgrading…";
    const c = upgradeCost();
    if (!c) return "";
    const missing: string[] = [];
    if (state.resources.wood < c.wood) missing.push(`🪵 ${c.wood - Math.floor(state.resources.wood)} more wood`);
    if (state.resources.stone < c.stone) missing.push(`🪨 ${c.stone - Math.floor(state.resources.stone)} more stone`);
    if (state.resources.gold < c.gold) missing.push(`🪙 ${c.gold - Math.floor(state.resources.gold)} more gold`);
    return missing.length ? `Need ${missing.join(", ")}` : "";
  };

  const showUpgradeIndicator = () =>
    !props.pen.upgrading &&
    props.pen.level < PEN_MAX_LEVEL;
  const indicatorCostTip = () => {
    const c = props.pen.level === 0 ? buildCost() : upgradeCost();
    if (!c) return "";
    const goldPart = c.gold > 0 ? `🪙 ${c.gold}` : "🪙 free!";
    return `🪵 ${c.wood} 🪨 ${c.stone} ${goldPart} · ${formatTime(getPenBuildTime(props.pen.level))}`;
  };
  const indicatorBlockedReason = () => props.pen.level === 0 ? buildBlockedReason() : upgradeBlockedReason();
  const indicatorCanAct = () => props.pen.level === 0 ? canBuild() : canUpgrade();

  const anchorId = () => `pen-${props.pen.animal}`;
  const isHighlighted = () => getActiveFarmingQuestAnchor(state) === anchorId();

  return (
    <Show when={!isUnbuilt()} fallback={
      <div
        id={anchorId()}
        class="building-card unbuilt-farm-card"
        classList={{ "quest-target": isHighlighted() }}
        style={{ cursor: "default", position: "relative" }}
      >
        <Show when={animal().image} fallback={
          <>
            <UpgradeIndicator
              level={0}
              canAct={canBuild()}
              costTip={indicatorCostTip()}
              blockedReason={buildBlockedReason()}
              onClick={() => actions.upgradePen(props.pen.id)}
            />
            <div style={{ "margin-bottom": "4px" }}>
              <div class="building-card-title">{animal().name} Pen</div>
              <div class="building-card-level not-built">Not built yet</div>
            </div>
          </>
        }>
          <div class="building-card-image">
            <img src={animal().image} alt="" loading="lazy" style={{ filter: "brightness(0.55) saturate(0.6)" }} />
            <div class="building-card-image-overlay" style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end" }}>
              <div>
                <div class="building-card-title">{animal().name} Pen</div>
                <div class="building-card-level not-built">Not built yet</div>
              </div>
              <UpgradeIndicator
                level={0}
                canAct={canBuild()}
                costTip={indicatorCostTip()}
                blockedReason={buildBlockedReason()}
                onClick={() => actions.upgradePen(props.pen.id)}
                inOverlay
              />
            </div>
          </div>
        </Show>

        {/* flex:0 so the description doesn't grow and shove the preview stats to
            the card's bottom (the card is stretched to the row's height). */}
        <div class="building-card-desc" style={{ flex: "0 0 auto", "min-height": "54px" }}>{animal().description}</div>
        {/* Greyed preview of what ONE animal gives — a fresh pen holds none, so
            these are per-head rates, not pen totals (the caption spells that out
            so "+3/h eggs on an unbuilt pen" doesn't read as a bug). */}
        <StatRow dim>
          <StatBox label="Eats / animal">
            <div style={{ "font-size": "1.15rem" }}>{getPenProduction(animal(), 1).consumed.toFixed(0)}/h</div>
            {/* Fixed height covers a two-line feed list (e.g. pigs), so pens with
                one feed source and pens with several keep the same box height. */}
            <div style={{ "font-weight": 400, "font-size": "0.72rem", "margin-top": "2px", "line-height": 1.4, "min-height": "32px" }}>
              <Show when={isGrazer(props.pen.animal)} fallback={
                <For each={ANIMAL_FEED[props.pen.animal]}>
                  {(cat, i) => (
                    <>
                      {i() > 0 ? <span style={{ color: "var(--text-muted)" }}> or </span> : null}
                      <span>{FEED_CATEGORY_ICON[cat]} {FEED_CATEGORY_LABEL[cat]}</span>
                    </>
                  )}
                </For>
              }>
                🌿 grass
              </Show>
            </div>
          </StatBox>
          <StatBox label="Makes / animal">
            <Show
              when={getPenProduction(animal(), 1).produced > 0}
              fallback={<MeatYield animal={props.pen.animal} />}
            >
              <div style={{ "font-size": "1.15rem" }}>+{getPenProduction(animal(), 1).produced}/h</div>
              <div style={{ "font-weight": 400, "font-size": "0.72rem", "margin-top": "2px", "min-height": "32px" }}>
                {animal().foodLabel.toLowerCase()}
                <Show when={getPenProduction(animal(), 1).secondary}>
                  {" "}· +{getPenProduction(animal(), 1).secondary!.amount}/h {getPenProduction(animal(), 1).secondary!.resource}
                </Show>
              </div>
            </Show>
          </StatBox>
        </StatRow>
        <div style={{ "font-size": "0.68rem", color: "var(--text-muted)", "margin-top": "6px", "text-align": "center" }}>
          Per animal, stock the pen once it's built.
        </div>
      </div>
    }>
      <div
        id={anchorId()}
        class="building-card"
        classList={{ upgrading: props.pen.upgrading, "quest-target": isHighlighted() }}
        style={{ cursor: "default", position: "relative" }}
      >
        <Show when={animal().image} fallback={
          <>
            <Show when={showUpgradeIndicator()}>
              <UpgradeIndicator
                level={props.pen.level}
                canAct={indicatorCanAct()}
                costTip={indicatorCostTip()}
                blockedReason={indicatorBlockedReason()}
                onClick={() => actions.upgradePen(props.pen.id)}
              />
            </Show>
            <div style={{ "margin-bottom": "4px" }}>
              <div class="building-card-title">{animal().name} Pen</div>
              <div class="building-card-level">Level {props.pen.level} / {effectiveMax()}</div>
            </div>
          </>
        }>
          <div class="building-card-image">
            <img src={animal().image} alt="" loading="lazy" />
            <div class="building-card-image-overlay" style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end" }}>
              <div>
                <div class="building-card-title">{animal().name} Pen</div>
                <div class="building-card-level">Level {props.pen.level} / {effectiveMax()}</div>
              </div>
              <Show when={showUpgradeIndicator()}>
                <UpgradeIndicator
                  level={props.pen.level}
                  canAct={indicatorCanAct()}
                  costTip={indicatorCostTip()}
                  blockedReason={indicatorBlockedReason()}
                  onClick={() => actions.upgradePen(props.pen.id)}
                  inOverlay
                />
              </Show>
            </div>
          </div>
        </Show>

        <div class="building-card-desc" style={{ flex: "0 0 auto", "min-height": "54px" }}>{animal().description}</div>

        <Show when={props.pen.upgrading && props.pen.upgradeRemaining}>
          <div class="building-card-upgrading">
            {props.pen.level === 0 ? "Building pen" : "Upgrading"}: <Countdown remainingSeconds={props.pen.upgradeRemaining!} />
          </div>
        </Show>

        <Show when={!props.pen.upgrading && props.pen.level > 0}>
          <StatRow>
            <StatBox label="Eats" warn={props.pen.starving}
              valColor={props.pen.starving ? "var(--accent-red)" : (onPasture() ? "var(--accent-green)" : undefined)}>
              {/* Live flock total (big), the per-animal rate right beneath it (as
                  in Makes), then the feed source. Feed source coloured live. */}
              <div style={{ "font-size": "1.15rem" }}>{prod().consumed.toFixed(0)}/h</div>
              <div style={{ "font-weight": 400, "font-size": "0.68rem", color: "var(--text-muted)" }}>
                {getPenProduction(animal(), 1).consumed}/h per animal
              </div>
              <div style={{ "font-weight": 400, "font-size": "0.72rem", "margin-top": "2px", "line-height": 1.4, "min-height": "32px" }}>
                <Show when={onPasture()} fallback={
                  <>
                    {/* Winter grazer: hay first, then larder. Non-grazer: larder only. */}
                    <Show when={grazes()}>
                      <span style={{ color: hayStored() > 0 ? "var(--accent-green)" : "var(--accent-red)" }}>🌾 hay</span>
                      <span style={{ color: "var(--text-muted)" }}> then </span>
                    </Show>
                    <For each={ANIMAL_FEED[props.pen.animal]}>
                      {(cat, i) => (
                        <>
                          {i() > 0 ? <span style={{ color: "var(--text-muted)" }}> or </span> : null}
                          <span style={{ color: categoryHasFood(cat) ? "var(--text-secondary)" : "var(--accent-red)" }}>
                            {FEED_CATEGORY_ICON[cat]} {FEED_CATEGORY_LABEL[cat]}
                          </span>
                        </>
                      )}
                    </For>
                  </>
                }>
                  <span style={{ color: "var(--accent-green)" }}>🌿 wild grass · free</span>
                </Show>
              </div>
            </StatBox>
            <StatBox label="Makes">
              <Show
                when={getPenProduction(animal(), 1).produced > 0}
                fallback={<MeatYield animal={props.pen.animal} />}
              >
                {/* Live flock total (big), per-animal rate right beneath it, then
                    any byproduct (wool) as the detail line. */}
                <div>+{prod().produced}/h {animal().foodLabel.toLowerCase()}</div>
                <div style={{ "font-weight": 400, "font-size": "0.68rem", color: "var(--text-muted)" }}>
                  +{getPenProduction(animal(), 1).produced}/h per animal
                </div>
                {(() => {
                  const sec = prod().secondary;
                  if (!sec) return null;
                  const mod = sec.resource === "wool" ? getWoolSeasonMod(state.season) : 1;
                  return mod > 0
                    ? <div style={{ "font-weight": 400, "font-size": "0.72rem", "margin-top": "2px", color: "var(--text-secondary)" }}>+{Math.floor(sec.amount * mod)}/h {sec.resource}</div>
                    : null;
                })()}
              </Show>
            </StatBox>
          </StatRow>
          <Show when={hasWaterInfra(state.buildings)}>
            <WaterNeed amount={penWaterDemand(props.pen.count)} />
          </Show>

          {/* Flock summary — the glance. Buying, culling and the guard dog all
              live in the Manage modal now (room there to assign a hand later). */}
          {(() => {
            // Guarded = a kept dog is posted to this fold (the bought flag is legacy).
            const guarded = () => state.keptAnimals.some((a) => a.species === "dog" && a.job === "guard" && a.penId === props.pen.id);
            const statusText = () => props.pen.starving
              ? "⚠️ Starving, losing head"
              : [
                  guarded() ? "🐕 Guarded" : "🐺 Unguarded",
                  onPasture() ? "🌿 On pasture" : (grazes() && isWinter() ? (hayStored() > 0 ? "🌾 On hay" : "🌾 No hay, larder feed") : null),
                ].filter(Boolean).join(" · ");
            const statusColor = () => props.pen.starving
              ? "var(--accent-red)"
              : (grazes() && isWinter() && hayStored() <= 0 ? "var(--accent-red)"
                : (guarded() ? "var(--accent-green)" : "var(--text-muted)"));
            const cap = () => getPenCapacity(props.pen.level);
            const buyCost = () => getAnimalBuyCost(props.pen.animal);
            const buyDisabled = () => props.pen.count >= cap() || state.resources.gold < buyCost();
            return (
              <div style={{
                ...STAT_BOX, "margin-top": "8px",
                "flex-direction": "column", "align-items": "stretch", "justify-content": "flex-start",
                "text-align": "left", gap: "10px", "min-height": "auto",
              }}>
                <div style={{ display: "flex", "align-items": "baseline", "justify-content": "space-between", gap: "8px" }}>
                  <div style={{ "font-size": "1rem", "font-weight": 600 }}>
                    Flock <span style={{ color: "var(--text-primary)" }}>{props.pen.count}</span> / {cap()}
                  </div>
                  <div style={{ "font-size": "0.72rem", color: statusColor() }}>
                    {statusText()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    class="btn-primary"
                    onClick={() => actions.buyLivestock(props.pen.id, 1)}
                    disabled={buyDisabled()}
                    style={{ flex: "1", "font-size": "0.85rem" }}
                  >
                    Buy {animal().icon} 💰{buyCost()}
                  </button>
                  <button
                    class="btn-secondary"
                    onClick={() => setManageOpen(true)}
                    style={{ flex: "1", height: "40px", "font-size": "0.85rem", "justify-content": "center" }}
                  >
                    Manage
                  </button>
                </div>
              </div>
            );
          })()}
        </Show>
      </div>
      <Show when={manageOpen()}>
        <PenManageModal pen={props.pen} onClose={() => setManageOpen(false)} />
      </Show>
    </Show>
  );
}

// ─── Hive Card ───────────────────────────────────────────────────

function HiveCard(props: { hive: PlayerHive }) {
  const { actions, state } = useGame();
  const effectiveMax = () => Math.min(actions.getTownHallLevel(), HIVE_MAX_LEVEL);

  const isUnbuilt = () => props.hive.level === 0 && !props.hive.upgrading;
  const buildCost = () => getHiveCost(0);
  const canBuild = () => {
    const c = buildCost();
    return state.resources.wood >= c.wood && state.resources.stone >= c.stone && state.resources.gold >= c.gold;
  };
  const buildBlockedReason = () => {
    const c = buildCost();
    if (state.resources.wood < c.wood || state.resources.stone < c.stone || state.resources.gold < c.gold) return "Not enough resources";
    return "";
  };

  const honeyRate = () => props.hive.level > 0 ? getHoneyRate(props.hive.level, state.season) : 0;
  const isDormant = () => props.hive.level > 0 && !props.hive.upgrading && honeyRate() === 0;
  const seasonMod = () => APIARY.seasonalModifiers[state.season];
  const ALL_SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];
  // Peak (warm-season) rate at the given level — a stable reference for the box,
  // while the status line below carries the current-season reality.
  const honeyPeak = (level: number) => Math.max(...ALL_SEASONS.map((s) => getHoneyRate(level, s)));
  const activeSeasons = () => ALL_SEASONS.filter((s) => (APIARY.seasonalModifiers[s] ?? 0) > 0);

  const upgradeCost = () => props.hive.level < HIVE_MAX_LEVEL ? getHiveCost(props.hive.level) : null;
  const canUpgrade = () => {
    if (props.hive.upgrading || props.hive.level >= HIVE_MAX_LEVEL) return false;
    if (props.hive.level >= effectiveMax()) return false;
    const c = upgradeCost();
    return c ? state.resources.wood >= c.wood && state.resources.stone >= c.stone && state.resources.gold >= c.gold : false;
  };
  const upgradeBlockedReason = () => {
    if (props.hive.level >= HIVE_MAX_LEVEL) return "Max level reached";
    if (props.hive.level >= effectiveMax()) return `Upgrade Town Hall to lvl ${actions.getTownHallLevel() + 1}`;
    if (props.hive.upgrading) return "Already upgrading…";
    const c = upgradeCost();
    if (c && (state.resources.wood < c.wood || state.resources.stone < c.stone || state.resources.gold < c.gold)) return "Not enough resources";
    return "";
  };

  // Show the indicator whenever the hive is below its current cap (any season —
  // hives upgrade year-round now; only resources / Town-Hall level gate it).
  const showUpgradeIndicator = () =>
    !props.hive.upgrading &&
    props.hive.level < effectiveMax();
  const indicatorCostTip = () => {
    const c = props.hive.level === 0 ? buildCost() : upgradeCost();
    return c ? `🪵 ${c.wood} 🪨 ${c.stone} 🪙 ${c.gold} · ${formatTime(getHiveBuildTime(props.hive.level))}` : "";
  };
  const indicatorBlockedReason = () => props.hive.level === 0 ? buildBlockedReason() : upgradeBlockedReason();
  const indicatorCanAct = () => props.hive.level === 0 ? canBuild() : canUpgrade();

  return (
    <Show when={!isUnbuilt()} fallback={
      <div class="building-card unbuilt-farm-card" style={{ cursor: "default", position: "relative" }}>
        <div class="building-card-image">
          <img src={APIARY_IMAGE} alt="" loading="lazy" style={{ filter: "brightness(0.55) saturate(0.6)" }} />
          <div class="building-card-image-overlay" style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end" }}>
            <div>
              <div class="building-card-title">Beehive</div>
              <div class="building-card-level not-built">Not built yet</div>
            </div>
            <UpgradeIndicator
              level={0}
              canAct={canBuild()}
              costTip={indicatorCostTip()}
              blockedReason={buildBlockedReason()}
              onClick={() => actions.upgradeHive(props.hive.id)}
              inOverlay
            />
          </div>
        </div>

        <div class="building-card-desc" style={{ flex: "0 0 auto", "min-height": "54px" }}>
          A simple wooden hive. Bees produce honey in warm months and hibernate through winter.
        </div>
        {/* Greyed preview of what a built hive would give */}
        <StatRow dim>
          <StatBox label="Active in">{seasonList(activeSeasons(), false)}</StatBox>
          <StatBox label="Produces">+{honeyPeak(1)}/h honey</StatBox>
        </StatRow>
      </div>
    }>
      <div class="building-card" classList={{ upgrading: props.hive.upgrading }} style={{ cursor: "default", position: "relative" }}>
        <div class="building-card-image">
          <img src={APIARY_IMAGE} alt="" loading="lazy" />
          <div class="building-card-image-overlay" style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end" }}>
            <div>
              <div class="building-card-title">Beehive</div>
              <div class="building-card-level">Level {props.hive.level} / {effectiveMax()}</div>
            </div>
            <Show when={showUpgradeIndicator()}>
              <UpgradeIndicator
                level={props.hive.level}
                canAct={indicatorCanAct()}
                costTip={indicatorCostTip()}
                blockedReason={indicatorBlockedReason()}
                onClick={() => actions.upgradeHive(props.hive.id)}
                inOverlay
              />
            </Show>
          </div>
        </div>

        <div class="building-card-desc" style={{ flex: "0 0 auto", "min-height": "54px" }}>
          A simple wooden hive. Bees produce honey in warm months and hibernate through winter.
        </div>

        <Show when={props.hive.upgrading && props.hive.upgradeRemaining}>
          <div class="building-card-upgrading">
            {props.hive.level === 0 ? "Building hive" : "Upgrading"}: <Countdown remainingSeconds={props.hive.upgradeRemaining!} />
          </div>
        </Show>

        <Show when={!props.hive.upgrading && props.hive.level > 0}>
          <StatRow>
            <StatBox label="Active in">{seasonList(activeSeasons(), false)}</StatBox>
            <StatBox label="Produces">
              {/* Current rate leads (green only when flowing); peak as a muted
                  reference so a dormant hive reads "0 now, 2 at its peak". */}
              <div style={{ "font-size": "1.15rem", color: honeyRate() > 0 ? "var(--accent-green)" : undefined }}>+{honeyRate()}/h honey</div>
              <Show when={honeyRate() < honeyPeak(props.hive.level)}>
                <div style={{ "font-weight": 400, "font-size": "0.68rem", "margin-top": "2px", color: "var(--text-muted)" }}>
                  +{honeyPeak(props.hive.level)}/h in warm months
                </div>
              </Show>
            </StatBox>
          </StatRow>
          <div style={{
            "font-size": "0.8rem", "text-align": "center", "margin-top": "8px",
            color: isDormant() ? "var(--text-muted)" : "var(--accent-gold)",
          }}>
            {isDormant()
              ? "❄️ Dormant, no honey until spring"
              : seasonMod() < 1
                ? `Producing +${honeyRate()}/h now (${Math.round(seasonMod() * 100)}% ${state.season})`
                : `Producing +${honeyRate()}/h now`}
          </div>
        </Show>
      </div>
    </Show>
  );
}

// ─── Orchard Card ────────────────────────────────────────────────

function OrchardCard(props: { orchard: PlayerOrchard }) {
  const { actions, state } = useGame();
  const fruitDef = () => getFruit(props.orchard.fruit);
  const effectiveMax = () => Math.min(actions.getTownHallLevel(), ORCHARD_MAX_LEVEL);

  // Specialty fruit (grapes) hides as a "???" mystery slot until the vine is
  // brought home — mirrors the garden specialty-seed gate. No unlock path is
  // wired yet, so it stays a teaser for now.
  const locked = () => props.orchard.level === 0 && !props.orchard.upgrading && !isFruitUnlocked(fruitDef(), state.fruitsUnlocked);

  // Tree bookkeeping.
  const slots = () => getOrchardTreeSlots(props.orchard.level);
  const saplingCount = () => props.orchard.saplings.reduce((n, c) => n + c.count, 0);
  const planted = () => props.orchard.matureTrees + saplingCount();
  const roomLeft = () => slots() - planted();
  const seedStock = () => state.fruitSeeds?.[props.orchard.fruit] ?? 0;
  const isPlantSeason = () => state.season === SAPLING_PLANT_SEASON;
  const canPlant = () => props.orchard.level > 0 && !props.orchard.upgrading && roomLeft() > 0 && isPlantSeason() && seedStock() > 0;
  const plantBlockedReason = () => {
    if (!isPlantSeason()) return "Saplings are planted in spring";
    if (seedStock() <= 0) return `No ${fruitDef().name.toLowerCase()} seed in store`;
    return "";
  };

  const isUnbuilt = () => props.orchard.level === 0 && !props.orchard.upgrading;
  const buildCost = () => getOrchardCost(0);
  const canBuild = () => {
    const c = buildCost();
    return state.resources.wood >= c.wood && state.resources.stone >= c.stone && state.resources.gold >= c.gold;
  };
  const buildBlockedReason = () => {
    const c = buildCost();
    if (state.resources.wood < c.wood || state.resources.stone < c.stone || state.resources.gold < c.gold) return "Not enough resources";
    return "";
  };

  const rate = () => props.orchard.level > 0 && props.orchard.matureTrees > 0 && isOrchardActive(fruitDef(), state.season)
    ? getOrchardRate(fruitDef(), props.orchard.matureTrees) : 0;
  const status = () => props.orchard.level > 0 && !props.orchard.upgrading
    ? getOrchardStatus(fruitDef(), state.season, props.orchard.matureTrees, saplingCount()) : "";

  const upgradeCost = () => props.orchard.level < ORCHARD_MAX_LEVEL ? getOrchardCost(props.orchard.level) : null;
  const canUpgrade = () => {
    if (props.orchard.upgrading || props.orchard.level >= ORCHARD_MAX_LEVEL) return false;
    if (props.orchard.level >= effectiveMax()) return false;
    const c = upgradeCost();
    return c ? state.resources.wood >= c.wood && state.resources.stone >= c.stone && state.resources.gold >= c.gold : false;
  };
  const upgradeBlockedReason = () => {
    if (props.orchard.level >= ORCHARD_MAX_LEVEL) return "Max level reached";
    if (props.orchard.level >= effectiveMax()) return `Upgrade Town Hall to lvl ${actions.getTownHallLevel() + 1}`;
    if (props.orchard.upgrading) return "Already upgrading…";
    const c = upgradeCost();
    if (c && (state.resources.wood < c.wood || state.resources.stone < c.stone || state.resources.gold < c.gold)) return "Not enough resources";
    return "";
  };

  const showUpgradeIndicator = () =>
    !props.orchard.upgrading &&
    props.orchard.level < ORCHARD_MAX_LEVEL;
  const indicatorCostTip = () => {
    const c = props.orchard.level === 0 ? buildCost() : upgradeCost();
    return c ? `🪵 ${c.wood} 🪨 ${c.stone} 🪙 ${c.gold} · ${formatTime(getOrchardBuildTime(props.orchard.level))}` : "";
  };
  const indicatorBlockedReason = () => props.orchard.level === 0 ? buildBlockedReason() : upgradeBlockedReason();
  const indicatorCanAct = () => props.orchard.level === 0 ? canBuild() : canUpgrade();

  return (
    <Show when={!locked()} fallback={
      <div class="building-card unbuilt-farm-card garden-locked-card" style={{ cursor: "default", position: "relative", "text-align": "center", opacity: 0.85 }}>
        <div class="building-card-image">
          <img
            src="https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/empty_garden.png"
            alt=""
            loading="lazy"
            style={{ filter: "grayscale(0.7) brightness(0.55)" }}
          />
        </div>
        <div class="building-card-title" style={{ "letter-spacing": "0.15em" }}>??? Orchard</div>
        <div class="building-card-desc" style={{ "margin-top": "6px", color: "var(--text-muted)", "font-style": "italic" }}>
          Ground set aside for something not yet brought home. Some vines and trees must be found or traded for before they can be planted here.
        </div>
      </div>
    }>
    <Show when={!isUnbuilt()} fallback={
      <div class="building-card unbuilt-farm-card" style={{ cursor: "default", position: "relative" }}>
        <Show when={fruitDef().image} fallback={
          <>
            <UpgradeIndicator
              level={0}
              canAct={canBuild()}
              costTip={indicatorCostTip()}
              blockedReason={buildBlockedReason()}
              onClick={() => actions.upgradeOrchard(props.orchard.id)}
            />
            <div style={{ "margin-bottom": "4px" }}>
              <div class="building-card-title">{fruitDef().name}</div>
              <div class="building-card-level not-built">Not built yet</div>
            </div>
          </>
        }>
          <div class="building-card-image">
            <img src={fruitDef().image} alt="" loading="lazy" style={{ filter: "brightness(0.55) saturate(0.6)" }} />
            <div class="building-card-image-overlay" style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end" }}>
              <div>
                <div class="building-card-title">{fruitDef().name}</div>
                <div class="building-card-level not-built">Not built yet</div>
              </div>
              <UpgradeIndicator
                level={0}
                canAct={canBuild()}
                costTip={indicatorCostTip()}
                blockedReason={buildBlockedReason()}
                onClick={() => actions.upgradeOrchard(props.orchard.id)}
                inOverlay
              />
            </div>
          </div>
        </Show>

        <div class="building-card-desc" style={{ flex: "0 0 auto", "min-height": "76px" }}>{fruitDef().description}</div>
        {/* Greyed preview — build the orchard, then plant saplings into it. */}
        <StatRow dim>
          <StatBox label="Harvest in">{seasonList(fruitDef().harvestSeasons, false)}</StatBox>
          <StatBox label="Maturity">🌱 {fruitDef().maturationSeasons} seasons</StatBox>
          <StatBox label="Yield / tree">+{getFruitPerTreeRate(fruitDef())}/h</StatBox>
        </StatRow>
        <div style={{ "font-size": "0.68rem", color: "var(--text-muted)", "margin-top": "6px", "text-align": "center" }}>
          Per tree, plant saplings once it's built.
        </div>
      </div>
    }>
      <div class="building-card" classList={{ upgrading: props.orchard.upgrading }} style={{ cursor: "default", position: "relative" }}>
        <Show when={fruitDef().image} fallback={
          <>
            <Show when={showUpgradeIndicator()}>
              <UpgradeIndicator
                level={props.orchard.level}
                canAct={indicatorCanAct()}
                costTip={indicatorCostTip()}
                blockedReason={indicatorBlockedReason()}
                onClick={() => actions.upgradeOrchard(props.orchard.id)}
              />
            </Show>
            <div style={{ "margin-bottom": "4px" }}>
              <div class="building-card-title">{fruitDef().name}</div>
              <div class="building-card-level">Level {props.orchard.level} / {effectiveMax()}</div>
            </div>
          </>
        }>
          <div class="building-card-image">
            <img src={fruitDef().image} alt="" loading="lazy" />
            <div class="building-card-image-overlay" style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end" }}>
              <div>
                <div class="building-card-title">{fruitDef().name}</div>
                <div class="building-card-level">Level {props.orchard.level} / {effectiveMax()}</div>
              </div>
              <Show when={showUpgradeIndicator()}>
                <UpgradeIndicator
                  level={props.orchard.level}
                  canAct={indicatorCanAct()}
                  costTip={indicatorCostTip()}
                  blockedReason={indicatorBlockedReason()}
                  onClick={() => actions.upgradeOrchard(props.orchard.id)}
                  inOverlay
                />
              </Show>
            </div>
          </div>
        </Show>

        <div class="building-card-desc" style={{ flex: "0 0 auto", "min-height": "76px" }}>{fruitDef().description}</div>

        <Show when={props.orchard.upgrading && props.orchard.upgradeRemaining}>
          <div class="building-card-upgrading">
            {props.orchard.level === 0 ? "Planting" : "Upgrading"}: <Countdown remainingSeconds={props.orchard.upgradeRemaining!} />
          </div>
        </Show>

        <Show when={!props.orchard.upgrading && props.orchard.level > 0}>
          <StatRow>
            <StatBox label="Harvest in">{seasonList(fruitDef().harvestSeasons, false)}</StatBox>
            <StatBox label="Bearing">
              <div style={{ "font-size": "1.15rem" }}>🌳 {props.orchard.matureTrees}</div>
              <Show when={saplingCount() > 0}>
                <div style={{ "font-weight": 400, "font-size": "0.72rem", "margin-top": "2px" }}>🌱 {saplingCount()} growing</div>
              </Show>
            </StatBox>
            <StatBox label="Yield">
              {/* Current total (big) — 0 out of season — then the per-tree rate. */}
              <div style={{ "font-size": "1.15rem", color: rate() > 0 ? "var(--accent-green)" : undefined }}>+{rate()}/h</div>
              <div style={{ "font-weight": 400, "font-size": "0.68rem", "margin-top": "2px", color: "var(--text-muted)" }}>
                +{getFruitPerTreeRate(fruitDef())}/h per tree
              </div>
            </StatBox>
          </StatRow>

          {/* Grove box — the glance (trees / room + status) with the Plant action
              inside it, echoing the pen flock box and the garden seed box. */}
          <div style={{
            ...STAT_BOX, "margin-top": "8px",
            "flex-direction": "column", "align-items": "stretch", "justify-content": "flex-start",
            "text-align": "center", gap: "10px", "min-height": "auto",
          }}>
            <div style={{ "font-size": "0.9rem", "font-weight": 600 }}>
              Grove <span style={{ color: "var(--text-primary)" }}>{planted()}</span> / {slots()}
              <span style={{ color: "var(--text-muted)", "font-weight": 400, "font-size": "0.78rem" }}>
                {" · "}{status()}
              </span>
            </div>
            {/* Seed store for this fruit — planting a sapling spends one. */}
            <div style={{ "font-size": "0.72rem", color: "var(--text-secondary)" }}>
              🌰 <b style={{ color: "var(--text-primary)" }}>{seedStock()}</b> {fruitDef().name.toLowerCase().replace(/ (trees|vines)$/, "")} seed{seedStock() === 1 ? "" : "s"} in store
            </div>
            <Show when={roomLeft() > 0}>
              <Tooltip block text={plantBlockedReason()}>
                <button
                  class="btn-primary"
                  style={{ width: "100%", "justify-content": "center" }}
                  disabled={!canPlant()}
                  onClick={() => actions.plantSapling(props.orchard.id)}
                >
                  {seedStock() <= 0
                    ? "No seed to plant"
                    : !isPlantSeason()
                      ? `Plant ${fruitDef().icon} in spring`
                      : `Plant ${fruitDef().icon} sapling (1 seed)`}
                </button>
              </Tooltip>
            </Show>
            <Show when={roomLeft() <= 0}>
              <div style={{ "font-size": "0.72rem", color: "var(--text-muted)" }}>
                Grove is full. Upgrade for more room.
              </div>
            </Show>
          </div>
        </Show>
        <Show when={hasWaterInfra(state.buildings)}>
          <WaterNeed amount={orchardWaterDemand(props.orchard.matureTrees)} />
        </Show>
      </div>
    </Show>
    </Show>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

/** On mount, if the URL has a hash like #pen-sheep, smooth-scroll to the
 *  matching element. Runs once — we don't track the hash reactively for the
 *  highlight (the active-quest derivation does that job). */
function useFarmingScrollToHash() {
  onMount(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) {
      setTimeout(() => {
        document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  });
}

/** Anchor (like "pen-sheep") of the current unclaimed quest pointing to the
 *  Farming page — used for the golden highlight. Mirrors how Buildings.tsx
 *  picks its quest target building. Returns null when no active farming quest.
 *
 *  "Active" = first quest whose rewards are unclaimed AND whose condition is
 *  still unmet. Once the player satisfies the condition the highlight fades. */
export function getActiveFarmingQuestAnchor(state: GameState): string | null {
  // Walk the new quest definitions, picking the first active (triggered + not
  // yet claimed) farming quest whose condition isn't satisfied yet.
  for (const q of QUEST_DEFINITIONS) {
    if (!isQuestActive(q, state)) continue;
    if (q.condition(state)) return null; // already completed, just waiting to claim
    const page = q.targetPage ?? "";
    const m = page.match(/^\/farming#(.+)$/);
    if (m) return m[1];
  }
  return null;
}

/** Wraps content in a faded, click-disabled shell with a tooltip listing the
 *  unlock condition. Mirrors the locked-building pattern from the Buildings page. */
function LockedShell(props: { locked: boolean; reason: string; children: JSX.Element }) {
  return (
    <Show when={props.locked} fallback={props.children}>
      <Tooltip
        position="cursor"
        block
        content={() => (
          <div style={{ "min-width": "200px" }}>
            <div class="section-label" style={{ "font-size": "0.7rem", "letter-spacing": "0.06em" }}>
              Unlock conditions
            </div>
            <div style={{
              "padding": "2px 0",
              color: "var(--accent-red)",
              "font-size": "0.8rem",
            }}>
              <span style={{ "margin-right": "6px" }}>✗</span>
              {props.reason}
            </div>
          </div>
        )}
      >
        <div class="dimmed" style={{
          position: "relative",
          "pointer-events": "none",
          width: "100%",
        }}>
          {props.children}
        </div>
      </Tooltip>
    </Show>
  );
}

export default function Farming() {
  const { state, actions } = useGame();
  useFarmingScrollToHash();
  // Fields are built empty, crops chosen per-field in spring.
  // Gardens/pens/hives/orchards use pre-attributed slots — each card handles its own build/plant action.

  const seasonMeta = () => SEASON_META[state.season];

  const canBuildField = () => {
    if (state.fields.length >= MAX_FIELDS) return false;
    const cost = getFieldCost(0);
    return state.resources.wood >= cost.wood && state.resources.stone >= cost.stone;
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

  // Farming arrives in two waves, food first. The kitchen garden opens early
  // (settlement Ch.2, as the camp grows past its founders) — a few raised beds
  // are the climbable answer to the early food deficit. Everything heavier waits
  // for Village (Town Hall Lv.3): crop fields are acreage that needs draft
  // animals and hands; livestock, bees, and orchards are settled-life too. A
  // tent camp of ten doesn't plough fields. The page renders the full layout
  // always — locked sections just show the unlock tooltip.
  const settlementChapter = () =>
    state.chapters?.find((c) => c.storyline === "settlement")?.current ?? 0;
  const townHallLevel = () =>
    state.buildings.find((b) => b.buildingId === "town_hall")?.level ?? 0;
  const gardensUnlocked = () => settlementChapter() >= 2; // kitchen gardens — camp-scale
  const apiaryUnlocked = () => townHallLevel() >= 2;      // a few hives — camp-scale, ahead of livestock
  const villageUnlocked = () => townHallLevel() >= 3;     // fields, livestock, orchards

  return (
    // The season emblem watermark is rendered at the app level (App.tsx) as a
    // content-pane backdrop, so it layers correctly above the weather rain and
    // stays fixed while this page scrolls.
    <div>
      <h1 class="page-title">Farming</h1>

      {/* Rotation tip — appears only until the player has actually planted, so
          it doesn't pester veterans. The soil-status pill on each field card
          handles ongoing guidance after the first planting. */}
      <Show when={state.fields.every((f) => f.lastCrop === null)}>
        <div style={{
          padding: "10px 14px",
          "margin-bottom": "16px",
          background: "rgba(139, 195, 74, 0.08)",
          border: "1px solid var(--accent-green)",
          "border-radius": "6px",
          "font-size": "0.85rem",
          color: "var(--text-secondary)",
          "line-height": "1.5",
        }}>
          🌾 <strong>Tip: rotate your crops.</strong> Planting the same crop
          in the same field year after year depletes the soil and cuts yield.
          Rotating between wheat, barley, and flax keeps fields healthy.
          Leaving a field empty through a season grants a <em>+15% rested</em>
          bonus on the next harvest.
        </div>
      </Show>

      <div class="farming-summary">
        <StatCard label="Season" valueColor={seasonMeta().color}>
          <SeasonIcon season={state.season} size={20} /> {seasonMeta().name}, Year {state.year}
        </StatCard>
        {/* Current weather — what the sky is doing right now. The year's
            character (a dry year bakes, a wet one floods) is read from the
            weather it keeps throwing, not forecast as a verdict, so a hard or
            easy year stays a thing you live through rather than a label. */}
        {(() => {
          const w = () => resolveCurrentWeather(state.season, state.seasonElapsed, state.year);
          const m = () => WEATHER_META[w()];
          const hasStandingCrop = () =>
            state.gardens.some((g) => g.plantedYear != null && (g.plantsAlive ?? 0) > 0) ||
            state.fields.some((f) => !!f.crop && f.level > 0);
          // Is the weather actively killing crops right now? Heat wilts anything
          // standing; a downpour only drowns when the cistern has backed up.
          const cisternFill = () => {
            const cb = state.buildings.find((b) => b.buildingId === CISTERN_ID);
            const cap = getWaterCap(Math.max(0, (cb?.level ?? 0) - (cb?.damaged ? 1 : 0)));
            return cap > 0 ? (state.resources.water ?? 0) / cap : 0;
          };
          const harming = () => hasStandingCrop() && (
            w() === "heat_wave" || (w() === "heavy_rain" && cisternFill() > DELUGE_SAFE_FILL)
          );
          const warnText = () => w() === "heat_wave"
            ? "The heat is wilting your crops right now, even watered beds. Run a water mission or wait it out."
            : "The downpour is drowning your crops. Open the cistern sluice to run the reserve low so the flood sheds off.";
          return (
            <Tooltip block text={harming() ? warnText() : m().blurb} style={{ flex: "1", display: "flex" }}>
              <StatCard label="Weather" danger={harming()}>
                <span style={{ display: "inline-flex", "align-items": "center", gap: "5px", color: harming() ? "var(--accent-red)" : undefined }}>
                  <WeatherIcon weather={w()} size={18} /> {m().name}
                </span>
              </StatCard>
            </Tooltip>
          );
        })()}
        <Show when={(state.season === "spring" || state.season === "summer") && totalExpectedHarvest() > 0}>
          <StatCard label="Expected Harvest">{totalExpectedHarvest()} food</StatCard>
        </Show>
        <Show when={state.season === "autumn" && actions.isHarvesting() && totalExpectedHarvest() > 0}>
          <StatCard label="Harvesting" valueColor="#d4831a">{totalExpectedHarvest()} food incoming</StatCard>
        </Show>
        {/* Current farm output per hour — gardens, orchards, pens and any active
            field harvest. Shown whenever the farm is producing, so a page with
            thriving gardens never reads a misleading grain-only "0 incoming". */}
        {(() => {
          const farmFood = () => actions.getFoodBreakdown().filter((src) => !src.wild).reduce((t, src) => t + src.rate, 0);
          return (
            <Show when={farmFood() > 0}>
              <StatCard label="Producing" valueColor="var(--accent-green)">+{Math.round(farmFood())}/h food</StatCard>
            </Show>
          );
        })()}
        <Show when={(state.season === "autumn" && !actions.isHarvesting()) || state.season === "winter"}>
          <StatCard label="Harvested this year" valueColor="var(--accent-green)">
            {Object.keys(state.yearHarvest).length > 0
              ? Object.entries(state.yearHarvest).map(([name, amt]) => `${amt} ${name}`).join(", ")
              : "Nothing"}
          </StatCard>
        </Show>
        <StatCard label="Animal Feed">
          <span class="rate-negative">-{actions.getAnimalFoodConsumption()}/h</span>
        </StatCard>
        {/* Farm water — what the fields, gardens, orchards and pens drink each
            hour. The reserve level + net balance live in the top-bar dropdown. */}
        {(() => {
          const b = () => actions.getWaterBreakdown();
          const w1 = (n: number) => String(Math.round(n));
          const farm = () => b().crops + b().animals;
          return (
            <Show when={farm() > 0}>
              <StatCard label="Farm Water">
                <Tooltip block text={`Crops need ${w1(b().crops)}/h${b().animals > 0 ? `, livestock ${w1(b().animals)}/h` : ""}. Rain waters the crops for free in kind years; a dry year draws the shortfall from your water reserve, or the crops go thirsty once it runs dry.`}>
                  <span class="rate-negative">💧 -{w1(farm())}/h</span>
                </Tooltip>
              </StatCard>
            </Show>
          );
        })()}
        <Show when={state.pens.some((p) => p.level > 0 && isGrazer(p.animal))}>
          <StatCard
            label={state.season === "winter" ? "Winter fodder" : "Grazing"}
            valueColor={state.season === "winter" && state.fields.reduce((s, f) => s + (f.hay ?? 0), 0) === 0 ? "var(--accent-red)" : "var(--accent-green)"}
          >
            {state.season === "winter"
              ? `🌾 ${Math.round(state.fields.reduce((s, f) => s + (f.hay ?? 0), 0))} hay stored`
              : "🌿 Wild pasture (free)"}
          </StatCard>
        </Show>
      </div>

      <Show when={state.season === "autumn" && actions.isHarvesting()}>
        <div class="harvest-banner">🍂 Harvest in progress! Your fields are yielding grain.</div>
      </Show>
      <Show when={state.season === "winter"}>
        <div class="winter-banner">❄️ Winter. Fields and gardens are dormant. Survive on stored food, hunting, fishing, and livestock.</div>
      </Show>

      {/* ── Fields ── Village-scale: acreage, ploughing, draft animals. Not a
          camp's work — opens with the Town Hall reaching Village (Lv.3). */}
      <div class="ornament-frame" style={{ background: "var(--bg-secondary)", padding: "4px 16px 16px", "margin-bottom": "16px" }}>
      <h2 class="farming-section-title">🌾 Fields</h2>
      <LockedShell locked={!villageUnlocked()} reason="Locked until your settlement becomes a Village (Town Hall Lv.3)">
      <Show when={state.fields.length === 0 && state.season !== "spring"}>
        <div style={{
          padding: "8px 12px",
          "margin-bottom": "10px",
          "border-radius": "0",
          background: "rgba(245, 197, 66, 0.1)",
          border: "1px solid rgba(245, 197, 66, 0.3)",
          "font-size": "0.8rem",
          color: "var(--accent-gold)",
        }}>
          Fields can only be planted in spring. You can build one now, but it will sit empty until next spring. Consider planting in a <strong>garden</strong> instead. Each veggie has its own planting window, so there's almost always something you can sow.
        </div>
      </Show>
      <Show when={state.fields.length > 0}>
        <div style={{
          padding: "8px 12px",
          "margin-bottom": "10px",
          "border-radius": "0",
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
        {/* Always render MAX_FIELDS slots so the player sees the full plot
            capacity up front — the three-field rotation is the whole game loop,
            not a capped allowance that needs discovering. */}
        <For each={Array.from({ length: MAX_FIELDS }, (_, i) => state.fields[i])}>
          {(f) => f
            ? <FieldCard field={f} />
            : <EmptyFieldSlot
                canBuild={canBuildField()}
                isWinter={state.season === "winter"}
                onBuild={() => actions.buildField()}
              />}
        </For>
      </div>
      </LockedShell>
      </div>

      {/* ── Gardens ── */}
      <div class="ornament-frame" style={{ background: "var(--bg-secondary)", padding: "4px 16px 16px", "margin-bottom": "16px" }}>
      <h2 class="farming-section-title">🥬 Gardens</h2>
      <LockedShell locked={!gardensUnlocked()} reason="Locked until your camp grows (Settlement chapter 2)">
        <div class="fields-grid">
          <For each={state.gardens}>{(g) => <GardenCard garden={g} />}</For>
        </div>
      </LockedShell>
      </div>

      {/* ── Bees ── A few hives are camp-scale work: they open a step ahead of
          the flocks, once the Town Hall reaches Lv.2. */}
      <div class="ornament-frame" style={{ background: "var(--bg-secondary)", padding: "4px 16px 16px", "margin-bottom": "16px" }}>
      <h2 class="farming-section-title">🐝 Bees</h2>
      <LockedShell locked={!apiaryUnlocked()} reason="Locked until your Town Hall reaches Level 2">
        <div class="fields-grid">
          <For each={state.hives}>{(h) => <HiveCard hive={h} />}</For>
        </div>
      </LockedShell>
      </div>

      {/* ── Livestock ── Deferred to Village (Town Hall Lv.3). A shepherd and a
          flock are settled-life, not camp survival; matches the "Woolly Friends"
          quest, which also waits for Village. */}
      <div class="ornament-frame" style={{ background: "var(--bg-secondary)", padding: "4px 16px 16px", "margin-bottom": "16px" }}>
      <h2 class="farming-section-title">🐄 Livestock</h2>
      <LockedShell locked={!villageUnlocked()} reason="Locked until your settlement becomes a Village (Town Hall Lv.3)">
        <div class="fields-grid">
          <For each={state.pens}>{(p) => <PenCard pen={p} />}</For>
        </div>
      </LockedShell>
      </div>

      {/* ── Orchards ── */}
      <div class="ornament-frame" style={{ background: "var(--bg-secondary)", padding: "4px 16px 16px", "margin-bottom": "16px" }}>
      <h2 class="farming-section-title">🌳 Orchards</h2>
      <LockedShell locked={!villageUnlocked()} reason="Locked until your settlement becomes a Village (Town Hall Lv.3)">
        <div class="fields-grid">
          <For each={state.orchards}>{(o) => <OrchardCard orchard={o} />}</For>
        </div>
      </LockedShell>
      </div>
    </div>
  );
}
