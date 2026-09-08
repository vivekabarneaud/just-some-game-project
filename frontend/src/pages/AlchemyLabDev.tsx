import { createSignal, createMemo, For, Show } from "solid-js";
import { brew } from "@medieval-realm/shared/data/alchemy/brew";
import { INGREDIENTS, getIngredient } from "@medieval-realm/shared/data/alchemy/ingredients";
import { describeEffect, effectKind } from "@medieval-realm/shared/data/alchemy/describe";
import type { Technique, Role, Placement } from "@medieval-realm/shared/data/alchemy/types";

/** TEMP dev page (/dev-alchemy) — the free-form alchemy SANDBOX. No art, no
 *  inventory wiring: pick a plant from each ROLE shelf, choose how to PREPARE it
 *  (technique), and watch the computed brew update live — so we can feel
 *  combinations + tune the effect-vector engine. See docs/IDEAS.md (Alchemy) for what's still unbuilt. */

const ROLE_SHELVES: { role: Role; label: string; hint: string }[] = [
  { role: "base", label: "Base", hint: "the carrier — a brew wants one" },
  { role: "hero", label: "Hero ⭐", hint: "the star effect" },
  { role: "catalyst", label: "Catalyst", hint: "amplify / extend the rest" },
  { role: "toxin", label: "Toxin", hint: "poisons & offensive" },
  { role: "wildcard", label: "Wildcard", hint: "potent, and its own risk" },
];

// The techniques a plant can be prepared with (the 5 we surface first).
const TECHNIQUES: { technique: Technique; label: string }[] = [
  { technique: "crush", label: "🪨 Crush" },
  { technique: "boil", label: "🔥 Boil" },
  { technique: "steep", label: "🫖 Steep" },
  { technique: "distil", label: "⚗️ Distil" },
  { technique: "char", label: "🕯️ Char" },
];

const QUALITY_COLOR = { fine: "var(--accent-green)", rough: "var(--accent-gold)", dubious: "var(--accent-red)" };
const KIND_COLOR = { recovery: "var(--accent-green)", combat: "var(--accent-blue)", offensive: "var(--accent-red)" };

type Slot = { ingredientId: string; technique: Technique };

export default function AlchemyLabDev() {
  // One slot per role shelf: the chosen plant + how it's prepared.
  const [slots, setSlots] = createSignal<Record<string, Slot>>(
    Object.fromEntries(ROLE_SHELVES.map((s) => [s.role, { ingredientId: "", technique: "steep" as Technique }])),
  );
  // Picking a plant defaults its technique to that plant's signature prep.
  const pickPlant = (role: Role, id: string) => {
    const sig = id ? getIngredient(id)?.signature ?? "steep" : "steep";
    setSlots({ ...slots(), [role]: { ingredientId: id, technique: sig } });
  };
  const pickTechnique = (role: Role, t: Technique) =>
    setSlots({ ...slots(), [role]: { ...slots()[role], technique: t } });
  const clear = () => setSlots(Object.fromEntries(ROLE_SHELVES.map((s) => [s.role, { ingredientId: "", technique: "steep" as Technique }])));

  const placements = createMemo<Placement[]>(() =>
    ROLE_SHELVES.filter((s) => slots()[s.role].ingredientId)
      .map((s) => ({ ingredientId: slots()[s.role].ingredientId, technique: slots()[s.role].technique })),
  );
  const result = createMemo(() => brew(placements()));

  return (
    <div style={{ padding: "20px", "max-width": "1000px", margin: "0 auto" }}>
      <h1 style={{ color: "var(--accent-gold)" }}>🧪 Alchemy Lab — sandbox</h1>
      <p style={{ color: "var(--text-secondary)", "font-size": "0.9rem" }}>
        Pick a plant from each shelf, then choose how to prepare it. Same plant, different technique = different effect.
        A tuning sandbox — no ingredients are consumed. <em>(dev page /dev-alchemy)</em>
      </p>

      <div style={{ display: "flex", gap: "20px", "flex-wrap": "wrap", "margin-top": "16px" }}>
        {/* ── Shelves (one row per role: plant + technique) ── */}
        <div style={{ flex: "1 1 460px" }}>
          <h2 style={{ "font-size": "1rem", color: "var(--text-primary)" }}>The shelves</h2>
          <For each={ROLE_SHELVES}>
            {(shelf) => {
              const slot = () => slots()[shelf.role];
              const picked = () => (slot().ingredientId ? getIngredient(slot().ingredientId) : undefined);
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
                  {/* Plant picker for this shelf */}
                  <select
                    value={slot().ingredientId}
                    onChange={(e) => pickPlant(shelf.role, e.currentTarget.value)}
                    style={{ flex: 1, padding: "5px", background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-default)", "border-radius": "4px" }}
                  >
                    <option value="">— none —</option>
                    <For each={INGREDIENTS.filter((i) => i.role === shelf.role)}>
                      {(ing) => <option value={ing.id}>{ing.icon} {ing.name}</option>}
                    </For>
                  </select>
                  {/* Technique picker (how to prepare it) — enabled once a plant is chosen */}
                  <select
                    value={slot().technique}
                    disabled={!picked()}
                    onChange={(e) => pickTechnique(shelf.role, e.currentTarget.value as Technique)}
                    title={picked() ? "How to prepare it" : "Pick a plant first"}
                    style={{ width: "112px", padding: "5px", background: "var(--bg-card)", color: picked() ? "var(--text-primary)" : "var(--text-muted)", border: "1px solid var(--border-default)", "border-radius": "4px", opacity: picked() ? 1 : 0.5 }}
                  >
                    <For each={TECHNIQUES}>
                      {(t) => <option value={t.technique}>{t.label}{picked()?.signature === t.technique ? " ⭐" : ""}</option>}
                    </For>
                  </select>
                </div>
              );
            }}
          </For>
          <button class="btn-tertiary" style={{ "margin-top": "4px", "font-size": "0.8rem" }} onClick={clear}>Clear the pot</button>
        </div>

        {/* ── Result ── */}
        <div style={{ flex: "1 1 320px" }}>
          <h2 style={{ "font-size": "1rem", color: "var(--text-primary)" }}>The brew</h2>
          <div style={{ padding: "14px", border: `1px solid ${QUALITY_COLOR[result().quality]}`, "border-radius": "8px", background: "rgba(0,0,0,0.15)" }}>
            <div style={{ "font-size": "1.2rem", "font-weight": 600, color: QUALITY_COLOR[result().quality] }}>
              {result().name}
            </div>
            <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin-bottom": "8px" }}>
              {result().quality}
            </div>
            <Show when={result().effects.length > 0} fallback={<div style={{ color: "var(--text-muted)", "font-style": "italic" }}>Nothing worth drinking yet.</div>}>
              <For each={result().effects}>
                {(e) => {
                  return (
                    <div style={{ "font-size": "0.85rem", color: KIND_COLOR[effectKind(e.channel)], padding: "2px 0" }}>
                      {describeEffect(e)}
                    </div>
                  );
                }}
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

          {/* Ingredient hints for what's picked */}
          <Show when={placements().length > 0}>
            <div style={{ "margin-top": "12px", "font-size": "0.75rem", color: "var(--text-muted)" }}>
              <For each={placements()}>
                {(pl) => {
                  const ing = getIngredient(pl.ingredientId);
                  return <div style={{ padding: "2px 0" }}>{ing?.icon} <b>{ing?.name}</b> — {ing?.note}</div>;
                }}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
