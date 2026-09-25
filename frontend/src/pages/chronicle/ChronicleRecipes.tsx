import { For, Show, createMemo, createSignal } from "solid-js";
import { useGame } from "~/engine/gameState";
import { NAMED_DISHES, type NamedDish } from "@medieval-realm/shared/data/kitchen/named_dishes";
import { NAMED_RECIPES, namedRecipeId, type NamedRecipe } from "@medieval-realm/shared/data/alchemy/named_recipes";
import { getFoodIngredient } from "@medieval-realm/shared/data/kitchen/ingredients";
import { getIngredient } from "@medieval-realm/shared/data/alchemy/ingredients";
import { describeEffectParts } from "@medieval-realm/shared/data/alchemy/describe";
import { brew } from "@medieval-realm/shared/data/alchemy/brew";
import type { CookTechnique } from "@medieval-realm/shared/data/kitchen/types";
import FramedModal from "~/components/FramedModal";

/**
 * Chronicle → Recipes. What the settlement has worked out how to make.
 *
 * THE RULE, and it is the whole reason this is safe to build: an undiscovered
 * card shows that a thing EXISTS and not one word more. No name, no ingredients,
 * no hint. The kitchen and the lab are free-form by design — you invent by
 * putting things together — and a mystery card that listed its ingredients would
 * turn that invention into following a shopping list. `???` keeps both the hunt
 * and the inventing.
 *
 * Only the NAMED recipes are censused. A player's own combos are open-ended and
 * live in the desk books; you cannot count what has no end.
 */

const COOK_GROUPS: { id: CookTechnique; label: string; icon: string }[] = [
  { id: "boil", label: "The pot", icon: "🍲" },
  { id: "roast", label: "The oven", icon: "🍖" },
  { id: "fry", label: "The pan", icon: "🍳" },
  { id: "skewer", label: "The fire", icon: "🍢" },
  { id: "chop", label: "The board", icon: "🥗" },
  { id: "preserve", label: "The store", icon: "🫙" },
];

/** A dish is filed under the prep its FIRST slot calls for — the meat is roasted
 *  and the grain boiled alongside, so the roast is what it is. Grouping by prep
 *  rather than by ingredient is also the useful one for a census: it tells you
 *  which station you have been neglecting. */
const dishGroup = (d: NamedDish): CookTechnique => d.slots[0]?.technique ?? "boil";

export default function ChronicleRecipes() {
  const { state } = useGame();
  const cookedIds = createMemo(() => new Set(Object.keys(state.kitchenDishes ?? {})));
  const brewedIds = createMemo(() => new Set(Object.keys(state.alchemyRecipes ?? {})));
  const [openDish, setOpenDish] = createSignal<NamedDish | null>(null);
  const [openBrew, setOpenBrew] = createSignal<NamedRecipe | null>(null);

  const dishKnown = (d: NamedDish) => !!d.preknown || cookedIds().has(d.id);
  const brewKnown = (r: NamedRecipe) => !!r.preknown || brewedIds().has(namedRecipeId(r));

  const dishesFound = () => NAMED_DISHES.filter(dishKnown).length;
  const brewsFound = () => NAMED_RECIPES.filter(brewKnown).length;

  /** The card. Deliberately takes only what it is allowed to show. */
  const Card = (p: { known: boolean; name: string; icon: string; onOpen: () => void }) => (
    <div class="building-card" classList={{ dimmed: !p.known }}
      style={{ cursor: p.known ? "pointer" : "default", "text-align": "center" }}
      onClick={() => { if (p.known) p.onOpen(); }}>
      <div style={{
        height: "72px", display: "flex", "align-items": "center", "justify-content": "center",
        background: "rgba(0,0,0,0.3)", "border-radius": "6px",
      }}>
        <Show when={p.known} fallback={
          <span style={{ "font-size": "2rem", color: "rgba(200,200,210,0.4)", "text-shadow": "0 0 8px rgba(0,0,0,0.7)" }}>?</span>
        }>
          <span style={{ "font-size": "2rem" }}>{p.icon}</span>
        </Show>
      </div>
      <div class="building-card-title" style={{
        "margin-top": "8px", "font-size": "0.8rem",
        "font-style": p.known ? "normal" : "italic",
        color: p.known ? "var(--text-primary)" : "var(--text-muted)",
        ...(p.known ? {} : { "letter-spacing": "0.15em" }),
      }}>
        {p.known ? p.name : "???"}
      </div>
    </div>
  );

  const GRID = { display: "grid", "grid-template-columns": "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" } as const;
  const HEAD = { "font-family": "var(--font-heading)", "font-size": "1rem", margin: "18px 0 10px", color: "var(--text-primary)" } as const;
  const COUNT = { color: "var(--text-muted)", "font-size": "0.8rem", "font-weight": 400 } as const;

  return (
    <div>
      <div style={{ display: "flex", "align-items": "baseline", gap: "12px", "margin-bottom": "4px", "flex-wrap": "wrap" }}>
        <p style={{ color: "var(--text-muted)", "font-size": "0.85rem", margin: 0, "font-style": "italic", flex: "1 1 320px" }}>
          A pot tells you nothing until you have put something in it.
        </p>
        <span style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
          {dishesFound() + brewsFound()} of {NAMED_DISHES.length + NAMED_RECIPES.length} written down
        </span>
      </div>

      {/* ── Dishes, filed by the prep they turn on ── */}
      <h2 style={HEAD}>🍲 The cookbook <span style={COUNT}>· {dishesFound()}/{NAMED_DISHES.length}</span></h2>
      <For each={COOK_GROUPS}>
        {(g) => {
          const inGroup = () => NAMED_DISHES.filter((d) => dishGroup(d) === g.id);
          return (
            <Show when={inGroup().length > 0}>
              <h3 style={{ "font-size": "0.85rem", color: "var(--text-muted)", margin: "14px 0 8px" }}>
                {g.icon} {g.label} <span style={COUNT}>· {inGroup().filter(dishKnown).length}/{inGroup().length}</span>
              </h3>
              <div style={GRID}>
                <For each={inGroup()}>
                  {(d) => <Card known={dishKnown(d)} name={d.name} icon={d.icon} onOpen={() => setOpenDish(d)} />}
                </For>
              </div>
            </Show>
          );
        }}
      </For>

      {/* ── Brews ── */}
      <h2 style={{ ...HEAD, "margin-top": "28px" }}>
        🧪 The apothecary's book <span style={COUNT}>· {brewsFound()}/{NAMED_RECIPES.length}</span>
      </h2>
      <div style={GRID}>
        <For each={NAMED_RECIPES}>
          {(r) => <Card known={brewKnown(r)} name={r.name} icon={r.icon} onOpen={() => setOpenBrew(r)} />}
        </For>
      </div>

      {/* ── A dish, once he knows it ── */}
      <Show when={openDish()}>
        {(d) => (
          <FramedModal title={d().name} icon={d().icon} onClose={() => setOpenDish(null)} maxWidth="560px"
            subtitle={d().preknown ? "Known since the first winter" : "Worked out in this kitchen"}>
            <div style={{ display: "flex", "flex-direction": "column", gap: "12px" }}>
              <div style={{ "font-style": "italic", color: "var(--text-muted)", "font-size": "0.85rem", "line-height": 1.5 }}>{d().note}</div>
              <div>
                <div style={{ "font-family": "var(--font-heading)", "font-size": "0.9rem", "margin-bottom": "6px" }}>What goes in it</div>
                <For each={d().slots}>
                  {(slot) => (
                    <div style={{ "font-size": "0.82rem", "line-height": 1.5 }}>
                      <span style={{ "font-weight": 600, "text-transform": "capitalize" }}>{slot.technique}:</span>{" "}
                      {/* An `anyOf` slot is the forgiving kind — a stew takes any
                          red meat — so the page says so rather than naming one. */}
                      {slot.anyOf.map((id) => getFoodIngredient(id)?.name ?? id).join(", or ")}
                    </div>
                  )}
                </For>
              </div>
            </div>
          </FramedModal>
        )}
      </Show>

      {/* ── A brew, once he knows it ── */}
      <Show when={openBrew()}>
        {(r) => (
          <FramedModal title={r().name} icon={r().icon} onClose={() => setOpenBrew(null)} maxWidth="560px"
            subtitle={r().preknown ? "Known since the first winter" : "Worked out at this bench"}>
            <div style={{ display: "flex", "flex-direction": "column", gap: "12px" }}>
              <div style={{ "font-style": "italic", color: "var(--text-muted)", "font-size": "0.85rem", "line-height": 1.5 }}>{r().note}</div>
              <div>
                <div style={{ "font-family": "var(--font-heading)", "font-size": "0.9rem", "margin-bottom": "6px" }}>What goes in it</div>
                <For each={r().placements}>
                  {(pl) => (
                    <div style={{ "font-size": "0.82rem", "line-height": 1.5 }}>
                      <span style={{ "font-weight": 600, "text-transform": "capitalize" }}>{pl.technique}:</span>{" "}
                      {getIngredient(pl.ingredientId)?.name ?? pl.ingredientId}
                    </div>
                  )}
                </For>
              </div>
              <div>
                <div style={{ "font-family": "var(--font-heading)", "font-size": "0.9rem", "margin-bottom": "6px" }}>What it does</div>
                <For each={brew(r().placements).effects}>
                  {(e) => {
                    const parts = describeEffectParts(e);
                    return (
                      <div style={{ "font-size": "0.82rem", "line-height": 1.5 }}>
                        {parts.label}
                        <Show when={parts.detail}><span style={{ color: "var(--text-muted)" }}> — {parts.detail}</span></Show>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          </FramedModal>
        )}
      </Show>
    </div>
  );
}
