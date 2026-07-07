import { For, Show, onMount } from "solid-js";
import { useGame, type GameState, type PlayerField, type PlayerGarden, type PlayerPen, type PlayerHive, type PlayerOrchard } from "~/engine/gameState";
import { CROPS, type CropId, getCrop, getFieldCost, getFieldBuildTime, getSeasonYield, getSoilMultiplier, getSoilStatus, MAX_FIELDS, FIELD_MAX_LEVEL } from "~/data/crops";
import { getVeggie, getGardenCost, getGardenBuildTime, getSeedCapacity, getEffectiveGardenRate, canPlantVeggie, isVeggieProducing, isSeedUnlocked, MAX_GARDENS, GARDEN_MAX_LEVEL } from "~/data/gardens";
import { getAnimal, getPenCost, getPenBuildTime, getPenProduction, PEN_MAX_LEVEL } from "@medieval-realm/shared/data/livestock";
import { ANIMAL_FEED, FEED_CATEGORY_ICON, FEED_CATEGORY_LABEL, FOOD_CATEGORY, isGrazer, calcGrazingCapacity, type FeedCategory } from "~/data/animalFeed";
import type { FoodItemType } from "~/data/foods";
import { getHiveCost, getHiveBuildTime, getHoneyRate, HIVE_MAX_LEVEL, APIARY_IMAGE, APIARY } from "~/data/apiary";
import SeedIcon from "~/components/SeedIcon";
import { getFruit, getOrchardCost, getOrchardBuildTime, getOrchardRate, getOrchardStatus, isOrchardActive, ORCHARD_MAX_LEVEL } from "~/data/orchards";
import { SEASON_META } from "~/data/seasons";
import { QUEST_DEFINITIONS, isQuestActive } from "~/data/quests";
import Countdown from "~/components/Countdown";
import { UpgradeIndicator } from "~/components/UpgradeIndicator";
import Tooltip from "~/components/Tooltip";
import { formatTimeLong as formatTime } from "~/utils/format";
import type { JSX } from "solid-js";

function fieldSeasonStatus(season: string, level: number, isHarvesting: boolean): { label: string; color: string } {
  if (level === 0) return { label: "Under construction", color: "var(--accent-blue)" };
  switch (season) {
    case "spring": return { label: "🌱 Planted — growing", color: "var(--accent-green)" };
    case "summer": return { label: "☀️ Growing", color: "var(--accent-green)" };
    case "autumn":
      if (isHarvesting) return { label: "🌾 Harvesting!", color: "#d4831a" };
      return { label: "✅ Harvest gathered", color: "var(--accent-red)" };
    case "winter": return { label: "❄️ Dormant until spring", color: "var(--text-muted)" };
    default: return { label: "", color: "" };
  }
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
    return Math.max(0, Math.floor(base * mult));
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
  const soilStatus = () => getSoilStatus(props.field.sameCropStreak);
  /** Effective max level — gated by the Town Hall level just like buildings.
   *  FIELD_MAX_LEVEL remains the absolute ceiling. */
  const effectiveMax = () => Math.min(actions.getTownHallLevel(), FIELD_MAX_LEVEL);
  const upgradeCost = () => props.field.level < FIELD_MAX_LEVEL ? getFieldCost(props.field.level) : null;
  const canUpgrade = () => {
    if (props.field.crop !== null) return false; // can only upgrade empty/fallow fields
    if (props.field.upgrading || props.field.level >= effectiveMax()) return false;
    // Fields can only be worked in winter while the ground is dormant.
    if (state.season !== "winter") return false;
    const cost = upgradeCost();
    return cost ? state.resources.wood >= cost.wood && state.resources.stone >= cost.stone : false;
  };
  /** Human-readable reason the upgrade button is disabled. Shown on hover/tooltip. */
  const upgradeBlockedReason = () => {
    if (props.field.level >= FIELD_MAX_LEVEL) return "Max level reached";
    if (props.field.level >= effectiveMax()) return `Upgrade Town Hall to lvl ${actions.getTownHallLevel() + 1} to raise this cap`;
    if (props.field.upgrading) return "Already upgrading…";
    if (props.field.crop !== null) return "Can't upgrade a planted field";
    if (state.season !== "winter") return "Fields can only be upgraded in winter";
    const cost = upgradeCost();
    if (cost && (state.resources.wood < cost.wood || state.resources.stone < cost.stone)) return "Not enough resources";
    return "";
  };
  const isCurrentlyHarvesting = () => actions.isHarvesting();
  const seasonStatus = () => {
    if (isEmpty()) {
      // In spring the crop picker replaces the status line — no need to also say "Ready to plant".
      if (state.season === "spring") return null;
      if (state.season === "winter") return { label: "❄️ Dormant — time to upgrade", color: "#a5d8ff" };
      return { label: "Resting — ready for next spring", color: "#9b59b6" };
    }
    return fieldSeasonStatus(state.season, props.field.level, isCurrentlyHarvesting());
  };

  // Banner image: only shown when there's an active crop. We deliberately do
  // NOT use lastCrop here — an empty field showing a wheat banner looks
  // identical to a planted one, hiding the crop picker / upgrade button. The
  // rotation memory lives in the soil-status pill below ("Depleted from wheat"),
  // which is more informative anyway.
  const bannerImage = () => crop()?.image;

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
      {/* No-icon fallback when the field has never been planted — the banner
          fills in once the player picks their first crop. Title sits up top;
          the level display is moved below the plant picker so the prompt leads
          the card and the metadata follows. */}
      <Show when={bannerImage()} fallback={
        <div style={{ "margin-bottom": "4px", position: "relative" }}>
          <div class="building-card-title">{cardTitle()}</div>
          <Show when={isEmpty() && !props.field.upgrading && state.season === "winter" && props.field.level < FIELD_MAX_LEVEL && upgradeCost()}>
            <UpgradeIndicator
              level={props.field.level}
              canAct={canUpgrade()}
              costTip={`🪵 ${upgradeCost()!.wood} 🪨 ${upgradeCost()!.stone} · ${formatTime(getFieldBuildTime(props.field.level))}`}
              blockedReason={upgradeBlockedReason()}
              onClick={() => actions.upgradeField(props.field.id)}
            />
          </Show>
        </div>
      }>
        <div class="building-card-image">
          <img src={bannerImage()} alt="" loading="lazy" />
          <div class="building-card-image-overlay" style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end" }}>
            <div>
              <div class="building-card-title">{cardTitle()}</div>
              <div class="building-card-level">
                {props.field.level === 0 ? "Building..." : `Level ${props.field.level} / ${effectiveMax()}`}
              </div>
            </div>
            <Show when={isEmpty() && !props.field.upgrading && state.season === "winter" && props.field.level < FIELD_MAX_LEVEL && upgradeCost()}>
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
          {props.field.level === 0 ? "Preparing field" : "Upgrading"} — <Countdown remainingSeconds={props.field.upgradeRemaining!} />
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
        {/* Soil status pill — only meaningful once the field has a rotation history */}
        <Show when={props.field.lastCrop !== null}>
          <div style={{
            "font-size": "0.7rem",
            color: soilStatus().color,
            "margin-top": "2px",
            display: "flex",
            gap: "6px",
            "align-items": "center",
            "flex-wrap": "wrap",
          }}>
            <span>🌾 {soilStatus().label}</span>
            <Show when={props.field.restBonus}>
              <span style={{ color: "var(--accent-green)" }}>· 🌿 Rested (+15% next harvest)</span>
            </Show>
          </div>
        </Show>
        <Show when={crop()}>
          <div class="field-card-harvest">
            Expected harvest: <strong>{harvestYield()}</strong> {crop()!.isFood ? "food" : "fiber"}
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
                <Tooltip block text={wouldDeplete()
                  ? `Same crop as last season — soil depletes. Yield: ${preview()} ${c.isFood ? "food" : "fiber"}.`
                  : `Rotating to ${c.name} — fresh soil. Yield: ${preview()} ${c.isFood ? "food" : "fiber"}.`}>
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
                      {wouldDeplete() ? "Same as last — depletes" : "Rotation — fresh soil"}
                    </div>
                  </div>
                </button>
                </Tooltip>
              );
            }}
          </For>
        </div>
        {/* Level readout under the picker — only shown when there's no banner
            image (fresh field). When a banner is present the level is on the
            overlay and this row would be redundant. */}
        <Show when={!bannerImage()}>
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
          src="https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/empty_field.png"
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
          {isSpring() ? "🌱 Fields are planted in spring — plant now!" : "Fields are planted in spring."}
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
  const planted = () => props.garden.plantedYear === state.year;
  const inPlantSeason = () => canPlantVeggie(veggie(), state.season);
  const producing = () => planted() && isVeggieProducing(veggie(), state.season);
  // Seed-driven sowing: the plot holds `capacity` seeds; sow up to that from
  // your stock. Yield scales with how full it is.
  const seedStock = () => state.seeds?.[props.garden.veggie] ?? 0;
  const capacity = () => getSeedCapacity(Math.max(1, props.garden.level));
  // Seeds already sown this cycle (0 if not planted this year), and the room
  // still left to fill — so the player can top up a partially-sown plot (e.g.
  // after an upgrade raised the capacity, or once more seed comes in).
  const sownThisYear = () => planted() ? props.garden.seedsPlanted : 0;
  const roomLeft = () => capacity() - sownThisYear();
  const sowAmount = () => Math.min(seedStock(), roomLeft()); // what we'd sow right now
  const effRate = () => getEffectiveGardenRate(veggie(), Math.max(1, props.garden.level), props.garden.seedsPlanted);
  const partialSow = () => planted() && props.garden.seedsPlanted < capacity();
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
    if (seedStock() <= 0) return `No ${veggie().name.toLowerCase()} seed in store — a harvested plot saves seed for next year`;
    return "";
  };

  const upgradeCost = () => props.garden.level < GARDEN_MAX_LEVEL ? getGardenCost(props.garden.level) : null;
  const canUpgrade = () => {
    if (props.garden.upgrading || props.garden.level >= GARDEN_MAX_LEVEL) return false;
    if (props.garden.level >= 1 && state.season !== "winter") return false;
    if (props.garden.level >= effectiveMax()) return false;
    const c = upgradeCost();
    return c ? state.resources.wood >= c.wood && state.resources.stone >= c.stone : false;
  };
  const upgradeBlockedReason = () => {
    if (props.garden.level >= GARDEN_MAX_LEVEL) return "Max level reached";
    if (props.garden.level >= effectiveMax()) return `Upgrade Town Hall to lvl ${actions.getTownHallLevel() + 1}`;
    if (props.garden.upgrading) return "Already upgrading…";
    if (props.garden.level >= 1 && state.season !== "winter") return "Gardens can only be upgraded in winter";
    const c = upgradeCost();
    if (c && (state.resources.wood < c.wood || state.resources.stone < c.stone)) return "Not enough resources";
    return "";
  };

  // ── Status line ─────────────────────────────────────────────────────
  const statusLine = (): { label: string; color: string } | null => {
    if (producing()) {
      const partial = partialSow() ? ` (${props.garden.seedsPlanted}/${capacity()} sown)` : "";
      return { label: `Producing: +${effRate()}/h ${veggie().name.toLowerCase()}${partial}`, color: "var(--accent-green)" };
    }
    if (planted() && !isVeggieProducing(veggie(), state.season)) {
      return { label: "Planted — waiting to produce", color: "var(--text-secondary)" };
    }
    if (props.garden.level > 0 && inPlantSeason() && !planted()) {
      return { label: `Time to plant — ${sowAmount()}/${capacity()} seed ready`, color: "var(--accent-gold)" };
    }
    if (props.garden.level > 0) return { label: `Not planted — sow in ${veggie().plantSeasons.join(", ")}`, color: "var(--text-muted)" };
    return null;
  };

  // "Plant in 🌸 · Produces in ☀️ 🍂" — the "Plant in" part is highlighted green
  // when we're currently in a plantable season, red otherwise. Helps the player
  // see at a glance whether they can sow this veggie right now.
  const renderCycleHint = () => (
    <>
      <span style={{
        color: inPlantSeason() ? "var(--accent-green)" : "var(--accent-red)",
        "font-weight": 600,
      }}>
        Plant in {veggie().plantSeasons.map((s) => SEASON_META[s].icon).join(" ")}
      </span>
      {" · Produces in "}
      {veggie().produceSeasons.map((s) => SEASON_META[s].icon).join(" ")}
    </>
  );

  const showUpgradeIndicator = () =>
    !props.garden.upgrading &&
    props.garden.level < GARDEN_MAX_LEVEL &&
    (props.garden.level === 0 || state.season === "winter");
  const indicatorCostTip = () => {
    const c = props.garden.level === 0 ? buildCost() : upgradeCost();
    return c ? `🪵 ${c.wood} 🪨 ${c.stone} · ${formatTime(getGardenBuildTime(props.garden.level))}` : "";
  };
  const indicatorBlockedReason = () => props.garden.level === 0
    ? (!inPlantSeason()
        ? `Can't sow ${veggie().name.toLowerCase()} this season — build when it's ${veggie().plantSeasons.join(" or ")}`
        : (canBuild() ? "" : "Not enough resources"))
    : upgradeBlockedReason();
  const indicatorCanAct = () => props.garden.level === 0 ? canBuild() : canUpgrade();

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

        <div class="building-card-desc">{veggie().description}</div>
        <div style={{ "font-size": "0.7rem", color: "var(--text-muted)" }}>
          {renderCycleHint()}
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

        <div class="building-card-desc">{veggie().description}</div>

        <Show when={props.garden.upgrading && props.garden.upgradeRemaining}>
          <div class="building-card-upgrading">
            {props.garden.level === 0 ? "Preparing garden" : "Upgrading"} — <Countdown remainingSeconds={props.garden.upgradeRemaining!} />
          </div>
        </Show>

        <Show when={!props.garden.upgrading && statusLine()}>
          {(s) => <div class="building-card-production" style={{ color: s().color }}>{s().label}</div>}
        </Show>

        <Show when={!props.garden.upgrading}>
          <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-top": "2px" }}>
            {renderCycleHint()}
          </div>
        </Show>

        {/* Seed store readout — bigger plots need more seed to run at full rate */}
        <Show when={!props.garden.upgrading && props.garden.level > 0}>
          <div style={{ "font-size": "0.7rem", color: "var(--text-secondary)", "margin-top": "4px", display: "flex", "align-items": "center", gap: "5px" }}>
            <span><SeedIcon id={veggie().id} size={16} /> {seedStock()} {veggie().name.toLowerCase()} seed in store</span>
            <span style={{ color: "var(--text-muted)" }}>· plot holds {capacity()}</span>
          </div>
        </Show>

        {/* Plant action — shown while the plot has room to sow this cycle, so a
            partially-filled plot (e.g. after an upgrade) can be topped up. */}
        <Show when={!props.garden.upgrading && props.garden.level > 0 && roomLeft() > 0}>
          <Tooltip block style={{ "margin-top": "8px" }} text={canPlant() ? "" : plantBlockedReason()}>
          <button
            class="field-upgrade-btn"
            style={{ width: "100%" }}
            disabled={!canPlant()}
            onClick={() => actions.plantGarden(props.garden.id)}
          >
            {seedStock() <= 0
              ? "No seed to sow"
              : sownThisYear() > 0
                ? `Sow ${sowAmount()} more ${veggie().name.toLowerCase()} seed (${sownThisYear() + sowAmount()}/${capacity()})`
                : `Sow ${sowAmount()} ${veggie().name.toLowerCase()} seed${sowAmount() < capacity() ? ` (plot holds ${capacity()})` : ""}`}
          </button>
          </Tooltip>
        </Show>
      </div>
    </Show>
    </Show>
  );
}

// ─── Pen Card ────────────────────────────────────────────────────

function PenCard(props: { pen: PlayerPen }) {
  const { actions, state } = useGame();
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

  const prod = () => props.pen.level > 0 ? getPenProduction(animal(), props.pen.level) : { produced: 0, consumed: 0, secondary: undefined as any };
  const productionLine = () => {
    const p = prod();
    let line = `Producing: +${p.produced}/h ${animal().foodLabel.toLowerCase()}`;
    if (p.secondary) line += `, +${p.secondary.amount}/h ${p.secondary.resource}`;
    return line;
  };

  // Grazing — sheep and goats can feed off fallow fields before dipping into the pantry
  const grazingPerHour = () => calcGrazingCapacity(state.fields);
  const totalGrazerDemand = () => {
    let d = 0;
    for (const p of state.pens) {
      if (p.level === 0 || !isGrazer(p.animal)) continue;
      d += getPenProduction(getAnimal(p.animal), p.level).consumed;
    }
    return d;
  };
  const grazingForThisPen = () => {
    if (!isGrazer(props.pen.animal) || totalGrazerDemand() === 0) return 0;
    const share = prod().consumed / totalGrazerDemand();
    return grazingPerHour() * share;
  };
  const grazingCovered = () => Math.min(prod().consumed, grazingForThisPen());
  const pantryNeed = () => Math.max(0, prod().consumed - grazingCovered());

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
    if (props.pen.level >= 1 && state.season !== "winter") return false;
    if (props.pen.level >= effectiveMax()) return false;
    const c = upgradeCost();
    return c ? state.resources.wood >= c.wood && state.resources.stone >= c.stone && state.resources.gold >= c.gold : false;
  };
  const upgradeBlockedReason = () => {
    if (props.pen.level >= PEN_MAX_LEVEL) return "Max level reached";
    if (props.pen.level >= effectiveMax()) return `Upgrade Town Hall to lvl ${actions.getTownHallLevel() + 1}`;
    if (props.pen.upgrading) return "Already upgrading…";
    if (props.pen.level >= 1 && state.season !== "winter") return "Pens can only be upgraded in winter";
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
    props.pen.level < PEN_MAX_LEVEL &&
    (props.pen.level === 0 || state.season === "winter");
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

        <div class="building-card-desc">{animal().description}</div>
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

        <div class="building-card-desc">{animal().description}</div>

        <Show when={props.pen.upgrading && props.pen.upgradeRemaining}>
          <div class="building-card-upgrading">
            {props.pen.level === 0 ? "Building pen" : "Upgrading"} — <Countdown remainingSeconds={props.pen.upgradeRemaining!} />
          </div>
        </Show>

        <Show when={!props.pen.upgrading && props.pen.level > 0}>
          <Show when={props.pen.starving}>
            <div class="building-card-production" style={{ color: "var(--accent-red)" }}>
              ⚠️ Starving — not producing
            </div>
          </Show>
          <Show when={!props.pen.starving}>
            <div class="building-card-production">{productionLine()}</div>
          </Show>
          <Show when={grazingCovered() > 0}>
            <div class="building-card-production" style={{ color: "var(--accent-green)" }}>
              🌿 Grazing: covers -{grazingCovered().toFixed(1)}/h food
            </div>
          </Show>
          <Show when={pantryNeed() > 0}>
            <div class="building-card-production" style={{ color: "var(--text-secondary)" }}>
              Eats: <span style={{ color: "var(--accent-gold)" }}>{pantryNeed().toFixed(1)}/h</span>
              {" · "}
              <For each={ANIMAL_FEED[props.pen.animal]}>
                {(cat, i) => (
                  <>
                    {i() > 0 ? " · " : null}
                    <span style={{
                      color: categoryHasFood(cat) ? "var(--text-secondary)" : "var(--accent-red)",
                      "font-weight": categoryHasFood(cat) ? "normal" : 600,
                    }}>
                      {FEED_CATEGORY_ICON[cat]} {FEED_CATEGORY_LABEL[cat]}
                    </span>
                  </>
                )}
              </For>
            </div>
          </Show>
          <Show when={pantryNeed() === 0 && grazingCovered() > 0 && grazingCovered() >= prod().consumed}>
            <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-top": "2px" }}>
              Fully covered by grazing — no pantry cost
            </div>
          </Show>
        </Show>
      </div>
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

  const upgradeCost = () => props.hive.level < HIVE_MAX_LEVEL ? getHiveCost(props.hive.level) : null;
  const canUpgrade = () => {
    if (props.hive.upgrading || props.hive.level >= HIVE_MAX_LEVEL) return false;
    if (props.hive.level >= 1 && state.season !== "winter") return false;
    if (props.hive.level >= effectiveMax()) return false;
    const c = upgradeCost();
    return c ? state.resources.wood >= c.wood && state.resources.stone >= c.stone && state.resources.gold >= c.gold : false;
  };
  const upgradeBlockedReason = () => {
    if (props.hive.level >= HIVE_MAX_LEVEL) return "Max level reached";
    if (props.hive.level >= effectiveMax()) return `Upgrade Town Hall to lvl ${actions.getTownHallLevel() + 1}`;
    if (props.hive.upgrading) return "Already upgrading…";
    if (props.hive.level >= 1 && state.season !== "winter") return "Hives can only be upgraded in winter";
    const c = upgradeCost();
    if (c && (state.resources.wood < c.wood || state.resources.stone < c.stone || state.resources.gold < c.gold)) return "Not enough resources";
    return "";
  };

  const showUpgradeIndicator = () =>
    !props.hive.upgrading &&
    props.hive.level < HIVE_MAX_LEVEL &&
    (props.hive.level === 0 || state.season === "winter");
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

        <div class="building-card-desc">
          A simple wooden hive. Bees produce honey in warm months and hibernate through winter.
        </div>
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

        <div class="building-card-desc">
          A simple wooden hive. Bees produce honey in warm months and hibernate through winter.
        </div>

        <Show when={props.hive.upgrading && props.hive.upgradeRemaining}>
          <div class="building-card-upgrading">
            {props.hive.level === 0 ? "Building hive" : "Upgrading"} — <Countdown remainingSeconds={props.hive.upgradeRemaining!} />
          </div>
        </Show>

        <Show when={!props.hive.upgrading && props.hive.level > 0}>
          <div class="building-card-production" style={{ color: isDormant() ? "var(--text-muted)" : "var(--accent-gold)" }}>
            {isDormant() ? "Dormant — no honey until spring" : `Producing: +${honeyRate()}/h honey`}
            <Show when={!isDormant() && seasonMod() < 1}>
              <span style={{ color: "var(--accent-gold)", "font-size": "0.7rem", "margin-left": "4px" }}>
                ({Math.round(seasonMod() * 100)}% — {state.season})
              </span>
            </Show>
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

  const rate = () => props.orchard.level > 0 && props.orchard.mature && isOrchardActive(fruitDef(), state.season)
    ? getOrchardRate(fruitDef(), props.orchard.level) : 0;
  const status = () => props.orchard.level > 0 && !props.orchard.upgrading
    ? getOrchardStatus(fruitDef(), state.season, props.orchard.mature, props.orchard.seasonsGrown) : "";

  const upgradeCost = () => props.orchard.level < ORCHARD_MAX_LEVEL ? getOrchardCost(props.orchard.level) : null;
  const canUpgrade = () => {
    if (props.orchard.upgrading || props.orchard.level >= ORCHARD_MAX_LEVEL) return false;
    if (props.orchard.level >= 1 && state.season !== "winter") return false;
    if (props.orchard.level >= effectiveMax()) return false;
    const c = upgradeCost();
    return c ? state.resources.wood >= c.wood && state.resources.stone >= c.stone && state.resources.gold >= c.gold : false;
  };
  const upgradeBlockedReason = () => {
    if (props.orchard.level >= ORCHARD_MAX_LEVEL) return "Max level reached";
    if (props.orchard.level >= effectiveMax()) return `Upgrade Town Hall to lvl ${actions.getTownHallLevel() + 1}`;
    if (props.orchard.upgrading) return "Already upgrading…";
    if (props.orchard.level >= 1 && state.season !== "winter") return "Orchards can only be upgraded in winter";
    const c = upgradeCost();
    if (c && (state.resources.wood < c.wood || state.resources.stone < c.stone || state.resources.gold < c.gold)) return "Not enough resources";
    return "";
  };

  const showUpgradeIndicator = () =>
    !props.orchard.upgrading &&
    props.orchard.level < ORCHARD_MAX_LEVEL &&
    (props.orchard.level === 0 || state.season === "winter");
  const indicatorCostTip = () => {
    const c = props.orchard.level === 0 ? buildCost() : upgradeCost();
    return c ? `🪵 ${c.wood} 🪨 ${c.stone} 🪙 ${c.gold} · ${formatTime(getOrchardBuildTime(props.orchard.level))}` : "";
  };
  const indicatorBlockedReason = () => props.orchard.level === 0 ? buildBlockedReason() : upgradeBlockedReason();
  const indicatorCanAct = () => props.orchard.level === 0 ? canBuild() : canUpgrade();

  return (
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

        <div class="building-card-desc">{fruitDef().description}</div>
        <div style={{ "font-size": "0.7rem", color: "var(--text-muted)" }}>
          Harvests: {fruitDef().harvestSeasons.map((s) => SEASON_META[s].icon).join(" ")} · {fruitDef().maturationSeasons} seasons to mature
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

        <div class="building-card-desc">{fruitDef().description}</div>

        <Show when={props.orchard.upgrading && props.orchard.upgradeRemaining}>
          <div class="building-card-upgrading">
            {props.orchard.level === 0 ? "Planting" : "Upgrading"} — <Countdown remainingSeconds={props.orchard.upgradeRemaining!} />
          </div>
        </Show>

        <Show when={!props.orchard.upgrading && props.orchard.level > 0}>
          <div class="building-card-production" style={{ color: rate() > 0 ? "var(--accent-green)" : "var(--text-muted)" }}>
            {rate() > 0 ? `Producing: +${rate()}/h fruit` : status()}
          </div>
          <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-top": "2px" }}>
            Harvests: {fruitDef().harvestSeasons.map((s) => SEASON_META[s].icon).join(" ")}
          </div>
        </Show>
      </div>
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
  const villageUnlocked = () => townHallLevel() >= 3;     // fields, livestock, apiary, orchards

  return (
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
          🌾 <strong>Tip — rotate your crops.</strong> Planting the same crop
          in the same field year after year depletes the soil and cuts yield.
          Rotating between wheat, barley, and flax keeps fields healthy.
          Leaving a field empty through a season grants a <em>+15% rested</em>
          bonus on the next harvest.
        </div>
      </Show>

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
        <Show when={state.fields.some((f) => f.level >= 1 && f.crop === null)}>
          <div class="farming-stat">
            <span class="farming-stat-label">Grazing</span>
            <span class="farming-stat-value" style={{ color: "var(--accent-green)" }}>
              +{calcGrazingCapacity(state.fields)}/h (sheep/goats)
            </span>
          </div>
        </Show>
      </div>

      <Show when={state.season === "autumn" && actions.isHarvesting()}>
        <div class="harvest-banner">🍂 Harvest in progress! Your fields are yielding grain.</div>
      </Show>
      <Show when={state.season === "winter"}>
        <div class="winter-banner">❄️ Winter — fields and gardens are dormant. Survive on stored food, hunting, fishing, and livestock.</div>
      </Show>

      {/* ── Fields ── Village-scale: acreage, ploughing, draft animals. Not a
          camp's work — opens with the Town Hall reaching Village (Lv.3). */}
      <h2 class="farming-section-title">🌾 Fields</h2>
      <LockedShell locked={!villageUnlocked()} reason="Locked until your settlement becomes a Village (Town Hall Lv.3)">
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
          Fields can only be planted in spring. You can build one now, but it will sit empty until next spring. Consider planting in a <strong>garden</strong> instead. Each veggie has its own planting window, so there's almost always something you can sow.
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

      {/* ── Gardens ── */}
      <h2 class="farming-section-title" style={{ "margin-top": "28px" }}>🥬 Gardens</h2>
      <LockedShell locked={!gardensUnlocked()} reason="Locked until your camp grows (Settlement chapter 2)">
        <div class="fields-grid">
          <For each={state.gardens}>{(g) => <GardenCard garden={g} />}</For>
        </div>
      </LockedShell>

      {/* ── Livestock ── Deferred to Village (Town Hall Lv.3). A shepherd and a
          flock are settled-life, not camp survival; this matches the "Woolly
          Friends" quest, which also waits for Village. */}
      <h2 class="farming-section-title" style={{ "margin-top": "28px" }}>🐄 Livestock</h2>
      <LockedShell locked={!villageUnlocked()} reason="Locked until your settlement becomes a Village (Town Hall Lv.3)">
        <div class="fields-grid">
          <For each={state.pens}>{(p) => <PenCard pen={p} />}</For>
        </div>
      </LockedShell>

      {/* ── Apiary ── */}
      <h2 class="farming-section-title" style={{ "margin-top": "28px" }}>🐝 Apiary</h2>
      <LockedShell locked={!villageUnlocked()} reason="Locked until your settlement becomes a Village (Town Hall Lv.3)">
        <div class="fields-grid">
          <For each={state.hives}>{(h) => <HiveCard hive={h} />}</For>
        </div>
      </LockedShell>

      {/* ── Orchards ── */}
      <h2 class="farming-section-title" style={{ "margin-top": "28px" }}>🌳 Orchards</h2>
      <LockedShell locked={!villageUnlocked()} reason="Locked until your settlement becomes a Village (Town Hall Lv.3)">
        <div class="fields-grid">
          <For each={state.orchards}>{(o) => <OrchardCard orchard={o} />}</For>
        </div>
      </LockedShell>
    </div>
  );
}
