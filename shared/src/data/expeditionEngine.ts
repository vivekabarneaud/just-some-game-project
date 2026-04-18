// ─── Expedition Engine ─────────────────────────────────────────
// Resolves expedition events one at a time during the tick loop.
// Events mutate ActiveMission state directly (HP, rewards, log, event index).

import type {
  ActiveMission,
  ExpeditionTemplate,
  ExpeditionEvent,
  ExpeditionEventSlot,
  ResolvedExpeditionEvent,
  AdventurerMissionSupplies,
  MissionReward,
} from "./missions/index.js";
import type { Adventurer } from "./adventurers.js";
import { calcStats } from "./adventurers.js";
import { getEquipmentStats, getRecoveryEffect } from "./items.js";
import { simulateCombat } from "./combat/index.js";

/** Calculate an adventurer's max HP using the same formula as combat. */
export function calcAdventurerMaxHp(adv: Adventurer): number {
  const eq = getEquipmentStats(adv.equipment);
  const stats = calcStats(adv, eq);
  return stats.vit * 8;
}

/** Pick a specific event from an event slot (resolves random pools). */
export function resolveEventSlot(
  slot: ExpeditionEventSlot,
  rand: () => number,
): ExpeditionEvent | null {
  if (slot.type === "fixed") return slot.event ?? null;
  if (!slot.pool || slot.pool.length === 0) return null;
  // Weighted pick
  const total = slot.pool.reduce((s, p) => s + p.weight, 0);
  let r = rand() * total;
  for (const entry of slot.pool) {
    r -= entry.weight;
    if (r <= 0) return entry.event;
  }
  return slot.pool[slot.pool.length - 1].event;
}

/** Skill check: does the team beat a DC? Uses the highest stat among living adventurers. */
function skillCheck(team: Adventurer[], hpMap: Record<string, number>, stat: "dex" | "wis" | "int", dc: number): boolean {
  let best = 0;
  for (const adv of team) {
    if ((hpMap[adv.id] ?? 0) <= 0) continue; // dead advs can't help
    const eq = getEquipmentStats(adv.equipment);
    const stats = calcStats(adv, eq);
    if (stats[stat] > best) best = stats[stat];
  }
  // A d20-style check: roll 1-20 + stat vs DC
  const roll = Math.floor(Math.random() * 20) + 1 + best;
  return roll >= dc;
}

/** Between-event passive heal: natural recovery + priest passive. */
export function applyBetweenEventHeal(
  team: Adventurer[],
  hpMap: Record<string, number>,
  maxHpMap: Record<string, number>,
): void {
  const priestCount = team.filter((a) => a.class === "priest" && (hpMap[a.id] ?? 0) > 0).length;
  const healPct = 0.05 + priestCount * 0.10; // +5% base, +10% per priest

  for (const adv of team) {
    if ((hpMap[adv.id] ?? 0) <= 0) continue; // dead advs don't heal
    const maxHp = maxHpMap[adv.id] ?? calcAdventurerMaxHp(adv);
    const heal = Math.floor(maxHp * healPct);
    hpMap[adv.id] = Math.min(maxHp, (hpMap[adv.id] ?? 0) + heal);
  }
}

/** Between-event recovery item auto-consume: uses bandage/mending potion on low-HP adventurers. */
export function applyRecoveryItems(
  team: Adventurer[],
  hpMap: Record<string, number>,
  maxHpMap: Record<string, number>,
  supplies: Record<string, AdventurerMissionSupplies>,
): string[] {
  const consumed: string[] = [];
  for (const adv of team) {
    const hp = hpMap[adv.id] ?? 0;
    if (hp <= 0) continue;
    const maxHp = maxHpMap[adv.id] ?? calcAdventurerMaxHp(adv);
    if (hp >= maxHp * 0.4) continue; // only auto-use when wounded below 40%

    const sup = supplies[adv.id];
    if (!sup?.recovery) continue;
    const eff = getRecoveryEffect(sup.recovery);
    if (!eff) continue;

    const healAmount = Math.floor(maxHp * eff.healPct / 100);
    hpMap[adv.id] = Math.min(maxHp, hp + healAmount);
    consumed.push(adv.id);
    // Clear the recovery slot so it's not re-used
    supplies[adv.id] = { ...sup, recovery: undefined };
  }
  return consumed;
}

export interface EventResolutionContext {
  template: ExpeditionTemplate;
  team: Adventurer[];
  /** Mutates: HP map (advId → current HP). Dead advs stay at 0. */
  hpMap: Record<string, number>;
  /** Per-adventurer max HP (computed at deploy). */
  maxHpMap: Record<string, number>;
  /** Mutates: accumulated rewards from events. */
  rewards: MissionReward[];
  /** Mutates: log of resolved events. */
  log: ResolvedExpeditionEvent[];
  /** Per-adventurer supplies (can be mutated when items auto-consume). */
  supplies: Record<string, AdventurerMissionSupplies>;
  /** Seed for deterministic behavior across previews. */
  seed: number;
  /** Sequence index (used to derive per-event seed offsets). */
  eventIndex: number;
}

/** Resolve a single expedition event, mutating the context. */
export function resolveExpeditionEvent(
  event: ExpeditionEvent,
  ctx: EventResolutionContext,
): void {
  switch (event.kind) {
    case "combat": {
      // Run combat starting from current HP
      const combatResult = simulateCombat(
        { ...ctx.template, encounters: event.encounters } as any,
        ctx.team,
        ctx.supplies,
        ctx.seed + ctx.eventIndex * 1000,
        { encounters: event.encounters, hpOverride: ctx.hpMap, skipRecoveryHeal: true },
      );
      if (!combatResult) {
        ctx.log.push({ kind: "combat", summary: "No combat resolved", icon: "⚔️", success: false });
        return;
      }

      // Update HP map from combat result
      if (combatResult.finalHp) {
        for (const id of Object.keys(combatResult.finalHp)) {
          ctx.hpMap[id] = combatResult.finalHp[id];
        }
      }

      // Accumulate combat loot
      if (combatResult.loot?.length) {
        for (const drop of combatResult.loot) {
          if (drop.type === "resource" && drop.resource) {
            const existing = ctx.rewards.find((r) => r.resource === drop.resource);
            if (existing) existing.amount += drop.amount;
            else ctx.rewards.push({ resource: drop.resource as any, amount: drop.amount });
          }
        }
      }

      const enemyTotal = event.encounters.reduce((s, e) => s + e.count, 0);
      const defeated = enemyTotal - combatResult.survivingEnemies;
      ctx.log.push({
        kind: "combat",
        summary: combatResult.victory
          ? `Victory — defeated ${defeated} enemy${defeated === 1 ? "" : "ies"}`
          : `Defeat — ${defeated}/${enemyTotal} enemies fell before the team broke`,
        icon: combatResult.victory ? "⚔️" : "💀",
        success: combatResult.victory,
      });
      return;
    }

    case "treasure": {
      // Optional skill check to claim the treasure
      let claimed = true;
      if (event.requiresCheck) {
        claimed = skillCheck(ctx.team, ctx.hpMap, event.requiresCheck.stat, event.requiresCheck.dc);
      }
      if (claimed) {
        for (const r of event.rewards) {
          const existing = ctx.rewards.find((x) => x.resource === r.resource);
          if (existing) existing.amount += r.amount;
          else ctx.rewards.push({ ...r });
        }
        const summary = event.rewards.map((r) => `${r.amount} ${r.resource}`).join(", ");
        ctx.log.push({ kind: "treasure", summary: `Found ${summary}`, icon: "💰", success: true });
      } else {
        ctx.log.push({ kind: "treasure", summary: "A cache was spotted but couldn't be reached", icon: "💰", success: false });
      }
      return;
    }

    case "trap": {
      const avoided = skillCheck(ctx.team, ctx.hpMap, event.dcStat, event.dc);
      if (avoided) {
        ctx.log.push({ kind: "trap", summary: `Trap detected and avoided`, icon: "⚡", success: true });
      } else {
        // Damage each living adv by a % of their max HP
        for (const adv of ctx.team) {
          if ((ctx.hpMap[adv.id] ?? 0) <= 0) continue;
          const maxHp = ctx.maxHpMap[adv.id] ?? calcAdventurerMaxHp(adv);
          const dmg = Math.floor(maxHp * event.damagePct / 100);
          ctx.hpMap[adv.id] = Math.max(0, (ctx.hpMap[adv.id] ?? 0) - dmg);
        }
        ctx.log.push({ kind: "trap", summary: `Trap triggered — party wounded (${event.damagePct}% HP)`, icon: "🪤", success: false });
      }
      return;
    }

    case "encounter": {
      if (!event.outcomes.length) {
        ctx.log.push({ kind: "encounter", summary: event.text, icon: "❓", success: true });
        return;
      }
      // Weighted random outcome
      const total = event.outcomes.reduce((s, o) => s + o.weight, 0);
      let r = Math.random() * total;
      let chosen = event.outcomes[event.outcomes.length - 1];
      for (const outcome of event.outcomes) {
        r -= outcome.weight;
        if (r <= 0) { chosen = outcome; break; }
      }

      // Apply the chosen effect
      applyExpeditionEffect(chosen.effect, ctx);
      ctx.log.push({ kind: "encounter", summary: chosen.text, icon: "🗣️", success: true });
      return;
    }

    case "environment": {
      applyExpeditionEffect(event.effect, ctx);
      ctx.log.push({ kind: "environment", summary: event.text, icon: "🌧️", success: true });
      return;
    }
  }
}

function applyExpeditionEffect(
  effect: import("./missions/index.js").ExpeditionEffect,
  ctx: EventResolutionContext,
): void {
  switch (effect.type) {
    case "heal":
      for (const adv of ctx.team) {
        if ((ctx.hpMap[adv.id] ?? 0) <= 0) continue;
        const maxHp = ctx.maxHpMap[adv.id] ?? calcAdventurerMaxHp(adv);
        const amount = Math.floor(maxHp * effect.pct / 100);
        ctx.hpMap[adv.id] = Math.min(maxHp, (ctx.hpMap[adv.id] ?? 0) + amount);
      }
      return;
    case "damage":
      for (const adv of ctx.team) {
        if ((ctx.hpMap[adv.id] ?? 0) <= 0) continue;
        const maxHp = ctx.maxHpMap[adv.id] ?? calcAdventurerMaxHp(adv);
        const amount = Math.floor(maxHp * effect.pct / 100);
        ctx.hpMap[adv.id] = Math.max(0, (ctx.hpMap[adv.id] ?? 0) - amount);
      }
      return;
    case "reward":
      for (const r of effect.rewards) {
        const existing = ctx.rewards.find((x) => x.resource === r.resource);
        if (existing) existing.amount += r.amount;
        else ctx.rewards.push({ ...r });
      }
      return;
    case "nothing":
      return;
  }
}

/** Is the whole team down? */
export function isTeamWiped(team: Adventurer[], hpMap: Record<string, number>): boolean {
  return team.every((a) => (hpMap[a.id] ?? 0) <= 0);
}

/**
 * Resolve every event of an expedition in one call — used server-side to
 * simulate the full run at once rather than streaming events through a tick loop.
 *
 * Mirrors the frontend's event loop: between-event heals + recovery item
 * auto-use happen between events, and a team wipe short-circuits the rest.
 */
export function resolveFullExpedition(
  template: ExpeditionTemplate,
  team: Adventurer[],
  supplies: Record<string, AdventurerMissionSupplies>,
  seed: number,
): {
  hpMap: Record<string, number>;
  maxHpMap: Record<string, number>;
  rewards: MissionReward[];
  log: ResolvedExpeditionEvent[];
  wiped: boolean;
} {
  // Initialize HP/maxHp for each adventurer
  const hpMap: Record<string, number> = {};
  const maxHpMap: Record<string, number> = {};
  for (const adv of team) {
    const maxHp = calcAdventurerMaxHp(adv);
    maxHpMap[adv.id] = maxHp;
    hpMap[adv.id] = maxHp;
  }

  const rewards: MissionReward[] = [];
  const log: ResolvedExpeditionEvent[] = [];
  const workingSupplies = JSON.parse(JSON.stringify(supplies ?? {}));

  // Resolve the event slots into concrete events using the seed
  const rand = createSeededRand(seed);
  const events: ExpeditionEvent[] = [];
  for (const slot of template.events) {
    const ev = resolveEventSlot(slot, rand);
    if (ev) events.push(ev);
  }

  for (let eventIdx = 0; eventIdx < events.length; eventIdx++) {
    if (eventIdx > 0) {
      applyBetweenEventHeal(team, hpMap, maxHpMap);
      applyRecoveryItems(team, hpMap, maxHpMap, workingSupplies);
    }

    let eventSeed = 0;
    const seedStr = template.id + "|" + eventIdx;
    for (let j = 0; j < seedStr.length; j++) eventSeed = ((eventSeed << 5) - eventSeed + seedStr.charCodeAt(j)) | 0;

    resolveExpeditionEvent(events[eventIdx], {
      template,
      team,
      hpMap,
      maxHpMap,
      rewards,
      log,
      supplies: workingSupplies,
      seed: eventSeed,
      eventIndex: eventIdx,
    });

    if (isTeamWiped(team, hpMap)) break;
  }

  return { hpMap, maxHpMap, rewards, log, wiped: isTeamWiped(team, hpMap) };
}

function createSeededRand(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
