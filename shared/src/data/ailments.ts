// ─── Founder ailments — injuries & illnesses on the settlement's own ─────────
// The character-driven layer of DESIGN_WORKERS_PLAGUES: a named founder who's
// hurt or sick works their building at reduced pace (via the staffing HP lever)
// until they recover. ALWAYS survivable by rest alone (the guaranteed exit); a
// cure item just speeds it. Mild by design — texture, not punishment.

export type AilmentKind = "injury" | "illness";

export interface AilmentDef {
  id: string;
  name: string;
  kind: AilmentKind;
  icon: string;
  /** Which founder-staffed buildings this can strike (by building id). */
  buildings: string[];
  /** Recovery "line" — lets a brewed potion's ease_<line> effect treat it.
   *  fever = chills/agues/deep-cough; gut = the gripe; wound = cuts/wrenches. */
  line: "fever" | "gut" | "wound";
  /** Illnesses spread (contagion raises the odds of the next one); injuries are
   *  individual bad luck and never catching. */
  contagious: boolean;
  /** Relative likelihood by season (missing season = 1). */
  seasonWeight?: Record<string, number>;
  /** How much it drops the afflicted founder's work share, 0..1. Kept mild, and
   *  the staffing floor means a building never falls below "the folk pitch in". */
  workPenalty: number;
  /** Game-hours to shake it by REST alone — the guaranteed exit. A cure is faster. */
  restHours: number;
  /** Item ids that cure it on application (a bandage, a salve, a tonic). */
  cures: string[];
  /** Can this be CAUGHT fresh? Default true. False = only reached by escalation
   *  (e.g. pneumonia never lands out of nowhere — it's a neglected chill gone
   *  to the chest, so the player always had a chance to treat it first). */
  catchable?: boolean;
  /** If left untreated, a per-game-hour chance to WORSEN into this ailment id (a
   *  chill settling into the chest → pneumonia). Undefined = never worsens. */
  escalatesTo?: string;
  escalateHourly?: number;
  /** Season weighting for escalation — cold deepens a cough. */
  escalateSeasonWeight?: Record<string, number>;
  /** Event-log line when it strikes. */
  onset: (who: string, where: string) => string;
  /** Event-log line when they recover (rest or cure). */
  recovered: (who: string) => string;
}

/** A live ailment sitting on a founder-staffed building. */
export interface BuildingAilment {
  ailmentId: string;
  founderId: string;
  /** Game-hours of rest left before it clears on its own. */
  hoursRemaining: number;
}

export const AILMENTS: AilmentDef[] = [
  {
    id: "bad_cut",
    line: "wound",
    name: "A Bad Cut",
    kind: "injury",
    icon: "🩸",
    buildings: ["quarry", "lumber_mill"],
    contagious: false,
    workPenalty: 0.35,
    restHours: 12,
    cures: ["bandage", "woundwort_salve", "healing_salve", "mending_potion"],
    onset: (who, where) => `${who} took a bad cut at the ${where}. They can only half-work until it's bound.`,
    recovered: (who) => `${who}'s cut has closed. Back to full at the work.`,
  },
  {
    id: "wrenched_back",
    line: "wound",
    name: "A Wrenched Back",
    kind: "injury",
    icon: "😣",
    buildings: ["quarry", "lumber_mill"],
    contagious: false,
    workPenalty: 0.5,
    restHours: 20,
    cures: ["knitbone_poultice", "mending_potion"],
    onset: (who, where) => `${who} wrenched their back at the ${where} and is moving slow and stiff.`,
    recovered: (who) => `${who}'s back has eased. They stand straight to the work again.`,
  },
  {
    id: "winter_chill",
    line: "fever",
    name: "A Winter Chill",
    kind: "illness",
    icon: "🤧",
    buildings: ["quarry", "lumber_mill", "forager_hut"],
    contagious: true,
    seasonWeight: { winter: 3, autumn: 1.5, spring: 1, summer: 0.4 },
    workPenalty: 0.4,
    restHours: 16,
    cures: ["fever_tonic", "healing_salve"],
    escalatesTo: "pneumonia",
    escalateHourly: 0.004,
    escalateSeasonWeight: { winter: 3, autumn: 1.5, spring: 1, summer: 0.3 },
    onset: (who, where) => `${who} has taken a chill, feverish and coughing at the ${where}.`,
    recovered: (who) => `${who} has shaken the chill and is sound again.`,
  },
  {
    id: "summer_gripe",
    line: "gut",
    name: "The Summer Gripe",
    kind: "illness",
    icon: "🤢",
    buildings: ["quarry", "lumber_mill", "forager_hut"],
    contagious: true,
    seasonWeight: { summer: 3, spring: 1, autumn: 0.7, winter: 0.3 },
    workPenalty: 0.35,
    restHours: 14,
    cures: ["settling_draught"],
    onset: (who, where) => `${who} has come down with the summer gripe, green about the gills at the ${where}.`,
    recovered: (who) => `${who}'s stomach has settled. Back to the work, none the worse.`,
  },
  {
    id: "fen_ague",
    line: "fever",
    name: "The Fen-Ague",
    kind: "illness",
    icon: "🥵",
    buildings: ["quarry", "lumber_mill", "forager_hut"],
    contagious: true,
    seasonWeight: { spring: 2, summer: 1.5, autumn: 1, winter: 0.4 },
    workPenalty: 0.45,
    restHours: 18,
    cures: ["bitterroot_tonic", "fever_tonic"],
    escalatesTo: "pneumonia",
    escalateHourly: 0.003,
    escalateSeasonWeight: { winter: 2, spring: 1.2, autumn: 1, summer: 0.5 },
    onset: (who, where) => `${who} has the fen-ague — shivering and sweating by turns at the ${where}. It came up off the wet ground.`,
    recovered: (who) => `${who}'s fever has broken and the ague has passed.`,
  },
  {
    // Pneumonia — the serious one. Never caught fresh (catchable: false); it is
    // what an untreated Winter Chill or Fen-Ague BECOMES when it settles into the
    // chest, so the player always had a window to prevent it. Big work drop and a
    // long haul, but no death (founders), and rest still clears it — the fast
    // cure is Edda's fenbalm draught (the scarce marsh herb).
    id: "pneumonia",
    line: "fever",
    name: "The Deep-Cough",
    kind: "illness",
    icon: "🫁",
    buildings: ["quarry", "lumber_mill", "forager_hut"],
    contagious: true,
    catchable: false,
    workPenalty: 0.65,
    restHours: 36,
    cures: ["deep_cough_draught"],
    onset: (who) => `${who} is laid low with the deep-cough, struggling for breath and fit for little.`,
    recovered: (who) => `${who}'s chest has cleared at last. The deep-cough has passed.`,
  },
];

export function getAilment(id: string): AilmentDef | undefined {
  return AILMENTS.find((a) => a.id === id);
}

// ─── Animal ailments ─────────────────────────────────────────────────────────
// Same engine as the founder ailments (rest ALWAYS heals, a cure item just
// speeds it, mild by design) but they sit on a KeptAnimal instead of a building,
// and the penalty is on the animal's POST — a wounded guard dog can't watch the
// fold, so predation returns until he mends. Applied by story beats (the pack's
// alpha mauls the good boy), not the random illness roll. `buildings` is unused
// here; kept for the shared AilmentDef shape.
export const ANIMAL_AILMENTS: AilmentDef[] = [
  {
    id: "savaged",
    line: "wound",
    name: "Savaged",
    kind: "injury",
    icon: "🩹",
    buildings: [],
    contagious: false,
    workPenalty: 1, // off his post entirely while he mends
    restHours: 48,  // a couple of game-days on rest alone
    cures: ["bandage", "woundwort_salve", "healing_salve", "knitbone_poultice", "mending_potion"],
    onset: (who) => `${who} was badly mauled and keeps to the fire now. He can't watch the fold until he mends — rest will do it, a poultice sooner.`,
    recovered: (who) => `${who} is up on his paws again, scarred but sound, and back at the fold.`,
  },
];

export function getAnimalAilment(id: string): AilmentDef | undefined {
  return ANIMAL_AILMENTS.find((a) => a.id === id);
}
