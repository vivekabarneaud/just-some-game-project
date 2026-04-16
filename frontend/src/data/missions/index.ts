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
  StoryMission,
} from "./types";

// ─── Mission pools ─────────────────────────────────────────────
import { NOVICE_MISSIONS } from "./noviceMissions";
import { APPRENTICE_MISSIONS } from "./apprenticeMissions";
import { JOURNEYMAN_MISSIONS } from "./journeymanMissions";
import { EXPERT_MISSIONS } from "./expertMissions";
import type { MissionTemplate } from "./types";

export { NOVICE_MISSIONS } from "./noviceMissions";
export { APPRENTICE_MISSIONS } from "./apprenticeMissions";
export { JOURNEYMAN_MISSIONS } from "./journeymanMissions";
export { EXPERT_MISSIONS } from "./expertMissions";

/** All regular (non-story) missions */
export const MISSION_POOL: MissionTemplate[] = [
  ...NOVICE_MISSIONS,
  ...APPRENTICE_MISSIONS,
  ...JOURNEYMAN_MISSIONS,
  ...EXPERT_MISSIONS,
];

// ─── Story missions ────────────────────────────────────────────
export { STORY_MISSIONS, getCurrentStoryMission } from "./storyMissions";

// ─── Helpers & constants ───────────────────────────────────────
export {
  formatReward,
  getMission,
  WIZARD_DURATION_REDUCTION,
  ASSASSIN_LOOT_BONUS,
  ASSASSIN_FAIL_LOOT,
  PRIEST_REVIVE_CHANCE,
  getMissionStatWeights,
  getMissionStatHint,
  calcSuccessChance,
  calcEffectiveDuration,
  areRequiredSlotsFilled,
  calcAssassinBonusRewards,
  calcAssassinFailRewards,
  calcDeathChance,
  generateMissionBoard,
  getMissionBoardSize,
} from "./helpers";
