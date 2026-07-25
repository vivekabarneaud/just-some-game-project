import { createMemo, For } from "solid-js";
import type { CombatantSnapshot, CombatLogEntry } from "@medieval-realm/shared/data/combat";
import CombatantCard, { type CombatStatus } from "./CombatantCard";
import { statusLabel } from "./CombatLog";

/**
 * The combat stage: allies in a left column, enemies in a right column, each a
 * CombatantCard whose HP / statuses / acting / fleeing / fallen state is derived
 * by replaying the revealed slice of the log (0..shownCount). Sits sticky above
 * the scrolling text log in CombatPlayback.
 *
 * Everything keys off the id-stamped log (phase 1): the last revealed line's
 * attackerId is "acting" (lunges), targetHp updates drain the bars, killed marks
 * fallen, a flee beat slides a card off. Cards scale down as the roster grows so
 * the panel always fits.
 */

const CARD_ASPECT = 422 / 992; // ART_H / ART_W

// Allies read front-to-back: heroes first, then squads, then walls/wards.
const ALLY_KIND_RANK: Record<string, number> = { adventurer: 0, ally: 1, entity: 2, enemy: 3 };

export default function CombatStage(props: {
  roster: CombatantSnapshot[];
  log: CombatLogEntry[];
  /** How many log entries have been revealed by the playback so far. */
  shownCount: number;
  /** Max height the stage may occupy (drives card scaling). Default 340. */
  maxHeight?: number;
}) {
  const revealed = () => props.log.slice(0, props.shownCount);

  const allies = () => props.roster.filter((c) => c.side === "ally")
    .slice().sort((a, b) => (ALLY_KIND_RANK[a.kind] ?? 9) - (ALLY_KIND_RANK[b.kind] ?? 9));
  const enemies = () => props.roster.filter((c) => c.side === "enemy");

  // Replay the revealed log into per-combatant live state.
  const derived = createMemo(() => {
    const hp = new Map<string, number>();
    const fallen = new Set<string>();
    const fled = new Set<string>();
    const statuses = new Map<string, Map<string, CombatStatus>>();
    for (const c of props.roster) hp.set(c.id, c.hp);

    const setHp = (id: string | undefined, v: number | undefined) => {
      if (id != null && v != null) hp.set(id, v);
    };
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
    // Poison ticks / beats aren't a combatant "acting"; only real attacks lunge.
    return last && !last.isPoisonTick && !last.beat ? last.attackerId : undefined;
  };

  const maxCount = () => Math.max(allies().length, enemies().length, 1);
  const cardWidth = () => {
    const maxH = props.maxHeight ?? 340;
    const gap = 8;
    const perCardH = (maxH - (maxCount() - 1) * gap) / maxCount();
    return Math.max(96, Math.min(180, perCardH / CARD_ASPECT));
  };

  const cardFor = (c: CombatantSnapshot) => {
    const d = derived();
    const fallen = () => d.fallen.has(c.id) || (d.hp.get(c.id) ?? c.hp) <= 0;
    return (
      <CombatantCard
        snapshot={c}
        hp={d.hp.get(c.id) ?? c.hp}
        statuses={fallen() ? [] : Array.from(d.statuses.get(c.id)?.values() ?? [])}
        acting={actingId() === c.id}
        actKey={props.shownCount}
        fleeing={d.fled.has(c.id)}
        fallen={fallen()}
        width={cardWidth()}
      />
    );
  };

  return (
    <div style={{
      display: "flex", "justify-content": "space-between", "align-items": "flex-start",
      gap: "12px", padding: "10px 4px",
    }}>
      <div style={{ display: "flex", "flex-direction": "column", gap: "8px", "align-items": "flex-start" }}>
        <For each={allies()}>{(c) => cardFor(c)}</For>
      </div>
      <div style={{ display: "flex", "flex-direction": "column", gap: "8px", "align-items": "flex-end" }}>
        <For each={enemies()}>{(c) => cardFor(c)}</For>
      </div>
    </div>
  );
}
