import { Show, For } from "solid-js";
import { A } from "@solidjs/router";
import {
  BUILDINGS,
  isBuildingUnlocked,
  isBuildingChapterUnlocked,
  getTierPrerequisitesMet,
  getUnlockRequirement,
  getUnlockReasons,
  getNextLevelRequirement,
  applyMasonCostReduction,
  applyMasonTimeReduction,
  getRepairCost,
  getRepairTime,
  DAMAGE_LOWERS_LEVEL,
  getBuildingImage,
  isStaffable,
  buildingWorkspace,
  gatheringSeasonMod,
  GATHERING_SEASON_MOD,
  getSettlementTier,
  getSettlementName,
  townHallTreasury,
  PANIC_BUILD_IDS,
  PANIC_BUILD_SHARD_COST,
} from "~/data/buildings";
import { type Season, IS_DEV, getGlobalSeason, SEASON_ELAPSED_SPAN } from "~/data/seasons";
import { totalPopulation } from "~/data/citizens";
import { getTotalFood } from "~/data/foods";
import { getCurrentDeity } from "~/data/deities";
import { RESOURCES } from "~/data/resources";
import { useGame, CRAFTING_RECIPES, getBuildingToolsForBuilding } from "~/engine/gameState";

const SEASONS: { key: Season; icon: string; label: string }[] = [
  { key: "spring", icon: "🌱", label: "Spring" },
  { key: "summer", icon: "☀️", label: "Summer" },
  { key: "autumn", icon: "🍂", label: "Autumn" },
  { key: "winter", icon: "❄️", label: "Winter" },
];

/** A building-effect string is several bonuses joined by " · " or newlines;
 *  split them so the green box can list one per row. */
const effectRows = (text: string): string[] => text.split(/ · |\n/).map((s) => s.trim()).filter(Boolean);
import Countdown from "~/components/Countdown";
import Tooltip from "~/components/Tooltip";
import FramedModal from "~/components/FramedModal";
import BuildingStaffSection from "~/components/BuildingStaffSection";
import KennelDogs from "~/components/KennelDogs";
import { TAVERN_COMMODITY_DRINKS } from "~/data/tavern";
import { formatTimeLong as formatTime } from "~/utils/format";

const COST_RESOURCES = RESOURCES.filter((r) => r.id === "wood" || r.id === "stone");

interface Props {
  buildingId: string;
  onClose: () => void;
}

/**
 * The building hub — one modal for every building, opened from its card. Holds
 * everything the old /buildings/:id page did (build/upgrade/repair/panic/cancel,
 * production preview) plus the staff section and any building-specific control
 * (the cistern sluice). Buildings with a dedicated workspace page (crafting,
 * tavern, guild, market) get a summary + an "Open ..." link instead of an embed.
 */
export default function BuildingModal(props: Props) {
  const { state, actions } = useGame();

  const id = () => props.buildingId;
  const building = () => BUILDINGS.find((b) => b.id === id());
  const playerBuilding = () => state.buildings.find((b) => b.buildingId === id());
  const level = () => playerBuilding()?.level ?? 0;

  const unlocked = () => {
    const b = building();
    return b ? isBuildingUnlocked(b, actions.getTownHallLevel()) && isBuildingChapterUnlocked(b, state) : false;
  };

  // The specific conditions this building is still waiting on (quest, chapter,
  // prereq building, or tier). Falls back to the tier requirement so we never
  // show an empty locked banner.
  const unlockReasons = () => {
    const b = building();
    if (!b) return [] as string[];
    const reasons = getUnlockReasons(b, state);
    return reasons.length > 0 ? reasons : [getUnlockRequirement(b)];
  };

  const currentLevel = () => {
    const pb = playerBuilding();
    const b = building();
    if (!b || !pb || pb.level === 0) return null;
    return b.levels[pb.level - 1];
  };

  const effectiveMax = () => actions.getEffectiveMaxLevel(id());

  const nextLevel = () => {
    const b = building();
    if (!b) return null;
    if (level() >= effectiveMax()) return null;
    return b.levels[level()];
  };

  const masonLevel = () => actions.getMasonLevel();
  const effectiveMasonLvl = () => id() === "masons_guild" ? 0 : masonLevel();

  const adjustedCost = () => {
    const next = nextLevel();
    if (!next) return null;
    return applyMasonCostReduction(next.cost, effectiveMasonLvl());
  };
  const adjustedTime = () => {
    const next = nextLevel();
    if (!next) return null;
    return applyMasonTimeReduction(next.buildTime, effectiveMasonLvl());
  };

  const canAffordRes = (resourceId: string) => {
    const cost = adjustedCost();
    if (!cost) return true;
    const amount = cost[resourceId as keyof typeof cost];
    if (amount === undefined) return true;
    const have = state.resources[resourceId as keyof typeof state.resources] as number;
    return have >= amount;
  };

  const queueFull = () => actions.getActiveQueueCount() >= actions.getMasonBonuses().queueSlots;

  const tierPrereqs = () => id() === "town_hall"
    ? getTierPrerequisitesMet(level() + 1, state.buildings)
    : { met: true, missing: [] as string[] };

  const canUpgrade = () => {
    if (!unlocked()) return false;
    const cost = adjustedCost();
    if (!cost) return false;
    if (playerBuilding()?.upgrading) return false;
    if (queueFull()) return false;
    if (!tierPrereqs().met) return false;
    return actions.canAfford(cost);
  };

  const panicEligible = () => {
    if (!PANIC_BUILD_IDS.includes(id())) return false;
    const pb = playerBuilding();
    if (!pb || pb.level > 0 || pb.upgrading) return false;
    if (!tierPrereqs().met) return false;
    const cost = adjustedCost();
    if (!cost) return false;
    return !actions.canAfford(cost);
  };
  const canPanicBuild = () => panicEligible() && state.astralShards >= PANIC_BUILD_SHARD_COST;

  const nextLevelReq = () => {
    const b = building();
    if (!b) return null;
    return getNextLevelRequirement(b, actions.getTownHallLevel());
  };

  const image = () => getBuildingImage(building()!, level());
  const workspace = () => buildingWorkspace(id());
  const sluiceOpen = () => state.cisternSluiceOpen ?? false;

  // Live crafting status — what's on the bench + what's queued behind it.
  const isCraftingBuilding = () => CRAFTING_RECIPES.some((r) => r.building === id());
  const buildingCrafts = () => state.craftingQueue.filter(
    (c) => CRAFTING_RECIPES.find((r) => r.id === c.recipeId)?.building === id(),
  );
  const activeCraft = () => buildingCrafts().find((c) => !c.pending);
  const queuedCount = () => buildingCrafts().filter((c) => c.pending).length;
  const recipeOf = (recipeId: string) => CRAFTING_RECIPES.find((r) => r.id === recipeId);

  // Tools installable at this building (the system currently has the Kitchen's
  // cutting board; more later). Read-only here — you craft/install at the bench.
  const tools = () => getBuildingToolsForBuilding(id());
  const installedTools = () => state.buildingTools?.[id()] ?? [];

  // Food-gathering buildings thin toward winter — show the whole year at a glance.
  const isGathering = () => GATHERING_SEASON_MOD[id()] != null;

  // Current-output card: the ACTUAL rate (base × season × staff coverage) plus a
  // status line explaining any shortfall — so it reads distinct from the upgrade
  // preview (which shows base rates).
  const prodSeasonMod = () => gatheringSeasonMod(id(), state.season) ?? 1;
  const prodStaff = () => isStaffable(id()) ? actions.getBuildingStaffing(id()) : null;
  // Hunting dogs posted to the camp boost its whole catch (+8%/hunt level, capped).
  const huntDogBoost = () => id() === "hunting_camp"
    ? Math.min(0.5, state.keptAnimals.reduce((b, a) => a.job === "hunt" ? b + 0.08 * Math.max(1, a.huntLevel) : b, 0))
    : 0;
  const gatherMult = () => prodSeasonMod() * (prodStaff()?.multiplier ?? 1) * (1 + huntDogBoost());
  const currentProdRate = () => Math.floor((currentLevel()?.production?.rate ?? 0) * gatherMult());
  // Hunting camp secondary yields (leather ×1.0, bone ×0.6 per level), same
  // modifiers. Kept fractional (they accrue slowly) so small rates still read.
  const huntLeatherRate = () => level() * 1.0 * gatherMult();
  const huntBoneRate = () => level() * 0.6 * gatherMult();
  const foragerFiberRate = () => level() * 1.5 * gatherMult();
  // Iron mine has no `production` field (hardcoded 8/level); staff-adjusted here.
  const ironRate = () => Math.floor(8 * level() * (prodStaff()?.multiplier ?? 1));
  const prodStatus = (): string[] => {
    const parts: string[] = [];
    const st = prodStaff();
    if (st && st.active < st.capacity) parts.push(`short-handed (${Math.round(st.multiplier * 100)}% output)`);
    if (prodSeasonMod() < 1) parts.push(`${state.season} lull (${Math.round(prodSeasonMod() * 100)}% yield)`);
    return parts;
  };

  // Town Hall gates everything: its level is the cap on every other building's
  // level (getEffectiveMaxLevel = min(TH, maxLevel)), and it advances the
  // settlement tier (Camp→Village→Town→City), which unlocks new buildings.
  const currentTier = () => getSettlementTier(level());
  const nextTier = () => getSettlementTier(level() + 1);
  const tierAdvances = () => nextTier() !== currentTier();

  // Houses raise the population cap. Occupancy = townsfolk + living adventurers
  // (both take a bed); growth stalls near the cap and overcrowding saps happiness.
  const occupancy = () => totalPopulation(state.citizens) + state.adventurers.filter((a) => a.alive).length;
  const popCap = () => actions.getMaxPopulation();
  const housingRatio = () => { const c = popCap(); return c > 0 ? occupancy() / c : 1; };

  // Pantry — food headroom. At/over the cap, surplus food spoils before it's eaten.
  const foodStored = () => getTotalFood(state.foods);
  const foodCap = () => actions.getStorageCaps().food;
  const foodRatio = () => { const c = foodCap(); return c > 0 ? foodStored() / c : 1; };

  // Repair — a mending job (30% of the level's build cost + time). The building
  // stays damaged while it runs, so repair is the ONLY action shown when broken.
  const repairCost = () => getRepairCost(building()!, level());
  const repairTime = () => getRepairTime(building()!, level());
  const isRepairing = () => playerBuilding()?.repairRemaining != null;
  const canRepairNow = () => state.resources.wood >= repairCost().wood && state.resources.stone >= repairCost().stone;

  // Shrine — today's rotating deity + whether an offering's been made (full
  // rotation stays on the Shrine page; this is just the at-a-glance status).
  const shrineDeity = () => {
    const info = IS_DEV ? { season: state.season, progress: state.seasonElapsed / SEASON_ELAPSED_SPAN } : getGlobalSeason();
    return getCurrentDeity(info.season, info.progress);
  };
  const offeringGiven = () => state.activeBlessing?.deityId === shrineDeity().id;
  // Buildings the next tier opens up (tier-gated AND past their story gate, so we
  // only promise ones that will actually appear). Empty unless the level advances.
  const unlockedNextTier = () => tierAdvances()
    ? BUILDINGS.filter((b) => b.requiredTier === nextTier() && isBuildingChapterUnlocked(b, state))
    : [];

  return (
    <Show when={building()}>
      {(b) => (
        <FramedModal
          image={image()}
          icon={b().icon}
          title={b().name}
          subtitle={
            !unlocked()
              ? unlockReasons().join(" · ")
              : level() === 0
                ? "Not yet built"
                : `Level ${level()} / ${effectiveMax()}${effectiveMax() < b().maxLevel ? ` (max ${b().maxLevel})` : ""}`
          }
          onClose={props.onClose}
          maxWidth="640px"
        >
                <p style={{ color: "var(--text-secondary)", "font-size": "0.88rem", "line-height": 1.5, "margin-bottom": "22px" }}>
                  {b().description}
                </p>

                <Show when={!unlocked()}>
                  <div style={{
                    padding: "12px", background: "rgba(106, 100, 88, 0.1)", border: "1px solid var(--text-muted)",
                    color: "var(--text-muted)", "text-align": "center", "font-size": "0.85rem",
                    display: "flex", "flex-direction": "column", gap: "4px",
                  }}>
                    <For each={unlockReasons()}>
                      {(reason) => <div>{reason}</div>}
                    </For>
                  </div>
                </Show>

                <Show when={unlocked()}>
                  {/* A damaged building isn't operating — hide its working sections
                      (staff, production, management) and show only the repair below. */}
                  <Show when={!playerBuilding()?.damaged}>
                  {/* Houses — the settlement's living headroom (why you build them). */}
                  <Show when={id() === "houses"}>
                    {(() => {
                      const over = () => occupancy() > popCap();
                      const near = () => !over() && housingRatio() >= 0.9;
                      const accent = () => over() ? "var(--accent-red)" : near() ? "var(--accent-gold)" : "var(--accent-green)";
                      return (
                        <div style={{ "margin-bottom": "22px", padding: "12px 14px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                          <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "0.6px", "margin-bottom": "8px" }}>Housing</div>
                          <div style={{ display: "flex", "align-items": "baseline", gap: "8px" }}>
                            <span style={{ "font-size": "1.15rem" }}>🏠 <b>{occupancy()}</b> / {popCap()}</span>
                            <span style={{ "font-size": "0.78rem", color: "var(--text-muted)" }}>sheltered</span>
                          </div>
                          <div style={{ "margin-top": "8px", height: "6px", background: "var(--bg-primary)", "border-radius": "3px", overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, housingRatio() * 100)}%`, height: "100%", background: accent(), transition: "width 0.3s" }} />
                          </div>
                          <div style={{ "font-size": "0.8rem", color: accent(), "margin-top": "8px", "line-height": 1.45 }}>
                            {over()
                              ? "Overcrowded — beds are short, and the crush is costing happiness. Build to make room."
                              : near()
                                ? "Nearly full — new folk will stop arriving until there's more shelter."
                                : "Room to grow. Folk arrive while there's shelter, food, and good cheer."}
                          </div>
                        </div>
                      );
                    })()}
                  </Show>

                  {/* Pantry — food headroom (surplus spoils once the cellar is full). */}
                  <Show when={id() === "pantry"}>
                    {(() => {
                      const over = () => foodStored() >= foodCap();
                      const near = () => !over() && foodRatio() >= 0.9;
                      const accent = () => over() ? "var(--accent-red)" : near() ? "var(--accent-gold)" : "var(--accent-green)";
                      return (
                        <div style={{ "margin-bottom": "22px", padding: "12px 14px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                          <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "0.6px", "margin-bottom": "8px" }}>Food stores</div>
                          <div style={{ display: "flex", "align-items": "baseline", gap: "8px" }}>
                            <span style={{ "font-size": "1.15rem" }}>🍞 <b>{Math.floor(foodStored())}</b> / {foodCap()}</span>
                            <span style={{ "font-size": "0.78rem", color: "var(--text-muted)" }}>stored</span>
                          </div>
                          <div style={{ "margin-top": "8px", height: "6px", background: "var(--bg-primary)", "border-radius": "3px", overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, foodRatio() * 100)}%`, height: "100%", background: accent(), transition: "width 0.3s" }} />
                          </div>
                          <div style={{ "font-size": "0.8rem", color: accent(), "margin-top": "8px", "line-height": 1.45 }}>
                            {over()
                              ? "The cellar is full — any more food spoils before it can be eaten. Upgrade to keep more against the winter."
                              : near()
                                ? "Nearly full — surplus will start spoiling soon."
                                : "Room to spare. A deep larder carries the settlement through the lean months."}
                          </div>
                        </div>
                      );
                    })()}
                  </Show>

                  {/* Shrine — today's deity + offering status (rotation lives on the page). */}
                  <Show when={id() === "shrine" && level() > 0 && !playerBuilding()?.damaged}>
                    <div style={{ "margin-bottom": "22px", padding: "12px 14px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                      <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "0.6px", "margin-bottom": "8px" }}>Today at the shrine</div>
                      <div style={{ display: "flex", "align-items": "center", gap: "8px", "font-size": "1.05rem" }}>
                        <span style={{ "font-size": "1.3rem" }}>{shrineDeity().icon}</span>
                        <b>{shrineDeity().name}</b>
                      </div>
                      <div style={{ "font-size": "0.82rem", "margin-top": "8px", color: offeringGiven() ? "var(--accent-green)" : "var(--text-muted)" }}>
                        {offeringGiven() ? "✓ Offering made — the blessing is upon you today." : "No offering made yet today."}
                      </div>
                    </div>
                  </Show>

                  {/* Tavern — the house at a glance (full management on the page). */}
                  <Show when={id() === "tavern" && level() > 0 && !playerBuilding()?.damaged}>
                    {(() => {
                      const rd = actions.getTavernReadout();
                      const short = rd.servers < rd.serversNeeded;
                      const row = (label: string, value: string, color?: string) => (
                        <div style={{ display: "flex", "justify-content": "space-between", gap: "8px", "font-size": "0.82rem", padding: "3px 0" }}>
                          <span style={{ color: "var(--text-muted)" }}>{label}</span><b style={{ color }}>{value}</b>
                        </div>
                      );
                      return (
                        <div style={{ "margin-bottom": "22px", padding: "12px 14px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                          <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "0.6px", "margin-bottom": "8px" }}>The house tonight</div>
                          {row("🛏️ Beds filled", `${rd.occupiedRooms} / ${rd.rooms}`)}
                          {row("👤 Servers", `${rd.servers} / ${rd.serversNeeded}`, short ? "var(--accent-red)" : undefined)}
                          {row("⭐ Reputation", `${Math.round(rd.reputation)} / 100`)}
                          {row("🪙 Traveler coin", `+${Math.round(rd.goldPerDay)}/day`, "var(--accent-green)")}
                          {row("🍲 Food served", `−${rd.foodPerHour.toFixed(1)}/h`)}
                          <Show when={short}>
                            <div style={{ "font-size": "0.75rem", color: "var(--accent-red)", "margin-top": "6px" }}>Short-staffed — beds sit empty for want of servers.</div>
                          </Show>
                        </div>
                      );
                    })()}
                  </Show>

                  {/* Live crafting status — what's on the bench right now. */}
                  <Show when={isCraftingBuilding() && level() > 0}>
                    <div style={{
                      "margin-bottom": "12px", padding: "10px 12px", background: "var(--bg-card)",
                      border: "1px solid var(--border-color)", "font-size": "0.85rem",
                    }}>
                      <Show
                        when={activeCraft()}
                        fallback={<span style={{ color: "var(--text-muted)", "font-style": "italic" }}>Idle — nothing on the bench.</span>}
                      >
                        {(c) => (
                          <span>
                            <span style={{ color: "var(--accent-green)" }}>{recipeOf(c().recipeId)?.icon} Crafting {recipeOf(c().recipeId)?.name}</span>
                            <Show when={(c().quantity ?? 1) > 1}><span style={{ color: "var(--text-muted)" }}> ×{c().quantity}</span></Show>
                            <Show when={queuedCount() > 0}>
                              <span style={{ color: "var(--text-muted)" }}> · {queuedCount()} more queued</span>
                            </Show>
                          </span>
                        )}
                      </Show>
                    </div>
                  </Show>

                  {/* Kennel: the dog roster lives right here in the modal. */}
                  <Show when={id() === "kennel" && level() > 0 && !playerBuilding()?.damaged}>
                    <div style={{ "margin-bottom": "22px" }}>
                      <KennelDogs />
                    </div>
                  </Show>

                  {/* Workspace link — dense pages stay pages; the modal just points there. */}
                  <Show when={workspace() && level() > 0}>
                    <A
                      href={workspace()!.route}
                      style={{
                        display: "flex", "align-items": "center", "justify-content": "center", gap: "6px",
                        "margin-bottom": "22px", padding: "10px", "text-decoration": "none",
                        background: "rgba(212, 175, 55, 0.12)", border: "1px solid var(--accent-gold)",
                        color: "var(--accent-gold)", "font-size": "0.9rem",
                      }}
                    >
                      {workspace()!.label} →
                    </A>
                  </Show>

                  {/* Tools — installed gear that unlocks/boosts this building's work. */}
                  <Show when={tools().length > 0 && level() > 0}>
                    <div style={{ "margin-bottom": "22px" }}>
                      <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "0.6px", "margin-bottom": "8px" }}>Tools</div>
                      <For each={tools()}>
                        {(t) => {
                          const installed = () => installedTools().includes(t.id);
                          return (
                            <div style={{
                              display: "flex", "align-items": "center", gap: "10px", padding: "8px 10px",
                              background: "var(--bg-card)", border: "1px solid var(--border-color)", "margin-bottom": "6px",
                              opacity: installed() ? "1" : "0.7",
                            }}>
                              <span style={{ "font-size": "1.2rem" }}>{t.icon}</span>
                              <div style={{ flex: "1", "min-width": 0 }}>
                                <div style={{ "font-size": "0.85rem" }}>{t.name}</div>
                                <div style={{ "font-size": "0.72rem", color: "var(--text-muted)" }}>{t.description}</div>
                              </div>
                              <span style={{ "font-size": "0.74rem", "white-space": "nowrap", color: installed() ? "var(--accent-green, #4a9)" : "var(--text-muted)" }}>
                                {installed() ? "✓ installed" : "craft to install"}
                              </span>
                            </div>
                          );
                        }}
                      </For>
                    </div>
                  </Show>

                  {/* Cistern sluice — the one live control on a WHOLE cistern
                      (hidden while damaged; you can't work a cracked one). */}
                  <Show when={id() === "cistern" && level() > 0 && !playerBuilding()?.damaged}>
                    <div style={{
                      "margin-bottom": "22px", padding: "14px", background: "var(--bg-card)",
                      border: `1px solid ${sluiceOpen() ? "var(--accent-blue)" : "var(--accent-gold)"}`,
                    }}>
                      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", gap: "12px", "flex-wrap": "wrap" }}>
                        <div>
                          <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>🚪 The Sluice Gate</div>
                          <div style={{ "font-size": "1.05rem", color: sluiceOpen() ? "var(--accent-blue)" : "var(--accent-gold)" }}>
                            {sluiceOpen() ? "Open — running the reserve low" : "Shut — banking water"}
                          </div>
                        </div>
                        <button class="upgrade-btn" onClick={() => actions.toggleSluice()} style={{ "font-size": "0.85rem", padding: "8px 16px" }}>
                          {sluiceOpen() ? "Shut the sluice" : "Open the sluice"}
                        </button>
                      </div>
                      <div style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-top": "10px", "font-style": "italic", "line-height": 1.4 }}>
                        {sluiceOpen()
                          ? "The stream and rain flow past instead of banking, and the reserve drains low. A downpour can't back up and drown the fields, but you hold no buffer against a heat wave."
                          : "The stream and rain fill the reserve, a buffer to see the crops through dry spells and heat waves. But a downpour landing on a full cistern backs up and drowns the fields."}
                      </div>
                      <div style={{ "font-size": "0.74rem", color: "var(--text-muted)", "margin-top": "6px" }}>
                        Read the year: shut it against a dry year's heat, open it in a wet year's downpours.
                      </div>
                    </div>
                  </Show>

                  {/* Brewery — brewing management, inline (pause a drink to stop it
                      drawing from your stores; the tavern only pours what's on its menu). */}
                  <Show when={id() === "brewery" && level() > 0 && !playerBuilding()?.damaged}>
                    <div style={{ "margin-bottom": "22px" }}>
                      <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "0.6px", "margin-bottom": "8px" }}>Brewing</div>
                      <For each={TAVERN_COMMODITY_DRINKS.filter((d) => d.requiresBuilding === "brewery")}>
                        {(d) => {
                          const minLvl = d.minBuildingLevel ?? 1;
                          const unlocked = () => level() >= minLvl;
                          const paused = () => actions.isBrewingPaused(d.id);
                          const onMenu = () => (state.tavernMenu ?? []).includes(d.id);
                          return (
                            <div style={{
                              display: "flex", "align-items": "center", gap: "10px", padding: "8px 10px",
                              background: "var(--bg-card)", border: "1px solid var(--border-color)",
                              "margin-bottom": "6px", opacity: unlocked() ? "1" : "0.6",
                            }}>
                              <span style={{ "font-size": "1.3rem", filter: unlocked() ? undefined : "grayscale(0.6)" }}>{d.icon}</span>
                              <div style={{ flex: "1", "min-width": "0" }}>
                                <div style={{ "font-size": "0.88rem" }}>{d.name}</div>
                                <Show
                                  when={unlocked()}
                                  fallback={<div style={{ "font-size": "0.72rem", color: "var(--text-muted)" }}>🔒 Unlocks at Brewery Lv.{minLvl}</div>}
                                >
                                  <div style={{ "font-size": "0.72rem", color: "var(--text-muted)" }}>
                                    +{d.producePerBuildingLevel * level()}/h from {d.brewedFrom} (−{d.inputPerBuildingLevel * level()}/h) · barrel {Math.floor(actions.resourceQty(d.resource))}/{d.storageBase + level() * d.storagePerBuildingLevel} · {onMenu() ? "on the menu" : "off the menu"}
                                  </div>
                                </Show>
                              </div>
                              <Show when={unlocked()}>
                                <button
                                  onClick={() => actions.toggleBrewingPaused(d.id)}
                                  style={{
                                    padding: "5px 10px", "font-size": "0.78rem", cursor: "pointer", "white-space": "nowrap",
                                    border: `1px solid ${paused() ? "var(--accent-gold)" : "var(--border-color)"}`,
                                    background: paused() ? "rgba(212, 175, 55, 0.1)" : "transparent",
                                    color: paused() ? "var(--accent-gold)" : "var(--text-secondary)", "border-radius": "0",
                                  }}
                                >
                                  {paused() ? "▶ Resume" : "⏸ Pause"}
                                </button>
                              </Show>
                            </div>
                          );
                        }}
                      </For>
                    </div>
                  </Show>

                  {/* Staff section (folded in from the old StaffManageModal). */}
                  <Show when={isStaffable(id()) && level() > 0}>
                    <BuildingStaffSection buildingId={id()} />
                  </Show>

                  {/* Current production — the ACTUAL rate (season/staff-adjusted) + why. */}
                  <Show when={currentLevel()?.production}>
                    {(prod) => (
                      <div style={{ "margin-bottom": "22px", padding: "10px 12px", background: "var(--bg-card)" }}>
                        <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>Current Production</div>
                        <div style={{ "font-size": "1.1rem", color: "var(--accent-green)" }}>
                          +{currentProdRate()}/h {prod().resource}
                          <Show when={currentProdRate() < prod().rate}>
                            <span style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-left": "6px" }}>(full {prod().rate}/h)</span>
                          </Show>
                        </div>
                        <Show when={id() === "forager_hut"}>
                          <div style={{ "font-size": "0.9rem", color: "var(--accent-green)", "margin-top": "2px" }}>
                            +{foragerFiberRate().toFixed(1)}/h fiber (wild flax)
                          </div>
                          <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-top": "2px" }}>
                            · sometimes turns up medicinal herbs
                          </div>
                        </Show>
                        <Show when={id() === "hunting_camp"}>
                          <div style={{ "font-size": "0.9rem", color: "var(--accent-green)", "margin-top": "2px" }}>
                            +{huntLeatherRate().toFixed(1)}/h leather · +{huntBoneRate().toFixed(1)}/h bone
                          </div>
                        </Show>
                        <div style={{ "font-size": "0.78rem", "margin-top": "6px", color: prodStatus().length ? "var(--accent-gold)" : "var(--accent-green, #4a9)" }}>
                          {prodStatus().length
                            ? prodStatus().map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" · ")
                            : "Steady — staffed and in season, full output."}
                        </div>
                      </div>
                    )}
                  </Show>

                  {/* Iron mine — hardcoded output (no production field), so its own card. */}
                  <Show when={id() === "iron_mine" && level() > 0}>
                    <div style={{ "margin-bottom": "22px", padding: "10px 12px", background: "var(--bg-card)" }}>
                      <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>Current Production</div>
                      <div style={{ "font-size": "1.1rem", color: "var(--accent-green)" }}>+{ironRate()}/h iron</div>
                      <div style={{ "font-size": "0.82rem", color: "var(--text-muted)", "margin-top": "2px" }}>· a chance of gems &amp; astral shards in the deep veins</div>
                      <div style={{ "font-size": "0.78rem", "margin-top": "6px", color: prodStatus().length ? "var(--accent-gold)" : "var(--accent-green, #4a9)" }}>
                        {prodStatus().length
                          ? prodStatus().map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" · ")
                          : "Steady — fully staffed, full output."}
                      </div>
                    </div>
                  </Show>

                  {/* Yield by season — the wild larder thins toward winter. */}
                  <Show when={isGathering() && level() > 0}>
                    <div style={{ "margin-bottom": "22px" }}>
                      <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "0.6px", "margin-bottom": "8px" }}>Yield by season</div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <For each={SEASONS}>
                          {(s) => {
                            const mod = () => gatheringSeasonMod(id(), s.key) ?? 1;
                            const now = () => s.key === state.season;
                            return (
                              <div style={{
                                flex: "1", "text-align": "center", padding: "8px 4px",
                                background: now() ? "rgba(212, 175, 55, 0.12)" : "var(--bg-card)",
                                border: `1px solid ${now() ? "var(--accent-gold)" : "var(--border-color)"}`,
                              }}>
                                <div style={{ "font-size": "1rem" }}>{s.icon}</div>
                                <div style={{ "font-size": "0.66rem", color: "var(--text-muted)" }}>{s.label}</div>
                                <div style={{ "font-size": "0.82rem", color: mod() >= 1 ? "var(--accent-green)" : "var(--accent-gold)" }}>
                                  {Math.round(mod() * 100)}%
                                </div>
                              </div>
                            );
                          }}
                        </For>
                      </div>
                    </div>
                  </Show>

                  {/* Active upgrade with cancel. */}
                  <Show when={playerBuilding()?.upgrading && playerBuilding()?.upgradeRemaining}>
                    <div style={{
                      "margin-bottom": "22px", padding: "12px", background: "rgba(52, 152, 219, 0.1)",
                      border: "1px solid var(--accent-blue)", color: "var(--accent-blue)",
                      display: "flex", "justify-content": "space-between", "align-items": "center",
                    }}>
                      <span>
                        Upgrading to Level {level() + 1} — <Countdown remainingSeconds={playerBuilding()!.upgradeRemaining!} /> remaining
                      </span>
                      <button class="btn-secondary" onClick={() => actions.cancelBuild(id())} style={{ "font-size": "0.8rem" }}>Cancel</button>
                    </div>
                  </Show>
                  </Show>{/* end operational sections (hidden while damaged) */}

                  {/* Action area — repair takes over entirely while damaged; the
                      upgrade flow only shows on a whole building. */}
                  <Show
                    when={playerBuilding()?.damaged}
                    fallback={
                      <>
                        {/* Queue full note. */}
                        <Show when={queueFull() && !playerBuilding()?.upgrading}>
                          <div style={{
                            "margin-bottom": "22px", padding: "10px", background: "rgba(245, 197, 66, 0.1)",
                            border: "1px solid var(--accent-gold)", color: "var(--accent-gold)", "font-size": "0.85rem",
                          }}>
                            Build queue full ({actions.getActiveQueueCount()}/{actions.getMasonBonuses().queueSlots})
                            {masonLevel() === 0 ? " — Build a Mason's Guild to unlock more slots" : " — Upgrade Mason's Guild for more slots"}
                          </div>
                        </Show>

                        {/* Build / upgrade. */}
                        <Show when={nextLevel()}>
                          {(next) => (
                            <>
                              <Show
                                when={id() === "town_hall"}
                                fallback={
                                  <>
                                    <Show when={actions.getBuildingEffect(id(), level() + 1)}>
                                      {(effect) => (
                                        <div class="building-effect">
                                          <For each={effectRows(effect())}>{(line) => <div style={{ padding: "1px 0" }}>{line}</div>}</For>
                                        </div>
                                      )}
                                    </Show>
                                  </>
                                }
                              >
                                {/* Town Hall — a before → after of what this upgrade changes. */}
                                <p style={{ "font-size": "0.82rem", color: "var(--text-secondary)", "margin-bottom": "12px", "line-height": 1.45 }}>
                                  The Town Hall caps every other building at its own level, and its rank unlocks new ones.
                                </p>
                                <div style={{ display: "flex", "flex-wrap": "wrap", gap: "10px", "align-items": "stretch" }}>
                                  {/* NOW */}
                                  <div style={{ flex: "1 1 44%", "min-width": "150px", padding: "10px 12px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                                    <div style={{ "font-size": "0.66rem", "text-transform": "uppercase", "letter-spacing": "0.6px", color: "var(--text-muted)", "margin-bottom": "8px" }}>Now · Level {level()}</div>
                                    <div style={{ display: "flex", "justify-content": "space-between", gap: "8px", "font-size": "0.82rem", padding: "3px 0" }}><span style={{ color: "var(--text-muted)" }}>Rank</span><b>{getSettlementName(currentTier())}</b></div>
                                    <div style={{ display: "flex", "justify-content": "space-between", gap: "8px", "font-size": "0.82rem", padding: "3px 0" }}><span style={{ color: "var(--text-muted)" }}>Build cap</span><b>Lv.{level()}</b></div>
                                    <div style={{ display: "flex", "justify-content": "space-between", gap: "8px", "font-size": "0.82rem", padding: "3px 0" }}><span style={{ color: "var(--text-muted)" }}>Treasury</span><b>{townHallTreasury(level()).toLocaleString()}</b></div>
                                  </div>
                                  {/* NEXT */}
                                  <div style={{ flex: "1 1 44%", "min-width": "150px", padding: "10px 12px", background: "rgba(46, 204, 113, 0.08)", border: "1px solid var(--accent-green)" }}>
                                    <div style={{ "font-size": "0.66rem", "text-transform": "uppercase", "letter-spacing": "0.6px", color: "var(--accent-green)", "margin-bottom": "8px" }}>Level {level() + 1}</div>
                                    <div style={{ display: "flex", "justify-content": "space-between", gap: "8px", "font-size": "0.82rem", padding: "3px 0" }}><span style={{ color: "var(--text-muted)" }}>Rank</span><b>{getSettlementName(nextTier())}{tierAdvances() ? " ▲" : ""}</b></div>
                                    <div style={{ display: "flex", "justify-content": "space-between", gap: "8px", "font-size": "0.82rem", padding: "3px 0" }}><span style={{ color: "var(--text-muted)" }}>Build cap</span><b>Lv.{level() + 1}</b></div>
                                    <div style={{ display: "flex", "justify-content": "space-between", gap: "8px", "font-size": "0.82rem", padding: "3px 0" }}><span style={{ color: "var(--text-muted)" }}>Treasury</span><b>{townHallTreasury(level() + 1).toLocaleString()}</b></div>
                                    <Show when={unlockedNextTier().length > 0}>
                                      <div style={{ "margin-top": "8px", "padding-top": "8px", "border-top": "1px solid var(--border-color)" }}>
                                        <div style={{ "font-size": "0.66rem", "text-transform": "uppercase", "letter-spacing": "0.6px", color: "var(--text-muted)", "margin-bottom": "6px" }}>Unlocks</div>
                                        <div style={{ display: "flex", "flex-wrap": "wrap", gap: "5px" }}>
                                          <For each={unlockedNextTier()}>
                                            {(bd) => (
                                              <span style={{ display: "inline-flex", "align-items": "center", gap: "4px", padding: "3px 7px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", "font-size": "0.74rem" }}>
                                                <span>{bd.icon}</span>{bd.name}
                                              </span>
                                            )}
                                          </For>
                                        </div>
                                      </div>
                                    </Show>
                                  </div>
                                </div>
                              </Show>

                              {/* Compact cost + build time. */}
                              <div style={{ display: "flex", "align-items": "center", "flex-wrap": "wrap", gap: "14px", margin: "16px 0 0", "font-size": "0.9rem" }}>
                                <span style={{ color: "var(--text-muted)" }}>Cost</span>
                                {COST_RESOURCES.map((res) => (
                                  <span style={{ display: "inline-flex", "align-items": "center", gap: "4px", color: canAffordRes(res.id) ? "var(--text-primary)" : "var(--accent-red)" }}>
                                    <span>{res.icon}</span>{adjustedCost()![res.id as "wood" | "stone"].toLocaleString()}
                                  </span>
                                ))}
                                <span style={{ color: "var(--text-muted)" }}>· ⏱ {formatTime(adjustedTime()!)}</span>
                              </div>

                              {/* Prereqs + upgrade + panic. */}
                              <div style={{ "margin-top": "18px" }}>
                                <Show when={!tierPrereqs().met}>
                                  <div style={{
                                    "margin-bottom": "10px", padding: "10px", background: "rgba(245, 197, 66, 0.1)",
                                    border: "1px solid var(--accent-gold)", color: "var(--accent-gold)", "font-size": "0.85rem",
                                  }}>
                                    🔒 Requires: {tierPrereqs().missing.join(", ")}
                                  </div>
                                </Show>
                                <button class="upgrade-btn" disabled={!canUpgrade()} onClick={() => actions.upgradeBuilding(id())}>
                                  {level() === 0 ? `Build ${b().name}` : `Upgrade to Level ${level() + 1}`}
                                </button>
                                <Show when={panicEligible()}>
                                  <Tooltip block style={{ "margin-top": "8px" }} text={canPanicBuild()
                                    ? `Soft-lock recovery: spend ${PANIC_BUILD_SHARD_COST} astral shards to build instantly`
                                    : `Need ${PANIC_BUILD_SHARD_COST - state.astralShards} more astral shards`}>
                                    <button
                                      class="btn-secondary"
                                      disabled={!canPanicBuild()}
                                      onClick={() => actions.panicBuildBuilding(id())}
                                      style={{ width: "100%", "justify-content": "center" }}
                                    >
                                      ✨ Use {PANIC_BUILD_SHARD_COST} Astral Shards to build instantly
                                    </button>
                                  </Tooltip>
                                  <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-top": "4px", "text-align": "center" }}>
                                    Stuck? This skips the resource cost.
                                  </div>
                                </Show>
                              </div>
                            </>
                          )}
                        </Show>

                        <Show when={level() >= effectiveMax() && !nextLevel()}>
                          <div style={{
                            padding: "12px", background: "rgba(245, 197, 66, 0.1)", border: "1px solid var(--accent-gold)",
                            color: "var(--accent-gold)", "text-align": "center", "font-family": "var(--font-heading)",
                          }}>
                            {level() >= b().maxLevel
                              ? "Maximum Level Reached"
                              : `Capped by Town Hall — upgrade Town Hall to lvl ${nextLevelReq()?.requiredTownHallLevel} to raise this cap`}
                          </div>
                        </Show>
                      </>
                    }
                  >
                    {/* DAMAGED — repair is the only action. */}
                    <div style={{ "margin-bottom": "16px", padding: "12px", background: "rgba(231, 76, 60, 0.1)", border: "1px solid var(--accent-red)", color: "var(--accent-red)", "line-height": 1.45 }}>
                      {id() === "houses"
                        ? "Homes lie in ruins — the settlement shelters a level fewer, and folk crowd the streets until you rebuild them."
                        : id() === "warehouse"
                          ? "The stores are breached — they hold as if a level lower, and anything over that spills and is lost until you repair the roof and walls."
                          : id() === "pantry"
                            ? "The cellar is broken open — it keeps a level less, and food above that spoils away until you repair it."
                            : id() === "cistern"
                              ? "The cistern is cracked — it holds a level less and its sluice can't be worked, the overflow draining away until you repair it."
                              : id() === "well"
                                ? "The well has caved in and fouled — it gives no water at all until you clear and repair it."
                                : id() === "shrine"
                                  ? "The shrine is desecrated — no offerings can be made and it gives no comfort until you cleanse and repair it."
                                  : id() === "tavern"
                                    ? "The tavern is wrecked — no travelers are served and the common room offers only the faintest cheer until you repair it."
                                    : id() === "brewery"
                                      ? "The brewery is smashed — nothing brews and the barrels run dry until you repair it."
                                      : "This building is damaged and inactive. Repair it to restore function."}
                    </div>

                    <Show
                      when={isRepairing()}
                      fallback={
                        <>
                          {/* What repairing restores — for buildings that lose a
                              level's worth of capacity while damaged. The effect at
                              THIS level is exactly "one level lower → full". */}
                          <Show when={DAMAGE_LOWERS_LEVEL.has(id()) && actions.getBuildingEffect(id(), level())}>
                            {(effect) => (
                              <div style={{ "margin-bottom": "16px" }}>
                                <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "0.6px", "margin-bottom": "6px" }}>Restored on repair</div>
                                <div class="building-effect" style={{ "margin-bottom": 0 }}>
                                  <For each={effectRows(effect())}>{(line) => <div style={{ padding: "1px 0" }}>{line}</div>}</For>
                                </div>
                              </div>
                            )}
                          </Show>

                          {/* Repair cost + time (mirrors the upgrade cost row). */}
                          <div style={{ display: "flex", "align-items": "center", "flex-wrap": "wrap", gap: "14px", margin: "0 0 18px", "font-size": "0.9rem" }}>
                            <span style={{ color: "var(--text-muted)" }}>Cost</span>
                            {COST_RESOURCES.map((res) => {
                              const resId = res.id as "wood" | "stone";
                              const afford = (state.resources[resId] as number) >= repairCost()[resId];
                              return (
                                <span style={{ display: "inline-flex", "align-items": "center", gap: "4px", color: afford ? "var(--text-primary)" : "var(--accent-red)" }}>
                                  <span>{res.icon}</span>{repairCost()[resId].toLocaleString()}
                                </span>
                              );
                            })}
                            <span style={{ color: "var(--text-muted)" }}>· ⏱ {formatTime(repairTime())}</span>
                          </div>
                          <button class="upgrade-btn" disabled={!canRepairNow()} onClick={() => actions.repairBuilding(id())}>
                            Repair
                          </button>
                        </>
                      }
                    >
                      <div style={{
                        padding: "12px", background: "rgba(52, 152, 219, 0.1)", border: "1px solid var(--accent-blue)",
                        color: "var(--accent-blue)", display: "flex", "align-items": "center", gap: "8px",
                      }}>
                        🔨 Repairing — <Countdown remainingSeconds={playerBuilding()!.repairRemaining!} /> remaining
                      </div>
                    </Show>
                  </Show>
                </Show>
        </FramedModal>
      )}
    </Show>
  );
}
