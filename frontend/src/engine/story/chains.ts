// ─── Story Chains — the "director" layer ───────────────────────────
// Sequenced narrative arcs, authored as re-entrant scripts. Each chain's `run`
// is re-executed every tick: it walks its beats top-to-bottom, skips the ones
// already satisfied (progress lives in game-state flags, NOT in this function),
// and HALTS at the first `await*` whose condition isn't met yet. That makes the
// scripts save-safe (no live coroutine state to serialize) while reading like a
// straight-line sequence: "do this, wait until the player does X, now do that".
//
// Effects (fireChronicle / recruit) MUST be idempotent — they re-run every tick
// until the script advances past them. They guard on existing state so re-runs
// are no-ops.
//
// The simulation never imports this file; the director reads the sim + writes
// narrative effects, one-way. See docs (narrative systems) when written.

/** The primitives a chain script may call. `await*` suspend the script (throw
 *  the runner's halt sentinel) until their condition holds; the rest are
 *  idempotent effects. Keep this surface small — add a primitive only when a
 *  real chain needs it. */
interface StoryChainApi {
  /** Suspend until a unique/side-chain mission has been completed. */
  awaitMissionDone(missionId: string): void;
  /** Suspend until a mission has been completed at least `count` times (uses the
   *  durable per-mission tally, so it works for repeatable missions). */
  awaitMissionCount(missionId: string, count: number): void;
  /** Suspend until at least one of these premade characters is on the roster. */
  awaitPremadePresent(premadeId: string | string[]): void;
  /** Suspend until the player has CLAIMED the given quest's reward. */
  awaitQuestClaimed(questId: string): void;
  /** Suspend until the given building is built to at least `minLevel` (default 1). */
  awaitBuilding(buildingId: string, minLevel?: number): void;
  /** Suspend until a recruited character's loyalty reaches `threshold`. Used to
   *  gate a beat on a bond deepening (e.g. Magnus unlocks once Aldwin belongs). */
  awaitLoyalty(premadeId: string, threshold: number): void;
  /** Suspend until `ms` real-world time has passed since the script first
   *  reached this step. `key` disambiguates multiple delays within one chain. */
  awaitDelay(key: string, ms: number): void;
  /** Suspend until the next morning — the next 3AM-UTC boundary after the script
   *  first reached this step (the same daily clock the mission board uses). A
   *  clean "come back tomorrow" beat. `key` disambiguates within one chain. */
  awaitNextMorning(key: string): void;
  /** Suspend until it's the given season AND at least `minYear`. Fires on the
   *  first matching season at or after that year (e.g. the first summer once
   *  year 2 has come). */
  awaitSeason(season: string, minYear: number): void;
  /** Fire a chronicle entry into the archive (once). */
  fireChronicle(entryId: string): void;
  /** Fire a chronicle entry AND surface it as a beat modal the moment it
   *  fires (once). Use for beats the player should see pop, not just find in
   *  the journal. Idempotent: no-op if the entry has already fired. */
  fireChronicleModal(entryId: string): void;
  /** Recruit a premade to the roster (once; no-op if already present). */
  recruit(premadeId: string): void;
  /** Unlock a specialty crop's seed (idempotent): its garden becomes buildable
   *  and a starter stock is granted, like the quest `unlocksSeeds` path. */
  unlockSeed(veggieId: string): void;
  /** Unlock a discovery-gated recipe (idempotent): pushes it into
   *  discoveredRecipes so it appears at its building (and badges the sidebar). */
  unlockRecipe(recipeId: string): void;
  /** Post a named kept dog to guard the fold (the first sheep pen), ONCE — the
   *  scripted "he took the fold himself" placement (Truffle won't stay where you
   *  put him, he goes to the sheep). One-time; the player may reassign after. */
  assignDogToFold(dogName: string): void;
  /** Wound a named kept dog with an animal ailment, ONCE (rest heals it, a cure
   *  speeds it — see ANIMAL_AILMENTS). One-time, so a healed dog is never
   *  re-wounded by the re-running script. */
  woundDog(dogName: string, ailmentId: string, hours: number): void;
}

export interface StoryChain {
  id: string;
  run: (api: StoryChainApi) => void;
}

/** Minimal structural view of game-state the runner touches (avoids importing
 *  the full GameState, keeping this module engine-dependency-free). */
export interface ChainState {
  completedUniqueMissionIds?: string[];
  missionCompletions?: Record<string, number>;
  adventurers: ReadonlyArray<{ premadeId?: string; loyalty?: number }>;
  buildings: ReadonlyArray<{ buildingId: string; level: number }>;
  questRewardsClaimed?: string[];
  season?: string;
  year?: number;
  chronicleEntriesFired: string[];
  /** Queue of chronicle entries waiting to pop as a beat modal (drained by the
   *  UI). Distinct from `chronicleEntriesFired` (the permanent archive). */
  pendingChronicleBeats?: string[];
  storyTimers?: Record<string, number>;
}

/** Effects the engine injects (it has nextId / buildRecruit / clothing in scope);
 *  `now` is injected so tests are deterministic. */
export interface ChainDeps {
  now: number;
  /** Build + push the premade onto the roster (+ any arrival side effects).
   *  Only called when the character isn't already present. */
  recruit: (premadeId: string) => void;
  /** Unlock a specialty crop seed (idempotent — engine owns starter-stock size). */
  unlockSeed: (veggieId: string) => void;
  /** Unlock a discovery-gated recipe (idempotent). */
  unlockRecipe: (recipeId: string) => void;
  /** Post the named kept dog to guard the first sheep fold (engine owns the pen
   *  lookup). Called at most once; no-op if the dog isn't in the kennel. */
  assignDogToFold: (dogName: string) => void;
  /** Apply an animal ailment to the named kept dog. Called at most once. */
  woundDog: (dogName: string, ailmentId: string, hours: number) => void;
}

/** Thrown by `await*` to stop a script at its first unmet step. Caught by the
 *  runner; never escapes. */
const HALT = Symbol("story-chain-halt");

/** The next 3AM-UTC boundary strictly after `afterMs` — the daily "morning" the
 *  mission board also refreshes on. Used by awaitNextMorning. */
export function next3amUTC(afterMs: number): number {
  const d = new Date(afterMs);
  d.setUTCHours(3, 0, 0, 0);
  if (d.getTime() <= afterMs) d.setUTCDate(d.getUTCDate() + 1);
  return d.getTime();
}

/** Run every chain against the current state. Re-entrant: call once per tick.
 *  Mutates `s` (fired chronicles, timers, recruited adventurers via deps). */
export function runStoryChains(s: ChainState, chains: StoryChain[], deps: ChainDeps): void {
  for (const chain of chains) {
    const api: StoryChainApi = {
      awaitMissionDone(id) {
        if (!(s.completedUniqueMissionIds ?? []).includes(id)) throw HALT;
      },
      awaitMissionCount(id, count) {
        if ((s.missionCompletions?.[id] ?? 0) < count) throw HALT;
      },
      awaitPremadePresent(pid) {
        const ids = Array.isArray(pid) ? pid : [pid];
        if (!s.adventurers.some((a) => !!a.premadeId && ids.includes(a.premadeId))) throw HALT;
      },
      awaitQuestClaimed(questId) {
        if (!(s.questRewardsClaimed ?? []).includes(questId)) throw HALT;
      },
      awaitBuilding(buildingId, minLevel = 1) {
        const b = s.buildings.find((bb) => bb.buildingId === buildingId);
        if (!b || b.level < minLevel) throw HALT;
      },
      awaitLoyalty(premadeId, threshold) {
        const a = s.adventurers.find((x) => x.premadeId === premadeId);
        if (!a || (a.loyalty ?? 0) < threshold) throw HALT;
      },
      awaitDelay(key, ms) {
        const k = `${chain.id}:${key}`;
        s.storyTimers = s.storyTimers ?? {};
        if (s.storyTimers[k] === undefined) {
          s.storyTimers[k] = deps.now + ms;
          throw HALT;
        }
        if (deps.now < s.storyTimers[k]) throw HALT;
      },
      awaitNextMorning(key) {
        const k = `${chain.id}:${key}`;
        s.storyTimers = s.storyTimers ?? {};
        if (s.storyTimers[k] === undefined) {
          s.storyTimers[k] = next3amUTC(deps.now);
          throw HALT;
        }
        if (deps.now < s.storyTimers[k]) throw HALT;
      },
      awaitSeason(season, minYear) {
        if ((s.year ?? 1) < minYear || s.season !== season) throw HALT;
      },
      fireChronicle(entryId) {
        if (!s.chronicleEntriesFired.includes(entryId)) s.chronicleEntriesFired.push(entryId);
      },
      fireChronicleModal(entryId) {
        if (s.chronicleEntriesFired.includes(entryId)) return; // already fired — don't re-pop
        s.chronicleEntriesFired.push(entryId);
        s.pendingChronicleBeats = s.pendingChronicleBeats ?? [];
        s.pendingChronicleBeats.push(entryId);
      },
      recruit(premadeId) {
        if (s.adventurers.some((a) => a.premadeId === premadeId)) return;
        deps.recruit(premadeId);
      },
      unlockSeed(veggieId) {
        deps.unlockSeed(veggieId);
      },
      unlockRecipe(recipeId) {
        deps.unlockRecipe(recipeId);
      },
      assignDogToFold(dogName) {
        const k = `${chain.id}:assignFold:${dogName}`;
        s.storyTimers = s.storyTimers ?? {};
        if (s.storyTimers[k] !== undefined) return; // placed once already
        s.storyTimers[k] = deps.now;
        deps.assignDogToFold(dogName);
      },
      woundDog(dogName, ailmentId, hours) {
        const k = `${chain.id}:wound:${dogName}`;
        s.storyTimers = s.storyTimers ?? {};
        if (s.storyTimers[k] !== undefined) return; // wounded once — never re-apply
        s.storyTimers[k] = deps.now;
        deps.woundDog(dogName, ailmentId, hours);
      },
    };
    try {
      chain.run(api);
    } catch (e) {
      if (e !== HALT) throw e;
    }
  }
}

// ─── The chains ─────────────────────────────────────────────────────

export const STORY_CHAINS: StoryChain[] = [
  // ── The guild's first hands: the Thornwoods (simple, very early) ──
  // They join via the arrival system. The Chronicle beat ("Two bows, a strong
  // back, and a loud boy") lands once the settlement has taken shape around them:
  // the family housed and their hunting camp raised. Both are now the single
  // "A Home for the Hunters" quest (a_roof_over_their_heads, whose condition
  // requires houses AND the hunting camp), so awaiting that one claim covers it.
  // Surfaced as a beat modal so the player meets it, not only in the journal.
  {
    id: "the_thornwoods",
    run: (api) => {
      api.awaitPremadePresent(["char_000", "char_005", "char_021"]);
      api.awaitQuestClaimed("a_roof_over_their_heads"); // merged: houses + hunting camp both up
      api.fireChronicleModal("ch1_thornwoods");
    },
  },
  // ── The Woodcutter — Hester's rescue → ghost puzzle → timed return ──
  // Beats 1 (ch1_hester_rescue) and 2a (ch1_woodcutter_ghost) fire from their
  // MISSIONS' chronicleEntryId (nicer on-claim modal surfacing). This script
  // owns the sequencing, the timed return, the recruit, and the 2b reveal.
  {
    id: "the_woodcutter",
    run: (api) => {
      api.awaitMissionDone("hester_rescue");     // Beat 1 (mission fires its chronicle)
      api.awaitMissionDone("quiet_the_woods");   // Beat 2a (mission fires its chronicle)
      api.awaitNextMorning("hesterReturn");   // she returns the next morning
      api.recruit("char_019");                   // she "returns" — Beat 2b
      api.fireChronicle("ch1_woodcutter");       // the reveal
    },
  },
  // ── The Returning Trader — Cobb keeps his word ──
  // His first pass (the modal) fired at TH2. Once the settlement can host him
  // (marketplace + tavern), the escort mission "The First Merchant" appears; on
  // completing it, the road is open — a beat modal fires, and Cobb's recurring
  // marketplace stall begins (see updateMerchantRecurrence, gated on that mission).
  {
    id: "the_returning_trader",
    run: (api) => {
      api.awaitMissionDone("merchant_escort_first");
      api.fireChronicleModal("ch1_cobb_returns");
    },
  },
  // ── The Tollman's Road — the road turns organized, and we take it back ──
  // Follows the merchant arc. Cobb is robbed on the downriver road (see_cobb_home)
  // → the road is worked in earnest by men taking orders (hold_the_road) → the
  // scouts find the camp and the team breaks its captain (break_the_nest). Merciful
  // throughout: we drive off, we do not slaughter; the Tollman routs, his company
  // scatters, and we bury no one.
  {
    id: "the_tollmans_road",
    run: (api) => {
      api.awaitMissionDone("see_cobb_home");
      api.fireChronicleModal("ch1_cobb_robbed");
      api.awaitMissionDone("hold_the_road");
      api.fireChronicleModal("ch1_road_organized");
      api.awaitMissionDone("break_the_nest");
      api.fireChronicleModal("ch1_road_ours");
    },
  },
  // ── The poisoner and the gambler — Elspeth & Edmund ──
  // They join together via "A Mother's Errand". Beat 1 lands the moment they're
  // on the roster (the fool at the fire, the watchful mother); Beat 2, a few
  // mornings later, is the Lord piecing together what she fears (his father's
  // blood, the pouch at her belt) — kept as observation, not a confession, per
  // their discovery-only canon. See docs/cast/elspeth-ravencroft.md + edmund.
  {
    id: "the_poisoner_and_the_gambler",
    run: (api) => {
      api.awaitPremadePresent(["char_007", "char_009"]);
      api.fireChronicleModal("ch2_mothers_errand");
      api.awaitNextMorning("elspethReflect");
      api.fireChronicleModal("ch2_whose_blood");
    },
  },
  // ── The bog witch — opening drip (mystery only; the dark descent is deferred).
  // marsh_clearing (an ordinary herb-errand) → a voice in the reeds offers a
  // bargain; the barter (reeds_bargain) → the offering drifts + she mines the
  // gatherers for the settlement's secrets. Folk voice, two-track; the horror
  // (the Cabin, the letters, the child) comes later. See cast/aldith-the-bog-witch.md.
  {
    id: "the_bog_witch",
    run: (api) => {
      api.awaitMissionDone("marsh_clearing");
      api.fireChronicleModal("ch1_reeds_voice");
      api.awaitMissionDone("reeds_bargain");
      api.fireChronicleModal("ch1_reeds_price");
      // The barter becomes routine (fen_barter ×3) → the tea beat (she learns of
      // Nell, cozy on the surface). Then the asking drifts into a recipe: a
      // symbolic count of parts, shrinking in number and worsening in kind —
      // three tusks, two hooves, one skull. Each is a light card; the pattern is
      // the horror. At the skull the Lord draws a line (grain only), and the
      // decision beat fires. The dark descent stays deferred.
      api.awaitMissionCount("fen_barter", 3);
      api.fireChronicleModal("ch1_reeds_tea");
      api.awaitMissionDone("reeds_tusks");
      api.awaitMissionDone("reeds_hooves");
      api.awaitMissionDone("reeds_skull");
      api.fireChronicleModal("ch1_reeds_doubt");
    },
  },
  // ── The Stonebridges — the first magic the Lord knowingly HARBORS ──
  // A Chapter 1 arc. Aldwin (a priest) and his silent brother Magnus present
  // themselves at the gate a few days after the marsh (the Slow Venom beat
  // spans those days, so no extra delay is needed). The Lord welcomes a healer
  // easily; Father Corin vouches priest-to-priest. Aldwin joins at once (a
  // healer earning his shelter); Magnus stays a shadow. As Aldwin's belonging
  // deepens, the Lord's hunch grows. The confession is gated on the Bad Blood
  // miracle beat (Aldwin's Light drives back a taint wound, and suspicion falls
  // on Magnus); Magnus then confesses ALONE to free his brother, which unlocks
  // him and cracks the Lord's faith. Chain-only recruits (no auto-arrival), so
  // recruit() brings each one in.
  {
    id: "the_stonebridges",
    run: (api) => {
      api.awaitQuestClaimed("slow_venom");            // the venom dealt with; days have passed
      api.recruit("char_017");                        // Aldwin presents at the gate, offers his hands
      api.fireChronicleModal("ch1_stonebridge_arrival");
      api.awaitLoyalty("char_017", 8);                // a few missions in, the Lord notices
      api.fireChronicleModal("ch1_stonebridge_hunch");
      // ── HELD until Aldwin's Ch2 miracle beat is built ───────────────
      // The confession is a Ch2-END beat. It must land AFTER Aldwin's Light
      // miracle in Ch2 (he drives back a TAINTED-boar Hollow wound that Edda
      // cannot touch) and the suspicion that throws onto Magnus. That beat does
      // not exist yet, and it belongs with the tainted turn of the Maddened Herd,
      // NOT the Ch1 "bad_blood" opener (which is now its own main-story beat). So
      // this sentinel (a mission id never completed) parks the tail. Replace it
      // with the real Ch2 miracle gate when that beat is built.
      api.awaitMissionDone("__aldwin_ch2_miracle_gate__");
      api.awaitLoyalty("char_017", 15);               // Familiar, he clearly belongs now
      api.fireChronicleModal("ch1_stonebridge_confession");
      api.recruit("char_029");                        // Magnus, freed by his own courage
      api.fireChronicleModal("ch1_stonebridge_plea");
      api.fireChronicleModal("ch1_stonebridge_aftermath");
    },
  },
  // ── Lammast — the farming neighbour to the east makes contact ──
  // Early Ch1. Surviving the wolves and building up (walls + watchtower + hearth-
  // smoke) makes the settlement visible on the frontier; Lammast, established a
  // year longer and watchful, sends a party to see who took the neighbouring
  // grant. The watchtower spots their approach (Gareth calls down strangers, not
  // wolves). This arrival beat opens the Lammast side-chain missions (a barter
  // return-visit east, and grain-escort runs north). The pigeon-exchange trust
  // milestone will be added as a later rung.
  {
    id: "lammast",
    run: (api) => {
      // Its OWN beat, one morning after "No One Followed" (quiet_the_woods).
      // Previously this shared the Baptism of Fire claim with the quest-attached
      // "The wall held" chronicle, and the two raced — Lammast stepped on the wall
      // beat. Landing it a couple of beats later (wolves long past, the Hester
      // scare settled) gives the wall its own raid AND lets Lammast breathe as the
      // warmer "the neighbours have noticed us" moment. The wall/tower + hearth-
      // smoke that make us visible are well up by now, so the flavour still holds.
      api.awaitMissionDone("quiet_the_woods");
      api.awaitNextMorning("lammastArrival");
      api.fireChronicleModal("ch1_lammast_arrival");
    },
  },

  // ── The Strawberry Patch — Nell wanders off; the team brings her home ──
  // A warm summer lull beat (year 2+). The worry beat pops, which opens the
  // "Where's Nell?" search mission (gated on that chronicle firing). Running it
  // brings her back, asleep in a wild strawberry hollow — and Edda's cutting
  // becomes the settlement's first cultivated strawberry bed (seed unlock).
  {
    id: "the_strawberry_patch",
    run: (api) => {
      // Gate on the settlement being ESTABLISHED (Village = Town Hall 3), not just
      // old: dev seasons are short, so year-2-summer alone can arrive while the
      // camp is still tiny, making a warm summer-lull "Nell wanders off" beat land
      // far too early. Require growth AND the season AND year 2.
      api.awaitBuilding("town_hall", 3);
      api.awaitSeason("summer", 2);
      api.fireChronicleModal("ch2_nell_wandering");   // worry — opens the search mission
      api.awaitMissionDone("wheres_nell");              // the team goes and finds her
      api.fireChronicleModal("ch2_nell_found");       // relief + the strawberry hollow
      api.unlockSeed("strawberries");                 // Edda's cutting → a cultivated bed
      api.unlockRecipe("strawberry_jam");             // and Edda's jam from Nell's berries
    },
  },

  // ── The Fold: Truffle takes his post → the pack learns → Greyfang mauls him → the hunt ──
  // He self-takes the fold when the kennel quest is claimed (he won't stay where
  // you post him). The drive-offs (fold_vigil, repeatable) pile up; Nell keeps
  // seeing the pale one at dusk and names him; the hunters confirm (night_howling,
  // gated on 2 fold_vigils); the diversion maul (lost_flock) leaves Truffle
  // savaged — off his post, so the fold bleeds sheep until he mends. The hunt
  // (alpha_wolf_hunt) fires its own aftermath chronicle on claim.
  {
    id: "the_fold",
    run: (api) => {
      api.awaitQuestClaimed("a_dog_without_a_home");
      api.assignDogToFold("Truffle");                  // he takes the fold himself
      api.fireChronicleModal("ch1_truffle_takes_fold");
      api.awaitMissionCount("fold_vigil", 2);           // the drive-offs pile up
      api.fireChronicleModal("ch1_greyfang");           // Nell's sightings, the name
      api.awaitMissionDone("lost_flock");               // the maul (fires ch1_truffle_mauled)
      api.woundDog("Truffle", "savaged", 48);           // savaged → off the fold → predation
    },
  },
];
