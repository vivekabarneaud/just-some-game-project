import { createSignal, For, Show } from "solid-js";
import { simulateCombat, type CombatResult } from "@medieval-realm/shared/data/combat";
import { buildRecruitFromPremadeId, type AdventurerRank } from "@medieval-realm/shared/data/adventurers";
import { NOVICE_MISSIONS } from "@medieval-realm/shared/data/missions";
import CombatPlayback from "~/components/CombatPlayback";

/** TEMP dev page (/dev-battle) to watch the REAL combat engine on hand-picked
 *  encounters, in the actual playback stage — so we can eyeball a creature's
 *  stats + abilities (wolf pack tactics, throat tear, boar charge, rout...)
 *  without grinding a mission. Remove once the Tier-1 enemy pass is dialed in.
 *
 *  It runs simulateCombat() with an encounter override and feeds the result's
 *  log/roster/positions straight into CombatPlayback — same data path the game
 *  uses after a mission. */

type Enc = { enemyId: string; count: number };

const PRESETS: { label: string; encounters: Enc[] }[] = [
  { label: "Lone Grey Wolf", encounters: [{ enemyId: "wild_wolf", count: 1 }] },
  { label: "Grey Wolf pack ×3", encounters: [{ enemyId: "wild_wolf", count: 3 }] },
  { label: "Mixed pack (2 grey, gaunt, starving)", encounters: [
    { enemyId: "wild_wolf", count: 2 }, { enemyId: "gaunt_wolf", count: 1 }, { enemyId: "starving_wolf", count: 1 },
  ] },
  { label: "Alpha + 2 grey", encounters: [{ enemyId: "alpha_wolf", count: 1 }, { enemyId: "wild_wolf", count: 2 }] },
  { label: "— boars (for later) —", encounters: [] },
  { label: "Lone Wild Boar", encounters: [{ enemyId: "wild_boar", count: 1 }] },
  { label: "Rabid Boar ×2", encounters: [{ enemyId: "rabid_boar", count: 2 }] },
  { label: "— outlaws (morale) —", encounters: [] },
  { label: "Leaderless mob (5 Toughs)", encounters: [{ enemyId: "dominion_thug", count: 5 }] },
  { label: "Led mob (Tollman + 3 Toughs + Brigand)", encounters: [
    { enemyId: "reaver_captain", count: 1 }, { enemyId: "dominion_thug", count: 3 }, { enemyId: "bandit_thug", count: 1 },
  ] },
  { label: "Dirty crew (Brigand, Poacher, Cutthroat)", encounters: [
    { enemyId: "bandit_thug", count: 1 }, { enemyId: "bandit_poacher", count: 1 }, { enemyId: "bandit_cutthroat", count: 1 },
  ] },
];

const TRIO = [
  { instance: "prev_godric", premade: "char_021", note: "Godric (warrior, front)" },
  { instance: "prev_brenna", premade: "char_000", note: "Brenna (archer, back)" },
  { instance: "prev_gareth", premade: "char_005", note: "Gareth (archer, back)" },
];

export default function BattlePreview() {
  const [seed, setSeed] = createSignal(1);
  const [level, setLevel] = createSignal(3);
  const [result, setResult] = createSignal<CombatResult | null>(null);
  const [note, setNote] = createSignal("");

  const watch = (encounters: Enc[]) => {
    if (!encounters.length) return;
    const rank = Math.max(1, Math.min(5, level())) as AdventurerRank;
    const team = TRIO
      .map((t) => buildRecruitFromPremadeId(t.instance, t.premade, rank))
      .filter((a): a is NonNullable<typeof a> => !!a);
    if (!team.length) { setNote("Could not build the party."); return; }
    const res = simulateCombat(NOVICE_MISSIONS[0], team, undefined, seed(), { encounters });
    if (!res) { setNote("simulateCombat returned null (empty encounter / team?)."); return; }
    setNote(`${res.log.length} log entries · ${res.victory ? "VICTORY" : "DEFEAT"} · seed ${seed()}`);
    setResult(res);
  };

  return (
    <div style={{ padding: "24px", "max-width": "760px", margin: "0 auto", color: "#e8e0d0" }}>
      <h1 style={{ "font-size": "20px", "margin-bottom": "4px" }}>Battle Preview <span style={{ opacity: 0.6, "font-size": "13px" }}>/dev-battle</span></h1>
      <p style={{ opacity: 0.7, "font-size": "13px", "margin-bottom": "16px" }}>
        Runs the real combat engine on a picked encounter and plays it in the actual stage.
        Party: Godric + Brenna + Gareth. Change the seed for a different fight.
      </p>

      <div style={{ display: "flex", gap: "16px", "align-items": "center", "margin-bottom": "16px" }}>
        <label>Seed <input type="number" value={seed()} onInput={(e) => setSeed(+e.currentTarget.value)}
          style={{ width: "70px", "margin-left": "6px" }} /></label>
        <button onClick={() => setSeed(seed() + 1)} style={btn}>seed +1</button>
        <label>Party rank (1-5) <input type="number" min="1" max="5" value={level()} onInput={(e) => setLevel(+e.currentTarget.value)}
          style={{ width: "55px", "margin-left": "6px" }} /></label>
      </div>

      <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
        <For each={PRESETS}>{(p) => (
          <Show when={p.encounters.length} fallback={<div style={{ opacity: 0.45, "font-size": "12px", "margin-top": "8px" }}>{p.label}</div>}>
            <button onClick={() => watch(p.encounters)} style={{ ...btn, "text-align": "left" }}>▶ {p.label}</button>
          </Show>
        )}</For>
      </div>

      <Show when={note()}><p style={{ opacity: 0.7, "font-size": "12px", "margin-top": "14px" }}>{note()}</p></Show>

      <Show when={result()}>
        {(r) => (
          <CombatPlayback
            log={r().log}
            roster={r().roster}
            positions={r().positions}
            title="Battle Preview"
            victory={r().victory}
            onClose={() => setResult(null)}
          />
        )}
      </Show>
    </div>
  );
}

const btn = {
  background: "#2a2118", color: "#e8e0d0", border: "1px solid #5a4a32",
  padding: "8px 12px", "border-radius": "6px", cursor: "pointer", "font-size": "14px",
} as const;
