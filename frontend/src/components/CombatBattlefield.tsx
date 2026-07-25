import { createMemo, For } from "solid-js";
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

  // Current round = the last revealed entry's round; positions[round] holds the
  // post-move layout for it (index 0 = start, clamped to what we recorded).
  const roundNow = () => revealed()[revealed().length - 1]?.round ?? 0;
  const posNow = () => props.positions[Math.min(roundNow(), props.positions.length - 1)] ?? props.positions[0] ?? {};
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
    return Math.max(-14, Math.min(14, dr * 6));
  };

  const cardFallen = (c: CombatantSnapshot) => derived().fallen.has(c.id) || (derived().hp.get(c.id) ?? c.hp) <= 0;

  return (
    <div style={{ position: "relative", height: `${H()}px`, overflow: "hidden" }}>
      <For each={props.roster}>
        {(c) => (
          <div style={{
            position: "absolute",
            left: `${leftPct(c)}%`, top: `${topPx(c)}px`,
            transform: "translateX(-50%)",
            transition: "left 0.5s ease",
          }}>
            <CombatantCard
              snapshot={c}
              hp={derived().hp.get(c.id) ?? c.hp}
              statuses={cardFallen(c) ? [] : Array.from(derived().statuses.get(c.id)?.values() ?? [])}
              acting={actingId() === c.id}
              actKey={props.shownCount}
              lungeY={lungeYOf(c)}
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
