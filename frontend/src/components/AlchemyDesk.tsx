import { createSignal, createMemo, For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { brew, recipeIdFor, brewRarity, MAX_PER_PLANT } from "@medieval-realm/shared/data/alchemy/brew";
import { INGREDIENTS, getIngredient } from "@medieval-realm/shared/data/alchemy/ingredients";
import { describeEffectParts } from "@medieval-realm/shared/data/alchemy/describe";
import { NAMED_RECIPES, matchNamedRecipe, namedRecipeId } from "@medieval-realm/shared/data/alchemy/named_recipes";
import type { Technique, Role, Placement, Effect } from "@medieval-realm/shared/data/alchemy/types";
import { playSound } from "~/engine/sounds";
import Tooltip from "~/components/Tooltip";
import FramedModal from "~/components/FramedModal";
import FramedItemCard, { itemFrameUrl as frameUrl, gradeFilter } from "~/components/FramedItemCard";

/** The free-form brewing lab. Left: the recipe book on parchment (paginated,
 *  framed item-style cards). Right: the lab — technique STATIONS up top, ROLE
 *  SHELVES below (each a button opening a plant picker modal), and the output.
 *  Pick a plant from a shelf → the stations highlight → click one to prepare it.
 *  Steep/Distil/Char are parked for now. See docs/IDEAS.md (Alchemy) for what's still unbuilt. */

/** The bench, painted. `x`/`y` are percentages onto ALCHEMY_ART and point at the
 *  object itself; the slot button and its contents sit on top. Mirrors the
 *  kitchen exactly (see KitchenDesk.tsx) so the two crafting screens read as one
 *  idea. Only crush + boil for now — the other Techniques aren't offered yet, and
 *  later ones will want their own painting rather than being bolted onto this. */
const ALCHEMY_ART = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/alchemy/camp.png";
const RECIPE_BOOK_ART = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/kitchen/cookbook.png";
const STATIONS: { technique: Technique; place: string; icon: string; verb: string; x: number; y: number }[] = [
  { technique: "boil",  place: "Cauldron", icon: "🔥", verb: "Boil",  x: 37, y: 50 },
  { technique: "crush", place: "Mortar",   icon: "🪨", verb: "Crush", x: 79, y: 66 },
];
const ROLE_SHELVES: { role: Role; label: string; icon: string }[] = [
  { role: "base", label: "Base", icon: "🫙" }, { role: "hero", label: "Hero", icon: "🌿" },
  { role: "catalyst", label: "Catalyst", icon: "🍯" }, { role: "toxin", label: "Toxin", icon: "🐍" },
  { role: "wildcard", label: "Wildcard", icon: "🍄" },
];
const QUALITY_COLOR = { fine: "var(--accent-green)", rough: "var(--accent-gold)", dubious: "var(--accent-red)" };
const PER_PAGE = 6; // 3 down each page — more than that overflows the painted book
const r0 = (n: number) => Math.floor(n); // quantities are whole on the shelf
const EFFECT_COLOR = "var(--accent-green)"; // all effects read as the potion's boons

export default function AlchemyDesk() {
  const { state, actions } = useGame();
  // Each station holds an ARRAY — a mortar can crush several things at once.
  const [stations, setStations] = createSignal<Partial<Record<Technique, string[]>>>({});
  const [held, setHeld] = createSignal<string | null>(null);   // plant picked off a shelf
  const [shelfModal, setShelfModal] = createSignal<Role | null>(null);
  const [page, setPage] = createSignal(0);

  const clear = () => { setStations({}); setHeld(null); };
  const stationOf = (t: Technique) => stations()[t] ?? [];

  const placements = createMemo<Placement[]>(() =>
    STATIONS.flatMap((s) => stationOf(s.technique).map((id) => ({ ingredientId: id, technique: s.technique }))),
  );
  const result = createMemo(() => brew(placements()));
  const matchedName = createMemo(() => matchNamedRecipe(placements())?.name);
  const alreadyKnown = createMemo(() => !!state.alchemyRecipes?.[recipeIdFor(placements())]);
  const invQty = (id: string) => state.inventory.find((i) => i.itemId === id)?.quantity ?? 0;

  // Ingredients a recipe/brew needs that the player is short of (by name).
  const missingOf = (pls: Placement[]) => {
    const need = new Map<string, number>();
    for (const pl of pls) need.set(pl.ingredientId, (need.get(pl.ingredientId) ?? 0) + 1);
    return [...need].filter(([id, n]) => actions.getBrewIngredientQty(id) < n).map(([id]) => getIngredient(id)?.name ?? id);
  };
  const short = createMemo(() => missingOf(placements()));

  const doBrew = () => { if (actions.brewPotion(placements())) playSound("brew"); };
  const loadRecipe = (r: { placements: Placement[] }) => {
    const next: Partial<Record<Technique, string[]>> = {};
    for (const pl of r.placements) if (STATIONS.some((s) => s.technique === pl.technique)) (next[pl.technique] ??= []).push(pl.ingredientId);
    setStations(next); setHeld(null);
  };

  // Recipe book — only recipes makeable with the current stations.
  const makeable = (pl: Placement[]) => pl.every((p) => STATIONS.some((s) => s.technique === p.technique));
  const knownCards = NAMED_RECIPES.filter((r) => makeable(r.placements))
    .map((r) => ({ id: namedRecipeId(r), name: r.name, icon: r.icon, placements: r.placements, quality: "fine" as const, rarity: brewRarity(r.placements), effects: brew(r.placements).effects }));
  const namedIds = new Set(NAMED_RECIPES.map((r) => namedRecipeId(r)));
  const book = createMemo(() => {
    const discovered = Object.values(state.alchemyRecipes ?? {})
      .filter((r) => !namedIds.has(r.id) && makeable(r.placements))
      .map((r) => ({ id: r.id, name: r.name, icon: getIngredient(r.placements[0]?.ingredientId)?.icon ?? "🧪", placements: r.placements, quality: r.quality, rarity: r.rarity ?? brewRarity(r.placements), effects: r.effects }));
    return [...knownCards, ...discovered];
  });
  const pageCount = () => Math.max(1, Math.ceil(book().length / PER_PAGE));
  const pageItems = () => book().slice(page() * PER_PAGE, page() * PER_PAGE + PER_PAGE);

  // Picking off a shelf → "hold" the plant; clicking a station adds it (append).
  const shelfPlants = (role: Role) => INGREDIENTS.filter((i) => i.role === role && actions.getBrewIngredientQty(i.id) > 0);
  // One distinct ingredient per ROLE (a brew is base + hero + catalyst + toxin +
  // wildcard). You can still crush several things together and stack quantity;
  // you just can't pick two bases. Roles in MULTI_ROLES may repeat — none for
  // now; loosening a role later is a one-line change here.
  const MULTI_ROLES = new Set<Role>();
  const brewPlantIds = () => { const s = new Set<string>(); STATIONS.forEach((st) => stationOf(st.technique).forEach((id) => s.add(id))); return s; };
  const roleOccupant = (role: Role) => [...brewPlantIds()].find((id) => getIngredient(id)?.role === role);
  const roleFreeFor = (id: string) => {
    const role = getIngredient(id)?.role;
    if (!role || MULTI_ROLES.has(role)) return true;
    const occ = roleOccupant(role);
    return !occ || occ === id; // free, or already this same plant (quantity is fine)
  };
  const pickFromShelf = (id: string) => { if (!roleFreeFor(id) || !canAddMore(id)) return; setHeld(id); setShelfModal(null); playSound("jars"); };
  const countInStation = (t: Technique, id: string) => stationOf(t).filter((x) => x === id).length;
  const clickStation = (t: Technique) => {
    const h = held();
    if (!h) { pulseShelves(); return; }
    // Respect the role cap, the stock, and the per-plant cap when dropping it.
    if (roleFreeFor(h) && countInStation(t, h) < MAX_PER_PLANT && canAddMore(h)) {
      setStations({ ...stations(), [t]: [...stationOf(t), h] }); setHeld(null); playSound("nav");
    }
  };
  // Quantity of a plant = how many copies sit in a station (each adds a
  // diminishing dose). Grouped into one chip per plant with a −/+ stepper.
  const countsOf = (t: Technique) => {
    const order: string[] = []; const n = new Map<string, number>();
    for (const id of stationOf(t)) { if (!n.has(id)) order.push(id); n.set(id, (n.get(id) ?? 0) + 1); }
    return order.map((id) => ({ id, n: n.get(id)! }));
  };
  // How many of this plant are placed across ALL stations (for the stock cap).
  const placedTotal = (id: string) => STATIONS.reduce((sum, s) => sum + stationOf(s.technique).filter((x) => x === id).length, 0);
  const canAddMore = (id: string) => placedTotal(id) < actions.getBrewIngredientQty(id);
  // A chip's + is live while it's under the per-plant cap AND stock remains.
  const canStepUp = (t: Technique, id: string) => stationOf(t).filter((x) => x === id).length < MAX_PER_PLANT && canAddMore(id);
  const addToStation = (t: Technique, id: string) => {
    if (!canStepUp(t, id)) return;
    setStations({ ...stations(), [t]: [...stationOf(t), id] }); playSound("nav");
  };
  const removeOneFromStation = (t: Technique, id: string) => {
    const arr = stationOf(t); const i = arr.indexOf(id);
    if (i >= 0) setStations({ ...stations(), [t]: arr.filter((_, j) => j !== i) });
  };
  const removeAllFromStation = (t: Technique, id: string) =>
    setStations({ ...stations(), [t]: stationOf(t).filter((x) => x !== id) });

  // Clicking a station empty-handed is the classic first-time stumble: the
  // player expects the station to open something. Pulse the stocked shelves
  // instead of doing nothing, so the nudge answers the question just asked.
  const [nudgeShelves, setNudgeShelves] = createSignal(false);
  const pulseShelves = () => {
    setNudgeShelves(false);
    requestAnimationFrame(() => setNudgeShelves(true));
    setTimeout(() => setNudgeShelves(false), 1900); // 1.2s pulse + the last shelf's stagger
  };

  const effectRow = (e: Effect) => {
    const p = describeEffectParts(e);
    return <div style={{ "font-size": "0.82rem", color: EFFECT_COLOR, padding: "1px 0" }}><b>{p.label}</b>{p.detail ? `: ${p.detail}` : ""}</div>;
  };
  // Compact effect hint for a plant across the visible techniques (for the picker).
  const plantHint = (id: string) => STATIONS
    .map((s) => { const e = getIngredient(id)?.techniques[s.technique]?.[0]; return e ? `${s.verb}: ${describeEffectParts(e).label}` : null; })
    .filter(Boolean).join(" · ");

  const PAGE_BTN = { background: "rgba(42,32,18,0.08)", border: "1px solid #2a2012", "border-radius": "2px", color: "#2a2012", padding: "2px 12px", cursor: "pointer", "font-size": "0.9rem" } as const;
  const STEP_BTN = { background: "rgba(255,255,255,0.1)", border: "1px solid var(--border-default)", "border-radius": "2px", color: "var(--text-primary)", width: "16px", height: "16px", "line-height": 1, padding: 0, cursor: "pointer", "font-size": "0.8rem", display: "inline-flex", "align-items": "center", "justify-content": "center" } as const;

  return (
    <div style={{ margin: "8px 0 24px", display: "flex", gap: "20px", "flex-wrap": "wrap", "align-items": "flex-start" }}>
      {/* ── LEFT: the recipe book, the same painted open book as the kitchen's
          cookbook. Cut-out PNG, so the panel is transparent and the book sits on
          the page rather than in a box. parchment-panel is kept only for its
          dark-ink rules (the pages are light, this text ships dark-theme pale). */}
      <div class="parchment-panel cookbook-book"
        style={{ position: "relative", flex: "1.4 1 460px", "max-width": "720px", "aspect-ratio": "1095 / 740", "align-self": "flex-start" }}>
        <img src={RECIPE_BOOK_ART} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", "object-fit": "contain", "user-select": "none", "pointer-events": "none",
          filter: "drop-shadow(0 20px 26px rgba(0,0,0,0.78)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }} />
        <div style={{ position: "absolute", left: "11%", right: "11%", top: "6%", bottom: "7%", display: "flex", "flex-direction": "column", "min-height": 0 }}>
        <Show when={book().length > 0} fallback={<div style={{ "font-size": "0.8rem", "font-style": "italic", opacity: 0.7, "text-align": "center" }}>No recipes yet.</div>}>
          <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", "column-gap": "11%", "row-gap": "8px" }}>
            <For each={pageItems()}>
              {(r) => {
                const missing = () => missingOf(r.placements);
                return (
                  <FramedItemCard rarity={r.rarity} quality={r.quality} icon={r.icon} dim={missing().length > 0}
                    title={<>{r.name}{invQty(r.id) > 0 ? <span style={{ opacity: 0.65, "font-weight": 400 }}> ×{invQty(r.id)}</span> : ""}</>}
                    tooltip={missing().length > 0 ? `Missing: ${missing().join(", ")}` : "Load onto the stations"}
                    onClick={() => loadRecipe(r)} minHeight="96px"
                    body={<For each={r.effects}>
                      {(e) => <div style={{ "font-size": "0.68rem", color: EFFECT_COLOR, "line-height": 1.3 }}>{describeEffectParts(e).label}</div>}
                    </For>} />
                );
              }}
            </For>
          </div>
          <Show when={pageCount() > 1}>
            <div style={{ display: "flex", "align-items": "center", "justify-content": "center", gap: "14px", "margin-top": "14px", color: "#2a2012" }}>
              <button style={PAGE_BTN} disabled={page() === 0} onClick={() => { setPage(page() - 1); playSound("page_turn"); }}>‹ Prev</button>
              <span style={{ "font-size": "0.82rem", "font-weight": 600 }}>{page() + 1} / {pageCount()}</span>
              <button style={PAGE_BTN} disabled={page() >= pageCount() - 1} onClick={() => { setPage(page() + 1); playSound("page_turn"); }}>Next ›</button>
            </div>
          </Show>
        </Show>
        </div>
      </div>

      {/* ── RIGHT: the working lab ── */}
      <div style={{ flex: "1 1 340px" }}>
        {/* ── The bench: a painting, with the stations sitting on it. Same
            construction as the kitchen (KitchenDesk.tsx) — slot buttons hang on
            each object, contents above them, coordinates as percentages so the
            art can be swapped or re-cropped without touching layout. */}
        <div style={{ position: "relative", width: "100%", "aspect-ratio": "1 / 1", "margin-bottom": "16px" }}>
          <img src={ALCHEMY_ART} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", "object-fit": "cover", "user-select": "none", "pointer-events": "none" }} />
          <Show when={held()}>
            <div style={{ position: "absolute", left: "50%", top: "3%", transform: "translateX(-50%)", "z-index": 2,
              padding: "3px 10px", "border-radius": "3px", "font-size": "0.72rem", "white-space": "nowrap",
              background: "rgba(20,14,8,0.78)", border: "1px solid var(--accent-gold)", color: "var(--accent-gold)",
              "backdrop-filter": "blur(2px)", "pointer-events": "none" }}>
              holding {getIngredient(held()!)?.icon} {getIngredient(held()!)?.name}, choose where it goes
            </div>
          </Show>
          <For each={STATIONS}>
            {(st) => {
              const arr = () => stationOf(st.technique);
              const offers = () => !!held();
              return (
                <div style={{ position: "absolute", left: `${st.x}%`, top: `${st.y}%`, transform: "translate(-50%, -50%)",
                  display: "flex", "flex-direction": "column", "align-items": "center", gap: "4px", "max-width": "46%" }}>
                  <Show when={arr().length > 0}>
                    <div style={{ display: "flex", "flex-wrap": "wrap", gap: "3px", "justify-content": "center" }}>
                      <For each={countsOf(st.technique)}>
                        {(c) => (
                          <span title={getIngredient(c.id)?.name}
                            style={{ display: "inline-flex", "align-items": "center", gap: "3px", "font-size": "0.66rem", padding: "1px 3px 1px 6px", "border-radius": "3px",
                              background: "rgba(20,14,8,0.82)", border: "1px solid var(--accent-gold)", color: "var(--text-primary)", "backdrop-filter": "blur(2px)" }}>
                            <span>{getIngredient(c.id)?.icon}</span>
                            <button onClick={(e) => { e.stopPropagation(); removeOneFromStation(st.technique, c.id); }} title="One less" style={STEP_BTN}>−</button>
                            <span style={{ "min-width": "0.8em", "text-align": "center", "font-weight": 600 }}>{c.n}</span>
                            <button onClick={(e) => { e.stopPropagation(); addToStation(st.technique, c.id); }} disabled={!canStepUp(st.technique, c.id)}
                              title={c.n >= MAX_PER_PLANT ? `Up to ${MAX_PER_PLANT} — more won't help` : canAddMore(c.id) ? "One more" : "None left in stock"}
                              style={{ ...STEP_BTN, opacity: canStepUp(st.technique, c.id) ? 1 : 0.35 }}>+</button>
                            <button onClick={(e) => { e.stopPropagation(); removeAllFromStation(st.technique, c.id); }} title={`Remove ${getIngredient(c.id)?.name}`} style={{ ...STEP_BTN, "margin-left": "1px" }}>✕</button>
                          </span>
                        )}
                      </For>
                    </div>
                  </Show>
                  <Tooltip position="top" text={
                    held() ? `Add ${getIngredient(held()!)?.name?.toLowerCase()} to the ${st.place.toLowerCase()}`
                      : arr().length ? `${st.verb}ing in the ${st.place.toLowerCase()}. Take something off a shelf to add more.`
                      : `The ${st.place.toLowerCase()}. Take something off a shelf first.`
                  }>
                  <button onClick={() => clickStation(st.technique)}
                    style={{ width: "58px", height: "58px", "border-radius": "3px", padding: 0,
                      display: "flex", "flex-direction": "column", "align-items": "center", "justify-content": "center", gap: "1px",
                      cursor: offers() ? "pointer" : "default",
                      background: offers() ? "rgba(212,131,26,0.30)" : "rgba(20,14,8,0.62)",
                      border: `1px ${arr().length ? "solid" : "dashed"} ${offers() ? "var(--accent-gold)" : arr().length ? QUALITY_COLOR.fine : "rgba(255,255,255,0.35)"}`,
                      color: "var(--text-primary)",
                      "backdrop-filter": "blur(2px)",
                      "box-shadow": offers() ? "0 0 12px rgba(245,197,66,0.45)" : "none" }}>
                    <span style={{ "font-size": "1.3rem", "line-height": 1 }}>{st.icon}</span>
                    <span style={{ "font-size": "0.6rem", "font-family": "var(--font-heading)" }}>{st.verb}</span>
                  </button>
                  </Tooltip>
                </div>
              );
            }}
          </For>
        </div>

        {/* Shelves — one button per role, opens a picker modal. Stacked 2-2-1,
            centered, compact (no icon). */}
        <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "6px" }}>🧺 Shelves</div>
        <div style={{ display: "flex", "flex-wrap": "wrap", "justify-content": "center", gap: "6px", "margin-bottom": "16px" }}>
          <For each={ROLE_SHELVES}>
            {(sh, i) => {
              const count = () => shelfPlants(sh.role).length;
              // Only shelves with something on them pulse — pointing at an empty
              // shelf would be a worse answer than saying nothing. Staggered so
              // it reads as a ripple along the row rather than a flash.
              const nudging = () => nudgeShelves() && count() > 0;
              return (
                <button onClick={() => { setShelfModal(sh.role); playSound("shelf_open"); }}
                  class={nudging() ? "kitchen-shelf-nudge" : undefined}
                  style={{ flex: "0 0 46%", padding: "5px 8px", "border-radius": "3px", cursor: "pointer",
                    "animation-delay": nudging() ? `${i() * 90}ms` : undefined,
                    border: "1px solid var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)",
                    display: "flex", "align-items": "baseline", "justify-content": "center", gap: "6px", opacity: count() > 0 ? 1 : 0.5 }}>
                  <span style={{ "font-size": "0.8rem" }}>{sh.label}</span>
                  <span style={{ "font-size": "0.64rem", color: "var(--text-muted)" }}>{count()} on hand</span>
                </button>
              );
            }}
          </For>
        </div>

        {/* Output */}
        <div style={{ display: "flex", "align-items": "flex-start", gap: "12px" }}>
          <div style={{ "font-size": "1.5rem", color: "var(--text-muted)", "padding-top": "14px" }}>⤵</div>
          <div style={{ flex: 1, "max-width": "340px" }}>
            <div style={{ padding: "12px", "border-radius": "4px", background: "rgba(255,255,255,0.06)", border: "14px solid transparent",
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
                      dim={!roleFreeFor(ing.id) || !canAddMore(ing.id)}
                      subtitle={<span style={{ "text-transform": "capitalize" }}>{ing.rarity} {ing.role} · ×{r0(actions.getBrewIngredientQty(ing.id))}</span>}
                      tooltip={!roleFreeFor(ing.id) ? `Already have a ${ing.role} — clear it first` : !canAddMore(ing.id) ? "It's all in the pot already" : `Pick ${ing.name}`}
                      onClick={() => pickFromShelf(ing.id)} minHeight="138px">
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
