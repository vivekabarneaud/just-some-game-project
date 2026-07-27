import { createMemo, createEffect, createSignal, onCleanup, untrack, For } from "solid-js";
import type { CombatantSnapshot, CombatLogEntry } from "@medieval-realm/shared/data/combat";
import CombatantCard, { type CombatStatus } from "./CombatantCard";
import { statusLabel } from "./CombatLog";

/**
 * Battlefield stage (positional): places each CombatantCard by its live X on a
 * horizontal field (allies advance from the left, enemies from the right) and
 * slides them as the fight progresses. Positions come from the sim's per-round
 * `positions` log; HP / statuses / acting / fallen replay from the id-stamped
 * combat log exactly like CombatStage. Same-X units on a side fan out vertically
 * (the "pool" for a swarm). Used when a fight carries positions; CombatStage
 * (two columns) remains the fallback for position-less fights (e.g. raids).
 */

const FIELD_PACES = 100;          // x axis domain
const EDGE_PCT = 7;               // horizontal padding so edge cards stay on-field
const CARD_ASPECT = 422 / 992;
// How long a unit slides to a new pace (the `left` transition). A charge's gore
// lunge is delayed to fire just as the slide lands, so the two never overlap —
// derive the delay from this so they can't drift apart.
const SLIDE_SEC = 0.5;
const CHARGE_LUNGE_DELAY_SEC = SLIDE_SEC - 0.05; // jab lands right as the rush arrives

const RANGED_CLASSES = new Set(["archer", "wizard", "priest"]);
const isRangedSnap = (c: CombatantSnapshot) =>
  c.class ? RANGED_CLASSES.has(c.class) : c.combatRole === "back"; // enemies: authored row

export default function CombatBattlefield(props: {
  roster: CombatantSnapshot[];
  log: CombatLogEntry[];
  positions: Record<string, number>[];
  shownCount: number;
  maxHeight?: number;
}) {
  const revealed = () => props.log.slice(0, props.shownCount);
  const H = () => props.maxHeight ?? 320;

  // ── Live HP / statuses / fallen / fled, replayed from the revealed log ──
  const derived = createMemo(() => {
    const hp = new Map<string, number>();
    const fallen = new Set<string>();
    const fled = new Set<string>();
    const statuses = new Map<string, Map<string, CombatStatus>>();
    for (const c of props.roster) hp.set(c.id, c.hp);
    const setHp = (id: string | undefined, v: number | undefined) => { if (id != null && v != null) hp.set(id, v); };
    for (const e of revealed()) {
      setHp(e.targetId, e.targetHp);
      if (e.targets) for (const t of e.targets) setHp(t.id, t.hp);
      if (e.killed && e.targetId) { fallen.add(e.targetId); hp.set(e.targetId, 0); }
      if (e.targets) for (const t of e.targets) if (t.killed && t.id) { fallen.add(t.id); hp.set(t.id, 0); }
      if (e.beat === "flee_success" && e.attackerId) fled.add(e.attackerId);
      if (e.statusApplied && e.targetId && !e.statusApplied.type.startsWith("buff:")) {
        const m = statuses.get(e.targetId) ?? new Map<string, CombatStatus>();
        const lbl = statusLabel(e.statusApplied.type);
        m.set(e.statusApplied.type, { icon: lbl.icon, label: lbl.text });
        statuses.set(e.targetId, m);
      }
    }
    return { hp, fallen, fled, statuses };
  });

  const actingId = () => {
    const last = revealed()[revealed().length - 1];
    return last && !last.isPoisonTick && !last.beat ? last.attackerId : undefined;
  };

  // Positions fold from the START layout (positions[0]): each revealed entry may
  // carry `moves` (a unit's new pace — a move, charge, or knockback), applied in
  // order. So a unit slides on its OWN turn as its line reveals, instead of the
  // whole army snapping at round start.
  const posNow = () => {
    const pos: Record<string, number> = { ...(props.positions[0] ?? {}) };
    for (const e of revealed()) {
      if (e.moves) for (const m of e.moves) pos[m.id] = m.x;
    }
    return pos;
  };
  const xOf = (c: CombatantSnapshot) => posNow()[c.id] ?? c.x ?? (c.side === "ally" ? 25 : 75);

  // ── Fixed formation rows (assigned once, never re-stacked) ──
  // Top → bottom: ally ranged (outer) · ally melee · [clash] · enemy melee · enemy
  // ranged (outer). Melee meet in the vertical middle; ranged fire from the edges.
  const rows = createMemo(() => {
    const allies = props.roster.filter((r) => r.side === "ally");
    const enemies = props.roster.filter((r) => r.side === "enemy");
    const order = [
      ...allies.filter(isRangedSnap), ...allies.filter((c) => !isRangedSnap(c)),
      ...enemies.filter((c) => !isRangedSnap(c)), ...enemies.filter(isRangedSnap),
    ];
    const m = new Map<string, number>();
    order.forEach((c, i) => m.set(c.id, i));
    return { m, count: Math.max(order.length, 1) };
  });

  // Size cards to fit one row each within the field height.
  const cardW = () => {
    const gap = 6;
    const rowH = (H() - gap) / rows().count - gap;
    return Math.max(72, Math.min(150, rowH / CARD_ASPECT));
  };
  const rowStep = () => cardW() * CARD_ASPECT + 6;

  const leftPct = (c: CombatantSnapshot) => EDGE_PCT + (xOf(c) / FIELD_PACES) * (100 - 2 * EDGE_PCT);
  const topPx = (c: CombatantSnapshot) => 6 + (rows().m.get(c.id) ?? 0) * rowStep();

  // Directional lunge: on top of the horizontal jab, add a vertical nudge toward
  // the target's row so the attacker visibly leans at whom it's hitting.
  const lungeYOf = (c: CombatantSnapshot): number => {
    if (actingId() !== c.id) return 0;
    const tid = revealed()[revealed().length - 1]?.targetId;
    if (!tid || tid === c.id) return 0;
    const dr = (rows().m.get(tid) ?? 0) - (rows().m.get(c.id) ?? 0);
    return Math.max(-30, Math.min(30, dr * 10)); // reach further when the target is rows away
  };

  // When the acting unit ALSO slid on this same entry (a charge), delay its lunge
  // until the slide (0.5s `left` transition) has landed — so it reads "arrive,
  // THEN gore" instead of striking mid-slide (which looked like a jump).
  const actDelayOf = (c: CombatantSnapshot): number => {
    if (actingId() !== c.id) return 0;
    const last = revealed()[revealed().length - 1];
    return last?.moves?.some((m) => m.id === c.id) ? CHARGE_LUNGE_DELAY_SEC : 0;
  };

  const cardFallen = (c: CombatantSnapshot) => derived().fallen.has(c.id) || (derived().hp.get(c.id) ?? c.hp) <= 0;

  // ── Floating combat text (WoW-style pops that rise + fade over a combatant) ──
  // Both sides, all events. Damage SIZE reflects the weapon-roll quality
  // (rollFactor, normalized per weapon) with crit stacking extra size + gold.
  type Floater = { key: number; xPct: number; yPx: number; text: string; color: string; sizeRem: number };
  const [floaters, setFloaters] = createSignal<Floater[]>([]);
  let floaterKey = 0;
  const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
  onCleanup(() => pendingTimeouts.forEach(clearTimeout));

  const damageSizeRem = (rollFactor: number | undefined, crit: boolean) => {
    const t = rollFactor ?? 0.5;      // undefined (magic/no-range) → mid size
    let rem = 0.85 + t * 0.65;        // low roll ~0.85rem → high roll ~1.5rem
    if (crit) rem *= 1.4;             // crit emphasis on top
    return rem;
  };

  const spawnFloaters = (e: CombatLogEntry) => {
    const batch: Floater[] = [];
    const push = (targetId: string | undefined, text: string, color: string, sizeRem: number, stack = 0) => {
      if (!targetId) return;
      const c = props.roster.find((r) => r.id === targetId);
      if (!c) return;
      batch.push({ key: floaterKey++, xPct: leftPct(c), yPx: topPx(c) + stack * 15, text, color, sizeRem });
    };
    // Rout / flee — the unit breaks off the fight (enemy routs, ally retreats).
    if (e.beat === "flee_success" || e.beat === "broken") {
      push(e.attackerId, e.isEnemy ? "Routs!" : "Flees!", "#fb923c", 1.05);
    }
    // Primary target: avoid → damage.
    else if (e.dodged) push(e.targetId, e.parried ? "Parry" : "Dodge", "#cbd5e1", 1.0);
    else if (e.damage > 0) push(e.targetId, `−${e.damage}`, e.crit ? "#fbbf24" : "#f87171", damageSizeRem(e.rollFactor, e.crit));
    // Heal + status can co-occur with damage (an ability that hits AND poisons).
    if (e.healed && e.healAmount) push(e.targetId, `+${e.healAmount}`, "#4ade80", 1.05, 1);
    if (e.statusApplied && !e.statusApplied.type.startsWith("buff:")) {
      const s = statusLabel(e.statusApplied.type);
      push(e.targetId, `${s.icon} ${s.text}`, "#c084fc", 0.85, 2);
    }
    // AoE casualties get their own damage pop.
    if (e.targets) for (const t of e.targets) {
      if (t.damage > 0) push(t.id, `−${t.damage}`, e.crit ? "#fbbf24" : "#f87171", damageSizeRem(e.rollFactor, e.crit));
    }
    if (!batch.length) return;
    setFloaters((f) => [...f, ...batch]);
    const keys = new Set(batch.map((b) => b.key));
    pendingTimeouts.push(setTimeout(() => setFloaters((f) => f.filter((x) => !keys.has(x.key))), 900));
  };

  // Spawn on each single-step reveal (skip/jump → no floater spam).
  let prevCount = props.shownCount;
  createEffect(() => {
    const c = props.shownCount;
    if (c === prevCount + 1) {
      const e = props.log[c - 1];
      if (e) untrack(() => spawnFloaters(e));
    }
    prevCount = c;
  });

  return (
    <div style={{ position: "relative", height: `${H()}px`, overflow: "hidden" }}>
      <style>{`@keyframes floatUp {
        0%   { opacity: 0; transform: translate(-50%, 2px) scale(0.8); }
        15%  { opacity: 1; transform: translate(-50%, -6px) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -46px) scale(1); }
      }`}</style>
      <For each={floaters()}>
        {(f) => (
          <div style={{
            position: "absolute",
            left: `${f.xPct}%`, top: `${f.yPx}px`,
            "font-size": `${f.sizeRem}rem`, "font-weight": "bold",
            color: f.color, "text-shadow": "0 1px 3px rgba(0,0,0,0.9)",
            "white-space": "nowrap", "pointer-events": "none", "z-index": "5",
            animation: "floatUp 0.9s ease-out forwards",
          }}>{f.text}</div>
        )}
      </For>
      <For each={props.roster}>
        {(c) => (
          <div style={{
            position: "absolute",
            left: `${leftPct(c)}%`, top: `${topPx(c)}px`,
            transform: "translateX(-50%)",
            transition: `left ${SLIDE_SEC}s ease`,
          }}>
            <CombatantCard
              snapshot={c}
              hp={derived().hp.get(c.id) ?? c.hp}
              statuses={cardFallen(c) ? [] : Array.from(derived().statuses.get(c.id)?.values() ?? [])}
              acting={actingId() === c.id}
              actKey={props.shownCount}
              lungeY={lungeYOf(c)}
              actDelay={actDelayOf(c)}
              fleeing={derived().fled.has(c.id)}
              fallen={cardFallen(c)}
              width={cardW()}
            />
          </div>
        )}
      </For>
    </div>
  );
}
