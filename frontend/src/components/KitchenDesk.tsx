import { createSignal, createMemo, For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { resolveDish, NAMED_DISHES } from "@medieval-realm/shared/data/kitchen/named_dishes";
import { dishFlavors } from "@medieval-realm/shared/data/kitchen/cook";
import { allowsTechnique, getFoodIngredient, foodByRole } from "@medieval-realm/shared/data/kitchen/ingredients";
import type { CookTechnique, FoodRole, CookPlacement, DishChannel } from "@medieval-realm/shared/data/kitchen/types";
import { playSound } from "~/engine/sounds";
import { getSettlementTier, type SettlementTier } from "~/data/buildings";
import FramedModal from "~/components/FramedModal";
import Tooltip from "~/components/Tooltip";
import FramedItemCard, { itemFrameUrl as frameUrl, gradeFilter } from "~/components/FramedItemCard";

/** The free-form cooking desk. Left: the cookbook on parchment. Right: the
 *  COOKING SURFACE — a painting of the kitchen with a slot button sitting on
 *  each object (pot / fire / board) — then ROLE SHELVES below (each opens a
 *  picker of what's in the larder), and the output. Pick an ingredient off a
 *  shelf → the stations it allows light up gold, the ones it can't use dim with
 *  a reason → click one to prepare it that way. Several ingredients per station,
 *  several per shelf.
 *
 *  The buttons hang ABOVE their object rather than the objects being clickable:
 *  simpler to read at a glance, and it leaves each station room to show what's
 *  in it. Positions are percentages onto the art (see STATIONS), so the painting
 *  can be swapped or re-cropped per settlement tier without touching layout.
 *  See docs/DESIGN_KITCHEN.md. */

/** The cooking surface, painted. `x`/`y` are percentages onto KITCHEN_ART and
 *  point at the object itself; the label + contents tray hangs just above it.
 *  `minTier` mirrors the design in kitchen/types.ts: boil + chop + skewer at
 *  camp, fry at village, roast at town. The camp painting only depicts those
 *  first three, so later tiers want their own art (a town kitchen is not a
 *  campfire) — until then, ungated stations fall back to a plain row below. */
const KITCHEN_ART = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/kitchen/camp.png";

type StationDef = {
  technique: CookTechnique; place: string; icon: string; verb: string; past: string;
  minTier: SettlementTier; x?: number; y?: number;
};
const STATIONS: StationDef[] = [
  { technique: "boil",   place: "Pot",   icon: "🍲", verb: "Boil",   past: "boiled",    minTier: "camp",    x: 47, y: 36 },
  { technique: "skewer", place: "Fire",  icon: "🍢", verb: "Skewer", past: "skewered",  minTier: "camp",    x: 26, y: 70 },
  { technique: "chop",   place: "Board", icon: "🔪", verb: "Chop",   past: "eaten raw", minTier: "camp",    x: 72, y: 69 },
  { technique: "fry",    place: "Pan",   icon: "🍳", verb: "Fry",    past: "fried",     minTier: "village" },
  { technique: "roast",  place: "Oven",  icon: "🔥", verb: "Roast",  past: "roasted",   minTier: "town" },
];
const TIER_RANK: Record<SettlementTier, number> = { camp: 0, village: 1, town: 2, city: 3 };
const ROLE_SHELVES: { role: FoodRole; label: string; icon: string }[] = [
  { role: "staple", label: "Staple", icon: "🌾" }, { role: "protein", label: "Protein", icon: "🍖" },
  { role: "veg", label: "Veg", icon: "🥬" }, { role: "fruit", label: "Fruit", icon: "🍎" },
  { role: "dairy", label: "Dairy", icon: "🧀" }, { role: "spice", label: "Spice", icon: "🌶️" },
];
const CH_SHORT: Record<DishChannel, string> = { nourishment: "Nourishment", comfort: "Comfort", warmth: "Warmth", freshness: "Freshness" };
const QUALITY_COLOR: Record<string, string> = { seasoned: "var(--accent-green)", fine: "var(--accent-green)", rough: "var(--accent-gold)", plain: "var(--text-muted)" };
const QUALITY_LABEL: Record<string, string> = { seasoned: "well-seasoned", fine: "fine", rough: "thin", plain: "plain" };
const MAX_PER_INGREDIENT = 5;
const PER_PAGE = 8;
const EFFECT_COLOR = "var(--accent-green)";

/** Staple dishes that double as the passive "keep a pot on" food multiplier
 *  (feeds citizens). Maps the cookbook dish id → the CraftingRecipe the auto-cook
 *  engine runs. The engine is unchanged; the desk just drives state.autoCook. */
const STAPLE_RECIPE: Record<string, string> = {
  dish_porridge: "porridge", dish_hearth_stew: "hearth_stew",
  dish_river_stew: "river_stew", dish_bone_broth: "bone_broth",
};

export default function KitchenDesk() {
  const { state, actions } = useGame();
  const [stations, setStations] = createSignal<Partial<Record<CookTechnique, string[]>>>({});
  const [held, setHeld] = createSignal<string | null>(null);   // ingredient picked off a shelf
  const [shelfModal, setShelfModal] = createSignal<FoodRole | null>(null);
  const [page, setPage] = createSignal(0);

  const clear = () => { setStations({}); setHeld(null); };
  const stationOf = (t: CookTechnique) => stations()[t] ?? [];
  const stock = (id: string) => Math.floor(actions.getCookIngredientQty(id));

  // Staple auto-cook ("keep a pot on") — feeds the settlement via the engine tick.
  const autoCook = () => state.autoCook?.["kitchen"] ?? [];
  const keepCookingOn = (recipeId: string) => autoCook().includes(recipeId);
  const cookSlotsFull = (recipeId: string) => !keepCookingOn(recipeId) && autoCook().length >= actions.getAutoCookSlots("kitchen");
  const toggleKeepCooking = (recipeId: string) => { if (!cookSlotsFull(recipeId)) { actions.setAutoCook("kitchen", recipeId); playSound("nav"); } };

  const placements = createMemo<CookPlacement[]>(() =>
    STATIONS.flatMap((s) => stationOf(s.technique).map((id) => ({ ingredientId: id, technique: s.technique }))),
  );
  const dish = createMemo(() => resolveDish(placements()));
  const taste = createMemo(() => dishFlavors(placements()));
  const short = createMemo(() => {
    const need = new Map<string, number>();
    for (const p of placements()) need.set(p.ingredientId, (need.get(p.ingredientId) ?? 0) + 1);
    return [...need].filter(([id, n]) => stock(id) < n).map(([id]) => getFoodIngredient(id)?.name ?? id);
  });
  const doCook = () => { if (actions.cookDish(placements())) playSound("kitchen"); };

  // Pick off a shelf → "hold" it; click a station to prepare it that way.
  const shelfStock = (role: FoodRole) => foodByRole(role).filter((i) => stock(i.id) > 0);
  const pickFromShelf = (id: string) => { if (!canAddMore(id)) return; setHeld(id); setShelfModal(null); playSound("jars"); };
  const countsOf = (t: CookTechnique) => {
    const order: string[] = []; const n = new Map<string, number>();
    for (const id of stationOf(t)) { if (!n.has(id)) order.push(id); n.set(id, (n.get(id) ?? 0) + 1); }
    return order.map((id) => ({ id, n: n.get(id)! }));
  };
  const placedTotal = (id: string) => STATIONS.reduce((sum, s) => sum + stationOf(s.technique).filter((x) => x === id).length, 0);
  const canAddMore = (id: string) => placedTotal(id) < stock(id);
  const countInStation = (t: CookTechnique, id: string) => stationOf(t).filter((x) => x === id).length;
  // An ingredient can only go to a station whose prep makes sense for it
  // (no raw meat, no raw grain, no fried wheat). See kitchen/ingredients.ts.
  const canStepUp = (t: CookTechnique, id: string) =>
    allowsTechnique(id, t) && countInStation(t, id) < MAX_PER_INGREDIENT && canAddMore(id);
  const clickStation = (t: CookTechnique) => {
    const h = held();
    if (!h) { pulseShelves(); return; }
    if (canStepUp(t, h)) { setStations({ ...stations(), [t]: [...stationOf(t), h] }); setHeld(null); playSound("nav"); }
  };
  const addToStation = (t: CookTechnique, id: string) => {
    if (!canStepUp(t, id)) return;
    setStations({ ...stations(), [t]: [...stationOf(t), id] }); playSound("nav");
  };
  const removeOne = (t: CookTechnique, id: string) => {
    const arr = stationOf(t); const i = arr.indexOf(id);
    if (i >= 0) setStations({ ...stations(), [t]: arr.filter((_, j) => j !== i) });
  };
  const removeAll = (t: CookTechnique, id: string) => setStations({ ...stations(), [t]: stationOf(t).filter((x) => x !== id) });

  // ── Cookbook (left) ──
  const anyOfInStock = (anyOf: readonly string[]) => anyOf.find((id) => stock(id) > 0);
  const repPlacements = (slots: { anyOf: readonly string[]; technique: CookTechnique }[]): CookPlacement[] =>
    slots.map((s) => ({ ingredientId: anyOfInStock(s.anyOf) ?? s.anyOf[0], technique: s.technique }));
  const missingSlots = (slots: { anyOf: readonly string[] }[]) =>
    slots.filter((s) => !s.anyOf.some((id) => stock(id) > 0)).map((s) => getFoodIngredient(s.anyOf[0])?.name ?? s.anyOf[0]);
  // Only the pre-known dishes (the staples) show from the start; the rest are
  // hidden until the player cooks the combo once (they land in state.kitchenDishes).
  const preknownDishes = NAMED_DISHES.filter((d) => d.preknown);
  const preknownIds = new Set(preknownDishes.map((d) => d.id));
  const namedById = new Map(NAMED_DISHES.map((d) => [d.id, d]));
  const book = createMemo(() => {
    const known = preknownDishes.map((d) => ({
      id: d.id, name: d.name, icon: d.icon, placements: repPlacements(d.slots),
      effects: resolveDish(repPlacements(d.slots)).effects, missing: missingSlots(d.slots),
    }));
    const discovered = Object.values(state.kitchenDishes ?? {})
      .filter((d) => !preknownIds.has(d.id)) // a cooked pre-known dish stays in the pre-known list
      .map((d) => ({
        id: d.id, name: d.name, icon: namedById.get(d.id)?.icon ?? getFoodIngredient(d.placements[0]?.ingredientId)?.icon ?? "🍲",
        placements: d.placements, effects: d.effects,
        missing: [...new Set(d.placements.map((p) => p.ingredientId))].filter((id) => stock(id) <= 0).map((id) => getFoodIngredient(id)?.name ?? id),
      }));
    return [...known, ...discovered];
  });
  const pageCount = () => Math.max(1, Math.ceil(book().length / PER_PAGE));
  const pageItems = () => book().slice(page() * PER_PAGE, page() * PER_PAGE + PER_PAGE);
  const loadDish = (pls: CookPlacement[]) => {
    const next: Partial<Record<CookTechnique, string[]>> = {};
    for (const pl of pls) (next[pl.technique] ??= []).push(pl.ingredientId);
    setStations(next); setHeld(null);
  };

  // Clicking a station empty-handed is the classic first-time stumble: the
  // player expects the station to open something. Pulse the shelves instead of
  // doing nothing, so the nudge answers the question they just asked.
  const [nudgeShelves, setNudgeShelves] = createSignal(false);
  const pulseShelves = () => {
    setNudgeShelves(false);
    requestAnimationFrame(() => setNudgeShelves(true));
    setTimeout(() => setNudgeShelves(false), 1200);
  };

  // Which stations this kitchen has. The painting depicts the three camp ones;
  // fry/roast unlock with the settlement and (for now) sit in a plain row until
  // their own tier art exists.
  const tier = () => getSettlementTier(actions.getTownHallLevel());
  const hasStation = (st: StationDef) => TIER_RANK[tier()] >= TIER_RANK[st.minTier];
  const paintedStations = () => STATIONS.filter((st) => hasStation(st) && st.x != null);
  const extraStations = () => STATIONS.filter((st) => hasStation(st) && st.x == null);

  const PAGE_BTN = { background: "rgba(42,32,18,0.08)", border: "1px solid #2a2012", "border-radius": "2px", color: "#2a2012", padding: "2px 12px", cursor: "pointer", "font-size": "0.9rem" } as const;
  const STEP_BTN = { background: "rgba(255,255,255,0.1)", border: "1px solid var(--border-default)", "border-radius": "2px", color: "var(--text-primary)", width: "16px", height: "16px", "line-height": 1, padding: 0, cursor: "pointer", "font-size": "0.8rem", display: "inline-flex", "align-items": "center", "justify-content": "center" } as const;

  return (
    <div style={{ margin: "8px 0 24px", display: "flex", gap: "20px", "flex-wrap": "wrap", "align-items": "flex-start" }}>
      {/* ── LEFT: cookbook on parchment ── */}
      <div class="parchment-panel" style={{ flex: "1.4 1 460px", "max-width": "610px", "min-height": "560px", padding: "18px 20px", "border-radius": "4px", "align-self": "stretch" }}>
        <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "12px" }}>📖 Cookbook</h3>
        <Show when={book().length > 0} fallback={<div style={{ "font-size": "0.8rem", "font-style": "italic", opacity: 0.7 }}>No dishes yet.</div>}>
          <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "12px" }}>
            <For each={pageItems()}>
              {(r) => (
                <FramedItemCard rarity="common" icon={r.icon} dim={r.missing.length > 0}
                  title={r.name}
                  tooltip={r.missing.length > 0 ? `Missing: ${r.missing.join(", ")}` : "Load into the stations"}
                  onClick={() => loadDish(r.placements)} minHeight="92px"
                  body={<For each={r.effects}>
                    {(e) => <div style={{ "font-size": "0.66rem", color: EFFECT_COLOR, "line-height": 1.3 }}>{e.amount} {CH_SHORT[e.channel]}</div>}
                  </For>}>
                  <Show when={STAPLE_RECIPE[r.id]}>
                    {(rid) => (
                      <span onClick={(e) => { e.stopPropagation(); toggleKeepCooking(rid()); }}
                        title={keepCookingOn(rid()) ? "Keeping a pot on to feed the settlement — tap to stop"
                          : cookSlotsFull(rid()) ? "All cook slots busy — upgrade the Kitchen for more pots"
                          : "Keep a pot on: stretches raw food into portions for the settlement"}
                        style={{ display: "inline-block", "margin-top": "6px", "font-size": "0.62rem", padding: "2px 7px", "border-radius": "4px",
                          cursor: cookSlotsFull(rid()) ? "default" : "pointer", "font-weight": 600,
                          background: keepCookingOn(rid()) ? "rgba(212,131,26,0.28)" : "rgba(255,255,255,0.08)",
                          border: `1px solid ${keepCookingOn(rid()) ? "var(--accent-gold)" : "var(--border-default)"}`,
                          color: "var(--text-primary)", opacity: cookSlotsFull(rid()) ? 0.5 : 1 }}>
                        {keepCookingOn(rid()) ? "🔥 Cooking — tap to stop" : cookSlotsFull(rid()) ? "🔥 Kitchen full" : "🔥 Keep a pot on"}
                      </span>
                    )}
                  </Show>
                </FramedItemCard>
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

      {/* ── RIGHT: the working kitchen ── */}
      <div style={{ flex: "1 1 340px" }}>
        {/* ── The cooking surface: a painting, with the stations sitting on it ──
            Buttons hang ABOVE each object rather than making the objects
            themselves clickable — simpler to read, and it leaves room for each
            station's contents. Coordinates are percentages, so the art can be
            re-cropped or swapped per tier without touching the layout. */}
        <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "8px" }}>
          🍳 The kitchen {held()
            ? <span style={{ color: "var(--accent-gold)" }}>· holding {getFoodIngredient(held()!)?.icon} {getFoodIngredient(held()!)?.name}, choose where it goes</span>
            : ""}
        </div>
        <div style={{ position: "relative", width: "100%", "aspect-ratio": "1 / 1", "border-radius": "4px", overflow: "hidden", "margin-bottom": "16px", border: "1px solid var(--border-color)" }}>
          <img src={KITCHEN_ART} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", "object-fit": "cover", "user-select": "none", "pointer-events": "none" }} />
          <For each={paintedStations()}>
            {(st) => {
              const arr = () => stationOf(st.technique);
              const refuses = () => !!held() && !allowsTechnique(held()!, st.technique);
              const offers = () => !!held() && !refuses();
              return (
                <div style={{ position: "absolute", left: `${st.x}%`, top: `${st.y}%`, transform: "translate(-50%, -50%)",
                  display: "flex", "flex-direction": "column", "align-items": "center", gap: "4px", "max-width": "46%" }}>
                  {/* contents tray — sits above the label so the object stays visible */}
                  <Show when={arr().length > 0}>
                    <div style={{ display: "flex", "flex-wrap": "wrap", gap: "3px", "justify-content": "center" }}>
                      <For each={countsOf(st.technique)}>
                        {(c) => (
                          <span title={getFoodIngredient(c.id)?.name}
                            style={{ display: "inline-flex", "align-items": "center", gap: "3px", "font-size": "0.66rem", padding: "1px 3px 1px 6px", "border-radius": "3px",
                              background: "rgba(20,14,8,0.82)", border: "1px solid var(--accent-gold)", color: "var(--text-primary)", "backdrop-filter": "blur(2px)" }}>
                            <span>{getFoodIngredient(c.id)?.icon}</span>
                            <button onClick={(e) => { e.stopPropagation(); removeOne(st.technique, c.id); }} title="One less" style={STEP_BTN}>−</button>
                            <span style={{ "min-width": "0.8em", "text-align": "center", "font-weight": 600 }}>{c.n}</span>
                            <button onClick={(e) => { e.stopPropagation(); addToStation(st.technique, c.id); }} disabled={!canStepUp(st.technique, c.id)}
                              title={c.n >= MAX_PER_INGREDIENT ? `Up to ${MAX_PER_INGREDIENT}` : canAddMore(c.id) ? "One more" : "None left"}
                              style={{ ...STEP_BTN, opacity: canStepUp(st.technique, c.id) ? 1 : 0.35 }}>+</button>
                            <button onClick={(e) => { e.stopPropagation(); removeAll(st.technique, c.id); }} title={`Remove ${getFoodIngredient(c.id)?.name}`} style={{ ...STEP_BTN, "margin-left": "1px" }}>✕</button>
                          </span>
                        )}
                      </For>
                    </div>
                  </Show>
                  {/* The slot itself — a square tile in the same language as the
                      adventurers' potion/food slots (SupplySlot): dashed while
                      empty, solid once something is in it. Labelled with the
                      VERB, since the action is what the player is choosing; the
                      place ("the Pot") stays as flavour in the tooltip. */}
                  <Tooltip position="top" text={
                    refuses() ? `${getFoodIngredient(held()!)?.name} can't be ${st.past}`
                      : held() ? `Add ${getFoodIngredient(held()!)?.name?.toLowerCase()} to the ${st.place.toLowerCase()}`
                      : arr().length ? `${st.verb}ing in the ${st.place.toLowerCase()}. Take something off a shelf to add more.`
                      : `The ${st.place.toLowerCase()}. Take something off a shelf first.`
                  }>
                  <button onClick={() => clickStation(st.technique)}
                    style={{ width: "58px", height: "58px", "border-radius": "3px", padding: 0,
                      display: "flex", "flex-direction": "column", "align-items": "center", "justify-content": "center", gap: "1px",
                      cursor: offers() ? "pointer" : "default",
                      background: offers() ? "rgba(212,131,26,0.30)" : "rgba(20,14,8,0.62)",
                      border: `1px ${arr().length ? "solid" : "dashed"} ${offers() ? "var(--accent-gold)" : arr().length ? "var(--accent-green)" : "rgba(255,255,255,0.35)"}`,
                      color: "var(--text-primary)", opacity: refuses() ? 0.35 : 1,
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

        {/* Stations the settlement has grown into but the camp painting doesn't
            depict yet. Plain row until each tier gets its own art. */}
        <Show when={extraStations().length > 0}>
          <div style={{ display: "flex", "flex-wrap": "wrap", gap: "8px", "margin-bottom": "16px" }}>
            <For each={extraStations()}>
              {(st) => {
                const arr = () => stationOf(st.technique);
                const refuses = () => !!held() && !allowsTechnique(held()!, st.technique);
                const offers = () => !!held() && !refuses();
                return (
                  <div style={{ flex: "1 1 45%", "min-height": "58px", padding: "6px", "border-radius": "4px", "text-align": "center", cursor: offers() ? "pointer" : "default",
                    border: `2px solid ${offers() ? "var(--accent-gold)" : arr().length ? "var(--accent-green)" : "var(--border-default)"}`,
                    background: offers() ? "rgba(212,131,26,0.08)" : "var(--bg-card)",
                    opacity: refuses() ? 0.4 : 1,
                    display: "flex", "flex-direction": "column", "align-items": "center", "justify-content": "center", gap: "3px" }}
                    onClick={() => clickStation(st.technique)}
                    title={refuses() ? `${getFoodIngredient(held()!)?.name} can't be ${st.past}`
                      : held() ? `${st.verb} it in the ${st.place}` : st.place}>
                    <div style={{ "font-size": "1.2rem" }}>{st.icon}</div>
                    <div style={{ "font-size": "0.7rem", color: "var(--text-secondary)" }}>{st.verb}</div>
                    <Show when={arr().length > 0} fallback={<div style={{ "font-size": "0.64rem", color: "var(--text-muted)" }}>empty</div>}>
                      <div style={{ display: "flex", "flex-wrap": "wrap", gap: "4px", "justify-content": "center" }}>
                        <For each={countsOf(st.technique)}>
                          {(c) => (
                            <span style={{ display: "inline-flex", "align-items": "center", gap: "4px", "font-size": "0.66rem", padding: "1px 3px 1px 7px", "border-radius": "3px", background: "rgba(255,255,255,0.08)", border: "1px solid var(--border-default)" }}>
                              <span>{getFoodIngredient(c.id)?.icon} {getFoodIngredient(c.id)?.name}</span>
                              <button onClick={(e) => { e.stopPropagation(); removeOne(st.technique, c.id); }} title="One less" style={STEP_BTN}>−</button>
                              <span style={{ "min-width": "0.8em", "text-align": "center", "font-weight": 600 }}>{c.n}</span>
                              <button onClick={(e) => { e.stopPropagation(); addToStation(st.technique, c.id); }} disabled={!canStepUp(st.technique, c.id)}
                                title={c.n >= MAX_PER_INGREDIENT ? `Up to ${MAX_PER_INGREDIENT}` : canAddMore(c.id) ? "One more" : "None left"}
                                style={{ ...STEP_BTN, opacity: canStepUp(st.technique, c.id) ? 1 : 0.35 }}>+</button>
                              <button onClick={(e) => { e.stopPropagation(); removeAll(st.technique, c.id); }} title={`Remove ${getFoodIngredient(c.id)?.name}`} style={{ ...STEP_BTN, "margin-left": "1px" }}>✕</button>
                            </span>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>

        {/* Shelves — one button per role, opens a picker of what's in the larder */}
        <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "6px" }}>🧺 Shelves</div>
        <div class={nudgeShelves() ? "kitchen-shelf-nudge" : undefined}
          style={{ display: "flex", "flex-wrap": "wrap", "justify-content": "center", gap: "6px", "margin-bottom": "16px", "border-radius": "3px" }}>
          <For each={ROLE_SHELVES}>
            {(sh) => {
              const count = () => shelfStock(sh.role).length;
              return (
                <button onClick={() => { setShelfModal(sh.role); playSound("shelf_open"); }}
                  style={{ flex: "0 0 46%", padding: "5px 8px", "border-radius": "3px", cursor: "pointer",
                    border: "1px solid var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)",
                    display: "flex", "align-items": "baseline", "justify-content": "center", gap: "6px", opacity: count() > 0 ? 1 : 0.5 }}>
                  <span style={{ "font-size": "0.8rem" }}>{sh.icon} {sh.label}</span>
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
              "border-image": `url(${frameUrl("common")}) 34 stretch`, filter: gradeFilter(dish().quality === "seasoned" ? "fine" : dish().quality) }}>
              <div style={{ "font-size": "1.1rem", "font-weight": 600, color: dish().named ? "var(--accent-green)" : QUALITY_COLOR[dish().quality] }}>{dish().name}</div>
              <div style={{ "font-size": "0.66rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin-bottom": "6px" }}>{dish().named ? "known dish · " : ""}{QUALITY_LABEL[dish().quality]}</div>
              <Show when={dish().effects.length > 0} fallback={<div style={{ color: "var(--text-muted)", "font-style": "italic", "font-size": "0.82rem" }}>Nothing worth serving yet.</div>}>
                <For each={dish().effects}>{(e) => <div style={{ "font-size": "0.82rem", color: EFFECT_COLOR, padding: "1px 0" }}><b>{e.amount}</b> {CH_SHORT[e.channel]}</div>}</For>
              </Show>
              <Show when={taste().length > 0}>
                <div style={{ "font-size": "0.72rem", color: "var(--accent-gold)", "margin-top": "4px", "text-transform": "capitalize" }}>👅 Taste: {taste().join(", ")}</div>
              </Show>
              <Show when={dish().notes.length > 0}>
                <div style={{ "margin-top": "8px", "border-top": "1px solid var(--border-default)", "padding-top": "6px" }}>
                  <For each={dish().notes}>{(n) => <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "font-style": "italic" }}>· {n}</div>}</For>
                </div>
              </Show>
            </div>
            <Show when={short().length > 0}><div style={{ "font-size": "0.72rem", color: "var(--accent-red)", "margin-top": "6px" }}>Short of: {short().join(", ")}</div></Show>
            <div style={{ display: "flex", gap: "8px", "margin-top": "8px" }}>
              <button class="btn-primary" style={{ flex: 1, opacity: placements().length === 0 || short().length > 0 ? 0.5 : 1 }}
                disabled={placements().length === 0 || short().length > 0} onClick={doCook}>🍳 Cook</button>
              <button class="btn-tertiary" style={{ "font-size": "0.78rem" }} onClick={clear}>Clear</button>
            </div>
          </div>
        </div>
      </div>

      {/* Shelf picker modal */}
      <Show when={shelfModal()}>
        {(role) => (
          <FramedModal icon={ROLE_SHELVES.find((s) => s.role === role())!.icon}
            title={`${ROLE_SHELVES.find((s) => s.role === role())!.label} shelf`}
            subtitle="Pick an ingredient, then click a station to prepare it."
            onClose={() => setShelfModal(null)} maxWidth="720px">
            <Show when={shelfStock(role()).length > 0} fallback={<div style={{ padding: "12px", "font-size": "0.85rem", color: "var(--text-muted)", "font-style": "italic" }}>Nothing on this shelf in the larder yet.</div>}>
              <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "8px", padding: "4px 2px" }}>
                <For each={shelfStock(role())}>
                  {(ing) => (
                    <FramedItemCard rarity="common" icon={ing.icon} title={ing.name} dim={!canAddMore(ing.id)}
                      subtitle={<span>in larder · ×{stock(ing.id)}{placedTotal(ing.id) > 0 ? ` · ${placedTotal(ing.id)} in the pot` : ""}</span>}
                      tooltip={canAddMore(ing.id) ? `Pick ${ing.name}` : "It's all in the pot already"} onClick={() => pickFromShelf(ing.id)} minHeight="120px">
                      <div style={{ "font-size": "0.72rem", color: "var(--text-secondary)", "font-style": "italic", "line-height": 1.3 }}>{ing.note}</div>
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
