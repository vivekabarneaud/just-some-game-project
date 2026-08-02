import { createSignal, createMemo, For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { brew, recipeIdFor, brewRarity } from "@medieval-realm/shared/data/alchemy/brew";
import { INGREDIENTS, getIngredient } from "@medieval-realm/shared/data/alchemy/ingredients";
import { describeEffectParts, effectKind } from "@medieval-realm/shared/data/alchemy/describe";
import { NAMED_RECIPES, matchNamedRecipe, namedRecipeId } from "@medieval-realm/shared/data/alchemy/named_recipes";
import type { Technique, Role, Placement, Effect } from "@medieval-realm/shared/data/alchemy/types";
import { playSound } from "~/engine/sounds";

/** The free-form brewing lab. Left: the recipe book on parchment (paginated,
 *  framed cards). Right: the working lab — technique STATIONS (click to pick a
 *  plant from a picker) and the output. Steep/Distil/Char are hidden for now
 *  (they'll return with Village/Town/City). See docs/DESIGN_APOTHECARY.md. */

// Stations shown for now — the two camp preparations. (Steep/Distil/Char parked.)
const STATIONS: { technique: Technique; place: string; icon: string; verb: string }[] = [
  { technique: "crush", place: "Mortar", icon: "🪨", verb: "Crush" },
  { technique: "boil", place: "Cauldron", icon: "🔥", verb: "Boil" },
];
const ROLE_ORDER: { role: Role; label: string }[] = [
  { role: "base", label: "Base" }, { role: "hero", label: "Hero" },
  { role: "catalyst", label: "Catalyst" }, { role: "toxin", label: "Toxin" }, { role: "wildcard", label: "Wildcard" },
];
const QUALITY_COLOR = { fine: "var(--accent-green)", rough: "var(--accent-gold)", dubious: "var(--accent-red)" };
const KIND_COLOR = { recovery: "var(--accent-green)", combat: "var(--accent-blue)", offensive: "var(--accent-red)" };
const frameUrl = (rarity?: string) => `/images/frames/item_frame_${rarity ?? "common"}.png`;
// Grade sheen over the frame: fine = bright/gold, rough = a touch dulled, dubious = grey.
const gradeFilter = (q: string) => q === "dubious" ? "grayscale(0.7) brightness(0.82)" : q === "rough" ? "saturate(0.65)" : "none";
const PER_PAGE = 6;

type Slot = { ingredientId: string; technique: Technique };

export default function AlchemyDesk() {
  const { state, actions } = useGame();
  const [stations, setStations] = createSignal<Partial<Record<Technique, string>>>({});
  const [pickerFor, setPickerFor] = createSignal<Technique | null>(null);
  const [page, setPage] = createSignal(0);

  const clear = () => { setStations({}); setPickerFor(null); };

  const placements = createMemo<Placement[]>(() =>
    STATIONS.filter((s) => stations()[s.technique]).map((s) => ({ ingredientId: stations()[s.technique]!, technique: s.technique })),
  );
  const result = createMemo(() => brew(placements()));
  const matchedName = createMemo(() => matchNamedRecipe(placements())?.name);
  const alreadyKnown = createMemo(() => !!state.alchemyRecipes?.[recipeIdFor(placements())]);
  const invQty = (id: string) => state.inventory.find((i) => i.itemId === id)?.quantity ?? 0;

  const short = createMemo(() => {
    const need = new Map<string, number>();
    for (const pl of placements()) need.set(pl.ingredientId, (need.get(pl.ingredientId) ?? 0) + 1);
    return [...need].filter(([id, n]) => actions.getBrewIngredientQty(id) < n).map(([id]) => getIngredient(id)?.name ?? id);
  });

  const doBrew = () => { if (actions.brewPotion(placements())) playSound("build"); };
  const loadRecipe = (r: { placements: Placement[] }) => {
    const next: Partial<Record<Technique, string>> = {};
    for (const pl of r.placements) if (STATIONS.some((s) => s.technique === pl.technique)) next[pl.technique] = pl.ingredientId;
    setStations(next); setPickerFor(null);
  };

  // Only recipes you can make with the stations you currently have.
  const makeable = (pl: Placement[]) => pl.every((p) => STATIONS.some((s) => s.technique === p.technique));
  // The recipe book: known (curated) then discovered, each with a frame rarity.
  const knownCards = NAMED_RECIPES.filter((r) => makeable(r.placements))
    .map((r) => ({ id: namedRecipeId(r), name: r.name, icon: r.icon, placements: r.placements, quality: "fine" as const, rarity: brewRarity(r.placements) }));
  const namedIds = new Set(NAMED_RECIPES.map((r) => namedRecipeId(r)));
  const book = createMemo(() => {
    const discovered = Object.values(state.alchemyRecipes ?? {})
      .filter((r) => !namedIds.has(r.id) && makeable(r.placements))
      .map((r) => ({ id: r.id, name: r.name, icon: getIngredient(r.placements[0]?.ingredientId)?.icon ?? "🧪", placements: r.placements, quality: r.quality, rarity: r.rarity ?? brewRarity(r.placements) }));
    return [...knownCards, ...discovered];
  });
  const pageCount = () => Math.max(1, Math.ceil(book().length / PER_PAGE));
  const pageItems = () => book().slice(page() * PER_PAGE, page() * PER_PAGE + PER_PAGE);

  // Owned plants for a station picker, grouped by role (effect under this technique).
  const pickable = (tech: Technique) => ROLE_ORDER
    .map((r) => ({ role: r.label, plants: INGREDIENTS.filter((i) => i.role === r.role && actions.getBrewIngredientQty(i.id) > 0) }))
    .filter((g) => g.plants.length > 0)
    .map((g) => ({ ...g, plants: g.plants.map((ing) => ({ ing, qty: actions.getBrewIngredientQty(ing.id), eff: ing.techniques[tech]?.[0] })) }));
  const pickPlant = (tech: Technique, id: string) => { setStations({ ...stations(), [tech]: id }); setPickerFor(null); playSound("nav"); };
  const clearStation = (tech: Technique) => { const n = { ...stations() }; delete n[tech]; setStations(n); };

  const effectRow = (e: Effect) => {
    const p = describeEffectParts(e);
    return <div style={{ "font-size": "0.82rem", color: KIND_COLOR[effectKind(e.channel)], padding: "1px 0" }}><b>{p.label}</b>{p.detail ? `: ${p.detail}` : ""}</div>;
  };

  return (
    <div style={{ margin: "8px 0 24px", display: "flex", gap: "20px", "flex-wrap": "wrap", "align-items": "flex-start" }}>
      {/* ── LEFT: recipe book on parchment, paginated, 2-col framed cards ── */}
      <div class="parchment-panel" style={{ flex: "1 1 380px", "max-width": "440px", padding: "16px", "border-radius": "8px" }}>
        <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "10px" }}>📖 Recipe Book</h3>
        <Show when={book().length > 0} fallback={<div style={{ "font-size": "0.8rem", "font-style": "italic", opacity: 0.7 }}>No recipes yet.</div>}>
          <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "10px" }}>
            <For each={pageItems()}>
              {(r) => {
                const owned = () => invQty(r.id);
                return (
                  <button onClick={() => loadRecipe(r)} title="Load onto the stations"
                    style={{
                      "text-align": "center", padding: "12px 8px 10px", cursor: "pointer", color: "#2a2012",
                      background: "rgba(255,255,255,0.14)", border: "14px solid transparent",
                      "border-image": `url(${frameUrl(r.rarity)}) 34 stretch`, filter: gradeFilter(r.quality),
                    }}>
                    <div style={{ "font-size": "1.6rem", "line-height": 1 }}>{r.icon}</div>
                    <div style={{ "font-size": "0.78rem", "font-weight": 700, "margin-top": "4px", "line-height": 1.15 }}>{r.name}</div>
                    <div style={{ "font-size": "0.66rem", opacity: 0.75, "margin-top": "2px" }}>{owned() > 0 ? `×${owned()}` : "not brewed"}</div>
                  </button>
                );
              }}
            </For>
          </div>
          <Show when={pageCount() > 1}>
            <div style={{ display: "flex", "align-items": "center", "justify-content": "center", gap: "12px", "margin-top": "12px", color: "#2a2012" }}>
              <button class="btn-tertiary" style={{ "font-size": "0.78rem", padding: "2px 10px" }} disabled={page() === 0} onClick={() => setPage(page() - 1)}>‹</button>
              <span style={{ "font-size": "0.78rem" }}>{page() + 1} / {pageCount()}</span>
              <button class="btn-tertiary" style={{ "font-size": "0.78rem", padding: "2px 10px" }} disabled={page() >= pageCount() - 1} onClick={() => setPage(page() + 1)}>›</button>
            </div>
          </Show>
        </Show>
      </div>

      {/* ── RIGHT: the working lab ── */}
      <div style={{ flex: "2 1 420px", position: "relative" }}>
        <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "8px" }}>⚗️ Alchemy lab</div>
        <div style={{ display: "flex", gap: "10px", "margin-bottom": "16px" }}>
          <For each={STATIONS}>
            {(st) => {
              const on = () => stations()[st.technique];
              const plant = () => (on() ? getIngredient(on()!) : undefined);
              return (
                <div style={{ flex: 1, "min-height": "96px", padding: "10px", "border-radius": "8px", "text-align": "center", cursor: "pointer",
                  border: `1px solid ${on() ? QUALITY_COLOR.fine : "var(--border-default)"}`, background: "var(--bg-card)",
                  display: "flex", "flex-direction": "column", "align-items": "center", "justify-content": "center", gap: "4px" }}
                  onClick={() => on() ? clearStation(st.technique) : setPickerFor(st.technique)}
                  title={on() ? "Click to clear" : `Pick a plant to ${st.verb.toLowerCase()}`}>
                  <div style={{ "font-size": "1.5rem" }}>{st.icon}</div>
                  <div style={{ "font-size": "0.72rem", color: "var(--text-secondary)" }}>{st.verb}</div>
                  <Show when={plant()} fallback={<div style={{ "font-size": "0.66rem", color: "var(--text-muted)" }}>tap to add</div>}>
                    <div style={{ "font-size": "0.76rem", color: "var(--text-primary)" }}>{plant()!.icon} {plant()!.name}</div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>

        {/* Output */}
        <div style={{ display: "flex", "align-items": "flex-start", gap: "12px" }}>
          <div style={{ "font-size": "1.5rem", color: "var(--text-muted)", "padding-top": "14px" }}>⤵</div>
          <div style={{ flex: 1, "max-width": "340px" }}>
            <div style={{ padding: "12px", "border-radius": "8px", background: "rgba(255,255,255,0.06)", border: "14px solid transparent",
              "border-image": `url(${frameUrl(brewRarity(placements()))}) 34 stretch`, filter: gradeFilter(result().quality) }}>
              <div style={{ "font-size": "1.1rem", "font-weight": 600, color: matchedName() ? "var(--accent-green)" : QUALITY_COLOR[result().quality] }}>{matchedName() ?? result().name}</div>
              <div style={{ "font-size": "0.66rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin-bottom": "6px" }}>{brewRarity(placements())} · {matchedName() ? "known" : result().quality}</div>
              <Show when={result().effects.length > 0} fallback={<div style={{ color: "var(--text-muted)", "font-style": "italic", "font-size": "0.82rem" }}>Nothing worth drinking yet.</div>}>
                <For each={result().effects}>{(e) => effectRow(e)}</For>
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
                🧪 Brew{alreadyKnown() || matchedName() ? "" : placements().length > 0 ? " (new)" : ""}
              </button>
              <button class="btn-tertiary" style={{ "font-size": "0.78rem" }} onClick={clear}>Clear</button>
            </div>
          </div>
        </div>

        {/* Picker overlay — pick a plant for the chosen station (by role). */}
        <Show when={pickerFor()}>
          {(tech) => (
            <div style={{ position: "absolute", inset: "0", "z-index": 20, background: "rgba(10,10,20,0.96)", border: "1px solid var(--accent-gold)", "border-radius": "8px", padding: "12px", overflow: "auto" }}>
              <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "8px" }}>
                <div style={{ "font-size": "0.9rem", color: "var(--accent-gold)" }}>{STATIONS.find((s) => s.technique === tech())!.icon} {STATIONS.find((s) => s.technique === tech())!.verb} — pick a plant</div>
                <button class="btn-tertiary" style={{ "font-size": "0.78rem" }} onClick={() => setPickerFor(null)}>✕</button>
              </div>
              <Show when={pickable(tech()).length > 0} fallback={<div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "font-style": "italic" }}>Nothing on your shelves yet — forage or bring some back.</div>}>
                <For each={pickable(tech())}>
                  {(g) => (
                    <div style={{ "margin-bottom": "8px" }}>
                      <div style={{ "font-size": "0.68rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin-bottom": "3px" }}>{g.role}</div>
                      <div style={{ display: "flex", "flex-wrap": "wrap", gap: "5px" }}>
                        <For each={g.plants}>
                          {(pl) => (
                            <button onClick={() => pickPlant(tech(), pl.ing.id)} title={pl.eff ? describeEffectParts(pl.eff).label : "little effect this way"}
                              style={{ padding: "4px 9px", "border-radius": "10px", "font-size": "0.76rem", cursor: "pointer",
                                border: "1px solid var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)" }}>
                              {pl.ing.icon} {pl.ing.name} <span style={{ color: "var(--text-muted)" }}>×{pl.qty}</span>
                              <Show when={pl.eff}><span style={{ color: KIND_COLOR[effectKind(pl.eff!.channel)], "margin-left": "5px" }}>· {describeEffectParts(pl.eff!).label}</span></Show>
                            </button>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </Show>
            </div>
          )}
        </Show>
      </div>
    </div>
  );
}
