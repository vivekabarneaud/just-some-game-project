import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import { HERBS } from "@medieval-realm/shared/data/herbs";
import { BUILDINGS, getRepairCost } from "~/data/buildings";
import { playSound } from "~/engine/sounds";
import AlchemyDesk from "~/components/AlchemyDesk";

export default function Alchemy() {
  const { state, actions } = useGame();

  const labLevel = () => state.buildings.find((b) => b.buildingId === "alchemy_lab")?.level ?? 0;
  const labDamaged = () => state.buildings.find((b) => b.buildingId === "alchemy_lab")?.damaged ?? false;
  const repairCost = () => {
    const def = BUILDINGS.find((b) => b.id === "alchemy_lab");
    return def ? getRepairCost(def, labLevel()) : { wood: 0, stone: 0 };
  };
  const canRepair = () => state.resources.wood >= repairCost().wood && state.resources.stone >= repairCost().stone;

  // How many of a herb the player holds (for the quick reference bar).
  const have = (id: string) => state.herbs?.[id] ?? 0;

  return (
    <div style={{ position: "relative", "min-height": "calc(100vh - var(--topbar-height))", overflow: "hidden" }}>
      {/* Immersive background — absolute within page content, not fixed over sidebar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        "z-index": 0, "pointer-events": "none",
      }}>
        <img
          src="https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/alchemy_lab.png"
          alt=""
          style={{ width: "100%", height: "100%", "object-fit": "cover", "object-position": "center 30%", opacity: "0.25" }}
        />
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "linear-gradient(to bottom, rgba(26, 26, 46, 0.9) 0%, rgba(26, 26, 46, 0.4) 30%, rgba(26, 26, 46, 0.7) 100%)",
        }} />
      </div>

      <div style={{ position: "relative", "z-index": 1, padding: "0 16px 32px" }}>
        <h1 class="page-title">🧪 Alchemy Lab</h1>

        <Show when={labLevel() === 0}>
          <div style={{
            padding: "24px",
            background: "var(--bg-secondary)",
            "border-radius": "8px",
            "text-align": "center",
            color: "var(--text-muted)",
          }}>
            <div style={{ "font-size": "2rem", "margin-bottom": "8px" }}>🧪</div>
            <p>Build the Alchemy Lab to unlock potion brewing.</p>
            <A href="/buildings#building-alchemy_lab" style={{ color: "var(--accent-gold)" }}>
              Go to Buildings →
            </A>
          </div>
        </Show>

        <Show when={labLevel() > 0}>
          {/* Header bar */}
          <div style={{
            display: "flex", gap: "16px", "margin-bottom": "16px",
            padding: "10px 14px", background: "rgba(30, 30, 50, 0.85)",
            "border-radius": "6px", "font-size": "0.85rem",
            color: "var(--text-secondary)", "flex-wrap": "wrap",
            "backdrop-filter": "blur(4px)",
            "align-items": "center",
          }}>
            <span>Lab Lv.{labLevel()}</span>
            <span style={{ "border-left": "1px solid var(--border-default)", "padding-left": "12px" }}>Herbs:</span>
            <For each={HERBS}>
              {(herb) => (
                <span style={{ color: have(herb.id) > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {herb.icon} {have(herb.id)}
                </span>
              )}
            </For>
          </div>

          <Show when={labDamaged()}>
            <div style={{
              padding: "10px", "margin-bottom": "16px",
              background: "rgba(231, 76, 60, 0.1)",
              border: "1px solid var(--accent-red)",
              "border-radius": "6px", color: "var(--accent-red)", "font-size": "0.85rem",
              display: "flex", "align-items": "center", "justify-content": "space-between", gap: "10px", "flex-wrap": "wrap",
            }}>
              <span>Lab is damaged. Brewing is disabled until it is repaired.</span>
              <button
                class="upgrade-btn"
                disabled={!canRepair()}
                onClick={() => { if (actions.repairBuilding("alchemy_lab")) playSound("build"); }}
                title={canRepair() ? undefined : "Not enough wood or stone"}
                style={{ "font-size": "0.8rem", padding: "4px 12px", "white-space": "nowrap", opacity: canRepair() ? "1" : "0.5", cursor: canRepair() ? "pointer" : "not-allowed" }}
              >
                🔧 Repair (🪵{repairCost().wood} 🪨{repairCost().stone})
              </button>
            </div>
          </Show>

          {/* The free-form brewing lab is now the whole apothecary — the old
              fixed-recipe list + daily research were retired in favour of it. */}
          <Show when={labLevel() > 0}>
            <AlchemyDesk />
          </Show>

        </Show>
      </div>
    </div>
  );
}
