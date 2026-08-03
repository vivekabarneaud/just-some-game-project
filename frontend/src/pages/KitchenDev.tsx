import { createSignal, createMemo, For, Show } from "solid-js";
import { cook } from "@medieval-realm/shared/data/kitchen/cook";
import { FOOD_INGREDIENTS, getFoodIngredient, foodByRole } from "@medieval-realm/shared/data/kitchen/ingredients";
import { matchNamedDish } from "@medieval-realm/shared/data/kitchen/named_dishes";
import type { CookTechnique, FoodRole, DishChannel } from "@medieval-realm/shared/data/kitchen/types";

/** TEMP dev page (/dev-kitchen) — the free-form COOKING sandbox. No art, no
 *  economy: pick ONE technique, add an ingredient from each shelf (with a
 *  quantity), and watch the dish update live — so we can feel combinations and
 *  tune the cook engine before wiring real food. See docs/DESIGN_KITCHEN.md. */

const TECHNIQUES: { technique: CookTechnique; label: string; hint: string }[] = [
  { technique: "simmer", label: "🍲 Simmer", hint: "hearty, warming" },
  { technique: "fry", label: "🍳 Fry", hint: "quick, savoury" },
  { technique: "roast", label: "🔥 Roast", hint: "rich, a small feast" },
  { technique: "assemble", label: "🥗 Assemble", hint: "fresh, cold, light" },
];

const SHELVES: { role: FoodRole; label: string; hint: string }[] = [
  { role: "staple", label: "🌾 Staple", hint: "the base — a meal wants one" },
  { role: "protein", label: "🍖 Protein", hint: "the substance" },
  { role: "veg", label: "🥬 Veg", hint: "body" },
  { role: "fruit", label: "🍎 Fruit", hint: "sweet" },
  { role: "dairy", label: "🧀 Dairy", hint: "enriches, bakes" },
  { role: "spice", label: "🌶️ Spices", hint: "amplify the rest" },
];

const CHANNEL_LABEL: Record<DishChannel, string> = {
  nourishment: "Nourishment (well-fed)",
  comfort: "Comfort (a small happiness lift)",
  warmth: "Warmth (eases winter cold)",
  freshness: "Freshness (eases summer heat)",
  diversity: "Variety delight",
};

const QUALITY_COLOR = { fine: "var(--accent-green)", rough: "var(--accent-gold)", plain: "var(--text-muted)" };

type Slot = { ingredientId: string; qty: number };

export default function KitchenDev() {
  const [technique, setTechnique] = createSignal<CookTechnique>("simmer");
  const [slots, setSlots] = createSignal<Record<string, Slot>>(
    Object.fromEntries(SHELVES.map((s) => [s.role, { ingredientId: "", qty: 1 }])),
  );

  const setIngredient = (role: FoodRole, id: string) =>
    setSlots({ ...slots(), [role]: { ingredientId: id, qty: 1 } });
  const setQty = (role: FoodRole, qty: number) =>
    setSlots({ ...slots(), [role]: { ...slots()[role], qty: Math.max(1, Math.min(5, qty)) } });
  const clear = () => setSlots(Object.fromEntries(SHELVES.map((s) => [s.role, { ingredientId: "", qty: 1 }])));

  // Build the ingredient-id list (an id repeated `qty` times = its quantity).
  const ids = createMemo<string[]>(() =>
    SHELVES.flatMap((s) => {
      const slot = slots()[s.role];
      return slot.ingredientId ? Array.from({ length: slot.qty }, () => slot.ingredientId) : [];
    }),
  );
  const result = createMemo(() => cook(technique(), ids()));
  const matched = createMemo(() => matchNamedDish(technique(), ids())?.name);

  return (
    <div style={{ padding: "20px", "max-width": "1000px", margin: "0 auto" }}>
      <h1 style={{ color: "var(--accent-gold)" }}>🍲 Kitchen — sandbox</h1>
      <p style={{ color: "var(--text-secondary)", "font-size": "0.9rem" }}>
        Pick ONE way to cook, then add ingredients from the shelves. The technique shapes the dish;
        spices amplify; a meal wants a staple. A tuning sandbox — nothing is consumed. <em>(dev page /dev-kitchen)</em>
      </p>

      {/* Technique picker */}
      <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap", margin: "12px 0 18px" }}>
        <For each={TECHNIQUES}>
          {(t) => (
            <button onClick={() => setTechnique(t.technique)}
              style={{
                padding: "8px 14px", "border-radius": "8px", cursor: "pointer",
                border: `2px solid ${technique() === t.technique ? "var(--accent-gold)" : "var(--border-default)"}`,
                background: technique() === t.technique ? "rgba(212,131,26,0.12)" : "var(--bg-card)",
                color: "var(--text-primary)",
              }}>
              <div>{t.label}</div>
              <div style={{ "font-size": "0.64rem", color: "var(--text-muted)" }}>{t.hint}</div>
            </button>
          )}
        </For>
      </div>

      <div style={{ display: "flex", gap: "20px", "flex-wrap": "wrap" }}>
        {/* ── Shelves ── */}
        <div style={{ flex: "1 1 460px" }}>
          <h2 style={{ "font-size": "1rem", color: "var(--text-primary)" }}>The shelves</h2>
          <For each={SHELVES}>
            {(shelf) => {
              const slot = () => slots()[shelf.role];
              const picked = () => (slot().ingredientId ? getFoodIngredient(slot().ingredientId) : undefined);
              return (
                <div style={{
                  display: "flex", "align-items": "center", gap: "8px", padding: "8px 10px",
                  "margin-bottom": "8px", border: "1px solid var(--border-default)", "border-radius": "6px",
                  background: picked() ? "rgba(212,131,26,0.06)" : undefined,
                }}>
                  <div style={{ "min-width": "96px" }}>
                    <div style={{ "font-size": "0.85rem", color: "var(--text-primary)" }}>{shelf.label}</div>
                    <div style={{ "font-size": "0.65rem", color: "var(--text-muted)" }}>{shelf.hint}</div>
                  </div>
                  <select value={slot().ingredientId}
                    onChange={(e) => setIngredient(shelf.role, e.currentTarget.value)}
                    style={{ flex: 1, padding: "5px", background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-default)", "border-radius": "4px" }}>
                    <option value="">— none —</option>
                    <For each={foodByRole(shelf.role)}>
                      {(ing) => <option value={ing.id}>{ing.icon} {ing.name}</option>}
                    </For>
                  </select>
                  {/* Quantity stepper (1–5) */}
                  <div style={{ display: "flex", "align-items": "center", gap: "4px", opacity: picked() ? 1 : 0.35 }}>
                    <button disabled={!picked()} onClick={() => setQty(shelf.role, slot().qty - 1)} style={STEP}>−</button>
                    <span style={{ "min-width": "1em", "text-align": "center", "font-weight": 600 }}>{slot().qty}</span>
                    <button disabled={!picked()} onClick={() => setQty(shelf.role, slot().qty + 1)} style={STEP}>+</button>
                  </div>
                </div>
              );
            }}
          </For>
          <button class="btn-tertiary" style={{ "margin-top": "4px", "font-size": "0.8rem" }} onClick={clear}>Clear the pot</button>
        </div>

        {/* ── Result ── */}
        <div style={{ flex: "1 1 320px" }}>
          <h2 style={{ "font-size": "1rem", color: "var(--text-primary)" }}>The dish</h2>
          <div style={{ padding: "14px", border: `1px solid ${QUALITY_COLOR[result().quality]}`, "border-radius": "8px", background: "rgba(0,0,0,0.15)" }}>
            <div style={{ "font-size": "1.2rem", "font-weight": 600, color: matched() ? "var(--accent-green)" : QUALITY_COLOR[result().quality] }}>
              {matched() ?? result().name}
            </div>
            <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin-bottom": "8px" }}>
              {matched() ? "known dish" : result().quality}
            </div>
            <Show when={result().effects.length > 0} fallback={<div style={{ color: "var(--text-muted)", "font-style": "italic" }}>Nothing worth serving yet.</div>}>
              <For each={result().effects}>
                {(e) => (
                  <div style={{ "font-size": "0.85rem", color: "var(--accent-green)", padding: "2px 0" }}>
                    <b>{e.amount}</b> {CHANNEL_LABEL[e.channel]}
                  </div>
                )}
              </For>
            </Show>
            <Show when={result().notes.length > 0}>
              <div style={{ "margin-top": "10px", "border-top": "1px solid var(--border-default)", "padding-top": "8px" }}>
                <For each={result().notes}>
                  {(n) => <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "font-style": "italic", padding: "1px 0" }}>· {n}</div>}
                </For>
              </div>
            </Show>
          </div>

          {/* Ingredient hints */}
          <Show when={ids().length > 0}>
            <div style={{ "margin-top": "12px", "font-size": "0.75rem", color: "var(--text-muted)" }}>
              <For each={SHELVES.filter((s) => slots()[s.role].ingredientId)}>
                {(s) => {
                  const ing = getFoodIngredient(slots()[s.role].ingredientId);
                  return <div style={{ padding: "2px 0" }}>{ing?.icon} <b>{ing?.name}</b> ×{slots()[s.role].qty} — {ing?.note}</div>;
                }}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}

const STEP = { background: "rgba(255,255,255,0.1)", border: "1px solid var(--border-default)", "border-radius": "4px", color: "var(--text-primary)", width: "20px", height: "20px", "line-height": 1, padding: 0, cursor: "pointer", "font-size": "0.9rem" } as const;
