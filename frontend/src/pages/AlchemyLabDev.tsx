import { createSignal, createMemo, For, Show } from "solid-js";
import { brew } from "@medieval-realm/shared/data/alchemy/brew";
import { INGREDIENTS, getIngredient } from "@medieval-realm/shared/data/alchemy/ingredients";
import type { Technique, Role, EffectChannel, Placement } from "@medieval-realm/shared/data/alchemy/types";

/** TEMP dev page (/dev-alchemy) — the free-form alchemy SANDBOX. No art, no
 *  inventory wiring: pick plants (grouped by ROLE shelf) into TECHNIQUE slots and
 *  watch the computed brew update live, so we can feel combinations + tune the
 *  effect-vector engine. See docs/DESIGN_APOTHECARY.md. */

// The 5 stations we surface first (the design's L1→ progression; dry/ferment omitted here).
const STATIONS: { technique: Technique; label: string; blurb: string }[] = [
  { technique: "crush", label: "🪨 Mortar — Crush", blurb: "poultices, wound-work" },
  { technique: "boil", label: "🔥 Cauldron — Boil", blurb: "strong decoctions (sustained)" },
  { technique: "steep", label: "🫖 Steep / Infuse", blurb: "gentle teas (sustained)" },
  { technique: "distil", label: "⚗️ Still — Distil", blurb: "potent essences (burst)" },
  { technique: "char", label: "🕯️ Burn — Char", blurb: "incense, warding, smoke" },
];

const ROLE_META: { role: Role; label: string }[] = [
  { role: "base", label: "Base" },
  { role: "hero", label: "Hero ⭐" },
  { role: "catalyst", label: "Catalyst" },
  { role: "toxin", label: "Toxin" },
  { role: "wildcard", label: "Wildcard" },
];

// Human labels for effect channels (display only).
const CHANNEL_LABEL: Partial<Record<EffectChannel, string>> = {
  str: "+STR", dex: "+DEX", int: "+INT", vit: "+VIT", wis: "+WIS",
  crit: "+Crit%", accuracy: "+Accuracy%", dodge: "+Dodge%", parry: "+Parry%",
  initiative: "+Initiative", mobility: "+Mobility", presence: "+Presence", luck: "+Luck%",
  damage_pct: "+Damage%", defense_pct: "+Defense%",
  heal_hp: "Heal HP", ease_fever: "Eases Fever", ease_gut: "Settles Gut", ease_wound: "Mends Wound",
  general_recovery: "General recovery", happiness: "+Happiness",
  resist_fire: "Resist Fire", resist_frost: "Resist Frost", resist_lightning: "Resist Lightning",
  resist_aether: "Resist Aether", resist_light: "Resist Light", resist_hollow: "Resist Hollow",
  resist_nature: "Resist Nature", resist_undead: "Ward vs Undead", resist_confuse: "Resist Confusion",
  poison: "Poison (DoT)", weaken: "Weaken", slow: "Slow", confuse: "Confuse",
  aoe_fire: "AoE Fire", aoe_frost: "AoE Frost",
};

const QUALITY_COLOR = { fine: "var(--accent-green)", rough: "var(--accent-gold)", dubious: "var(--accent-red)" };

export default function AlchemyLabDev() {
  // technique → ingredientId ("" = empty)
  const [slots, setSlots] = createSignal<Record<string, string>>(
    Object.fromEntries(STATIONS.map((s) => [s.technique, ""])),
  );
  const setSlot = (t: Technique, id: string) => setSlots({ ...slots(), [t]: id });
  const clear = () => setSlots(Object.fromEntries(STATIONS.map((s) => [s.technique, ""])));

  const placements = createMemo<Placement[]>(() =>
    STATIONS.filter((s) => slots()[s.technique])
      .map((s) => ({ ingredientId: slots()[s.technique], technique: s.technique })),
  );
  const result = createMemo(() => brew(placements()));

  const fmtEffect = (e: { channel: EffectChannel; amount: number; shape?: string; rounds?: number }) => {
    const label = CHANNEL_LABEL[e.channel] ?? e.channel;
    const dur = e.shape === "burst" ? ` for ${e.rounds ?? 2} turns`
      : e.shape === "instant" ? " (instant)"
      : e.shape === "topical" ? " (applied)"
      : " (whole fight)";
    return `${label} ${e.amount}${dur}`;
  };

  return (
    <div style={{ padding: "20px", "max-width": "1000px", margin: "0 auto" }}>
      <h1 style={{ color: "var(--accent-gold)" }}>🧪 Alchemy Lab — sandbox</h1>
      <p style={{ color: "var(--text-secondary)", "font-size": "0.9rem" }}>
        Pick a plant into a technique slot and watch the brew. Same plant, different technique = different effect.
        This is a tuning sandbox — no ingredients are consumed. <em>(dev page /dev-alchemy)</em>
      </p>

      <div style={{ display: "flex", gap: "20px", "flex-wrap": "wrap", "margin-top": "16px" }}>
        {/* ── Stations ── */}
        <div style={{ flex: "1 1 420px" }}>
          <h2 style={{ "font-size": "1rem", color: "var(--text-primary)" }}>The lab</h2>
          <For each={STATIONS}>
            {(st) => {
              const picked = () => (slots()[st.technique] ? getIngredient(slots()[st.technique]) : undefined);
              return (
                <div style={{
                  display: "flex", "align-items": "center", gap: "10px", padding: "8px 10px",
                  "margin-bottom": "8px", border: "1px solid var(--border-default)", "border-radius": "6px",
                  background: picked() ? "rgba(212,131,26,0.06)" : undefined,
                }}>
                  <div style={{ "min-width": "160px" }}>
                    <div style={{ "font-size": "0.85rem", color: "var(--text-primary)" }}>{st.label}</div>
                    <div style={{ "font-size": "0.68rem", color: "var(--text-muted)" }}>{st.blurb}</div>
                  </div>
                  <select
                    value={slots()[st.technique]}
                    onChange={(e) => setSlot(st.technique, e.currentTarget.value)}
                    style={{ flex: 1, padding: "5px", background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-default)", "border-radius": "4px" }}
                  >
                    <option value="">— empty —</option>
                    <For each={ROLE_META}>
                      {(rm) => (
                        <optgroup label={rm.label}>
                          <For each={INGREDIENTS.filter((i) => i.role === rm.role)}>
                            {(ing) => <option value={ing.id}>{ing.icon} {ing.name}{ing.signature === st.technique ? " ⭐" : ""}</option>}
                          </For>
                        </optgroup>
                      )}
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
                  const offensive = ["poison", "weaken", "slow", "confuse", "aoe_fire", "aoe_frost"].includes(e.channel);
                  return (
                    <div style={{ "font-size": "0.85rem", color: offensive ? "var(--accent-red)" : "var(--accent-green)", padding: "2px 0" }}>
                      {fmtEffect(e)}
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
                  return <div style={{ padding: "2px 0" }}>{ing?.icon} <b>{ing?.name}</b> ({ing?.role}) — {ing?.note}</div>;
                }}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
