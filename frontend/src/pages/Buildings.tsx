import { For } from "solid-js";
import { A } from "@solidjs/router";
import { BUILDINGS, isBuildingUnlocked, getUnlockRequirement } from "~/data/buildings";
import { useGame } from "~/engine/gameState";
import Countdown from "~/components/Countdown";

export default function Buildings() {
  const { state, actions } = useGame();
  const thLevel = () => actions.getTownHallLevel();

  const getPlayerBuilding = (buildingId: string) =>
    state.buildings.find((b) => b.buildingId === buildingId);

  return (
    <div>
      <h1 class="page-title">Buildings</h1>
      <div class="buildings-grid">
        <For each={BUILDINGS}>
          {(building) => {
            const pb = () => getPlayerBuilding(building.id);
            const level = () => pb()?.level ?? 0;
            const isUpgrading = () => pb()?.upgrading ?? false;
            const currentLevel = () => (level() > 0 ? building.levels[level() - 1] : null);
            const unlocked = () => isBuildingUnlocked(building, thLevel());

            return unlocked() ? (
              <A href={`/buildings/${building.id}`} style={{ "text-decoration": "none" }}>
                <div class="building-card" classList={{ upgrading: isUpgrading() }}>
                  <span class="building-card-category">{building.category}</span>
                  <div class="building-card-header">
                    <div class="building-card-icon">{building.icon}</div>
                    <div>
                      <div class="building-card-title">{building.name}</div>
                      <div
                        class="building-card-level"
                        classList={{ "not-built": level() === 0 }}
                      >
                        {level() === 0
                          ? "Not built"
                          : `Level ${level()} / ${building.maxLevel}`}
                      </div>
                    </div>
                  </div>
                  <div class="building-card-desc">{building.description}</div>
                  {currentLevel()?.production && (
                    <div class="building-card-production">
                      Producing: +{currentLevel()!.production!.rate}/h{" "}
                      {currentLevel()!.production!.resource}
                    </div>
                  )}
                  {isUpgrading() && pb()?.upgradeRemaining && (
                    <div class="building-card-upgrading">
                      Upgrading to Lv. {level() + 1} —{" "}
                      <Countdown remainingSeconds={pb()!.upgradeRemaining!} />
                    </div>
                  )}
                </div>
              </A>
            ) : (
              <div class="building-card locked">
                <span class="building-card-category">{building.category}</span>
                <div class="building-card-header">
                  <div class="building-card-icon locked-icon">{building.icon}</div>
                  <div>
                    <div class="building-card-title locked-title">{building.name}</div>
                    <div class="building-card-level locked-req">
                      {getUnlockRequirement(building)}
                    </div>
                  </div>
                </div>
                <div class="building-card-desc">{building.description}</div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
