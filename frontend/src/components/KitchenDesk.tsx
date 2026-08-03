import { createSignal, createMemo, For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { resolveDish, NAMED_DISHES } from "@medieval-realm/shared/data/kitchen/named_dishes";
import { getFoodIngredient, foodByRole } from "@medieval-realm/shared/data/kitchen/ingredients";
import type { CookTechnique, FoodRole, CookPlacement, DishChannel } from "@medieval-realm/shared/data/kitchen/types";
import { playSound } from "~/engine/sounds";
import FramedModal from "~/components/FramedModal";
import FramedItemCard, { itemFrameUrl as frameUrl, gradeFilter } from "~/components/FramedItemCard";

/** The free-form cooking desk. Left: the cookbook on parchment (paginated framed
 *  cards). Right: the pot (ingredient chips, one per pick, several per shelf) fed
 *  by ROLE SHELVES (each a button opening a picker of what's in your larder), and
 *  the output. Each chip carries its own prep + quantity. See docs/DESIGN_KITCHEN.md. */

const SHELVES: { role: FoodRole; label: string; icon: string }[] = [
  { role: "staple", label: "Staple", icon: "🌾" }, { role: "protein", label: "Protein", icon: "🍖" },
  { role: "veg", label: "Veg", icon: "🥬" }, { role: "fruit", label: "Fruit", icon: "🍎" },
  { role: "dairy", label: "Dairy", icon: "🧀" }, { role: "spice", label: "Spice", icon: "🌶️" },
];
const TECHNIQUES: { technique: CookTechnique; label: string }[] = [
  { technique: "boil", label: "🍲 Boil" }, { technique: "chop", label: "🔪 Chop" },
  { technique: "fry", label: "🍳 Fry" }, { technique: "roast", label: "🔥 Roast" },
];
const CH_SHORT: Record<DishChannel, string> = { nourishment: "Nourishment", comfort: "Comfort", warmth: "Warmth", freshness: "Freshness" };
const QUALITY_COLOR: Record<string, string> = { seasoned: "var(--accent-green)", fine: "var(--accent-green)", rough: "var(--accent-gold)", plain: "var(--text-muted)" };
const QUALITY_LABEL: Record<string, string> = { seasoned: "well-seasoned", fine: "fine", rough: "thin", plain: "plain" };
const MAX_PER_INGREDIENT = 5;
const PER_PAGE = 8;
const EFFECT_COLOR = "var(--accent-green)";

type Entry = { id: string; technique: CookTechnique; qty: number };

export default function KitchenDesk() {
  const { state, actions } = useGame();
  const [pot, setPot] = createSignal<Entry[]>([]);
  const [shelfModal, setShelfModal] = createSignal<FoodRole | null>(null);
  const [page, setPage] = createSignal(0);

  const stock = (id: string) => Math.floor(actions.getCookIngredientQty(id));
  const placedTotal = (id: string) => pot().filter((e) => e.id === id).reduce((n, e) => n + e.qty, 0);
  const canAdd = (id: string) => placedTotal(id) < stock(id);
  const clear = () => setPot([]);

  // Adding an ingredient: bump its (id, signature) entry, or start a new chip.
  const addIngredient = (id: string) => {
    if (!canAdd(id)) return;
    const sig = getFoodIngredient(id)?.signature ?? "boil";
    const arr = [...pot()];
    const e = arr.find((x) => x.id === id && x.technique === sig);
    if (e && e.qty < MAX_PER_INGREDIENT) e.qty++;
    else if (!e) arr.push({ id, technique: sig, qty: 1 });
    else return; // at the per-ingredient cap on this prep
    setPot(arr); playSound("jars");
  };
  const setTech = (i: number, t: CookTechnique) => { const arr = [...pot()]; arr[i] = { ...arr[i], technique: t }; setPot(arr); };
  const stepQty = (i: number, d: number) => {
    const arr = [...pot()]; const e = arr[i];
    const next = e.qty + d;
    if (next <= 0) { arr.splice(i, 1); setPot(arr); return; }
    if (next > MAX_PER_INGREDIENT) return;
    if (d > 0 && !canAdd(e.id)) return; // stock cap across all this id's chips
    arr[i] = { ...e, qty: next }; setPot(arr);
  };
  const removeChip = (i: number) => { const arr = [...pot()]; arr.splice(i, 1); setPot(arr); };

  const placements = createMemo<CookPlacement[]>(() =>
    pot().flatMap((e) => Array.from({ length: e.qty }, () => ({ ingredientId: e.id, technique: e.technique }))),
  );
  const dish = createMemo(() => resolveDish(placements()));
  const short = createMemo(() => {
    const need = new Map<string, number>();
    for (const e of pot()) need.set(e.id, (need.get(e.id) ?? 0) + e.qty);
    return [...need].filter(([id, n]) => stock(id) < n).map(([id]) => getFoodIngredient(id)?.name ?? id);
  });
  const doCook = () => { if (actions.cookDish(placements())) playSound("kitchen"); };

  // Shelf picker — only what's in the larder.
  const shelfStock = (role: FoodRole) => foodByRole(role).filter((i) => stock(i.id) > 0);

  // ── Cookbook (left): known dishes you can browse; dim what you can't make. ──
  const anyOfInStock = (anyOf: readonly string[]) => anyOf.find((id) => stock(id) > 0);
  const repPlacements = (slots: { anyOf: readonly string[]; technique: CookTechnique }[]): CookPlacement[] =>
    slots.map((s) => ({ ingredientId: anyOfInStock(s.anyOf) ?? s.anyOf[0], technique: s.technique }));
  const missingSlots = (slots: { anyOf: readonly string[] }[]) =>
    slots.filter((s) => !s.anyOf.some((id) => stock(id) > 0)).map((s) => getFoodIngredient(s.anyOf[0])?.name ?? s.anyOf[0]);

  const knownIds = new Set(NAMED_DISHES.map((d) => d.id));
  const book = createMemo(() => {
    const known = NAMED_DISHES.map((d) => ({
      id: d.id, name: d.name, icon: d.icon, placements: repPlacements(d.slots),
      effects: resolveDish(repPlacements(d.slots)).effects, missing: missingSlots(d.slots),
    }));
    const discovered = Object.values(state.kitchenDishes ?? {})
      .filter((d) => !knownIds.has(d.id))
      .map((d) => ({
        id: d.id, name: d.name, icon: getFoodIngredient(d.placements[0]?.ingredientId)?.icon ?? "🍲",
        placements: d.placements, effects: d.effects,
        missing: [...new Set(d.placements.map((p) => p.ingredientId))].filter((id) => stock(id) <= 0).map((id) => getFoodIngredient(id)?.name ?? id),
      }));
    return [...known, ...discovered];
  });
  const pageCount = () => Math.max(1, Math.ceil(book().length / PER_PAGE));
  const pageItems = () => book().slice(page() * PER_PAGE, page() * PER_PAGE + PER_PAGE);

  const loadDish = (placements: CookPlacement[]) => {
    const order: Entry[] = []; const map = new Map<string, Entry>();
    for (const p of placements) {
      const k = `${p.ingredientId}:${p.technique}`;
      let e = map.get(k);
      if (!e) { e = { id: p.ingredientId, technique: p.technique, qty: 0 }; order.push(e); map.set(k, e); }
      e.qty++;
    }
    setPot(order);
  };

  const PAGE_BTN = { background: "rgba(42,32,18,0.08)", border: "1px solid #2a2012", "border-radius": "4px", color: "#2a2012", padding: "2px 12px", cursor: "pointer", "font-size": "0.9rem" } as const;
  const STEP_BTN = { background: "rgba(255,255,255,0.1)", border: "1px solid var(--border-default)", "border-radius": "4px", color: "var(--text-primary)", width: "16px", height: "16px", "line-height": 1, padding: 0, cursor: "pointer", "font-size": "0.8rem", display: "inline-flex", "align-items": "center", "justify-content": "center" } as const;

  return (
    <div style={{ margin: "8px 0 24px", display: "flex", gap: "20px", "flex-wrap": "wrap", "align-items": "flex-start" }}>
      {/* ── LEFT: cookbook on parchment ── */}
      <div class="parchment-panel" style={{ flex: "1.4 1 460px", "max-width": "610px", "min-height": "540px", padding: "18px 20px", "border-radius": "8px", "align-self": "stretch" }}>
        <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "12px" }}>📖 Cookbook</h3>
        <Show when={book().length > 0} fallback={<div style={{ "font-size": "0.8rem", "font-style": "italic", opacity: 0.7 }}>No dishes yet.</div>}>
          <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "12px" }}>
            <For each={pageItems()}>
              {(r) => (
                <FramedItemCard rarity="common" icon={r.icon} dark dim={r.missing.length > 0}
                  title={r.name}
                  tooltip={r.missing.length > 0 ? `Missing: ${r.missing.join(", ")}` : "Load into the pot"}
                  onClick={() => loadDish(r.placements)} minHeight="92px"
                  body={<For each={r.effects}>
                    {(e) => <div style={{ "font-size": "0.66rem", color: EFFECT_COLOR, "line-height": 1.3 }}>{e.amount} {CH_SHORT[e.channel]}</div>}
                  </For>} />
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
        {/* The pot — ingredient chips (several per shelf), each with prep + qty */}
        <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "8px" }}>🍲 The pot</div>
        <div style={{ "min-height": "70px", padding: "8px", "border-radius": "8px", border: "2px solid var(--border-default)", background: "var(--bg-card)", "margin-bottom": "16px", display: "flex", "flex-direction": "column", gap: "6px" }}>
          <Show when={pot().length > 0} fallback={<div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "font-style": "italic", "text-align": "center", padding: "14px 0" }}>Empty — pick ingredients from the shelves below.</div>}>
            <For each={pot()}>
              {(e, i) => (
                <div style={{ display: "flex", "align-items": "center", gap: "6px", "font-size": "0.74rem" }}>
                  <span style={{ flex: 1, "min-width": 0, "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" }}>{getFoodIngredient(e.id)?.icon} {getFoodIngredient(e.id)?.name}</span>
                  <select value={e.technique} onChange={(ev) => setTech(i(), ev.currentTarget.value as CookTechnique)}
                    style={{ padding: "2px 4px", "font-size": "0.7rem", background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-default)", "border-radius": "4px" }}>
                    <For each={TECHNIQUES}>{(t) => <option value={t.technique}>{t.label}</option>}</For>
                  </select>
                  <button onClick={() => stepQty(i(), -1)} style={STEP_BTN}>−</button>
                  <span style={{ "min-width": "0.8em", "text-align": "center", "font-weight": 600 }}>{e.qty}</span>
                  <button onClick={() => stepQty(i(), 1)} disabled={e.qty >= MAX_PER_INGREDIENT || !canAdd(e.id)}
                    style={{ ...STEP_BTN, opacity: e.qty >= MAX_PER_INGREDIENT || !canAdd(e.id) ? 0.35 : 1 }}>+</button>
                  <button onClick={() => removeChip(i())} title="Remove" style={{ ...STEP_BTN, "margin-left": "1px" }}>✕</button>
                </div>
              )}
            </For>
          </Show>
        </div>

        {/* Shelves — one button per role, opens a picker of what's in the larder */}
        <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "6px" }}>🧺 Shelves</div>
        <div style={{ display: "flex", "flex-wrap": "wrap", "justify-content": "center", gap: "6px", "margin-bottom": "16px" }}>
          <For each={SHELVES}>
            {(sh) => {
              const count = () => shelfStock(sh.role).length;
              return (
                <button onClick={() => { setShelfModal(sh.role); playSound("shelf_open"); }}
                  style={{ flex: "0 0 46%", padding: "5px 8px", "border-radius": "8px", cursor: "pointer",
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
            <div style={{ padding: "12px", "border-radius": "8px", background: "rgba(255,255,255,0.06)", border: "14px solid transparent",
              "border-image": `url(${frameUrl("common")}) 34 stretch`, filter: gradeFilter(dish().quality === "seasoned" ? "fine" : dish().quality) }}>
              <div style={{ "font-size": "1.1rem", "font-weight": 600, color: dish().named ? "var(--accent-green)" : QUALITY_COLOR[dish().quality] }}>{dish().name}</div>
              <div style={{ "font-size": "0.66rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin-bottom": "6px" }}>{dish().named ? "known dish · " : ""}{QUALITY_LABEL[dish().quality]}</div>
              <Show when={dish().effects.length > 0} fallback={<div style={{ color: "var(--text-muted)", "font-style": "italic", "font-size": "0.82rem" }}>Nothing worth serving yet.</div>}>
                <For each={dish().effects}>{(e) => <div style={{ "font-size": "0.82rem", color: EFFECT_COLOR, padding: "1px 0" }}><b>{e.amount}</b> {CH_SHORT[e.channel]}</div>}</For>
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
          <FramedModal icon={SHELVES.find((s) => s.role === role())!.icon}
            title={`${SHELVES.find((s) => s.role === role())!.label} shelf`}
            subtitle="Click to add to the pot — several is fine. Close when you're done."
            onClose={() => setShelfModal(null)} maxWidth="720px">
            <Show when={shelfStock(role()).length > 0} fallback={<div style={{ padding: "12px", "font-size": "0.85rem", color: "var(--text-muted)", "font-style": "italic" }}>Nothing on this shelf in the larder yet.</div>}>
              <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "8px", padding: "4px 2px" }}>
                <For each={shelfStock(role())}>
                  {(ing) => (
                    <FramedItemCard rarity="common" icon={ing.icon} title={ing.name} dim={!canAdd(ing.id)}
                      subtitle={<span>in larder · ×{stock(ing.id)}{placedTotal(ing.id) > 0 ? ` · ${placedTotal(ing.id)} in pot` : ""}</span>}
                      tooltip={canAdd(ing.id) ? `Add ${ing.name}` : "None left in the larder"}
                      onClick={() => addIngredient(ing.id)} minHeight="120px">
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
