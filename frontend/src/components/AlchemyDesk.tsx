import { createSignal, createMemo, For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { brew, recipeIdFor } from "@medieval-realm/shared/data/alchemy/brew";
import { INGREDIENTS, getIngredient } from "@medieval-realm/shared/data/alchemy/ingredients";
import { describeEffect, effectKind } from "@medieval-realm/shared/data/alchemy/describe";
import { NAMED_RECIPES, matchNamedRecipe, namedRecipeId } from "@medieval-realm/shared/data/alchemy/named_recipes";
import type { Technique, Role, Placement } from "@medieval-realm/shared/data/alchemy/types";
import { playSound } from "~/engine/sounds";

/** The free-form brewing lab (docs/DESIGN_APOTHECARY.md — user sketch layout):
 *  recipe book on the LEFT, the working lab on the RIGHT. In the lab you take an
 *  ingredient off a ROLE shelf (click to pick up) and set it on a TECHNIQUE
 *  station (click to place) — station = how it's prepared. The brew flows to the
 *  output box, where Brew spends the herbs → a potion + a saved recipe card.
 *  Functional/placeholder art; the hand-drawn lab drops in later. */

// Technique stations — unlock as the Alchemy Lab levels up.
const STATIONS: { technique: Technique; place: string; icon: string; verb: string; level: number }[] = [
  { technique: "crush", place: "Mortar", icon: "🪨", verb: "Crush", level: 1 },
  { technique: "boil", place: "Cauldron", icon: "🔥", verb: "Boil", level: 1 },
  { technique: "steep", place: "Steeping Pot", icon: "🫖", verb: "Steep", level: 1 },
  { technique: "distil", place: "Still", icon: "⚗️", verb: "Distil", level: 2 },
  { technique: "char", place: "Brazier", icon: "🕯️", verb: "Char", level: 3 },
];
const ROLE_SHELVES: { role: Role; label: string }[] = [
  { role: "base", label: "Base" }, { role: "hero", label: "Hero ⭐" },
  { role: "catalyst", label: "Catalyst" }, { role: "toxin", label: "Toxin" }, { role: "wildcard", label: "Wildcard" },
];
const QUALITY_COLOR = { fine: "var(--accent-green)", rough: "var(--accent-gold)", dubious: "var(--accent-red)" };
// Recovery = green, combat buff = blue, offensive = red.
const KIND_COLOR = { recovery: "var(--accent-green)", combat: "var(--accent-blue)", offensive: "var(--accent-red)" };

export default function AlchemyDesk() {
  const { state, actions } = useGame();
  const labLevel = () => state.buildings.find((b) => b.buildingId === "alchemy_lab")?.level ?? 0;

  // What's "in hand" (picked off a shelf), and what sits on each station.
  const [held, setHeld] = createSignal<string | null>(null);
  const [stations, setStations] = createSignal<Partial<Record<Technique, string>>>({});

  const clear = () => { setStations({}); setHeld(null); };

  const clickStation = (t: Technique, unlocked: boolean) => {
    if (!unlocked) return;
    const h = held();
    if (h) { setStations({ ...stations(), [t]: h }); setHeld(null); playSound("nav"); }
    else if (stations()[t]) { const next = { ...stations() }; delete next[t]; setStations(next); } // clear the station
  };
  const clickShelf = (id: string) => setHeld(held() === id ? null : id);

  const placements = createMemo<Placement[]>(() =>
    STATIONS.filter((s) => stations()[s.technique])
      .map((s) => ({ ingredientId: stations()[s.technique]!, technique: s.technique })),
  );
  const result = createMemo(() => brew(placements()));

  const short = createMemo(() => {
    const need = new Map<string, number>();
    for (const pl of placements()) need.set(pl.ingredientId, (need.get(pl.ingredientId) ?? 0) + 1);
    return [...need].filter(([id, n]) => actions.getBrewIngredientQty(id) < n).map(([id]) => getIngredient(id)?.name ?? id);
  });
  const matchedName = createMemo(() => matchNamedRecipe(placements())?.name);
  const alreadyKnown = createMemo(() => !!state.alchemyRecipes?.[recipeIdFor(placements())]);
  const invQty = (id: string) => state.inventory.find((i) => i.itemId === id)?.quantity ?? 0;

  // Known recipes (curated, always in the book) + the player's own discoveries.
  const knownCards = NAMED_RECIPES.map((r) => ({ id: namedRecipeId(r), name: r.name, icon: r.icon, note: r.note, placements: r.placements }));
  const namedIds = new Set(knownCards.map((c) => c.id));
  const discoveredCards = createMemo(() => Object.values(state.alchemyRecipes ?? {}).filter((r) => !namedIds.has(r.id)));

  const doBrew = () => { if (actions.brewPotion(placements())) playSound("build"); };
  const loadRecipe = (r: { placements: Placement[] }) => {
    const next: Partial<Record<Technique, string>> = {};
    for (const pl of r.placements) next[pl.technique] = pl.ingredientId;
    setStations(next); setHeld(null);
  };

  // The player's OWN shelves — only ingredients they actually hold.
  const shelfPlants = (role: Role) =>
    INGREDIENTS.filter((i) => i.role === role && actions.getBrewIngredientQty(i.id) > 0);

  return (
    <div style={{ margin: "8px 0 24px" }}>
      <h3 style={{ "font-family": "var(--font-heading)", color: "var(--text-primary)", "margin-bottom": "4px" }}>The Lab</h3>
      <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-bottom": "12px" }}>
        Take a plant off a shelf, set it on a station to prepare it. Brewing spends your herbs and remembers the recipe.
      </div>

      <div style={{ display: "flex", gap: "20px", "flex-wrap": "wrap", "align-items": "flex-start" }}>
        {/* ── LEFT: recipe book — known (curated) + your discoveries ── */}
        <div style={{ flex: "1 1 240px", "max-width": "300px", "max-height": "420px", overflow: "auto" }}>
          <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "6px" }}>📖 Recipe book</div>
          <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin-bottom": "4px" }}>Known</div>
          <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "6px" }}>
            <For each={knownCards}>
              {(r) => {
                const owned = () => invQty(r.id);
                return (
                  <button onClick={() => loadRecipe(r)} title={`${r.note} — load onto the stations`}
                    style={{ "text-align": "left", padding: "6px 8px", background: "var(--bg-card)", border: `1px solid ${owned() > 0 ? "var(--accent-green)" : "var(--border-default)"}`, "border-radius": "5px", cursor: "pointer", color: "var(--text-primary)" }}>
                    <div style={{ "font-size": "0.78rem", "font-weight": 600, "line-height": 1.2 }}>{r.icon} {r.name}</div>
                    <div style={{ "font-size": "0.66rem", color: "var(--text-muted)", "margin-top": "2px" }}>
                      {r.placements.map((pl) => getIngredient(pl.ingredientId)?.icon).join(" ")}{owned() > 0 ? ` ×${owned()}` : ""}
                    </div>
                  </button>
                );
              }}
            </For>
          </div>
          <Show when={discoveredCards().length > 0}>
            <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin": "10px 0 4px" }}>Your discoveries</div>
            <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "6px" }}>
              <For each={discoveredCards()}>
                {(r) => (
                  <button onClick={() => loadRecipe(r)} title="Load onto the stations"
                    style={{ "text-align": "left", padding: "6px 8px", background: "var(--bg-card)", border: `1px solid ${QUALITY_COLOR[r.quality]}`, "border-radius": "5px", cursor: "pointer", color: "var(--text-primary)" }}>
                    <div style={{ "font-size": "0.78rem", color: QUALITY_COLOR[r.quality], "font-weight": 600, "line-height": 1.2 }}>{r.name}</div>
                    <div style={{ "font-size": "0.66rem", color: "var(--text-muted)", "margin-top": "2px" }}>
                      {r.placements.map((pl) => getIngredient(pl.ingredientId)?.icon).join(" ")} ×{invQty(r.id)}
                    </div>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* ── RIGHT: the working lab (divider) ── */}
        <div style={{ flex: "2 1 460px", "border-left": "1px solid var(--border-default)", "padding-left": "20px" }}>
          {/* Stations (the lab) */}
          <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "6px" }}>⚗️ Alchemy lab</div>
          <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap", "margin-bottom": "16px" }}>
            <For each={STATIONS}>
              {(st) => {
                const unlocked = () => labLevel() >= st.level;
                const on = () => stations()[st.technique];
                const plant = () => (on() ? getIngredient(on()!) : undefined);
                const isSig = () => plant()?.signature === st.technique;
                return (
                  <div
                    onClick={() => clickStation(st.technique, unlocked())}
                    title={unlocked() ? (held() ? `Set on the ${st.place}` : plant() ? "Click to clear" : `Empty ${st.place}`) : `Unlocks at Alchemy Lab Lv.${st.level}`}
                    style={{
                      width: "104px", "min-height": "88px", padding: "8px 6px", "border-radius": "8px", "text-align": "center",
                      border: `1px solid ${on() ? QUALITY_COLOR.fine : "var(--border-default)"}`,
                      background: unlocked() ? (held() ? "rgba(212,131,26,0.10)" : "var(--bg-card)") : "rgba(0,0,0,0.25)",
                      opacity: unlocked() ? 1 : 0.5, cursor: unlocked() ? "pointer" : "not-allowed",
                      display: "flex", "flex-direction": "column", "align-items": "center", "justify-content": "center", gap: "3px",
                    }}
                  >
                    <div style={{ "font-size": "1.4rem" }}>{st.icon}</div>
                    <div style={{ "font-size": "0.7rem", color: "var(--text-secondary)" }}>{st.verb}</div>
                    <Show when={unlocked()} fallback={<div style={{ "font-size": "0.62rem", color: "var(--text-muted)" }}>🔒 Lv.{st.level}</div>}>
                      <Show when={plant()} fallback={<div style={{ "font-size": "0.62rem", color: "var(--text-muted)" }}>empty</div>}>
                        <div style={{ "font-size": "0.72rem", color: "var(--text-primary)" }}>{plant()!.icon} {plant()!.name}{isSig() ? " ⭐" : ""}</div>
                      </Show>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>

          {/* Shelves (your owned ingredients, by role) */}
          <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "6px" }}>
            🧺 Shelves {held() ? <span style={{ color: "var(--accent-gold)" }}>· holding {getIngredient(held()!)?.icon} {getIngredient(held()!)?.name} (click a station)</span> : ""}
          </div>
          <For each={ROLE_SHELVES}>
            {(shelf) => (
              <div style={{ display: "flex", "align-items": "center", gap: "8px", "margin-bottom": "5px" }}>
                <div style={{ "min-width": "72px", "font-size": "0.72rem", color: "var(--text-muted)" }}>{shelf.label}</div>
                <div style={{ display: "flex", gap: "5px", "flex-wrap": "wrap" }}>
                  <Show when={shelfPlants(shelf.role).length > 0} fallback={<span style={{ "font-size": "0.7rem", color: "var(--text-muted)", "font-style": "italic" }}>—</span>}>
                    <For each={shelfPlants(shelf.role)}>
                      {(ing) => (
                        <button onClick={() => clickShelf(ing.id)}
                          style={{ padding: "3px 8px", "border-radius": "12px", "font-size": "0.74rem", cursor: "pointer",
                            border: `1px solid ${held() === ing.id ? "var(--accent-gold)" : "var(--border-default)"}`,
                            background: held() === ing.id ? "rgba(212,131,26,0.18)" : "var(--bg-card)", color: "var(--text-primary)" }}>
                          {ing.icon} {ing.name} <span style={{ color: "var(--text-muted)" }}>×{actions.getBrewIngredientQty(ing.id)}</span>
                        </button>
                      )}
                    </For>
                  </Show>
                </div>
              </div>
            )}
          </For>

          {/* Output */}
          <div style={{ display: "flex", "align-items": "flex-start", gap: "12px", "margin-top": "16px" }}>
            <div style={{ "font-size": "1.6rem", color: "var(--text-muted)", "padding-top": "18px" }}>⤵</div>
            <div style={{ flex: 1, "max-width": "320px" }}>
              <div style={{ padding: "12px", border: `1px solid ${QUALITY_COLOR[result().quality]}`, "border-radius": "8px", background: "rgba(0,0,0,0.15)" }}>
                <div style={{ "font-size": "1.1rem", "font-weight": 600, color: matchedName() ? "var(--accent-green)" : QUALITY_COLOR[result().quality] }}>{matchedName() ?? result().name}</div>
                <div style={{ "font-size": "0.68rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin-bottom": "6px" }}>{matchedName() ? "known recipe" : result().quality}{!matchedName() && alreadyKnown() ? " · known" : ""}</div>
                <Show when={result().effects.length > 0} fallback={<div style={{ color: "var(--text-muted)", "font-style": "italic", "font-size": "0.82rem" }}>Nothing worth drinking yet.</div>}>
                  <For each={result().effects}>{(e) => <div style={{ "font-size": "0.82rem", color: KIND_COLOR[effectKind(e.channel)], padding: "1px 0" }}>{describeEffect(e)}</div>}</For>
                </Show>
                <Show when={result().notes.length > 0}>
                  <div style={{ "margin-top": "8px", "border-top": "1px solid var(--border-default)", "padding-top": "6px" }}>
                    <For each={result().notes}>{(n) => <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "font-style": "italic" }}>· {n}</div>}</For>
                  </div>
                </Show>
              </div>
              <Show when={short().length > 0}><div style={{ "font-size": "0.72rem", color: "var(--accent-red)", "margin-top": "6px" }}>Short of: {short().join(", ")}</div></Show>
              <div style={{ display: "flex", gap: "8px", "margin-top": "8px" }}>
                <button class="btn-primary" style={{ flex: 1, opacity: placements().length === 0 || short().length > 0 ? 0.5 : 1 }}
                  disabled={placements().length === 0 || short().length > 0} onClick={doBrew}>
                  🧪 Brew{alreadyKnown() ? "" : placements().length > 0 ? " (new)" : ""}
                </button>
                <button class="btn-tertiary" style={{ "font-size": "0.78rem" }} onClick={clear}>Clear</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
