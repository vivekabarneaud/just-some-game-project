import { Show, createSignal } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import ForagingScene from "~/components/ForagingScene";
import { getMission } from "@medieval-realm/shared/data/missions";
import { FOOD_ITEMS } from "~/data/foods";

/** A real foraging trip (FORAGING_MINIGAME §3d). Reached by clicking a foraging
 *  card on the mission board, which is the door: no deploy panel, no adventurer
 *  occupied, no timer, no failure state.
 *
 *  The wood follows the settlement's own season and starts full every trip —
 *  there is no stored stock, and BASKET_SIZE is what makes picking a choice.
 *  Walking home stores the good half via `completeForagingTrip`, which respects
 *  the larder cap and reports honestly what did not fit. */
export default function Foraging() {
  const { state, actions } = useGame();
  const params = useParams();
  const navigate = useNavigate();
  const [result, setResult] = createSignal<ReturnType<typeof actions.completeForagingTrip> | null>(null);

  const mission = () => getMission(params.missionId ?? "");
  const walkHome = (plantIds: string[]) => {
    setResult(actions.completeForagingTrip(params.missionId ?? "", plantIds));
  };

  const label = (id: string) => FOOD_ITEMS.find((f) => f.id === id)?.label ?? id;
  const rows = (r: Record<string, number>) =>
    Object.entries(r).map(([id, n]) => `${n} × ${label(id)}`).join(", ");

  return (
    <div style={{ padding: "24px", "max-width": "1200px", margin: "0 auto" }}>
      <h2 style={{ "font-family": "var(--font-heading)", "margin-bottom": "4px" }}>
        {mission()?.name ?? "The Wood"}
      </h2>
      <div style={{ "font-size": "0.82rem", color: "var(--text-muted)", "margin-bottom": "16px" }}>
        {state.season}, and nothing here is labelled. Lean in to look closer.
      </div>

      <Show when={!result()} fallback={
        <div style={{ "max-width": "560px" }}>
          <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px" }}>Home again</h3>
          <Show when={Object.keys(result()!.stored).length > 0} fallback={
            <div style={{ "font-style": "italic", color: "var(--text-muted)" }}>
              Nothing worth keeping came back with us.
            </div>
          }>
            <div style={{ "margin-bottom": "8px" }}>Into the larder: {rows(result()!.stored)}.</div>
          </Show>
          {/* Honest about both ways a pick can fail to land. */}
          <Show when={Object.keys(result()!.spoiled).length > 0}>
            <div style={{ color: "var(--accent-red)", "font-size": "0.82rem", "margin-bottom": "6px" }}>
              The larder is full, so we lost {rows(result()!.spoiled)}.
            </div>
          </Show>
          <Show when={Object.keys(result()!.noHome).length > 0}>
            <div style={{ color: "var(--text-muted)", "font-size": "0.78rem", "margin-bottom": "6px" }}>
              Nobody knows what to do with {rows(result()!.noHome)} yet.
            </div>
          </Show>
          <button
            style={{ background: "var(--bg-card)", border: "1px solid var(--accent-gold)", "border-radius": "3px",
              color: "var(--text-primary)", padding: "6px 14px", cursor: "pointer", "margin-top": "12px" }}
            onClick={() => navigate("/guild")}>
            Back to the map
          </button>
        </div>
      }>
        <ForagingScene season={state.season} onWalkHome={walkHome} />
      </Show>
    </div>
  );
}
