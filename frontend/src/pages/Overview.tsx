import { createSignal, createMemo, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { BUILDINGS, getSettlementName, SETTLEMENT_TIERS } from "~/data/buildings";
import { RESOURCES } from "~/data/resources";
import { SEASON_META } from "~/data/seasons";
import { getRaid, getDefenseTips, type IncomingRaid } from "~/data/raids";
import { militiaCount } from "~/data/defenses";
import { getCurrentOverviewFlavors, FLAVOR_CATEGORY_ORDER } from "~/data/overview_flavors";
import { QUEST_DEFINITIONS, isQuestActive, isQuestClaimable, isQuestClaimed } from "~/data/quests";
import { useGame, WALL_BASE_HP } from "~/engine/gameState";
import { totalPopulation } from "~/data/citizens";
import { getRobinEvent, setOpenChronicleEntry } from "~/data/robins";
import { getChronicleEntry } from "~/data/chronicle_entries";
import { simulateRaidCombat } from "@medieval-realm/shared/data/raidCombat";
import Countdown from "~/components/Countdown";
// QuestClaimModal removed — claim flow lives on /quests now.
import CombatPlayback from "~/components/CombatPlayback";
import Tooltip from "~/components/Tooltip";

export default function Overview() {
  const { state, actions } = useGame();

  const rates = () => actions.getProductionRates();
  const foodCons = () => actions.getFoodConsumption();
  const caps = () => actions.getStorageCaps();
  const tier = () => actions.getSettlementTier();
  const thLevel = () => actions.getTownHallLevel();
  const defense = () => actions.getDefense();

  const upgradingBuildings = () =>
    state.buildings.filter((b) => b.upgrading && b.upgradeRemaining);

  const topBuildings = () =>
    [...state.buildings]
      .filter((b) => b.level > 0)
      .sort((a, b) => b.level - a.level)
      .slice(0, 5);

  const netRate = (id: string) => {
    const r = rates();
    const base = r[id as keyof typeof r] as number;
    if (id === "food") return base - foodCons() - actions.getAnimalFoodConsumption() + actions.getCookingFoodNet();
    return base;
  };

  const nextTier = () => {
    const current = tier();
    const idx = SETTLEMENT_TIERS.findIndex((t) => t.tier === current);
    if (idx < SETTLEMENT_TIERS.length - 1) return SETTLEMENT_TIERS[idx + 1];
    return null;
  };

  const hasThreats = () => state.incomingRaids.length > 0;

  // Quest system — Overview now shows a single summary card linking to the
  // Quest Log. Detail / claim flows live on /quests. Helpers below drive the
  // summary card text and the "all done" congratulations panel.
  const allQuestsComplete = () =>
    QUEST_DEFINITIONS.every((q) => isQuestClaimed(q, state));
  const [dismissedCongrats, setDismissedCongrats] = createSignal(false);

  /** Raid currently being played back. Set when the player clicks "Watch combat"
   *  on a resolved raid card; cleared (and acknowledged) when the modal closes. */
  const [playingRaid, setPlayingRaid] = createSignal<IncomingRaid | null>(null);

  const TIER_IMAGES: Record<string, string> = {
    camp: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/settlement_camp.png",
    village: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/settlement_village.png",
    town: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/settlement_town.png",
    city: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/settlement_city.png",
  };

  return (
    <div>
      {/* (Quest claim modal removed — claims now happen on the Quest Log page.) */}

      {/* Raid combat playback — opens from "Watch combat" on a resolved threat card. */}
      <Show when={playingRaid()}>
        {(ir) => (
          <CombatPlayback
            log={ir().combatLog ?? []}
            title={getRaid(ir().raidId)?.name ?? ir().raidId}
            victory={ir().combatVictory}
            onClose={() => {
              actions.acknowledgeRaidCombat(ir().raidId);
              setPlayingRaid(null);
            }}
          />
        )}
      </Show>

      <div class="settlement-banner">
        <img src={TIER_IMAGES[tier()] ?? TIER_IMAGES.camp} alt={tier()} />
        <div class="settlement-banner-overlay">
          <h1 class="settlement-banner-title">
            {getSettlementName(tier())} of {state.villageName}
          </h1>
        </div>
      </div>


      {/* Robin delivery — surfaces a pending robin (event-driven story beat).
          Click opens the chronicle entry + applies unlocks via acknowledgeRobin.
          Sidebar pill mirrors this; the card here is the prominent surface. */}
      {(() => {
        const pendingRobin = () => {
          const id = state.pendingRobins?.[0];
          return id ? getRobinEvent(id) : undefined;
        };
        return (
          <Show when={pendingRobin()}>
            {(robin) => (
              <Tooltip text="Click to read the message." block style={{ "margin-bottom": "16px" }}>
              <div
                onClick={() => {
                  const entry = getChronicleEntry(robin().chronicleEntryId);
                  if (entry) setOpenChronicleEntry(entry);
                  actions.acknowledgeRobin(robin().id);
                }}
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "12px",
                  padding: "12px 16px",
                  background: "rgba(96, 165, 250, 0.10)",
                  border: "1px solid var(--accent-blue)",
                  "border-radius": "8px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = "rgba(96, 165, 250, 0.16)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = "rgba(96, 165, 250, 0.10)"}
              >
                <span style={{ "font-size": "1.8rem" }}>🐦</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    "font-size": "0.7rem",
                    "text-transform": "uppercase",
                    "letter-spacing": "1px",
                    color: "var(--accent-blue)",
                    "font-weight": "bold",
                    "margin-bottom": "2px",
                  }}>
                    A robin has arrived
                  </div>
                  <div style={{ "font-size": "0.9rem", color: "var(--text-primary)" }}>
                    {robin().bannerText}
                  </div>
                </div>
                <span style={{ color: "var(--accent-blue)", "font-size": "0.85rem" }}>Read →</span>
              </div>
              </Tooltip>
            )}
          </Show>
        );
      })()}

      {/* Quest summary card — directs the player to the Quest Log for full
          quest detail. Replaces the old in-Overview claim panel; the log handles
          claim flow now. The golden frame styling is preserved for continuity. */}
      <Show when={!allQuestsComplete()}>
        {(() => {
          const activeQuests = () =>
            QUEST_DEFINITIONS.filter((q) => isQuestActive(q, state));
          const activeCount = () => activeQuests().length;
          const claimableCount = () =>
            activeQuests().filter((q) => isQuestClaimable(q, state)).length;
          const newCount = () => {
            const seen = state.questsClaimableSeen ?? [];
            return activeQuests().filter((q) => !seen.includes(q.id)).length;
          };
          // Build a comma-separated breakdown like "1 new, 1 claimable, 3 active"
          const breakdown = () => {
            const parts: string[] = [];
            if (newCount() > 0) parts.push(`${newCount()} new`);
            if (claimableCount() > 0) parts.push(`${claimableCount()} claimable`);
            parts.push(`${activeCount()} active`);
            return parts.join(", ");
          };
          // Flavor headline. Constant by default; shifts to a slightly more
          // urgent line when there are claimable rewards to nudge the player.
          const headline = () => {
            if (claimableCount() > 0) return "Matters waiting on your stamp";
            return "Matters to attend to today";
          };
          // Lord-voice narration of the current settlement mood — see
          // data/overview_flavors.ts. One paragraph per category (settlement,
          // adventurers, defense), each tracking its own latest match. Lets
          // the player see parallel priorities at the same time.
          const flavors = () => getCurrentOverviewFlavors(state);
          const activeFlavors = () => FLAVOR_CATEGORY_ORDER
            .map((cat) => flavors()[cat])
            .filter((f): f is NonNullable<typeof f> => !!f);

          // Immediate-danger banner inside the Matters card. Matches the
          // red "!" badge in the sidebar — surfaces when food is running
          // out so a player who closes the game with a deficit doesn't
          // wake up to a wiped settlement.
          const foodDanger = (): { headline: string; detail: string } | null => {
            const total = Object.values(state.foods ?? {}).reduce((s, v) => s + v, 0);
            const pop = totalPopulation(state.citizens);
            if (pop === 0) return null;
            const net = netRate("food");
            // Treat anything under one full ration as effectively empty.
            // Prevents the message from flickering between "no food" and
            // "runs out in under an hour" when the stockpile oscillates
            // near zero from float-point tick math.
            if (total < 1) {
              return { headline: "No food in the stores", detail: "Citizens are starving. Build a Forager's Hut, Hunting Camp, or Fishing Hut now." };
            }
            if (net < 0) {
              const hours = total / Math.abs(net);
              if (hours < 12) {
                return {
                  headline: `Food runs out in ${hours < 1 ? "under an hour" : `~${Math.round(hours)}h`}`,
                  detail: `Consumption exceeds production by ${Math.abs(net).toFixed(1)}/hr. Add a food building or upgrade an existing one before this hits zero.`,
                };
              }
            }
            return null;
          };
          return (
            <div class="quest-panel" style={{ "padding": "16px 20px" }}>
              <div class="quest-panel-content">
                <div class="quest-header" style={{ "align-items": "center" }}>
                  <span class="quest-icon" style={{ "font-size": "1.6rem" }}>📋</span>
                  <div style={{ "flex": "1", "min-width": "0" }}>
                    <h2 style={{ "margin": 0 }}>{headline()}</h2>
                    <p class="quest-narrative" style={{
                      "margin": "1px 0 0",
                      "font-size": "0.75rem",
                      "line-height": "1.3",
                    }}>
                      {breakdown()}
                    </p>
                    <Show when={foodDanger()}>
                      {(d) => (
                        <div style={{
                          "margin": "14px 0 0",
                          padding: "10px 14px",
                          background: "rgba(231, 76, 60, 0.10)",
                          border: "1px solid var(--accent-red)",
                          "border-left-width": "4px",
                          "border-radius": "6px",
                          "max-width": "800px",
                        }}>
                          <div style={{
                            "font-weight": "700",
                            color: "var(--accent-red)",
                            "font-size": "0.9rem",
                            display: "flex",
                            "align-items": "center",
                            gap: "8px",
                          }}>
                            <span>⚠️</span>
                            <span>{d().headline}</span>
                          </div>
                          <div style={{
                            "margin-top": "4px",
                            "font-size": "0.82rem",
                            color: "var(--text-secondary)",
                            "line-height": "1.5",
                          }}>
                            {d().detail}
                          </div>
                        </div>
                      )}
                    </Show>
                    <Show when={activeFlavors().length > 0}>
                      <div style={{
                        "margin": "16px 0 0",
                        display: "flex",
                        "flex-direction": "column",
                        gap: "8px",
                        "max-width": "800px",
                      }}>
                        <For each={activeFlavors()}>
                          {(f) => (
                            <p style={{
                              "margin": 0,
                              "font-size": "0.9rem",
                              "font-style": "italic",
                              "color": "var(--text-secondary)",
                              "line-height": "1.5",
                            }}>
                              {f.text}
                            </p>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                  <A href="/quests" class="quest-link" style={{ "margin-left": "auto" }}>
                    Open Quest Log →
                  </A>
                </div>
              </div>
            </div>
          );
        })()}
      </Show>

      <Show when={allQuestsComplete() && !dismissedCongrats()}>
        <div class="quest-panel">
          <div class="quest-complete-banner">
            <h2>All Quests Complete — For Now</h2>
            <p>You have proven yourself a worthy ruler. Your settlement thrives under your leadership. But the frontier is vast, and new challenges are on the horizon. Stay sharp — more quests will arrive soon.</p>
            <button
              class="quest-claim-btn"
              style={{ "margin-top": "10px" }}
              onClick={() => setDismissedCongrats(true)}
            >
              Onward!
            </button>
          </div>
        </div>
      </Show>

      <div class="overview-grid">
        <div class="overview-panel">
          <h2>Production Overview</h2>
          <For each={RESOURCES}>
            {(res) => {
              const rate = () => netRate(res.id);
              return (
                <div class="stat-row">
                  <span class="stat-label">
                    {res.icon} {res.name}
                  </span>
                  <span
                    class="stat-value"
                    style={{
                      color:
                        rate() > 0
                          ? "var(--accent-green)"
                          : rate() < 0
                            ? "var(--accent-red)"
                            : "var(--text-secondary)",
                    }}
                  >
                    {rate() >= 0 ? "+" : ""}
                    {Math.round(rate())}/h
                  </span>
                </div>
              );
            }}
          </For>
          <div class="stat-row" style={{ "margin-top": "-1px", "border-top": "1px solid var(--border-highlight)", "padding-top": "8px" }}>
            <span class="stat-label">Material Storage</span>
            <span class="stat-value">{caps().wood.toLocaleString()}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Food Storage</span>
            <span class="stat-value">{caps().food.toLocaleString()}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Treasury</span>
            <span class="stat-value">{caps().gold.toLocaleString()}</span>
          </div>
        </div>

        <div class="overview-panel">
          <h2>Building Activity</h2>
          <div class="stat-row" style={{ "margin-bottom": "8px" }}>
            <span class="stat-label">Queue</span>
            <span class="stat-value">
              {actions.getActiveQueueCount()} / {actions.getMasonBonuses().queueSlots}
            </span>
          </div>
          <Show
            when={upgradingBuildings().length > 0}
            fallback={
              <p style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
                No construction in progress
              </p>
            }
          >
            <For each={upgradingBuildings()}>
              {(pb) => {
                const def = BUILDINGS.find((b) => b.id === pb.buildingId)!;
                return (
                  <div class="stat-row">
                    <span class="stat-label">
                      {def.icon} {def.name} → Lv. {pb.level + 1}
                    </span>
                    <span class="stat-value" style={{ color: "var(--accent-blue)" }}>
                      <Countdown remainingSeconds={pb.upgradeRemaining!} />
                    </span>
                  </div>
                );
              }}
            </For>
          </Show>
        </div>

        <div class="overview-panel">
          <h2>Top Buildings</h2>
          <For each={topBuildings()}>
            {(pb) => {
              const def = BUILDINGS.find((b) => b.id === pb.buildingId)!;
              return (
                <div class="stat-row">
                  <span class="stat-label">
                    {def.icon} {def.name}
                  </span>
                  <span class="stat-value">Level {pb.level}</span>
                </div>
              );
            }}
          </For>
          <div style={{ "margin-top": "12px" }}>
            <A href="/buildings" style={{ color: "var(--accent-gold)", "font-size": "0.85rem" }}>
              View all buildings →
            </A>
          </div>
        </div>

        <div class="overview-panel">
          <h2>Settlement Status</h2>
          <div class="stat-row">
            <span class="stat-label">Settlement</span>
            <span class="stat-value" style={{ color: "var(--accent-gold)" }}>
              {getSettlementName(tier())}
            </span>
          </div>
          <Show when={nextTier()}>
            {(nt) => (
              <div class="stat-row">
                <span class="stat-label">Next tier</span>
                <span class="stat-value">
                  {nt().name} (TH {nt().minTownHall})
                </span>
              </div>
            )}
          </Show>
          <div class="stat-row">
            <span class="stat-label">Population</span>
            <span class="stat-value">
              {totalPopulation(state.citizens)} / {actions.getMaxPopulation()}
            </span>
          </div>
          {(() => {
            const net = netRate("food");
            // Surplus that exists ONLY because a pot is cooking is fragile — it
            // reverts to a deficit when ingredients run out. Flag it yellow + a
            // clock, and (unlike the cramped top bar) spell it out inline.
            const fragile = net >= 0 && net - actions.getCookingFoodNet() < 0;
            const color = net < 0 ? "var(--accent-red)" : fragile ? "var(--accent-gold)" : "var(--accent-green)";
            const label = net < 0 ? "Deficit" : fragile ? "⏳ Surplus (while cooking)" : "Surplus";
            return (
              <>
                <div class="stat-row">
                  <span class="stat-label">Food Balance</span>
                  <span class="stat-value" style={{ color }}>{label} ({Math.round(net)}/h)</span>
                </div>
                <Show when={fragile}>
                  <div style={{ "font-size": "0.75rem", color: "var(--accent-gold)", "margin-top": "-2px", "margin-bottom": "6px", "line-height": 1.35 }}>
                    Only positive while a pot is cooking. It drops back to a deficit once the ingredients run out, so stock up or add a food source.
                  </div>
                </Show>
              </>
            );
          })()}
          <Show when={state.season === "autumn" || state.season === "winter"}>
            <div style={{ "font-size": "0.75rem", color: "var(--accent-gold)", "padding": "2px 0 4px", "font-style": "italic" }}>
              {state.season === "winter"
                ? "Winter: foragers find only nuts (25%), hunting and fishing at 50%"
                : "Autumn: foragers gather mushrooms (75%), hunting and fishing at 75%"}
            </div>
          </Show>
          <Show when={state.season === "winter"}>
            <div style={{
              padding: "6px 10px",
              "margin-bottom": "8px",
              "border-radius": "6px",
              background: "rgba(135, 206, 235, 0.1)",
              border: "1px solid #87CEEB",
              "font-size": "0.8rem",
              color: "#87CEEB",
            }}>
              ❄️ Winter cold: consuming wood for heating ({Math.round(totalPopulation(state.citizens) * 0.5)}/h).
              {state.resources.wood <= 0 && <span style={{ color: "var(--accent-red)" }}> No wood — citizens are freezing!</span>}
            </div>
          </Show>
          <Show when={state.buildings.some((b) => b.damaged)}>
            <div style={{
              padding: "6px 10px",
              "margin-bottom": "8px",
              "border-radius": "6px",
              background: "rgba(231, 76, 60, 0.1)",
              border: "1px solid var(--accent-red)",
              "font-size": "0.8rem",
              color: "var(--accent-red)",
            }}>
              🔧 {state.buildings.filter((b) => b.damaged).length} building{state.buildings.filter((b) => b.damaged).length > 1 ? "s" : ""} damaged!{" "}
              <A href="/buildings" style={{ color: "var(--accent-gold)" }}>Repair them →</A>
            </div>
          </Show>
          <div class="stat-row">
            <span class="stat-label">Happiness</span>
            <span class="stat-value" style={{
              color: state.happiness >= 70 ? "var(--accent-green)" : state.happiness >= 40 ? "var(--accent-gold)" : "var(--accent-red)",
            }}>
              {state.happiness >= 70 ? "😊" : state.happiness >= 40 ? "😐" : "😟"} {state.happiness}%
              <span style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-left": "4px" }}>
                ({Math.round(actions.getHappinessModifier() * 100)}% production)
              </span>
            </span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Season</span>
            <span class="stat-value" style={{ color: SEASON_META[state.season].color }}>
              {SEASON_META[state.season].icon} {SEASON_META[state.season].name}, Year {state.year}
            </span>
          </div>
        </div>

        {/* Threats & Defense — moves to top when raids incoming */}
        <div class="overview-panel" style={{ order: hasThreats() ? -1 : 0 }}>
          <h2>Threats & Defense</h2>
          <div class="stat-row">
            <span class="stat-label">Defense Score</span>
            <span class="stat-value" style={{ color: defense().total > 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
              {defense().total}
            </span>
          </div>
          <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-bottom": "8px" }}>
            {defense().watchtower > 0 && <span>Watchtower +{defense().watchtower} · </span>}
            {defense().barracks > 0 && <span>Barracks +{defense().barracks} · </span>}
            {defense().walls > 0 && <span>Walls +{defense().walls} · </span>}
            {defense().adventurers > 0 && <span>Adventurers +{defense().adventurers} · </span>}
            <span>Militia +{defense().population}</span>
          </div>

          <Show when={state.incomingRaids.length > 0} fallback={
            <div style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
              No threats detected. Calm for {Math.floor(state.hoursSinceLastRaid)}h.
            </div>
          }>
            <For each={state.incomingRaids}>
              {(ir) => {
                const raid = () => getRaid(ir.raidId);
                // Monte-Carlo win % from the same sim that resolves the actual
                // raid. Tracks defenses + stationed counts so it recomputes when
                // the player builds/repairs/recruits during the prep phase, but
                // ignores resource ticks (the sim doesn't read them).
                const SIMS = 50;
                const successPct = createMemo(() => {
                  const tmpl = raid();
                  if (!tmpl?.encounters?.length) return 0;
                  const wallsSnap = state.walls.map((w) => ({ ring: w.ring, level: w.level, hp: w.hp, maxHp: w.level * WALL_BASE_HP }));
                  const towersSnap = state.watchtowers.map((t) => ({ ring: t.ring, level: t.level, damaged: t.damaged, archerCount: t.garrison.count, trainedLevel: t.garrison.trainedLevel }));
                  const barracksSnap = state.barracks.map((b) => ({ ring: b.ring, level: b.level, damaged: b.damaged, soldierCount: b.garrison.count, trainedLevel: b.garrison.trainedLevel }));
                  let seed = 0;
                  for (let i = 0; i < ir.raidId.length; i++) {
                    seed = ((seed << 5) - seed + ir.raidId.charCodeAt(i)) | 0;
                  }
                  let wins = 0;
                  for (let i = 0; i < SIMS; i++) {
                    const result = simulateRaidCombat({
                      raidId: ir.raidId,
                      encounters: tmpl.encounters,
                      walls: wallsSnap,
                      watchtowers: towersSnap,
                      barracks: barracksSnap,
                      militiaCount: militiaCount(state),
                      seed: seed + i,
                    });
                    if (result.victory) wins++;
                  }
                  return Math.round((wins / SIMS) * 100);
                });
                const successColor = () =>
                  successPct() >= 80 ? "var(--accent-green)" :
                  successPct() >= 50 ? "var(--accent-gold)" : "var(--accent-red)";
                const onMissionCount = () => state.adventurers.filter((a) => a.onMission).length;
                const tips = () => getDefenseTips(successPct(), state.walls, state.watchtowers, state.barracks, onMissionCount());
                return (
                  <div
                    class="threat-card"
                    style={{ "min-height": raid()?.image ? "220px" : undefined }}
                  >
                    {/* Background image — left-aligned, fades into red bg */}
                    <Show when={raid()?.image}>
                      <div style={{
                        position: "absolute", top: 0, left: 0, bottom: 0, width: "55%",
                        "z-index": 0, "pointer-events": "none",
                      }}>
                        <img
                          src={raid()!.image!}
                          alt=""
                          style={{
                            width: "100%", height: "100%", "object-fit": "cover", "object-position": "center 30%", opacity: "0.2",
                            "-webkit-mask-image": "linear-gradient(to right, black 30%, transparent 100%)",
                            "mask-image": "linear-gradient(to right, black 30%, transparent 100%)",
                          }}
                        />
                      </div>
                    </Show>

                    {/* Two-column layout */}
                    <div class="threat-card-layout">

                      {/* Left — Attacker info */}
                      <div style={{ flex: 1 }}>
                        <span style={{ color: "var(--accent-red)", "font-size": "1rem", "font-weight": "bold" }}>
                          {raid()?.icon} {raid()?.name ?? ir.raidId}
                        </span>
                        <div style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-top": "6px", "font-style": "italic" }}>
                          {raid()?.description}
                        </div>

                        {/* Consequences */}
                        <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-top": "8px" }}>
                          <Show when={successPct() < 100}>
                            <div>If defeated:</div>
                            {raid()?.stealsResources && <div style={{ color: "var(--accent-red)" }}>· ~{Math.round((raid()!.resourceStealPercent) * 100)}% resources stolen</div>}
                            {raid()?.killsCitizens && <div style={{ color: "var(--accent-red)" }}>· up to {raid()!.maxCitizenLoss} citizen deaths</div>}
                            <div style={{ color: "var(--accent-red)" }}>· 1-3 buildings damaged</div>
                          </Show>
                          <Show when={successPct() >= 100}>
                            <div style={{ color: "var(--accent-green)" }}>Expected loot: {raid()!.victoryLoot.map((l) => `+${l.amount} ${l.resource}`).join(", ")}</div>
                          </Show>
                        </div>

                        {/* Tags */}
                        <Show when={raid()?.tags}>
                          <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-top": "6px" }}>
                            {raid()!.tags.join(", ")}
                            {raid()!.stealsResources && " · steals resources"}
                            {raid()!.killsCitizens && " · kills citizens"}
                          </div>
                        </Show>
                      </div>

                      {/* Right — Player defense (incoming) OR resolved-combat CTA */}
                      <Show
                        when={!ir.combatLog}
                        fallback={
                          <div style={{ flex: 1, display: "flex", "flex-direction": "column", "align-items": "flex-end", "justify-content": "center", "text-align": "right", gap: "10px" }}>
                            <div style={{
                              color: ir.combatVictory ? "var(--accent-green)" : "var(--accent-red)",
                              "font-size": "1.2rem",
                              "font-weight": "bold",
                            }}>
                              {ir.combatVictory ? "🛡️ Repelled" : "💔 Defeated"}
                            </div>
                            <button
                              onClick={() => setPlayingRaid(ir)}
                              style={{
                                padding: "8px 18px",
                                background: "rgba(180, 150, 100, 0.2)",
                                border: "1px solid var(--accent-gold)",
                                color: "var(--accent-gold)",
                                "border-radius": "4px",
                                cursor: "pointer",
                                "font-size": "0.9rem",
                                "font-weight": "bold",
                              }}
                            >
                              ▶ Watch combat
                            </button>
                          </div>
                        }
                      >
                        <div style={{ flex: 1, display: "flex", "flex-direction": "column", "align-items": "flex-end", "text-align": "right" }}>
                          {/* Timer */}
                          <div style={{ color: "var(--accent-red)", "font-size": "1.1rem", "font-weight": "bold" }}>
                            <Countdown remainingSeconds={ir.remaining} />
                          </div>

                          {/* Force composition */}
                          <Show when={raid()?.encounters?.length}>
                            <div style={{ "margin-top": "8px", "font-size": "0.8rem", color: "var(--accent-red)" }}>
                              {raid()!.encounters.map((e) => `${e.count}× ${e.enemyId.replace(/_/g, " ")}`).join(", ")}
                            </div>
                          </Show>

                          {/* Success % */}
                          <div style={{ "margin-top": "8px" }}>
                            <span style={{ "font-size": "0.75rem", color: "var(--text-muted)" }}>Success </span>
                            <span style={{ color: successColor(), "font-weight": "bold", "font-size": "1.4rem" }}>
                              {successPct()}%
                            </span>
                          </div>

                          {/* Tips */}
                          <div style={{ "margin-top": "auto", "padding-top": "10px" }}>
                            <For each={tips()}>
                              {(tip) => (
                                <div style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-bottom": "3px" }}>
                                  {tip.icon}{" "}
                                  {tip.actionLink ? (
                                    <A href={tip.actionLink} style={{ color: "var(--accent-gold)" }}>{tip.text}</A>
                                  ) : (
                                    tip.text
                                  )}
                                </div>
                              )}
                            </For>
                          </div>

                          {/* Recall button */}
                          <Show when={onMissionCount() > 0}>
                            <button
                              onClick={() => {
                                const hasWiz = state.activeMissions.some((m) =>
                                  m.adventurerIds.some((id) => state.adventurers.find((a) => a.id === id)?.class === "wizard")
                                );
                                const msg = hasWiz
                                  ? `Recall ${onMissionCount()} adventurer(s)? Missions cancelled, but your wizard will teleport 30% of the loot home.`
                                  : `Recall ${onMissionCount()} adventurer(s)? All active missions will be cancelled and rewards forfeited.`;
                                if (confirm(msg)) {
                                  const result = actions.recallAdventurers();
                                }
                              }}
                              style={{
                                "margin-top": "8px",
                                padding: "6px 14px",
                                background: "rgba(231, 76, 60, 0.2)",
                                border: "1px solid var(--accent-red)",
                                color: "var(--accent-red)",
                                "border-radius": "4px",
                                cursor: "pointer",
                                "font-size": "0.85rem",
                                width: "100%",
                              }}
                            >
                              Recall Adventurers ({onMissionCount()})
                            </button>
                          </Show>
                        </div>
                      </Show>

                    </div>{/* end two-column layout */}
                  </div>
                );
              }}
            </For>
          </Show>
        </div>

        {/* Event Log */}
        <Show when={state.eventLog.length > 0}>
          <div class="overview-panel">
            <h2>Event Log</h2>
            <div style={{ "max-height": "300px", overflow: "auto" }}>
              <For each={state.eventLog.slice(0, 20)}>
                {(event) => {
                  const color = () => {
                    if (event.type.includes("died") || event.type.includes("defeat") || event.type.includes("failed") || event.type.includes("left") || event.type.includes("damaged") || event.type.includes("freezing")) return "var(--accent-red)";
                    if (event.type.includes("victory") || event.type.includes("success") || event.type.includes("born") || event.type.includes("completed") || event.type.includes("repaired")) return "var(--accent-green)";
                    if (event.type.includes("levelup") || event.type.includes("rankup")) return "var(--accent-blue)";
                    if (event.type.includes("incoming")) return "var(--accent-gold)";
                    return "var(--text-secondary)";
                  };
                  return (
                    <div style={{
                      padding: "4px 0",
                      "border-bottom": "1px solid var(--border-default)",
                      "font-size": "0.8rem",
                      display: "flex",
                      gap: "6px",
                      "align-items": "flex-start",
                    }}>
                      <span>{event.icon}</span>
                      <span style={{ color: color() }}>{event.message}</span>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
