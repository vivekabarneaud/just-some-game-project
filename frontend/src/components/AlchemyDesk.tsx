import { createSignal, createMemo, For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { brew, recipeIdFor } from "@medieval-realm/shared/data/alchemy/brew";
import { INGREDIENTS, getIngredient } from "@medieval-realm/shared/data/alchemy/ingredients";
import type { Technique, Role, EffectChannel, Placement } from "@medieval-realm/shared/data/alchemy/types";
import { playSound } from "~/engine/sounds";

/** The free-form brewing desk — the real, playable version of the /dev-alchemy
 *  sandbox: pick a plant from each ROLE shelf, choose how to prepare it
 *  (technique), see the live brew, and BREW it (consumes your herbs → a potion
 *  in your inventory + a saved recipe card). See docs/DESIGN_APOTHECARY.md. */

const ROLE_SHELVES: { role: Role; label: string; hint: string }[] = [
  { role: "base", label: "Base", hint: "the carrier — a brew wants one" },
  { role: "hero", label: "Hero ⭐", hint: "the star effect" },
  { role: "catalyst", label: "Catalyst", hint: "amplify / extend" },
  { role: "toxin", label: "Toxin", hint: "poisons & offensive" },
  { role: "wildcard", label: "Wildcard", hint: "potent, and its own risk" },
];
const TECHNIQUES: { technique: Technique; label: string }[] = [
  { technique: "crush", label: "🪨 Crush" },
  { technique: "boil", label: "🔥 Boil" },
  { technique: "steep", label: "🫖 Steep" },
  { technique: "distil", label: "⚗️ Distil" },
  { technique: "char", label: "🕯️ Char" },
];
const CHANNEL_LABEL: Partial<Record<EffectChannel, string>> = {
  str: "+STR", dex: "+DEX", int: "+INT", vit: "+VIT", wis: "+WIS",
  crit: "+Crit%", accuracy: "+Accuracy%", dodge: "+Dodge%", parry: "+Parry%",
  initiative: "+Initiative", mobility: "+Mobility", presence: "+Presence", luck: "+Luck%",
  damage_pct: "+Damage%", defense_pct: "+Defense%",
  heal_hp: "Heal HP", ease_fever: "Eases Fever", ease_gut: "Settles Gut", ease_wound: "Mends Wound",
  general_recovery: "General recovery", happiness: "+Happiness",
  resist_undead: "Ward vs Undead", resist_confuse: "Resist Confusion",
  poison: "Poison (DoT)", weaken: "Weaken", slow: "Slow", confuse: "Confuse",
  aoe_fire: "AoE Fire", aoe_frost: "AoE Frost",
};
const QUALITY_COLOR = { fine: "var(--accent-green)", rough: "var(--accent-gold)", dubious: "var(--accent-red)" };
const OFFENSIVE = new Set(["poison", "weaken", "slow", "confuse", "aoe_fire", "aoe_frost"]);
type Slot = { ingredientId: string; technique: Technique };
const emptySlots = (): Record<string, Slot> =>
  Object.fromEntries(ROLE_SHELVES.map((s) => [s.role, { ingredientId: "", technique: "steep" as Technique }]));

function fmtEffect(e: { channel: EffectChannel; amount: number; shape?: string; rounds?: number }) {
  const label = CHANNEL_LABEL[e.channel] ?? e.channel;
  const dur = e.shape === "burst" ? ` for ${e.rounds ?? 2} turns`
    : e.shape === "instant" ? " (instant)" : e.shape === "topical" ? " (applied)" : " (whole fight)";
  return `${label} ${e.amount}${dur}`;
}

export default function AlchemyDesk() {
  const { state, actions } = useGame();
  const [slots, setSlots] = createSignal<Record<string, Slot>>(emptySlots());

  const pickPlant = (role: Role, id: string) => {
    const sig = id ? getIngredient(id)?.signature ?? "steep" : "steep";
    setSlots({ ...slots(), [role]: { ingredientId: id, technique: sig } });
  };
  const pickTechnique = (role: Role, t: Technique) => setSlots({ ...slots(), [role]: { ...slots()[role], technique: t } });
  const clear = () => setSlots(emptySlots());

  const placements = createMemo<Placement[]>(() =>
    ROLE_SHELVES.filter((s) => slots()[s.role].ingredientId)
      .map((s) => ({ ingredientId: slots()[s.role].ingredientId, technique: slots()[s.role].technique })),
  );
  const result = createMemo(() => brew(placements()));

  // Availability: 1 of each ingredient. Short if any owned count < needed.
  const short = createMemo(() => {
    const need = new Map<string, number>();
    for (const pl of placements()) need.set(pl.ingredientId, (need.get(pl.ingredientId) ?? 0) + 1);
    return [...need].filter(([id, n]) => actions.getBrewIngredientQty(id) < n).map(([id]) => getIngredient(id)?.name ?? id);
  });
  const alreadyKnown = createMemo(() => !!state.alchemyRecipes?.[recipeIdFor(placements())]);

  const doBrew = () => {
    if (actions.brewPotion(placements())) { playSound("build"); }
  };
  const loadRecipe = (r: { placements: Placement[] }) => {
    const next = emptySlots();
    for (const pl of r.placements) {
      const role = getIngredient(pl.ingredientId)?.role;
      if (role) next[role] = { ingredientId: pl.ingredientId, technique: pl.technique };
    }
    setSlots(next);
  };

  const recipeBook = createMemo(() => Object.values(state.alchemyRecipes ?? {}));

  return (
    <div style={{ margin: "8px 0 24px" }}>
      <h3 style={{ "font-family": "var(--font-heading)", color: "var(--text-primary)", "margin-bottom": "4px" }}>
        The Lab — free-form brewing
      </h3>
      <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-bottom": "12px" }}>
        Pick a plant from each shelf and choose how to prepare it. Brewing spends your herbs and remembers the recipe.
      </div>

      <div style={{ display: "flex", gap: "18px", "flex-wrap": "wrap" }}>
        {/* Recipe book (known) */}
        <div style={{ flex: "1 1 240px", "max-width": "300px" }}>
          <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "6px" }}>📖 Recipe book</div>
          <Show when={recipeBook().length > 0} fallback={<div style={{ "font-size": "0.78rem", color: "var(--text-muted)", "font-style": "italic" }}>No recipes yet — brew something to start your book.</div>}>
            <div style={{ display: "flex", "flex-direction": "column", gap: "5px", "max-height": "320px", overflow: "auto" }}>
              <For each={recipeBook()}>
                {(r) => (
                  <button
                    onClick={() => loadRecipe(r)}
                    title="Load into the desk"
                    style={{ "text-align": "left", padding: "6px 9px", background: "var(--bg-card)", border: `1px solid ${QUALITY_COLOR[r.quality]}`, "border-radius": "5px", cursor: "pointer", color: "var(--text-primary)" }}
                  >
                    <div style={{ "font-size": "0.82rem", color: QUALITY_COLOR[r.quality], "font-weight": 600 }}>{r.name}</div>
                    <div style={{ "font-size": "0.68rem", color: "var(--text-muted)" }}>
                      {r.placements.map((pl) => getIngredient(pl.ingredientId)?.icon).join(" ")} · owned ×{state.inventory.find((i) => i.itemId === r.id)?.quantity ?? 0}
                    </div>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* The desk (shelves → slots) */}
        <div style={{ flex: "2 1 380px" }}>
          <For each={ROLE_SHELVES}>
            {(shelf) => {
              const slot = () => slots()[shelf.role];
              const picked = () => (slot().ingredientId ? getIngredient(slot().ingredientId) : undefined);
              return (
                <div style={{ display: "flex", "align-items": "center", gap: "7px", padding: "6px 8px", "margin-bottom": "6px", border: "1px solid var(--border-default)", "border-radius": "6px", background: picked() ? "rgba(212,131,26,0.06)" : undefined }}>
                  <div style={{ "min-width": "86px" }}>
                    <div style={{ "font-size": "0.82rem", color: "var(--text-primary)" }}>{shelf.label}</div>
                    <div style={{ "font-size": "0.62rem", color: "var(--text-muted)" }}>{shelf.hint}</div>
                  </div>
                  <select value={slot().ingredientId} onChange={(e) => pickPlant(shelf.role, e.currentTarget.value)}
                    style={{ flex: 1, padding: "4px", background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-default)", "border-radius": "4px" }}>
                    <option value="">— none —</option>
                    <For each={INGREDIENTS.filter((i) => i.role === shelf.role)}>
                      {(ing) => {
                        const owned = actions.getBrewIngredientQty(ing.id);
                        return <option value={ing.id}>{ing.icon} {ing.name} (×{owned})</option>;
                      }}
                    </For>
                  </select>
                  <select value={slot().technique} disabled={!picked()} onChange={(e) => pickTechnique(shelf.role, e.currentTarget.value as Technique)}
                    style={{ width: "104px", padding: "4px", background: "var(--bg-card)", color: picked() ? "var(--text-primary)" : "var(--text-muted)", border: "1px solid var(--border-default)", "border-radius": "4px", opacity: picked() ? 1 : 0.5 }}>
                    <For each={TECHNIQUES}>
                      {(t) => <option value={t.technique}>{t.label}{picked()?.signature === t.technique ? " ⭐" : ""}</option>}
                    </For>
                  </select>
                </div>
              );
            }}
          </For>
          <button class="btn-tertiary" style={{ "font-size": "0.78rem" }} onClick={clear}>Clear the pot</button>
        </div>

        {/* Output */}
        <div style={{ flex: "1 1 240px", "max-width": "300px" }}>
          <div style={{ padding: "12px", border: `1px solid ${QUALITY_COLOR[result().quality]}`, "border-radius": "8px", background: "rgba(0,0,0,0.15)" }}>
            <div style={{ "font-size": "1.1rem", "font-weight": 600, color: QUALITY_COLOR[result().quality] }}>{result().name}</div>
            <div style={{ "font-size": "0.68rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin-bottom": "6px" }}>{result().quality}{alreadyKnown() ? " · known" : ""}</div>
            <Show when={result().effects.length > 0} fallback={<div style={{ color: "var(--text-muted)", "font-style": "italic", "font-size": "0.82rem" }}>Nothing worth drinking yet.</div>}>
              <For each={result().effects}>
                {(e) => <div style={{ "font-size": "0.82rem", color: OFFENSIVE.has(e.channel) ? "var(--accent-red)" : "var(--accent-green)", padding: "1px 0" }}>{fmtEffect(e)}</div>}
              </For>
            </Show>
            <Show when={result().notes.length > 0}>
              <div style={{ "margin-top": "8px", "border-top": "1px solid var(--border-default)", "padding-top": "6px" }}>
                <For each={result().notes}>{(n) => <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "font-style": "italic" }}>· {n}</div>}</For>
              </div>
            </Show>
          </div>
          <Show when={short().length > 0}>
            <div style={{ "font-size": "0.72rem", color: "var(--accent-red)", "margin-top": "6px" }}>Short of: {short().join(", ")}</div>
          </Show>
          <button
            class="btn-primary"
            style={{ "margin-top": "8px", width: "100%", opacity: placements().length === 0 || short().length > 0 ? 0.5 : 1 }}
            disabled={placements().length === 0 || short().length > 0}
            onClick={doBrew}
          >
            🧪 Brew{alreadyKnown() ? "" : " (new recipe)"}
          </button>
        </div>
      </div>
    </div>
  );
}
