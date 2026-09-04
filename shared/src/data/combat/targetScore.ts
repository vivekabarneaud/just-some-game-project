// ─── Target scoring: the dimensions a creature weighs ───────────────────────
// See docs/design/combat/TARGETING.md. Replaces seven single-mode labels with
// a weighted sum, so a creature's taste is authored rather than named.
//
//   score(t) = ( BASE + rolePull(t) + Σ wᵢ·dᵢ(t) ) × reach(t)
//
// EVERY dimension returns 0..1 and all magnitude lives in the weight. That is
// not cosmetic: the old scoredPick mixed a 0..100 softness term with a 0..20
// wounded term, so softness silently dominated 5:1 and "squishiest" was the
// de-facto default for every enemy on the threat path.
//
// Additive terms, ONE multiplier. Additive because multiplying lets any zero
// zero the target — a healer-weighted mage would score a warrior at 0 and then
// never attack anyone when no healer is on the field. Reach is the exception
// because it is a CAPABILITY, not a taste.

import type { CombatUnit } from "./types.js";
import { getDefenseReduction, getMagicResistReduction, dealsMagicalDamage, getAvoidance } from "./stats.js";
import { getThreat } from "./threat.js";
import { paceGap, mobilityOf } from "./positional.js";

/** What a target DOES, for the role pull. Derived from class, so an enemy
 *  authors intent ("hunts healers") rather than a class name. */
export type TargetRole = "healer" | "caster" | "ranged" | "frontline" | "skirmisher";

export function roleOf(u: CombatUnit): TargetRole {
  switch (u.class) {
    case "priest": return "healer";
    case "wizard": return "caster";
    case "archer": return "ranged";
    case "assassin": return "skirmisher";
    default: return "frontline";
  }
}

/** A creature's taste in targets. Everything optional — author only what makes
 *  this creature distinct, exactly like the `ai` knobs. */
export interface TargetWeights {
  /** Per-role pull. Values are contributions on the same 0..1 scale as the
   *  other weights, so `{ healer: 1, caster: 0.8 }` is the old `backline`
   *  (priest first, wizard second) expressed as a ranking rather than a
   *  hardcoded cascade. Omitted roles contribute nothing. */
  roles?: Partial<Record<TargetRole, number>>;
  /** Wounded, and lightly: slowed / stat-debuffed. "Finish the hurt one." */
  condition?: number;
  /** Cut off from their own line. "Take the straggler." */
  isolation?: number;
  /** Armour/resist AND how hittable — who I can actually land on. */
  softness?: number;
  /** What they have done to me. Normalised against my angriest candidate. */
  threat?: number;
  /** How many packmates already committed to them. The pack instinct. */
  ganged?: number;
  /** Commitment to whoever I hit last. Small by design — a nudge against
   *  flip-flop, not a lock, so a genuinely better target still peels me off.
   *  The engine already learned this lesson in moveUnit, which commits its
   *  breakthrough intent ONCE to stop exactly this jitter. */
  sticky?: number;
}

/** Present in every score, so the reach multiplier always differentiates. With
 *  no weights authored at all, score = BASE × reach — i.e. "hit the closest
 *  thing I can get to", which is what `nearest` used to be. It falls out of the
 *  creature's legs instead of being labelled.
 *
 *  CALIBRATION (measured while implementing): BASE sets how much a weight of 1
 *  is actually worth, since the taste range is (BASE + Σw) / BASE. At BASE = 1 a
 *  weight of 1 buys only a 2:1 preference while reachFactor spans up to 7:1 —
 *  distance would overwhelm every taste and the dimensions would be decorative.
 *  At 0.25 a weight of 1 buys 5:1, which reads as a real preference that a long
 *  walk can still override. Keep authored weights near 0..1 and let this
 *  constant carry the calibration. */
export const BASE = 0.25;

/** How far another unit still counts as "beside you" for the isolation read.
 *  The ally line normally spans ~14 paces, so this is roughly "in your
 *  formation" — drift further and an opportunist notices. */
export const SUPPORT_RADIUS = 12;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Furthest this unit's weapons can strike (0 when it has no bands authored —
 *  band-less units are treated as melee by the reach read). */
function bandMax(u: CombatUnit): number {
  if (!u.weapons?.length) return 5;
  return u.weapons.reduce((m, w) => Math.max(m, w.maxRange), 0);
}

/**
 * The one multiplier: how much this target's distance discounts my interest.
 * 1 when they are already inside my weapon band, falling off by how many turns
 * of MY movement it would take to get them there.
 *
 * BAND-aware, not contact-aware. A back-row shooter's bow covers the whole
 * field, so for it everyone is zero turns away and this returns ~1 for all —
 * computing turns-to-CONTACT instead would make a ranged creature believe every
 * target was distant.
 *
 * This is the best property in the design: the same weights make a fast thing
 * hunt the backline and a slow thing take what is in front of it, with nothing
 * authored. Greyfang at mobility 36 is one turn from the caster; a shambling
 * skeleton is five, so the damping sinks the caster below the nearest body.
 */
export function reachFactor(attacker: CombatUnit, target: CombatUnit): number {
  const gap = paceGap(attacker, target);
  const reachable = bandMax(attacker);
  if (gap <= reachable) return 1;
  const turns = (gap - reachable) / Math.max(1, mobilityOf(attacker));
  return 1 / (1 + turns * REACH_FALLOFF);
}

/** How sharply distance discounts interest. At 0.5 a target one turn away is
 *  worth 0.67, two turns 0.5, six turns 0.25 — gentle enough that a strong
 *  preference can pay for a short walk, steep enough that the far side of the
 *  field loses to what is in front of you. */
export const REACH_FALLOFF = 0.5;

// ── The scored dimensions, every one 0..1 ──────────────────────────────────

export function conditionOf(t: CombatUnit): number {
  const wounded = t.maxHp > 0 ? 1 - t.hp / t.maxHp : 0;
  const hampered = (t.slowed ?? 0) > 0 || (t.statDebuffs?.length ?? 0) > 0 ? 1 : 0;
  return clamp01(wounded * 0.8 + hampered * 0.2);
}

/** 1 alone · 0.5 with one ally beside them · 0.33 with two.
 *  Counts from the WHOLE line, not just the attacker's reachable subset — an
 *  ally standing guard is support whether or not I can reach them. */
export function isolationOf(t: CombatUnit, line: CombatUnit[]): number {
  const supporters = line.filter((a) => a.id !== t.id && a.hp > 0 && !a.fled && paceGap(a, t) <= SUPPORT_RADIUS).length;
  return 1 / (1 + supporters);
}

/** How much damage actually arrives: through their armour/resist, and past
 *  their dodge/parry. A plated, parrying tank scores far below the cloth-wearer
 *  behind it — the counterplay is defensive (armour, and body-blocking so the
 *  soft one is not reachable). */
export function softnessOf(attacker: CombatUnit, t: CombatUnit): number {
  const through = 1 - (dealsMagicalDamage(attacker) ? getMagicResistReduction(t) : getDefenseReduction(t));
  const lands = 1 - getAvoidance(attacker, t).chance / 100;
  return clamp01(through * lands);
}

/** Threat is unbounded (it accumulates and decays ×0.9/round), so it normalises
 *  against the attacker's OWN angriest candidate: their max reads 1. */
export function threatOf(attacker: CombatUnit, t: CombatUnit, pool: CombatUnit[]): number {
  if (!attacker.isEnemy || !attacker.threatTable) return 0;
  let max = 0;
  for (const c of pool) max = Math.max(max, getThreat(attacker, c.id));
  if (max <= 0) return 0;
  return clamp01(getThreat(attacker, t.id) / max);
}

/** Fraction of my living packmates already committed to this target. */
export function gangedOf(attacker: CombatUnit, t: CombatUnit, allies?: CombatUnit[]): number {
  const mates = (allies ?? []).filter((m) => m.id !== attacker.id && m.hp > 0 && !m.fled);
  if (mates.length === 0) return 0;
  const on = mates.filter((m) => m.lastTargetId === t.id).length;
  return clamp01(on / mates.length);
}

/**
 * The whole score for one candidate. `line` is the target's own side (for the
 * isolation read); `allies` is the attacker's side (for the pack read).
 */
export function scoreTarget(
  attacker: CombatUnit,
  t: CombatUnit,
  w: TargetWeights,
  ctx: { line: CombatUnit[]; allies?: CombatUnit[]; pool: CombatUnit[] },
): number {
  let sum = BASE;
  if (w.roles) sum += w.roles[roleOf(t)] ?? 0;
  if (w.condition) sum += w.condition * conditionOf(t);
  if (w.isolation) sum += w.isolation * isolationOf(t, ctx.line);
  if (w.softness) sum += w.softness * softnessOf(attacker, t);
  if (w.threat) sum += w.threat * threatOf(attacker, t, ctx.pool);
  if (w.ganged) sum += w.ganged * gangedOf(attacker, t, ctx.allies);
  if (w.sticky && attacker.lastTargetId === t.id) sum += w.sticky;
  return sum * reachFactor(attacker, t);
}
