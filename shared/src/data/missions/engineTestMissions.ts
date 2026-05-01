// ─── Engine test missions ──────────────────────────────────────
// Stubs used to exercise engine features end-to-end before final story
// content lands. Spawn via `spawnTestMissions("<id>")` from gameState.
//
// Replace / delete these when the parallel story-content thread lands.

import type { MissionTemplate } from "./types.js";

/**
 * STUB — exercises the npcAlly + threat + vipFallen system end-to-end with
 * Niamh as the binding ritualist. Real "Captain's Rest" story content will
 * replace this; the engine wiring it tests stays unchanged.
 */
export const CAPTAINS_REST_STUB: MissionTemplate = {
  id: "captains_rest_engine_test",
  name: "[ENGINE TEST] The Captain's Rest",
  description:
    "Stub mission for engine testing. Niamh accompanies the team to bind the ghost. If she falls, the mission fails distinctly from a wipe.",
  icon: "👻",
  // Warrior is suggested (visible class hint) but not required — the threat
  // system rewards bringing one, but the player can experiment freely.
  slots: [
    { class: "warrior" },
    { class: "any" },
    { class: "any" },
  ],
  duration: 600,
  rewards: [
    { resource: "gold", amount: 100 },
    { resource: "astralShards", amount: 1 },
  ],
  deployCost: 10,
  difficulty: 2,
  minGuildLevel: 1,
  tags: ["combat", "magical", "escort"],
  // Real encounter authored by the parallel story thread will replace this.
  // Cast: Hale (cunning boss) + 3 wraith lieutenants + 5 spirit minions.
  // Total 9 enemies vs 3 advs + Niamh — tight at lvl 5, gear-able.
  encounters: [
    { enemyId: "captain_hale_stub", count: 1 },
    { enemyId: "wraith", count: 3 },
    { enemyId: "cursed_spirit", count: 5 },
  ],
  npcAlly: {
    npcId: "niamh",
    deathFailsMission: true,
    // Niamh is busy with the binding rite — she takes no turn, just stands at
    // the center of the encounter as a high-priority target. The team's job is
    // to keep her alive. Threat multiplier is irrelevant while passive.
    passive: true,
    // Mission-specific: ghosts focus the ritualist from round 1.
    baseThreatVsTag: { ghost: 80 },
  },
  // While Niamh's binding holds, ghosts can be struck physically (the rite
  // partially anchors them in the material plane). If she dies, the binding
  // fades and ghosts go back to being physical-immune.
  modifiers: [
    { type: "physical_pierces_tag", tag: "ghost", whileAllyAlive: "niamh" },
  ],
};

export const ENGINE_TEST_MISSIONS: MissionTemplate[] = [CAPTAINS_REST_STUB];
