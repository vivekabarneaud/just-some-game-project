import { createSignal, createMemo, For, Show } from "solid-js";
import { cook } from "@medieval-realm/shared/data/kitchen/cook";
import { getFoodIngredient, foodByRole } from "@medieval-realm/shared/data/kitchen/ingredients";
import { matchNamedDish } from "@medieval-realm/shared/data/kitchen/named_dishes";
import type { CookTechnique, FoodRole, DishChannel, CookPlacement } from "@medieval-realm/shared/data/kitchen/types";

/** TEMP dev page (/dev-kitchen) — the free-form COOKING sandbox. No art, no
 *  economy: pick an ingredient from each shelf, choose how to PREPARE it (roast
 *  the meat, boil the staple), set a quantity, and watch the dish update live —
 *  so we can feel combinations and tune the cook engine. See docs/DESIGN_KITCHEN.md. */

const SHELVES: { role: FoodRole; label: string; hint: string }[] = [
  { role: "staple", label: "🌾 Staple", hint: "the base — a meal wants one" },
  { role: "protein", label: "🍖 Protein", hint: "the substance" },
  { role: "veg", label: "🥬 Veg", hint: "body" },
  { role: "fruit", label: "🍎 Fruit", hint: "sweet" },
  { role: "dairy", label: "🧀 Dairy", hint: "enriches, bakes" },
  { role: "spice", label: "🌶️ Spices", hint: "amplify the rest" },
];

// Preps + which kitchen level / tool gates each (shown here for reference; the
// sandbox exposes them all for tuning).
const TECHNIQUES: { technique: CookTechnique; label: string; gate: string }[] = [
  { technique: "boil", label: "🍲 Boil", gate: "camp" },
  { technique: "chop", label: "🔪 Chop", gate: "camp" },
  { technique: "fry", label: "🍳 Fry", gate: "village · pan" },
  { technique: "roast", label: "🔥 Roast", gate: "town · oven" },
];

const CHANNEL_LABEL: Record<DishChannel, string> = {
  nourishment: "Nourishment (well-fed)",
  comfort: "Comfort (a small happiness lift)",
  warmth: "Warmth (eases winter cold)",
  freshness: "Freshness (eases summer heat)",
  diversity: "Variety delight",
};

const QUALITY_COLOR = { fine: "var(--accent-green)", rough: "var(--accent-gold)", plain: "var(--text-muted)" };

type Slot = { ingredientId: string; technique: CookTechnique; qty: number };

export default function KitchenDev() {
  const [slots, setSlots] = createSignal<Record<string, Slot>>(
    Object.fromEntries(SHELVES.map((s) => [s.role, { ingredientId: "", technique: "boil" as CookTechnique, qty: 1 }])),
  );

  // Picking an ingredient defaults its prep to its signature.
  const pickIngredient = (role: FoodRole, id: string) => {
    const sig = id ? getFoodIngredient(id)?.signature ?? "boil" : "boil";
    setSlots({ ...slots(), [role]: { ingredientId: id, technique: sig, qty: 1 } });
  };
  const pickTechnique = (role: FoodRole, t: CookTechnique) =>
    setSlots({ ...slots(), [role]: { ...slots()[role], technique: t } });
  const setQty = (role: FoodRole, qty: number) =>
    setSlots({ ...slots(), [role]: { ...slots()[role], qty: Math.max(1, Math.min(5, qty)) } });
  const clear = () => setSlots(Object.fromEntries(SHELVES.map((s) => [s.role, { ingredientId: "", technique: "boil" as CookTechnique, qty: 1 }])));

  // Build placements (an ingredient repeated `qty` times = its quantity).
  const placements = createMemo<CookPlacement[]>(() =>
    SHELVES.flatMap((s) => {
      const slot = slots()[s.role];
      return slot.ingredientId
        ? Array.from({ length: slot.qty }, () => ({ ingredientId: slot.ingredientId, technique: slot.technique }))
        : [];
    }),
  );
  const result = createMemo(() => cook(placements()));
  const matched = createMemo(() => matchNamedDish(placements())?.name);

  return (
    <div style={{ padding: "20px", "max-width": "1000px", margin: "0 auto" }}>
      <h1 style={{ color: "var(--accent-gold)" }}>🍲 Kitchen — sandbox</h1>
      <p style={{ color: "var(--text-secondary)", "font-size": "0.9rem" }}>
        Pick an ingredient from each shelf and choose how to prepare it — roast the meat, boil the staple, combine.
        Spices amplify; a meal wants a staple. A tuning sandbox — nothing is consumed. <em>(dev page /dev-kitchen)</em>
      </p>
      <p style={{ color: "var(--text-muted)", "font-size": "0.72rem" }}>
        Prep unlocks (for reference): <For each={TECHNIQUES}>{(t) => <span>{t.label} <em>{t.gate}</em> &nbsp; </span>}</For>
      </p>

      <div style={{ display: "flex", gap: "20px", "flex-wrap": "wrap", "margin-top": "12px" }}>
        {/* ── Shelves ── */}
        <div style={{ flex: "1 1 480px" }}>
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
                  <div style={{ "min-width": "92px" }}>
                    <div style={{ "font-size": "0.85rem", color: "var(--text-primary)" }}>{shelf.label}</div>
                    <div style={{ "font-size": "0.65rem", color: "var(--text-muted)" }}>{shelf.hint}</div>
                  </div>
                  <select value={slot().ingredientId}
                    onChange={(e) => pickIngredient(shelf.role, e.currentTarget.value)}
                    style={{ flex: 1, padding: "5px", background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-default)", "border-radius": "4px" }}>
                    <option value="">— none —</option>
                    <For each={foodByRole(shelf.role)}>
                      {(ing) => <option value={ing.id}>{ing.icon} {ing.name}</option>}
                    </For>
                  </select>
                  {/* Prep picker — defaults to the ingredient's signature */}
                  <select value={slot().technique} disabled={!picked()}
                    onChange={(e) => pickTechnique(shelf.role, e.currentTarget.value as CookTechnique)}
                    title={picked() ? "How to prepare it" : "Pick an ingredient first"}
                    style={{ width: "104px", padding: "5px", background: "var(--bg-card)", color: picked() ? "var(--text-primary)" : "var(--text-muted)", border: "1px solid var(--border-default)", "border-radius": "4px", opacity: picked() ? 1 : 0.5 }}>
                    <For each={TECHNIQUES}>
                      {(t) => <option value={t.technique}>{t.label}{picked()?.signature === t.technique ? " ⭐" : ""}</option>}
                    </For>
                  </select>
                  {/* Quantity (1–5) */}
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
          <Show when={placements().length > 0}>
            <div style={{ "margin-top": "12px", "font-size": "0.75rem", color: "var(--text-muted)" }}>
              <For each={SHELVES.filter((s) => slots()[s.role].ingredientId)}>
                {(s) => {
                  const ing = getFoodIngredient(slots()[s.role].ingredientId);
                  const prep = TECHNIQUES.find((t) => t.technique === slots()[s.role].technique)?.label ?? "";
                  return <div style={{ padding: "2px 0" }}>{prep} {ing?.icon} <b>{ing?.name}</b> ×{slots()[s.role].qty} — {ing?.note}</div>;
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
