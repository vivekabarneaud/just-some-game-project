// ─── Re-export types ───────────────────────────────────────────
export type {
  RewardType,
  MissionReward,
  MissionSlot,
  MissionTag,
  MissionEncounter,
  MissionTemplate,
  ActiveMission,
  CompletedMission,
  MissionRosterEntry,
  StoryMission,
  MissionRequirements,
  AdventurerMissionSupplies,
  MissionNpcAlly,
  MissionModifier,
  ExpeditionTemplate,
  ExpeditionEvent,
  ExpeditionEventSlot,
  ExpeditionEffect,
  CombatEvent,
  TreasureEvent,
  TrapEvent,
  EncounterEvent,
  EnvironmentEvent,
  ResolvedExpeditionEvent,
} from "./types.js";
export { isExpedition, getMissionPhase } from "./types.js";
export type { MissionPhase } from "./types.js";

// ─── Mission pools ─────────────────────────────────────────────
import { NOVICE_MISSIONS } from "./noviceMissions.js";
import { APPRENTICE_MISSIONS } from "./apprenticeMissions.js";
import { JOURNEYMAN_MISSIONS } from "./journeymanMissions.js";
import { EXPERT_MISSIONS } from "./expertMissions.js";
import { SIDE_CHAIN_MISSIONS } from "./sideChainMissions.js";
import type { MissionTemplate } from "./types.js";

export { NOVICE_MISSIONS } from "./noviceMissions.js";
export { APPRENTICE_MISSIONS } from "./apprenticeMissions.js";
export { JOURNEYMAN_MISSIONS } from "./journeymanMissions.js";
export { EXPERT_MISSIONS } from "./expertMissions.js";
export { EXPEDITION_POOL } from "./expeditions.js";
export { STAGED_MISSIONS } from "./stagedMissions.js";
export { SIDE_CHAIN_MISSIONS } from "./sideChainMissions.js";

/** All regular (non-story) missions. */
export const MISSION_POOL: MissionTemplate[] = [
  ...NOVICE_MISSIONS,
  ...APPRENTICE_MISSIONS,
  ...JOURNEYMAN_MISSIONS,
  ...EXPERT_MISSIONS,
  ...SIDE_CHAIN_MISSIONS,
];

// ─── Story missions ────────────────────────────────────────────
export { STORY_MISSIONS, getCurrentStoryMission, getLockedStoryMission } from "./storyMissions.js";

// ─── Helpers & constants ───────────────────────────────────────
export {
  formatReward,
  getMission,
  getMissionRank,
  type MissionRank,
  WIZARD_DURATION_REDUCTION,
  ASSASSIN_LOOT_BONUS,
  ASSASSIN_FAIL_LOOT,
  PRIEST_REVIVE_CHANCE,
  getMissionStatWeights,
  getMissionStatHint,
  calcSuccessChance,
  calcEffectiveDuration,
  missionTravelSeconds,
  SETTLEMENT_MAP_POS,
  areRequiredSlotsFilled,
  calcAssassinBonusRewards,
  calcAssassinFailRewards,
  calcDeathChance,
  rollPermanentDeaths,
  generateMissionBoard,
  eligiblePinnedMissions,
  meetsRequirements,
  getMissionBoardSize,
  getExpeditionSlotCount,
  type MissionBoardContext,
} from "./helpers.js";
