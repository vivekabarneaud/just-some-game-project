// ─── Positional combat BALANCE WORKBENCH ────────────────────────────────────
// The permanent sandbox for tuning the 1D positional model + (eventually) real
// encounters as gear/talents/enemies land. See docs/design/combat/POSITIONAL_COMBAT.md.
//   run : cd frontend && npx vitest run src/prototype/positional.test.ts
//   view: cat "$(node -e 'console.log(require("os").tmpdir())')/positional_sandbox.txt"
// Add scenarios below; tweak DEFAULT_TUNE / unit() stats to feel out balance.

import { describe, it, expect } from "vitest";
import { runPositional, unit, DEFAULT_TUNE, type PUnit, type PResult } from "./positionalCombat";

declare const require: (m: string) => any; // node runtime (vitest); avoids @types/node dep

const OUT = `${require("os").tmpdir()}/positional_sandbox.txt`;

function report(title: string, units: PUnit[], r: PResult): string {
  return [
    `━━━ ${title} ━━━`,
    `winner: ${r.winner.toUpperCase()}  ·  ${r.rounds} rounds`,
    `survivors: ${r.survivors.map((s) => `${s.name} ${s.hp}/${s.maxHp}@x${s.x}`).join(", ") || "none"}`,
    "trace:",
    ...r.log,
    "",
  ].join("\n");
}

describe("positional sandbox v0.1", () => {
  it("runs the canonical scenarios", () => {
    const out: string[] = [`TUNE: ${JSON.stringify(DEFAULT_TUNE)}`, ""];

    // 1) THE PROBLEM CASE: two archers, no frontline, vs five weak melee.
    {
      const u: PUnit[] = [
        unit({ id: "a1", name: "Brenna(arch)", side: "ally", role: "ranged", hp: 40, dmg: 9, meleeDmg: 6 }),
        unit({ id: "a2", name: "Gareth(arch)", side: "ally", role: "ranged", hp: 48, dmg: 9, meleeDmg: 3 }),
        ...[1, 2, 3, 4, 5].map((n) => unit({ id: `e${n}`, name: `Tough${n}`, side: "enemy", role: "melee", hp: 20, dmg: 4, aiTier: "tactical" })),
      ];
      out.push(report("1) 2 archers, NO frontline, vs 5 melee", u, runPositional(u)));
    }

    // 2) Same five, but with ONE warrior holding the line.
    {
      const u: PUnit[] = [
        unit({ id: "w", name: "Godric(war)", side: "ally", role: "melee", hp: 70, dmg: 8, threatMul: 2 }),
        unit({ id: "a1", name: "Brenna(arch)", side: "ally", role: "ranged", hp: 40, dmg: 9, meleeDmg: 6 }),
        unit({ id: "a2", name: "Gareth(arch)", side: "ally", role: "ranged", hp: 48, dmg: 9, meleeDmg: 3 }),
        ...[1, 2, 3, 4, 5].map((n) => unit({ id: `e${n}`, name: `Tough${n}`, side: "enemy", role: "melee", hp: 20, dmg: 4, aiTier: "tactical" })),
      ];
      out.push(report("2) warrior + 2 archers vs 5 melee (holdPer=1)", u, runPositional(u)));
    }

    // 3) Assassin bypass: dive the enemy casters behind their 2 melee.
    {
      const u: PUnit[] = [
        unit({ id: "w", name: "Godric(war)", side: "ally", role: "melee", hp: 70, dmg: 8, threatMul: 2 }),
        unit({ id: "as", name: "Sable(assn)", side: "ally", role: "melee", hp: 45, dmg: 12, mobility: 22, bypass: true }),
        unit({ id: "a1", name: "Brenna(arch)", side: "ally", role: "ranged", hp: 40, dmg: 9, meleeDmg: 6 }),
        unit({ id: "m1", name: "Brute1", side: "enemy", role: "melee", hp: 40, dmg: 6 }),
        unit({ id: "m2", name: "Brute2", side: "enemy", role: "melee", hp: 40, dmg: 6 }),
        unit({ id: "c1", name: "Caster1", side: "enemy", role: "ranged", hp: 22, dmg: 11, aiTier: "cunning" }),
        unit({ id: "c2", name: "Caster2", side: "enemy", role: "ranged", hp: 22, dmg: 11, aiTier: "cunning" }),
      ];
      out.push(report("3) assassin bypass vs 2 brutes + 2 casters", u, runPositional(u)));
    }

    // Best-effort dump for manual inspection; never fail the suite over it.
    try { require("fs").writeFileSync(OUT, out.join("\n")); } catch { /* ignore */ }
    expect(true).toBe(true);
  });
});
