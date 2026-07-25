// ─── 1D Positional Combat — SANDBOX (prototype, not production) ──────────────
// A tiny, self-contained, deterministic positional sim to tune the MODEL and
// NUMBERS before touching the real engine (see docs/DESIGN_POSITIONAL_COMBAT.md).
// Runs headless; a harness dumps traces. Throwaway/iterate freely.

export type Side = "ally" | "enemy";
export type AiTier = "feral" | "tactical" | "cunning";
export type Role = "melee" | "ranged";

export interface PUnit {
  id: string;
  name: string;
  side: Side;
  role: Role;
  hp: number;
  maxHp: number;
  dmg: number;        // damage per hit
  reach: number;      // attack range in X units (melee small, ranged large)
  mobility: number;   // max move per turn
  threatMul: number;  // aggro generated per point of damage
  aiTier: AiTier;
  bypass: boolean;    // can slip past the enemy front to the backline
  x: number;          // position (set at init)
  threat: number;     // accumulated aggro proxy
  fallen: boolean;
}

export interface PTune {
  fieldMin: number; fieldMax: number; // hard edges — you cannot kite off the map
  allyFrontX: number;  allyBackX: number;
  enemyFrontX: number; enemyBackX: number;
  contact: number;     // melee contact distance
  exposureMult: number;// ranged damage mult when pressured (melee foe in contact at turn start)
  holdPer: number;     // how many attackers ONE frontliner pins; the rest overflow
  maxRounds: number;
}

export const DEFAULT_TUNE: PTune = {
  fieldMin: 0, fieldMax: 100,
  allyFrontX: 32, allyBackX: 18,
  enemyFrontX: 68, enemyBackX: 82,
  contact: 5,
  exposureMult: 0.45,
  holdPer: 1,
  maxRounds: 30,
};

const alive = (us: PUnit[]) => us.filter((u) => !u.fallen && u.hp > 0);
const nearest = (u: PUnit, pool: PUnit[]) =>
  pool.slice().sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
// "Deeper" = further into the enemy's own back territory (where casters sit).
const backlineScore = (e: PUnit, u: PUnit) => (u.side === "ally" ? e.x : -e.x);

function place(units: PUnit[], t: PTune) {
  for (const u of units) {
    u.x = u.side === "ally"
      ? (u.role === "melee" ? t.allyFrontX : t.allyBackX)
      : (u.role === "melee" ? t.enemyFrontX : t.enemyBackX);
    u.threat = 0; u.fallen = false;
  }
}

// Which advancing melee are HELD by the opposing front this round (capacity =
// holders × holdPer, frontmost attackers held first; overflow + bypass pass).
function computeHolds(units: PUnit[], t: PTune): Set<string> {
  const held = new Set<string>();
  for (const side of ["ally", "enemy"] as Side[]) {
    const attackers = alive(units).filter((u) => u.side === side && u.role === "melee" && !u.bypass);
    const holders = alive(units).filter((u) => u.side !== side && u.role === "melee");
    const capacity = holders.length * t.holdPer;
    // frontmost (closest to center) held first
    attackers.sort((a, b) => (side === "ally" ? b.x - a.x : a.x - b.x));
    attackers.forEach((a, i) => { if (i < capacity) held.add(a.id); });
  }
  return held;
}

function pickTarget(u: PUnit, enemies: PUnit[], held: boolean): PUnit {
  if (u.aiTier === "feral") return nearest(u, enemies);
  const deepest = () => enemies.slice().sort((a, b) => backlineScore(b, u) - backlineScore(a, u) || b.threat - a.threat)[0];
  // Overflow melee (unheld), bypassers, and cunning units push PAST the front to
  // the backline. Held melee fight what's pinning them (the nearest/tank).
  if (u.bypass || u.aiTier === "cunning" || (u.role === "melee" && !held)) return deepest();
  if (u.role === "melee") return nearest(u, enemies);
  // tactical ranged: highest threat on the field.
  return enemies.slice().sort((a, b) => b.threat - a.threat || Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
}

const clampField = (x: number, t: PTune) => Math.max(t.fieldMin, Math.min(t.fieldMax, x));

function move(u: PUnit, target: PUnit, units: PUnit[], held: Set<string>, t: PTune) {
  const foes = alive(units).filter((x) => x.side !== u.side);
  if (u.role === "ranged") {
    // kite: back off if a melee foe is (nearly) in contact — but the field edge
    // is a wall, so you eventually get pinned.
    const pressed = foes.some((e) => e.role === "melee" && Math.abs(e.x - u.x) <= t.contact * 1.4);
    if (pressed) {
      const dir = u.side === "ally" ? -1 : 1;
      u.x = clampField(u.x + dir * u.mobility, t);
    }
    return;
  }
  // melee: advance toward target, stopped at the enemy front only if HELD.
  const dir = target.x > u.x ? 1 : -1;
  let destX = u.x + dir * u.mobility;
  if (held.has(u.id)) {
    const front = nearest(u, foes.filter((e) => e.role === "melee"));
    if (front) {
      const stopX = front.x - dir * t.contact;
      destX = dir > 0 ? Math.min(destX, stopX) : Math.max(destX, stopX);
    }
  }
  destX = dir > 0 ? Math.min(destX, target.x) : Math.max(destX, target.x); // don't overshoot
  u.x = clampField(destX, t);
}

export interface PResult {
  rounds: number;
  winner: Side | "draw";
  log: string[];
  survivors: { name: string; hp: number; maxHp: number; x: number }[];
}

export function runPositional(units: PUnit[], t: PTune = DEFAULT_TUNE): PResult {
  place(units, t);
  const log: string[] = [];
  let round = 0;
  while (round < t.maxRounds && alive(units).some((u) => u.side === "ally") && alive(units).some((u) => u.side === "enemy")) {
    round++;
    const held = computeHolds(units, t);
    // initiative: faster units act first
    const order = alive(units).sort((a, b) => b.mobility - a.mobility);
    for (const u of order) {
      if (u.fallen || u.hp <= 0) continue;
      const foes = alive(units).filter((x) => x.side !== u.side);
      if (!foes.length) break;
      // Exposure is judged at the START of the turn: if a melee foe is on you
      // now, your shot is rushed even if you scramble back before firing.
      const exposed = u.role === "ranged" && foes.some((e) => e.role === "melee" && Math.abs(e.x - u.x) <= t.contact);
      const target = pickTarget(u, foes, held.has(u.id));
      move(u, target, units, held, t);
      const dist = Math.abs(u.x - target.x);
      if (dist <= u.reach + 1e-6) {
        let dmg = u.dmg;
        if (exposed) dmg *= t.exposureMult;
        target.hp -= dmg;
        u.threat += dmg * u.threatMul;
        log.push(`r${round} ${u.name}@${u.x.toFixed(0)} → ${target.name}@${target.x.toFixed(0)} (Δ${dist.toFixed(0)}) ${dmg.toFixed(1)}dmg → ${Math.max(0, target.hp).toFixed(0)}/${target.maxHp}${exposed ? " [EXPOSED]" : ""}`);
        if (target.hp <= 0) { target.fallen = true; log.push(`   ✝ ${target.name} falls`); }
      } else {
        log.push(`r${round} ${u.name}@${u.x.toFixed(0)} advances toward ${target.name}@${target.x.toFixed(0)} (Δ${dist.toFixed(0)} > reach ${u.reach})`);
      }
    }
  }
  const a = alive(units).some((u) => u.side === "ally");
  const e = alive(units).some((u) => u.side === "enemy");
  return {
    rounds: round,
    winner: a && !e ? "ally" : e && !a ? "enemy" : "draw",
    log,
    survivors: alive(units).map((u) => ({ name: u.name, hp: Math.round(u.hp), maxHp: u.maxHp, x: Math.round(u.x) })),
  };
}

// ── Unit factory (rough archetypes to tune) ──────────────────────────────────
export function unit(p: Partial<PUnit> & Pick<PUnit, "id" | "name" | "side" | "role">): PUnit {
  const ranged = p.role === "ranged";
  return {
    hp: 40, maxHp: 40, dmg: 8,
    reach: ranged ? 100 : 4,
    mobility: ranged ? 6 : 10,
    threatMul: 1, aiTier: "tactical", bypass: false,
    x: 0, threat: 0, fallen: false,
    ...p,
    maxHp: p.hp ?? 40,
  };
}
