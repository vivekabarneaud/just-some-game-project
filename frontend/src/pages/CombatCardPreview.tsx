import { createSignal, For } from "solid-js";
import { createStore } from "solid-js/store";
import type { CombatantSnapshot } from "@medieval-realm/shared/data/combat";
import { buildRecruitFromPremadeId, getPortraitUrl } from "@medieval-realm/shared/data/adventurers";
import CombatantCard, { DEFAULT_SLOTS, type CardSlots } from "~/components/CombatantCard";

/** TEMP dev page (/dev-combat-card) to eyeball & tune the combat card against the
 *  hand-drawn frame. Live slot editor — adjust the sliders, copy the JSON, hand
 *  it back. Remove after the layout is dialed in. */

// [group, field, min, max] — the slot numbers exposed as sliders.
const FIELDS: [keyof CardSlots, string, number, number][] = [
  ["portrait", "cx", 0, 100], ["portrait", "cy", 0, 100], ["portrait", "d", 0, 120],
  ["level", "cx", 0, 100], ["level", "cy", 0, 100], ["level", "d", 0, 30],
  ["glyph", "cx", 0, 100], ["glyph", "cy", 0, 100],
  ["name", "l", 0, 100], ["name", "t", -20, 60], ["name", "w", 0, 100], ["name", "h", 0, 60],
  ["hp", "l", 0, 100], ["hp", "t", 0, 100], ["hp", "w", 0, 100], ["hp", "h", 0, 40], ["hp", "bevel", 0, 40],
  ["status", "l", 0, 100], ["status", "slotW", 0, 30], ["status", "gap", 0, 20], ["status", "top", 0, 100], ["status", "h", 0, 60],
];

export default function CombatCardPreview() {
  const [hpPct, setHpPct] = createSignal(70);
  const [width, setWidth] = createSignal(170);
  const [editWidth, setEditWidth] = createSignal(360); // bigger while tuning
  const [acting, setActing] = createSignal(false);
  const [fleeing, setFleeing] = createSignal(false);
  const [slots, setSlots] = createStore<CardSlots>(structuredClone(DEFAULT_SLOTS));

  const brenna = buildRecruitFromPremadeId("prev_brenna", "char_000", 1);
  const ally: CombatantSnapshot = {
    id: "a1", name: brenna?.name ?? "Brenna Thornwood", icon: "🏹",
    side: "ally", kind: "adventurer", class: "archer", level: 4,
    hp: 40, maxHp: 40, portrait: brenna ? getPortraitUrl(brenna) : undefined,
  };
  const enemy: CombatantSnapshot = {
    id: "e1", name: "Starving Wolf 1", icon: "🐺", side: "enemy", kind: "enemy", hp: 20, maxHp: 20,
  };
  const statuses = [
    { icon: "🩸", label: "bleeding" }, { icon: "☠️", label: "poisoned" }, { icon: "❄️", label: "slowed" },
  ];

  const numFmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));
  const json = () => JSON.stringify(slots, null, 2);

  return (
    <div style={{ padding: "20px", "min-height": "100vh", background: "var(--bg-primary)", color: "var(--text-secondary)" }}>
      <h1 style={{ "font-family": "var(--font-heading)", color: "var(--accent-gold)", margin: "0 0 12px" }}>Combat Card — tuning</h1>

      <div style={{ display: "flex", gap: "24px", "flex-wrap": "wrap" }}>
        {/* Slot editor */}
        <div style={{ flex: "1 1 340px", "min-width": "320px" }}>
          <div style={{ display: "flex", gap: "16px", "flex-wrap": "wrap", "margin-bottom": "12px" }}>
            <label>HP {hpPct()}%<input type="range" min="0" max="100" value={hpPct()} onInput={(e) => setHpPct(+e.currentTarget.value)} /></label>
            <label>Stage width {width()}px<input type="range" min="120" max="360" value={width()} onInput={(e) => setWidth(+e.currentTarget.value)} /></label>
            <label>Tuning width {editWidth()}px<input type="range" min="200" max="560" value={editWidth()} onInput={(e) => setEditWidth(+e.currentTarget.value)} /></label>
            <label><input type="checkbox" checked={acting()} onChange={(e) => setActing(e.currentTarget.checked)} /> lunge</label>
            <label><input type="checkbox" checked={fleeing()} onChange={(e) => setFleeing(e.currentTarget.checked)} /> fleeing</label>
          </div>

          <div style={{ display: "grid", "grid-template-columns": "auto 1fr auto", gap: "3px 10px", "align-items": "center", "font-size": "0.8rem" }}>
            <For each={FIELDS}>
              {([group, field, min, max]) => (
                <>
                  <span style={{ "text-align": "right", color: "var(--text-muted)" }}>{group}.{field}</span>
                  <input
                    type="range" min={min} max={max} step="0.5"
                    value={(slots[group] as any)[field]}
                    onInput={(e) => setSlots(group as any, field as any, +e.currentTarget.value)}
                  />
                  <span style={{ "min-width": "34px", color: "var(--accent-gold)" }}>{numFmt((slots[group] as any)[field])}</span>
                </>
              )}
            </For>
          </div>

          <div style={{ "margin-top": "12px" }}>
            <button class="btn-secondary" onClick={() => navigator.clipboard?.writeText(json())} style={{ "font-size": "0.8rem" }}>Copy JSON</button>
            <button class="btn-tertiary" onClick={() => setSlots(structuredClone(DEFAULT_SLOTS))} style={{ "font-size": "0.8rem", "margin-left": "8px" }}>Reset</button>
            <pre style={{ background: "var(--bg-card)", padding: "10px", "font-size": "0.72rem", "margin-top": "8px", "max-height": "180px", overflow: "auto" }}>{json()}</pre>
          </div>
        </div>

        {/* Live cards — big tuning card + a stage-size row */}
        <div style={{ flex: "1 1 400px" }}>
          <div style={{ "margin-bottom": "6px", color: "var(--text-muted)", "font-size": "0.8rem" }}>Tuning size ({editWidth()}px)</div>
          <div style={{ display: "flex", gap: "40px", "margin-bottom": "24px", "align-items": "flex-start", "justify-content": "space-between" }}>
            <CombatantCard snapshot={ally} hp={(hpPct() / 100) * ally.maxHp} statuses={statuses} acting={acting()} fleeing={fleeing()} width={editWidth()} slots={slots} />
            <CombatantCard snapshot={enemy} hp={(hpPct() / 100) * enemy.maxHp} statuses={statuses} acting={acting()} width={editWidth()} slots={slots} />
          </div>

          <div style={{ "margin-bottom": "6px", color: "var(--text-muted)", "font-size": "0.8rem" }}>Stage size ({width()}px)</div>
          <div style={{ display: "flex", "justify-content": "space-between", gap: "24px" }}>
            <div style={{ display: "flex", "flex-direction": "column", gap: "10px" }}>
              <CombatantCard snapshot={ally} hp={(hpPct() / 100) * ally.maxHp} statuses={statuses} acting={acting()} fleeing={fleeing()} width={width()} slots={slots} />
              <CombatantCard snapshot={{ id: "w", name: "Outer Wall", icon: "🧱", side: "ally", kind: "entity", hp: 100, maxHp: 100 }} hp={80} width={width()} slots={slots} />
            </div>
            <div style={{ display: "flex", "flex-direction": "column", gap: "10px", "align-items": "flex-end" }}>
              <CombatantCard snapshot={enemy} hp={(hpPct() / 100) * enemy.maxHp} statuses={[{ icon: "🩸" }]} width={width()} slots={slots} />
              <CombatantCard snapshot={{ ...enemy, id: "e3", name: "Gaunt Wolf 3" }} hp={0} fallen width={width()} slots={slots} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
