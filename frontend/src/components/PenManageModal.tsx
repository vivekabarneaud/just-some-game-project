import { createSignal, createEffect, onCleanup, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { useGame, type PlayerPen } from "~/engine/gameState";
import {
  getAnimal, getPenCapacity, getAnimalBuyCost, getCullYield,
  getPenProduction,
} from "@medieval-realm/shared/data/livestock";
import { ANIMAL_FEED, FEED_CATEGORY_ICON, FEED_CATEGORY_LABEL, isGrazer } from "~/data/animalFeed";
import Tooltip from "~/components/Tooltip";
import DogAssignSection from "~/components/DogAssignSection";

interface Props {
  pen: PlayerPen;
  onClose: () => void;
}

/**
 * Per-pen flock manager. The card is the glance (count, output, status); this
 * modal is where the hands-on work happens — buying and culling stock, and
 * setting a guard dog on the fold. Same shell as StaffManageModal so pens and
 * buildings feel like one family.
 *
 * Room to grow: assigning a townsfolk/founder to tend the pen and bulk-buying
 * stock both slot in here later (the user's call), which is why the flock and
 * guard controls live in a modal rather than crammed onto the card.
 */
export default function PenManageModal(props: Props) {
  const { state, actions } = useGame();
  const [exiting, setExiting] = createSignal(false);

  const close = () => {
    setExiting(true);
    setTimeout(() => props.onClose(), 200);
  };

  createEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    onCleanup(() => window.removeEventListener("keydown", handler));
  });

  const animal = () => getAnimal(props.pen.animal);
  const cap = () => getPenCapacity(props.pen.level);
  const buyCost = () => getAnimalBuyCost(props.pen.animal);
  const buyDisabled = () => props.pen.count >= cap() || state.resources.gold < buyCost();
  const cy = () => getCullYield(props.pen.animal);
  const prod = () => getPenProduction(animal(), props.pen.count);
  const grazes = () => isGrazer(props.pen.animal);
  const onPasture = () => grazes() && state.season !== "winter";
  const hayStored = () => state.fields.reduce((sum, f) => sum + (f.hay ?? 0), 0);

  return (
    <Portal>
      <div
        style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.78)", "z-index": 1100,
          display: "flex", "align-items": "center", "justify-content": "center", padding: "24px",
          opacity: exiting() ? 0 : 1, transition: "opacity 0.2s ease",
        }}
        onClick={close}
      >
        <div
          style={{
            "max-width": "440px", width: "100%", background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)", "border-radius": "8px", padding: "20px",
            color: "var(--text-primary)", "max-height": "88vh", overflow: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "6px" }}>
            <h3 style={{ margin: 0, "font-family": "var(--font-heading)", color: "var(--accent-gold)" }}>
              {animal().icon} {animal().name} Pen — Flock
            </h3>
            <button onClick={close} style={{ background: "none", border: "none", color: "var(--text-muted)", "font-size": "1.2rem", cursor: "pointer", "line-height": 1 }}>✕</button>
          </div>

          {/* Flock summary */}
          <div style={{
            display: "flex", "align-items": "baseline", gap: "12px", "flex-wrap": "wrap",
            padding: "10px 12px", background: "var(--bg-card)", border: "1px solid var(--border-color)",
            "border-radius": "8px", "margin-bottom": "14px",
          }}>
            <span style={{ "font-size": "1.05rem", "font-weight": 600 }}>
              {props.pen.count} / {cap()} <span style={{ "font-size": "0.8rem", color: "var(--text-muted)", "font-weight": 400 }}>head</span>
            </span>
            <Show
              when={prod().produced > 0}
              fallback={<span style={{ "font-size": "0.85rem", color: "var(--text-muted)" }}>raised for meat</span>}
            >
              <span style={{ "font-size": "0.9rem", color: "var(--accent-green, #4a9)" }}>
                +{prod().produced}/h {animal().foodLabel.toLowerCase()}
                <Show when={prod().secondary}>{" "}· +{prod().secondary!.amount}/h {prod().secondary!.resource}</Show>
              </span>
            </Show>
          </div>

          <Show when={props.pen.starving}>
            <div style={{ color: "var(--accent-red)", "font-weight": 600, "font-size": "0.82rem", "text-align": "center", "margin-bottom": "12px" }}>
              ⚠️ Starving — not producing, and losing animals
            </div>
          </Show>

          {/* Buy / Cull */}
          <div style={{
            padding: "12px", background: "var(--bg-card)", border: "1px solid var(--border-color)",
            "border-radius": "8px", "margin-bottom": "10px",
          }}>
            <div style={{ "font-size": "0.9rem", "margin-bottom": "10px" }}>Stock the fold</div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                class="btn-primary"
                onClick={() => actions.buyLivestock(props.pen.id, 1)}
                disabled={buyDisabled()}
                style={{ flex: "1", "font-size": "0.9rem" }}
              >
                Buy {animal().icon} 💰{buyCost()}
              </button>
              <Tooltip block style={{ flex: "1" }} text={`Slaughter one for +${cy().meat} meat${cy().leather ? `, +${cy().leather} leather` : ""}${cy().bone ? `, +${cy().bone} bone` : ""}`}>
                <button
                  class="btn-secondary"
                  onClick={() => actions.cullLivestock(props.pen.id, 1)}
                  disabled={props.pen.count <= 0}
                  style={{ width: "100%", height: "40px", "font-size": "0.9rem", "justify-content": "center" }}
                >
                  Cull 🥩
                </button>
              </Tooltip>
            </div>
            <p style={{ "font-size": "0.72rem", color: "var(--text-muted)", margin: "10px 0 0" }}>
              {props.pen.count >= cap()
                ? "The pen is full. Upgrade it to raise the headcount."
                : "Bought stock joins the fold at once. Culling trades an animal for meat and hide."}
            </p>
          </div>

          {/* Guard dog — assign a kept dog (from the Kennel) to keep wolves off. */}
          <div style={{
            padding: "12px", background: "var(--bg-card)", border: "1px solid var(--border-color)",
            "border-radius": "8px", "margin-bottom": "10px",
          }}>
            <DogAssignSection job="guard" penId={props.pen.id} slots={1} label="Guard dogs" sendLabel="Assign a guard dog" />
            <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "margin-top": "8px" }}>
              A good dog turns wolves off this fold.
            </div>
          </div>

          {/* Feed detail */}
          <div style={{
            padding: "10px 12px", background: "var(--bg-card)", border: "1px solid var(--border-color)",
            "border-radius": "8px", "font-size": "0.78rem", color: "var(--text-muted)",
          }}>
            <Show
              when={onPasture()}
              fallback={
                <>
                  <Show when={grazes()}>
                    🌾 Winter: fed from the hayricks{hayStored() > 0 ? "" : " (none stored — buy or grow feed)"}, then{" "}
                  </Show>
                  Eats{" "}
                  <For each={ANIMAL_FEED[props.pen.animal]}>
                    {(cat, i) => (
                      <>
                        {i() > 0 ? " or " : ""}{FEED_CATEGORY_ICON[cat]} {FEED_CATEGORY_LABEL[cat]}
                      </>
                    )}
                  </For>
                  {" "}from the larder.
                </>
              }
            >
              🌿 Out on the wild pasture — no feed cost this season.
            </Show>
          </div>
        </div>
      </div>
    </Portal>
  );
}
