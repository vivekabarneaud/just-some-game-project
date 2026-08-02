import { createSignal, createMemo, For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { brew, recipeIdFor, brewRarity } from "@medieval-realm/shared/data/alchemy/brew";
import { INGREDIENTS, getIngredient } from "@medieval-realm/shared/data/alchemy/ingredients";
import { describeEffectParts, effectKind } from "@medieval-realm/shared/data/alchemy/describe";
import { NAMED_RECIPES, matchNamedRecipe, namedRecipeId } from "@medieval-realm/shared/data/alchemy/named_recipes";
import type { Technique, Role, Placement, Effect } from "@medieval-realm/shared/data/alchemy/types";
import { playSound } from "~/engine/sounds";
import FramedModal from "~/components/FramedModal";
import FramedItemCard, { itemFrameUrl as frameUrl, gradeFilter } from "~/components/FramedItemCard";

/** The free-form brewing lab. Left: the recipe book on parchment (paginated,
 *  framed item-style cards). Right: the lab — technique STATIONS up top, ROLE
 *  SHELVES below (each a button opening a plant picker modal), and the output.
 *  Pick a plant from a shelf → the stations highlight → click one to prepare it.
 *  Steep/Distil/Char are parked for now. See docs/DESIGN_APOTHECARY.md. */

const STATIONS: { technique: Technique; place: string; icon: string; verb: string }[] = [
  { technique: "crush", place: "Mortar", icon: "🪨", verb: "Crush" },
  { technique: "boil", place: "Cauldron", icon: "🔥", verb: "Boil" },
];
const ROLE_SHELVES: { role: Role; label: string; icon: string }[] = [
  { role: "base", label: "Base", icon: "🫙" }, { role: "hero", label: "Hero", icon: "🌿" },
  { role: "catalyst", label: "Catalyst", icon: "🍯" }, { role: "toxin", label: "Toxin", icon: "🐍" },
  { role: "wildcard", label: "Wildcard", icon: "🍄" },
];
const QUALITY_COLOR = { fine: "var(--accent-green)", rough: "var(--accent-gold)", dubious: "var(--accent-red)" };
const KIND_COLOR = { recovery: "var(--accent-green)", combat: "var(--accent-blue)", offensive: "var(--accent-red)" };
const PER_PAGE = 6;
const r0 = (n: number) => Math.floor(n); // quantities are whole on the shelf

export default function AlchemyDesk() {
  const { state, actions } = useGame();
  const [stations, setStations] = createSignal<Partial<Record<Technique, string>>>({});
  const [held, setHeld] = createSignal<string | null>(null);   // plant picked off a shelf
  const [shelfModal, setShelfModal] = createSignal<Role | null>(null);
  const [page, setPage] = createSignal(0);

  const clear = () => { setStations({}); setHeld(null); };

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
    setStations(next); setHeld(null);
  };

  // Recipe book — only recipes makeable with the current stations.
  const makeable = (pl: Placement[]) => pl.every((p) => STATIONS.some((s) => s.technique === p.technique));
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

  // Picking off a shelf → "hold" the plant; clicking a station sets it down.
  const shelfPlants = (role: Role) => INGREDIENTS.filter((i) => i.role === role && actions.getBrewIngredientQty(i.id) > 0);
  const pickFromShelf = (id: string) => { setHeld(id); setShelfModal(null); };
  const clickStation = (t: Technique) => {
    const h = held();
    if (h) { setStations({ ...stations(), [t]: h }); setHeld(null); playSound("nav"); }
    else if (stations()[t]) { const n = { ...stations() }; delete n[t]; setStations(n); }
  };

  const effectRow = (e: Effect) => {
    const p = describeEffectParts(e);
    return <div style={{ "font-size": "0.82rem", color: KIND_COLOR[effectKind(e.channel)], padding: "1px 0" }}><b>{p.label}</b>{p.detail ? `: ${p.detail}` : ""}</div>;
  };
  // Compact effect hint for a plant across the visible techniques (for the picker).
  const plantHint = (id: string) => STATIONS
    .map((s) => { const e = getIngredient(id)?.techniques[s.technique]?.[0]; return e ? `${s.verb}: ${describeEffectParts(e).label}` : null; })
    .filter(Boolean).join(" · ");

  const PAGE_BTN = { background: "rgba(42,32,18,0.08)", border: "1px solid #2a2012", "border-radius": "4px", color: "#2a2012", padding: "2px 12px", cursor: "pointer", "font-size": "0.9rem" } as const;

  return (
    <div style={{ margin: "8px 0 24px", display: "flex", gap: "20px", "flex-wrap": "wrap", "align-items": "flex-start" }}>
      {/* ── LEFT: recipe book on parchment (paginated, item-style cards) ── */}
      <div class="parchment-panel" style={{ flex: "1 1 380px", "max-width": "440px", padding: "16px", "border-radius": "8px" }}>
        <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "10px" }}>📖 Recipe Book</h3>
        <Show when={book().length > 0} fallback={<div style={{ "font-size": "0.8rem", "font-style": "italic", opacity: 0.7 }}>No recipes yet.</div>}>
          <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "10px" }}>
            <For each={pageItems()}>
              {(r) => (
                <FramedItemCard dark rarity={r.rarity} quality={r.quality} icon={r.icon}
                  title={r.name} subtitle={invQty(r.id) > 0 ? `×${invQty(r.id)}` : "not brewed"}
                  hoverTitle="Load onto the stations" onClick={() => loadRecipe(r)} minHeight="70px" />
              )}
            </For>
          </div>
          <Show when={pageCount() > 1}>
            <div style={{ display: "flex", "align-items": "center", "justify-content": "center", gap: "14px", "margin-top": "14px", color: "#2a2012" }}>
              <button style={PAGE_BTN} disabled={page() === 0} onClick={() => setPage(page() - 1)}>‹ Prev</button>
              <span style={{ "font-size": "0.82rem", "font-weight": 600 }}>{page() + 1} / {pageCount()}</span>
              <button style={PAGE_BTN} disabled={page() >= pageCount() - 1} onClick={() => setPage(page() + 1)}>Next ›</button>
            </div>
          </Show>
        </Show>
      </div>

      {/* ── RIGHT: the working lab ── */}
      <div style={{ flex: "2 1 420px" }}>
        {/* Stations (highlight when a plant is held) */}
        <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "8px" }}>
          ⚗️ Alchemy lab {held() ? <span style={{ color: "var(--accent-gold)" }}>· holding {getIngredient(held()!)?.icon} {getIngredient(held()!)?.name} — click a station</span> : ""}
        </div>
        <div style={{ display: "flex", gap: "10px", "margin-bottom": "18px" }}>
          <For each={STATIONS}>
            {(st) => {
              const on = () => stations()[st.technique];
              const plant = () => (on() ? getIngredient(on()!) : undefined);
              return (
                <div style={{ flex: 1, "min-height": "96px", padding: "10px", "border-radius": "8px", "text-align": "center", cursor: "pointer",
                  border: `2px solid ${held() ? "var(--accent-gold)" : on() ? QUALITY_COLOR.fine : "var(--border-default)"}`,
                  background: held() ? "rgba(212,131,26,0.08)" : "var(--bg-card)",
                  display: "flex", "flex-direction": "column", "align-items": "center", "justify-content": "center", gap: "4px" }}
                  onClick={() => clickStation(st.technique)}
                  title={held() ? `Set on the ${st.place}` : on() ? "Click to clear" : `Empty ${st.place}`}>
                  <div style={{ "font-size": "1.5rem" }}>{st.icon}</div>
                  <div style={{ "font-size": "0.72rem", color: "var(--text-secondary)" }}>{st.verb}</div>
                  <Show when={plant()} fallback={<div style={{ "font-size": "0.66rem", color: "var(--text-muted)" }}>empty</div>}>
                    <div style={{ "font-size": "0.76rem", color: "var(--text-primary)" }}>{plant()!.icon} {plant()!.name}</div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>

        {/* Shelves — one button per role, opens a picker modal */}
        <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "6px" }}>🧺 Shelves</div>
        <div style={{ display: "flex", "flex-wrap": "wrap", gap: "8px", "margin-bottom": "18px" }}>
          <For each={ROLE_SHELVES}>
            {(sh) => {
              const count = () => shelfPlants(sh.role).length;
              return (
                <button onClick={() => setShelfModal(sh.role)}
                  style={{ padding: "8px 12px", "border-radius": "8px", cursor: "pointer", "min-width": "104px",
                    border: "1px solid var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)",
                    display: "flex", "flex-direction": "column", "align-items": "center", gap: "2px", opacity: count() > 0 ? 1 : 0.5 }}>
                  <div style={{ "font-size": "1.3rem" }}>{sh.icon}</div>
                  <div style={{ "font-size": "0.78rem" }}>{sh.label}</div>
                  <div style={{ "font-size": "0.66rem", color: "var(--text-muted)" }}>{count()} on hand</div>
                </button>
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
      </div>

      {/* Shelf picker modal */}
      <Show when={shelfModal()}>
        {(role) => (
          <FramedModal
            icon={ROLE_SHELVES.find((s) => s.role === role())!.icon}
            title={`${ROLE_SHELVES.find((s) => s.role === role())!.label} shelf`}
            subtitle="Pick a plant, then click a station to prepare it."
            onClose={() => setShelfModal(null)}
            maxWidth="720px"
          >
            <Show when={shelfPlants(role()).length > 0} fallback={<div style={{ padding: "12px", "font-size": "0.85rem", color: "var(--text-muted)", "font-style": "italic" }}>Nothing on this shelf yet — forage or bring some back.</div>}>
              <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "8px", padding: "4px 2px" }}>
                <For each={shelfPlants(role())}>
                  {(ing) => (
                    <FramedItemCard rarity={ing.rarity} icon={ing.icon} title={ing.name}
                      subtitle={<span style={{ "text-transform": "capitalize" }}>{ing.rarity} {ing.role} · ×{r0(actions.getBrewIngredientQty(ing.id))}</span>}
                      hoverTitle={`Pick ${ing.name}`} onClick={() => pickFromShelf(ing.id)} minHeight="138px">
                      <div style={{ "font-size": "0.72rem", color: "var(--text-secondary)", "font-style": "italic", "line-height": 1.3 }}>{ing.note}</div>
                      <Show when={plantHint(ing.id)}>
                        <div style={{ "font-size": "0.68rem", color: "var(--accent-green)" }}>{plantHint(ing.id)}</div>
                      </Show>
                    </FramedItemCard>
                  )}
                </For>
              </div>
            </Show>
          </FramedModal>
        )}
      </Show>
    </div>
  );
}
