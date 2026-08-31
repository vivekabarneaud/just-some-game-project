// ─── Enemy Definitions ──────────────────────────────────────────
// Enemies appear in mission encounters. Stats drive combat simulation.
// Enemy HP = VIT * 10. Natural armor = VIT / 3.
// Designed so unequipped adventurers struggle; gear makes the difference.

export type EnemyTag =
  | "humanoid" | "beast" | "undead" | "ghost" | "demon" | "divine" | "dragon"
  | "elemental_fire" | "elemental_water" | "elemental_earth" | "elemental_wind" | "elemental_aether"
  | "magical";

// ─── Loot Tables ────────────────────────────────────────────────
// Each enemy can drop resources (common) or items (rare, mostly bosses).
// `chance` is 0-1 probability per kill. `min`/`max` is amount range.

export interface ResourceDrop {
  type: "resource";
  resource: string;    // "gold", "wood", "stone", "food", "astralShards", herb IDs, etc.
  chance: number;      // 0-1 probability per kill
  min: number;
  max: number;
  /** Survives a rout: a "sheddable" drop (a fang knocked loose, a tuft of fur,
   *  a dropped coin pouch) that can still be found when the enemy FLED rather
   *  than died. Default false = the drop needs the carcass (hides, sinew, meat,
   *  skulls), so a routed enemy yields none of it. */
  keepOnRout?: boolean;
}

export interface ItemDrop {
  type: "item";
  itemId: string;      // item ID from items.ts
  chance: number;      // 0-1 probability per kill (typically low for bosses)
  /** See ResourceDrop.keepOnRout. */
  keepOnRout?: boolean;
}

/** Guaranteed pick-ONE-of-a-group drop. For a unique boss's signature material
 *  where the player gets exactly one of several (e.g. the alpha's fang OR its
 *  sinew, 50/50) and trades for the rest — not two independent rolls that could
 *  leave you with nothing. `chance` gates the whole group (usually 1). */
export interface OneOfDrop {
  type: "oneOf";
  chance: number;
  options: { resource: string; min: number; max: number; weight?: number }[];
  keepOnRout?: boolean;
}

export type LootDrop = ResourceDrop | ItemDrop | OneOfDrop;

// ─── Enemy Definitions ─────────────────────────────────────────

// ─── Enemy Abilities ────────────────────────────────────────────

export interface EnemyAbility {
  id: string;
  name: string;
  icon: string;
  cooldown: number;
  /** Reach in paces (Combat Foundation: abilities carry their own range). A
   *  DAMAGE ability can only strike a target within this many paces; if none is
   *  in range the ability is held and the creature acts otherwise. Omit → the
   *  creature's basic reach (melee = contact), so a bite can't cross the field.
   *  Author a big value (e.g. a spitting adder's 20, a caster's whole field) for
   *  ranged abilities. */
  range?: number;
  /** When to use this ability */
  trigger: "always" | "hp_below_50" | "ally_dead" | "round_start" | "any_ally_below_30";
  /** What the ability does */
  effect:
    | { type: "bleed"; pctPerRound: number; rounds: number }
    | { type: "poison"; pctPerRound: number; rounds: number }
    /** A bite that has a `chance` (0-1) to infect the target with a lingering
     *  condition carried home (the rabid boar's "froth"). Deals a normal hit;
     *  the infection is the payload, not an in-combat DoT. */
    | { type: "infect"; condition: "froth"; chance: number }
    | { type: "heal_self"; pct: number }
    | { type: "heal_ally"; pct: number }
    | { type: "summon"; enemyId: string; count: number }
    | { type: "aoe_damage"; pct: number; magical: boolean }
    | { type: "mind_control"; rounds: number }
    | { type: "buff_allies"; stat: "str" | "dex" | "int"; pct: number; rounds: number }
    | { type: "debuff_target"; stat: "str" | "dex" | "int"; pct: number; rounds: number }
    /** A strike that also STUNS the target for `rounds` of its own turns (skips
     *  them). The cutthroat's garrote; fights dirty. Range-gated like any strike. */
    | { type: "stun"; rounds: number }
    /** A strike that also SLOWS the target for `rounds` (halved initiative). The
     *  poacher's hamstring shot. Range-gated. */
    | { type: "slow"; rounds: number }
    | { type: "revive_ally"; hpPct: number }
    /** Pack Howl (Flanker archetype, alpha): mark the weakest prey (lowest current
     *  HP — the pack smells blood) and lock the whole pack onto it for `rounds`,
     *  ignoring taunts, with a `buffStat` +`buffPct`% damage buff. Counter: CC or
     *  burst, not taunt. */
    | { type: "pack_howl"; buffStat: "str" | "dex" | "int"; buffPct: number; rounds: number }
    /** A single/multi-target hit for `mult`× damage. `ignoreArmor` makes it a
     *  physical armor-piercer (the wolf's Throat Tear — a normal-ish bite the
     *  neck, no armor help). */
    | { type: "damage_mult"; mult: number; targets: number; ignoreArmor?: boolean };
}

/** See combat/types.ts for the canonical definition. Re-declared here as a type
 *  alias to avoid a cross-package import (this file is leaf-level data). */
export type EnemyAITier = "feral" | "tactical" | "cunning";
export type EnemyTauntImmunity = "none" | "normal" | "all";

export interface EnemyDefinition {
  id: string;
  name: string;
  icon: string;
  image?: string;
  description: string;
  tier: 1 | 2 | 3 | 4 | 5;
  stats: {
    str: number;
    dex: number;
    int: number;
    vit: number;
    wis: number;
  };
  /** Authored raw sub-stat bonuses (Combat Foundation §2): flat additions on top
   *  of the STR/DEX-derived floors. Lets a creature be "fast" (raw mobility) or
   *  "nimble" (raw dodge) WITHOUT inflating DEX and thus its crit/accuracy. Mirror
   *  of CombatUnit.raw (RawSubStats). Omit for a plain creature. */
  raw?: {
    crit?: number;
    accuracy?: number;
    dodge?: number;
    parry?: number;
    mobility?: number;
    initiative?: number;
    armor?: number;
  };
  tags: EnemyTag[];
  boss?: boolean;
  /** Combat-stage row: "back" for ranged/casters (they set up behind the line),
   *  "front" (default) for melee. Purely presentational — where the card sits in
   *  the formation. Distinct from aiTier (targeting), which "cunning" enemies use
   *  to hunt the player's own backline. */
  combatRole?: "front" | "back";
  /** The settlement already knows this foe by reputation before ever fighting it
   *  (named in the journal, described by scouts, etc.). Its PORTRAIT + name show
   *  on mission cards pre-encounter, but its combat measure (HP, abilities, stat
   *  hints) stays hidden until actually fought. Contrast the default: unknown
   *  creatures stay a "???" card until first encountered. */
  revealPortrait?: boolean;
  /** Targeting style. Default "tactical" (threat-aware scored pick). Orthogonal to boss. */
  /** Composable AI knobs (DESIGN_TIER1_ENEMIES §1). Author only the knobs that
   *  make this creature distinct; anything omitted falls back to `aiTier` below
   *  and then to the defaults. Preferred over `aiTier` for new enemies. */
  ai?: Partial<import("./combat/types.js").AIProfile>;
  /** LEGACY single-tier targeting. Maps onto `ai.targeting` exactly. */
  aiTier?: EnemyAITier;
  /** Resistance to forced-target taunt effects. Default "none". */
  tauntImmunity?: EnemyTauntImmunity;
  abilities?: EnemyAbility[];
  /** Pack tag (Combat Foundation, Flanker archetype): creatures sharing a `pack`
   *  string get **Pack Tactics** — a damage bonus when a packmate is also engaged
   *  with the same target. Lone pack-hunters are weak; a pack ganging up is
   *  lethal. Reusable (wolves now; goblins/raptors later). */
  pack?: string;
  /** Pack nerve: this creature's aim AND courage scale with living packmates
   *  (same `pack` tag) — brave and accurate in a pack, feeble and skittish alone.
   *  Pairs with `pack`; delivers "useless out of one" mechanically. */
  packNerve?: boolean;
  /** Morale (Outlaw archetype): this humanoid routs on COURAGE, not just HP. Each
   *  round it weighs a morale score — base `courage`, plus a big cushion while a
   *  leader stands, minus its side's casualties and being outnumbered, plus a
   *  "smell blood" bonus as the enemy nears death — and breaks when it drops below
   *  zero. Omit for things that fight to the death (beasts use routsAt; leaders,
   *  undead, bosses fight on). See [[DESIGN_TIER1_ENEMIES]]. */
  morale?: { courage: number };
  /** A leader: its living presence steadies allied morale (a big cushion); drop it
   *  and the rabble's nerve collapses. Leaders don't rout themselves. */
  leader?: boolean;
  /** Charge (Combat Foundation, Charger archetype): when this creature has room
   *  (a big enough gap to a foe), it spends its move to barrel up to `range`
   *  paces to contact and gores on arrival for bonus damage that SCALES with the
   *  distance covered, plus a small knockback. Cooldown-gated (rounds); defused
   *  by holding it in melee (no run-up = no charge). Boars now; a warrior Charge
   *  talent later. */
  charge?: { range: number; cooldown: number };
  /** Elusive at range (Skirmisher archetype): a weaving, hard-to-pin creature is
   *  much harder to HIT while it is still closing the gap, and commits — becoming
   *  normally hittable — as it reaches melee contact. This number is the peak
   *  bonus Dodge % it gets at full distance, fading linearly to 0 at contact.
   *  Only a ranged attacker across the gap ever triggers it — a pure anti-kite
   *  tool. Wolves now (they close weaving through the arrows); skirmishing
   *  raiders/rats later. */
  elusiveAtRange?: number;
  loot?: LootDrop[];   // drops on kill, empty/undefined means no drops
  /** Physical auto-attack damage range (the creature's bite/claw/swing). The sim
   *  rolls within [dmgMin, dmgMax] then scales by the creature's offensive stat.
   *  If omitted, a behavior-preserving range is derived from that stat (so an
   *  un-tuned enemy hits exactly as before) — set explicitly to hand-tune. */
  dmgMin?: number;
  dmgMax?: number;
  /** Range band of the natural attack in paces (Combat Foundation §3): a
   *  spitting adder strikes 6–20, a biting one 0–5. Omit for the default —
   *  melee contact, or the ranged band when combatRole is "back". */
  attackBand?: { min: number; max: number };
  /** Beast rout: this creature BREAKS AND FLEES when its HP falls to/below this
   *  fraction of max (0-1), surviving instead of being killed. A fled enemy
   *  counts as defeated (field cleared = victory, full performance) but yields
   *  only keepOnRout loot. Omit for things that fight to the end: undead (no
   *  fear to break), maddened/rabid beasts (the boars), swarms, and any boss
   *  meant to make its death a deliberate choice. */
  routsAt?: number;
}

export const ENEMIES: EnemyDefinition[] = [
  // ── Tier 1 — Common threats ───────────────────────────────────
  // Challenging for level 1-3 with no gear. Beatable with basic gear.
  {
    id: "goblin_scout",
    name: "Frontier Goblin",
    icon: "👺",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/goblin_scout.png",
    description: "Small, sneaky, and cowardly alone, but they never come alone. The frontier breeds them like flies.",
    tier: 1,
    stats: { str: 4, dex: 6, int: 2, vit: 6, wis: 2 },
    tags: ["humanoid"],
    loot: [
      { type: "resource", resource: "gold", chance: 0.4, min: 2, max: 8 },
    ],
  },
  {
    id: "bandit_thug",
    name: "Displaced Brigand",
    icon: "🗡️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/bandit_thug.png",
    description: "A desperate man with a rusty blade. Probably a farmer before the Sundering took his land.",
    tier: 1,
    stats: { str: 6, dex: 4, int: 2, vit: 7, wis: 2 },
    tags: ["humanoid"],
    abilities: [
      // Fights dirty: a rusty blade to the belly that leaves you bleeding.
      { id: "gutting_strike", name: "Gutting Strike", icon: "🩸", cooldown: 3, trigger: "always", effect: { type: "bleed", pctPerRound: 15, rounds: 2 } },
    ],
    morale: { courage: 45 }, // desperate — nothing to lose; holds longer than the rabble
    routsAt: 0.3,
    loot: [
      { type: "resource", resource: "gold", chance: 0.5, min: 3, max: 10 },
      { type: "resource", resource: "highwaymans_steel", chance: 0.25, min: 1, max: 2 },
      { type: "item", itemId: "duelist_blade", chance: 0.08 },  // a fine stolen blade
      { type: "item", itemId: "reavers_blade", chance: 0.05 },  // a heavy raider's sword
      { type: "item", itemId: "reavers_greatsword", chance: 0.04 }, // a brute two-hander
      { type: "item", itemId: "notched_hatchet", chance: 0.15 }, // brigands carry axes
      { type: "item", itemId: "fighting_knife", chance: 0.1 },   // and knives
      { type: "item", itemId: "poachers_bow", chance: 0.06 },    // some carry a poacher's bow
      { type: "item", itemId: "scavenged_mail", chance: 0.05 },  // and the odd looted hauberk
      { type: "item", itemId: "brigands_jerkin", chance: 0.08 }, // or a supple leather jerkin
      { type: "item", itemId: "stranger_signet", chance: 0.01 }, // the thrill jackpot: a dead traveller's luck-charm
    ],
  },
  {
    id: "reaver_captain",
    name: "The Tollman",
    icon: "🪖",
    description: "The one who turned a scatter of desperate men into a company. He set a price on the road and calls it a toll. Better fed and better armed than his men, and smart enough to keep it that way.",
    tier: 1,
    stats: { str: 9, dex: 6, int: 3, vit: 15, wis: 4 },
    tags: ["humanoid"],
    boss: true,
    leader: true, // his presence steadies the company; break him and they scatter (morale)
    dmgMin: 5, dmgMax: 9, // a captain's blade, kept sharp
    abilities: [
      { id: "rally", name: "Rally the Company", icon: "📣", cooldown: 4, trigger: "round_start", effect: { type: "buff_allies", stat: "str", pct: 20, rounds: 2 } },
    ],
    // Break him and the company scatters. What they took is piled in the camp, not
    // carried on his back, so the hoard is recovered whether he falls or flees.
    routsAt: 0.3,
    loot: [
      { type: "resource", resource: "gold", chance: 1, min: 20, max: 40, keepOnRout: true },
      // Guaranteed signature: the fine steel he hoarded, the boss-earned sword's material. One bar, one blade.
      { type: "resource", resource: "captains_steel", chance: 1, min: 1, max: 1, keepOnRout: true },
      // Lucky (~12%): a fine leather coat, stashed in the camp, not on his back. Leather's rare.
      { type: "item", itemId: "reavers_leathers", chance: 0.12, keepOnRout: true },
    ],
  },
  {
    // Weaker than a brigand — a hired tough, not a fighter. Comes in numbers
    // (a mob), so a mission can pit 5-6 of them and still read as low-danger.
    id: "dominion_thug",
    name: "Dominion Tough",
    icon: "👊",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/bandit_thug.png",
    description: "A hired hand doing a cruel errand for coin. Brave in a pack, useless out of one.",
    tier: 1,
    stats: { str: 3, dex: 3, int: 1, vit: 4, wis: 1 },
    tags: ["humanoid"],
    abilities: [
      // Dirty and cowardly: a thrown handful of grit — you fight clumsy for a bit.
      { id: "sucker_punch", name: "Sucker Punch", icon: "👊", cooldown: 3, trigger: "always", effect: { type: "debuff_target", stat: "dex", pct: 25, rounds: 2 } },
    ],
    pack: "dominion",        // gangs up — a shared-target bite bonus with its mates
    packNerve: true,         // and its aim + nerve swell with numbers, collapse alone
    morale: { courage: 16 }, // glass nerve — brave in a pack, useless out of one
    routsAt: 0.35,           // folds when its own skin is at stake (lowered so the
                             //   pack-morale, not a lone half-HP panic, governs it)
    loot: [
      { type: "resource", resource: "gold", chance: 0.35, min: 2, max: 6 },
    ],
  },
  {
    id: "bandit_poacher",
    name: "Poacher",
    icon: "🏹",
    description: "An outlaw who learned his aim keeping crows off someone else's barley. Hangs back and picks you off from the treeline.",
    tier: 1,
    stats: { str: 5, dex: 6, int: 2, vit: 5, wis: 2 },
    tags: ["humanoid"],
    combatRole: "back", // hangs back with a bow — fights from range
    abilities: [
      // Hamstring shot: an arrow to the leg — you move and act slow after.
      { id: "hamstring_shot", name: "Hamstring Shot", icon: "🏹", cooldown: 3, trigger: "always", effect: { type: "slow", rounds: 2 } },
    ],
    morale: { courage: 35 }, // steadier than the rabble, but no hero
    routsAt: 0.4,
    loot: [
      { type: "resource", resource: "gold", chance: 0.4, min: 2, max: 8 },
      { type: "item", itemId: "poachers_bow", chance: 0.12 },
      { type: "item", itemId: "stranger_signet", chance: 0.01 }, // the thrill jackpot
    ],
  },
  {
    id: "bandit_cutthroat",
    name: "Cutthroat",
    icon: "🔪",
    description: "A killer for hire with a length of wire and a fast knife. Goes for whoever looks softest.",
    tier: 1,
    stats: { str: 6, dex: 7, int: 2, vit: 5, wis: 2 },
    tags: ["humanoid"],
    aiTier: "cunning", // hunts the softest target it can reach
    abilities: [
      // Garrote: a strangling wire — a hit that leaves the victim choking, stunned.
      { id: "garrote", name: "Garrote", icon: "🪢", cooldown: 4, trigger: "always", effect: { type: "stun", rounds: 1 } },
    ],
    morale: { courage: 40 },
    routsAt: 0.35,
    loot: [
      { type: "resource", resource: "gold", chance: 0.5, min: 3, max: 10 },
      { type: "item", itemId: "fighting_knife", chance: 0.12 },
      { type: "item", itemId: "stranger_signet", chance: 0.01 }, // the thrill jackpot
    ],
  },
  {
    id: "wild_wolf",
    name: "Grey Wolf",
    icon: "🐺",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/wild_wolf.png",
    description: "Lean, hungry, and hunting in packs. A hard season has made them bold, and a bold wolf is a dangerous one.",
    tier: 1,
    stats: { str: 4, dex: 5, int: 1, vit: 5, wis: 1 },
    tags: ["beast"],
    abilities: [
      { id: "wolf_bite", name: "Rending Bite", icon: "🩸", cooldown: 4, trigger: "always",
        effect: { type: "bleed", pctPerRound: 20, rounds: 2 } },
      // Throat Tear: lunges for the neck — armor is no help (ignoreArmor). Mild at
      // Tier 1 (little armor to bypass), keeps wolves relevant as armor grows.
      { id: "throat_tear", name: "Throat Tear", icon: "🦷", cooldown: 3, trigger: "always",
        effect: { type: "damage_mult", mult: 1.2, targets: 1, ignoreArmor: true } },
    ],
    pack: "wolves",
    loot: [
      // Grey = the fed, full-grown wolf: the best meat + hide of the three.
      { type: "resource", resource: "meat", chance: 0.5, min: 2, max: 4 },
      { type: "resource", resource: "wolfhide_strip", chance: 0.4, min: 1, max: 2 },
      { type: "resource", resource: "fang", chance: 0.5, min: 1, max: 2, keepOnRout: true },
      { type: "resource", resource: "sinew_cord", chance: 0.2, min: 1, max: 1 },
    ],
    raw: { mobility: 27, dodge: 5 }, // pack hunter — fast (~36 paces/turn, closes the field in ~1.5 rounds)
    elusiveAtRange: 25, // weaves through the arrows while it closes; commits at contact
    routsAt: 0.3, // a pack wolf breaks when the fight turns against it
    aiTier: "feral"
  },
  {
    id: "giant_rat",
    name: "Ruin Rat",
    icon: "🐀",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/giant_rat.png",
    description: "Bloated and disease-ridden. They breed in every ruin the Sundering left behind.",
    tier: 1,
    stats: { str: 4, dex: 6, int: 1, vit: 5, wis: 1 },
    tags: ["beast"],
    loot: [
      { type: "resource", resource: "meat", chance: 0.2, min: 1, max: 3 },
      { type: "resource", resource: "gnawed_marrow", chance: 0.2, min: 1, max: 1 },
    ],
    aiTier: "feral"
  },
  {
    id: "skeleton",
    name: "Barrowfield Walker",
    icon: "💀",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/skeleton.png",
    description: "Bones held together by Netheron's lingering death-magic. They don't tire and they don't stop.",
    tier: 1,
    stats: { str: 5, dex: 3, int: 2, vit: 8, wis: 1 },
    tags: ["undead"],
    abilities: [
      { id: "bone_reform", name: "Reassemble", icon: "💀", cooldown: 5, trigger: "hp_below_50",
        effect: { type: "heal_self", pct: 25 } },
    ],
    loot: [
      { type: "resource", resource: "bonewalk_shard", chance: 0.3, min: 1, max: 2 },
      { type: "resource", resource: "barrow_ash", chance: 0.15, min: 1, max: 1 },
    ],
    aiTier: "feral"
  },

  // ── Tier 0 — True novice fodder ───────────────────────────────
  // Designed so a lone lvl 1 adventurer with no gear has a fighting chance.
  // Used for the first "prove yourself" missions — mix with tier 1 enemies
  // to grade difficulty without jumping from trivial to deadly.
  {
    id: "gaunt_wolf",
    name: "Gaunt Wolf",
    icon: "🐺",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/gaunt_wolf.png",
    description: "A lean yearling, kicked out of the pack too early. Hungry and nervous, but still a predator.",
    tier: 1,
    stats: { str: 3, dex: 4, int: 1, vit: 3, wis: 1 },
    tags: ["beast"],
    loot: [
      // Gaunt yearling: leaner meat + hide than a Grey, but the fang still bites.
      { type: "resource", resource: "meat", chance: 0.3, min: 1, max: 2 },
      { type: "resource", resource: "wolfhide_strip", chance: 0.25, min: 1, max: 1 },
      { type: "resource", resource: "fang", chance: 0.35, min: 1, max: 1, keepOnRout: true },
      { type: "resource", resource: "sinew_cord", chance: 0.12, min: 1, max: 1 },
    ],
    abilities: [
      // A weaker Rending Bite than the Grey Wolf's — half the bleed.
      { id: "wolf_bite", name: "Rending Bite", icon: "🩸", cooldown: 4, trigger: "always",
        effect: { type: "bleed", pctPerRound: 10, rounds: 2 } },
    ],
    pack: "wolves",
    raw: { mobility: 20, dodge: 3 }, // lean yearling — quick and jumpy (~28 paces/turn)
    elusiveAtRange: 25, // jumpy and hard to pin while it closes
    routsAt: 0.35, // a nervous, starving yearling, breaks and runs easily
    aiTier: "feral"
  },
  {
    // The runt of the pack — half-starved, barely more than skin and ribs. Weak
    // enough that a trained watchtower archer two-shots it, so a lean pack of
    // these is the intended "Hold the Treeline" first-defense fight, winnable by
    // the captain (+ a Lv1 wall) alone. Distinct from gaunt_wolf so the bigger
    // wolf packs keep their bite.
    id: "starving_wolf",
    name: "Starving Wolf",
    icon: "🐺",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/gaunt_wolf.png",
    description: "Skin stretched over ribs, driven to the wall by pure hunger. Little fight left in it, but a cornered starving thing still bites.",
    tier: 1,
    stats: { str: 2, dex: 3, int: 1, vit: 2, wis: 1 },
    tags: ["beast"],
    loot: [
      // Starving runt: skin and ribs — scraps of meat/hide, but the fang keeps its worth.
      { type: "resource", resource: "meat", chance: 0.15, min: 1, max: 1 },
      { type: "resource", resource: "wolfhide_strip", chance: 0.12, min: 1, max: 1 },
      { type: "resource", resource: "fang", chance: 0.3, min: 1, max: 1, keepOnRout: true },
      { type: "resource", resource: "sinew_cord", chance: 0.1, min: 1, max: 1 },
    ],
    pack: "wolves",
    raw: { mobility: 8 }, // spent and slow for a wolf, but still quicker than a boar (~16 paces/turn)
    elusiveAtRange: 15, // still weaves, but half-starved and easier to catch
    routsAt: 0.45, // barely holding together; breaks the moment it's hurt
    aiTier: "feral"
  },
  {
    id: "wild_boar",
    name: "Wild Boar",
    icon: "🐗",
    description: "All muscle and bad temper, and quick for its size. Those tusks are not for show.",
    tier: 1,
    stats: { str: 5, dex: 3, int: 1, vit: 6, wis: 1 }, // out-muscles + out-tanks a lone wolf
    tags: ["beast"],
    loot: [
      // The clean, healthy boar: good meat + its full materials (hide, tusk-shards).
      { type: "resource", resource: "meat", chance: 0.5, min: 2, max: 4 },
      { type: "resource", resource: "bristlehide", chance: 0.35, min: 1, max: 2 },
      { type: "resource", resource: "tusk_shard", chance: 0.8, min: 1, max: 2 },
      { type: "resource", resource: "boar_tusk", chance: 0.08, min: 1, max: 1 }, // rare: a tusk out clean
    ],
    charge: { range: 40, cooldown: 99 }, // one devastating charge, then it fights or flees
    routsAt: 0.3, // a wild animal — breaks and flees when the fight turns against it
    aiTier: "feral"
  },
  {
    id: "goblin_runt",
    name: "Goblin Runt",
    icon: "👺",
    description: "The smallest of the goblin scouts, usually sent ahead to spring the traps. Underestimate it and it will make you bleed.",
    tier: 1,
    stats: { str: 2, dex: 4, int: 2, vit: 3, wis: 2 },
    tags: ["humanoid"],
    loot: [
      { type: "resource", resource: "gold", chance: 0.3, min: 1, max: 4 },
    ],
    aiTier: "feral"
  },

  // ── Tier 2 — Organized threats ────────────────────────────────
  // Require level 4-6 WITH basic gear. Dangerous without.
  {
    id: "gharkal_raider",
    name: "Ghar'kal Raider",
    icon: "👹",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/orc_warrior.png",
    description: "Broad-shouldered and battle-scarred. Driven north by the spreading Wastes, they fight for what land is left: kill or be displaced.",
    tier: 2,
    stats: { str: 18, dex: 7, int: 2, vit: 20, wis: 3 },
    tags: ["humanoid"],
    abilities: [
      { id: "orc_warcry", name: "War Cry", icon: "📯", cooldown: 4, trigger: "always",
        effect: { type: "buff_allies", stat: "str", pct: 20, rounds: 2 } },
    ],
    loot: [
      { type: "resource", resource: "gold", chance: 0.5, min: 5, max: 15 },
      { type: "resource", resource: "orc_steel", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "war_paint", chance: 0.1, min: 1, max: 1 },
    ],
  },
  {
    id: "skeleton_archer",
    name: "Barrowfield Archer",
    icon: "🏹",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/skeleton_archer.png",
    description: "Dead eyes, steady aim. Barrowfield archers who kept their skill past death. They never miss twice.",
    tier: 2,
    stats: { str: 6, dex: 16, int: 3, vit: 12, wis: 2 },
    tags: ["undead"],
    combatRole: "back",
    loot: [
      { type: "resource", resource: "cursed_iron", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "bonewalk_shard", chance: 0.3, min: 1, max: 2 },
    ],
    aiTier: "feral"
  },
  {
    id: "bandit_captain",
    name: "Dominion Deserter",
    icon: "⚔️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/bandit_captain.png",
    description: "A former Dominion soldier turned outlaw. Dangerous because he still fights like one.",
    tier: 2,
    stats: { str: 16, dex: 11, int: 5, vit: 18, wis: 5 },
    tags: ["humanoid"],
    boss: true,
    leader: true, // a living anchor — the rabble holds while he stands, breaks when he falls
    raw: { dodge: 12 }, // disciplined footwork, deflects blows (STR-parry proper lands with hit-resolution)
    dmgMin: 6, dmgMax: 11, // a soldier's blade, wielded like one
    abilities: [
      // Steadies and stiffens the men — a veteran's command in the thick of it.
      { id: "hold_line", name: "Hold the Line", icon: "🛡️", cooldown: 4, trigger: "round_start", effect: { type: "buff_allies", stat: "str", pct: 15, rounds: 2 } },
    ],
    loot: [
      { type: "resource", resource: "gold", chance: 0.8, min: 15, max: 40 },
      { type: "item", itemId: "iron_sword", chance: 0.10 },
      { type: "item", itemId: "stranger_signet", chance: 0.01 }, // the thrill jackpot
    ],
  },
  {
    id: "cave_spider",
    name: "Cave Spinner",
    icon: "🕷️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/cave_spider.png",
    description: "Silent, venomous, and the size of a dog. The old Khazdurim mines are thick with them now.",
    tier: 2,
    stats: { str: 10, dex: 16, int: 1, vit: 12, wis: 2 },
    tags: ["beast"],
    abilities: [
      { id: "spider_venom", name: "Venomous Bite", icon: "☠️", cooldown: 3, trigger: "always",
        effect: { type: "poison", pctPerRound: 12, rounds: 3 } },
    ],
    loot: [
      { type: "resource", resource: "spinners_bile", chance: 0.25, min: 1, max: 1 },
      { type: "resource", resource: "chitin_plate", chance: 0.15, min: 1, max: 1 },
    ],
    aiTier: "feral"
  },
  {
    id: "rock_skitter",
    name: "Rock Skitter",
    icon: "🕷️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/cave_spider.png",
    description: "Hand-sized, many-legged, and never alone. The Spinners' small cousins boil up out of the cracks in a scuttling tide. One is nothing; a nest is a problem.",
    tier: 1,
    // Fast and fragile swarm fodder — no venom (that stays the Spinner's mark).
    // Meant to be fought several at once, like brigands.
    stats: { str: 4, dex: 8, int: 1, vit: 5, wis: 1 },
    tags: ["beast"],
    loot: [
      { type: "resource", resource: "chitin_plate", chance: 0.1, min: 1, max: 1 },
    ],
    aiTier: "feral"
  },
  {
    id: "cursed_spirit",
    name: "Grief-Bound Spirit",
    icon: "👻",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/cursed_spirit.png",
    description: "A restless soul from before the Sundering, bound to this place by old grief. Its wail chills the blood.",
    tier: 1,
    stats: { str: 3, dex: 5, int: 8, vit: 8, wis: 6 },
    tags: ["ghost", "magical"],
    loot: [
      { type: "resource", resource: "veilmist", chance: 0.20, min: 1, max: 1 },
      { type: "resource", resource: "soul_shard", chance: 0.08, min: 1, max: 1 },
    ],
  },

  // ── Tier 3 — Dangerous foes ───────────────────────────────────
  // Require level 6-10 with decent gear. Party composition matters.
  {
    id: "dark_mage",
    name: "Veil-Touched Scholar",
    icon: "🧙",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/dark_mage.png",
    description: "A scholar who dug too deep into pre-Sundering texts. The air crackles and tastes of copper near him.",
    tier: 3,
    stats: { str: 4, dex: 7, int: 26, vit: 14, wis: 18 },
    tags: ["humanoid", "magical"],
    combatRole: "back",
    boss: true,
    abilities: [
      { id: "mind_control", name: "Dominate Mind", icon: "🧠", cooldown: 5, trigger: "always",
        effect: { type: "mind_control", rounds: 1 } },
      { id: "dark_bolt", name: "Dark Bolt", icon: "⚡", cooldown: 2, trigger: "always",
        effect: { type: "damage_mult", mult: 1.8, targets: 1 } },
    ],
    loot: [
      { type: "resource", resource: "astralShards", chance: 0.25, min: 1, max: 2 },
      { type: "resource", resource: "nightbloom", chance: 0.15, min: 1, max: 1 },
      { type: "resource", resource: "nettle", chance: 0.2, min: 1, max: 2 },
      { type: "item", itemId: "enchanted_staff", chance: 0.08 },
    ],
    aiTier: "cunning"
  },
  {
    id: "wraith",
    name: "Netheron's Shade",
    icon: "👤",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/wraith.png",
    description: "Not quite alive, not quite dead. Born where Netheron's death-essence seeps thickest. Steel passes through it.",
    tier: 3,
    stats: { str: 10, dex: 12, int: 20, vit: 16, wis: 14 },
    tags: ["ghost", "magical"],
    abilities: [
      { id: "life_drain", name: "Life Drain", icon: "💀", cooldown: 3, trigger: "always",
        effect: { type: "damage_mult", mult: 1.5, targets: 1 } },
      { id: "wail", name: "Chilling Wail", icon: "😱", cooldown: 4, trigger: "always",
        effect: { type: "debuff_target", stat: "str", pct: 30, rounds: 2 } },
    ],
    loot: [
      { type: "resource", resource: "ghostweave", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "veilmist", chance: 0.3, min: 1, max: 2 },
    ],
  },
  // ── ENGINE TEST STUB ──────────────────────────────────────────
  // Captain Hale stand-in for the npc-escort engine test. Real Hale stats,
  // lore, and portrait will be authored by the parallel story thread —
  // delete or rename this entry when that lands.
  {
    id: "captain_hale_stub",
    name: "Captain Hale's Wraith",
    icon: "💀",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/captain_hale_ghost_portrait.png",
    description: "He held the post for forty-seven days after the order to fall back never came. The Wastes wore him down to grief and silence. Now he stands his line still, and the dead under him will not let go.",
    revealPortrait: true, // his name + story are in the journal before we face him
    tier: 2, // cosmetic (frame only) — an early Chapter-1 boss, not a mid-tier one
    stats: { str: 14, dex: 14, int: 24, vit: 26, wis: 18 },
    tags: ["ghost", "magical"],
    boss: true,
    // A tired, anguished soul who "stands his line" — not a scheming elite. He
    // fights whoever presses him (threat-aware) and CAN be goaded by a warrior's
    // taunt, rather than coldly hunting the backline. Makes the first real fight
    // winnable by peeling him onto the tank.
    aiTier: "tactical",
    tauntImmunity: "none",
    abilities: [
      { id: "spectral_lash", name: "Spectral Lash", icon: "💢", cooldown: 2, trigger: "always",
        effect: { type: "damage_mult", mult: 1.75, targets: 1 } },
      { id: "captains_command", name: "Captain's Command", icon: "📣", cooldown: 4, trigger: "always",
        effect: { type: "buff_allies", stat: "str", pct: 25, rounds: 2 } },
    ],
    loot: [
      { type: "resource", resource: "veilmist", chance: 0.6, min: 2, max: 4 },
      { type: "resource", resource: "ghostweave", chance: 0.4, min: 1, max: 2 },
      { type: "resource", resource: "soul_shard", chance: 0.25, min: 1, max: 1 },
    ],
  },
  {
    id: "troll",
    name: "Thornveil Troll",
    icon: "🧌",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/troll.png",
    description: "Massive, foul-smelling, and nearly impossible to kill. The Thornveil Rangers say they've been pushing further from the Wastes each year.",
    tier: 3,
    stats: { str: 28, dex: 4, int: 1, vit: 35, wis: 2 },
    tags: ["beast"],
    boss: true,
    abilities: [
      { id: "troll_regen", name: "Regeneration", icon: "💚", cooldown: 0, trigger: "round_start",
        effect: { type: "heal_self", pct: 15 } },
      { id: "troll_slam", name: "Ground Slam", icon: "💥", cooldown: 4, trigger: "always",
        effect: { type: "aoe_damage", pct: 40, magical: false } },
    ],
    loot: [
      { type: "resource", resource: "trollhide", chance: 0.4, min: 1, max: 2 },
      { type: "resource", resource: "gnawed_marrow", chance: 0.6, min: 2, max: 4 },
      { type: "resource", resource: "gold", chance: 0.5, min: 10, max: 30 },
    ],
    aiTier: "feral"
  },

  // ── Tier 3 — Elemental threats ──────────────────────────────

  // ── Tier 3 — Ghost threats ────────────────────────────────────
  {
    id: "wailing_phantom",
    name: "Wastes Phantom",
    icon: "👻",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/wailing_phantom.png",
    description: "The boundary between realms is thin near the Wastes. This one remembers how it died, and wants you to share the experience.",
    // Cosmetic only (tier drives the card frame, not combat). Kept at tier 2 so
    // an early Chapter-1 foe doesn't wear the tier-3 "rare" frame.
    tier: 2,
    stats: { str: 8, dex: 14, int: 22, vit: 12, wis: 16 },
    tags: ["ghost"],
    loot: [
      { type: "resource", resource: "veilmist", chance: 0.25, min: 1, max: 1 },
      { type: "resource", resource: "ghostweave", chance: 0.10, min: 1, max: 1 },
    ],
  },

  // ── Dragon threats (spread across tiers) ───────────────────────

  // ── Tier 4 — Elite threats ────────────────────────────────────
  // Require level 10-15 with good gear. Full party required.

  // ── Tier 5 — Legendary ────────────────────────────────────────
  // Require level 18+ fully geared elite party. Expect casualties.

  // ── New Enemies — Content Expansion ────────────────────────────

  // ── Tier 1 — New Common Threats ─────────────────────────────────
  {
    id: "forest_bear",
    name: "Forest Bear",
    icon: "🐻",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/forest_bear.png",
    description: "A massive brown bear, territorial and aggressive. They don't hunt people, but get between one and its den and it will kill you.",
    tier: 1,
    stats: { str: 8, dex: 3, int: 1, vit: 9, wis: 2 },
    tags: ["beast"],
    abilities: [{ id: "maul", name: "Maul", icon: "🐾", cooldown: 2, trigger: "always", effect: { type: "damage_mult", mult: 1.5, targets: 1 } }],
    loot: [
      { type: "resource", resource: "meat", chance: 0.5, min: 3, max: 8 },
      { type: "resource", resource: "thick_pelt", chance: 0.35, min: 1, max: 1 },
      { type: "resource", resource: "bear_claw", chance: 0.2, min: 1, max: 2, keepOnRout: true },
    ],
    routsAt: 0.3, // a hurt bear disengages (mostly moot, bears are "wide berth" now)
    aiTier: "feral"
  },
  {
    id: "marsh_adder",
    name: "Marsh Adder",
    icon: "🐍",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/marsh_adder.png",
    description: "Long as a man is tall, with venom that makes your blood burn. Settlers lose more livestock to these than to wolves.",
    tier: 1,
    stats: { str: 4, dex: 8, int: 2, vit: 5, wis: 1 },
    tags: ["beast"],
    abilities: [{ id: "venomous_strike", name: "Venomous Strike", icon: "☠️", cooldown: 2, trigger: "always", effect: { type: "poison", pctPerRound: 8, rounds: 3 } }],
    loot: [
      { type: "resource", resource: "serpent_fang", chance: 0.25, min: 1, max: 1 },
      { type: "resource", resource: "snake_oil", chance: 0.15, min: 1, max: 1 },
    ],
    aiTier: "feral"
  },
  {
    id: "rabid_boar",
    name: "Rabid Boar",
    icon: "🐗",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/rabid_boar.png",
    description: "Red-eyed and frothing. Something in the bad water drives them mad. They charge anything that moves.",
    tier: 1,
    stats: { str: 7, dex: 4, int: 1, vit: 8, wis: 1 }, // clumsy but brutal — low DEX, rides its charge + bulk
    tags: ["beast"],
    abilities: [
      // The frothing bite: a normal hit that rarely (10%) infects with the froth,
      // a bite-sickness carried home. Cured only by a Boar's-Bane Salve.
      { id: "frothing_bite", name: "Frothing Bite", icon: "🤢", cooldown: 1, trigger: "always", effect: { type: "infect", condition: "froth", chance: 0.1 } },
    ],
    charge: { range: 40, cooldown: 2 }, // frenzied — charges every couple of rounds
    loot: [
      // Diseased — no edible meat. Bone + hide still harvest clean.
      { type: "resource", resource: "bristlehide", chance: 0.3, min: 1, max: 1 },
      { type: "resource", resource: "tusk_shard", chance: 1, min: 1, max: 1 },
      { type: "resource", resource: "boar_tusk", chance: 0.10, min: 1, max: 1 }, // rare: a tusk out clean (bigger boar, better odds)
      { type: "resource", resource: "cloven_hoof", chance: 0.6, min: 1, max: 2 },
      { type: "resource", resource: "boar_skull", chance: 0.15, min: 1, max: 1 },
    ],
    aiTier: "feral"
  },
  {
    id: "tainted_boar",
    name: "Tainted Boar",
    icon: "🐗",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/tainted_boar.png",
    revealPortrait: true, // the scouts came back describing them ("What the Scouts Saw")
    description: "Grey-mottled and weeping black, reeking of cold metal. A spear through the heart barely slows it; the body keeps moving long after it should have stopped, as if the death will not take. Whatever is in these beasts will not let them die easily.",
    tier: 2,
    stats: { str: 8, dex: 4, int: 1, vit: 13, wis: 1 },
    tags: ["beast"],
    charge: { range: 40, cooldown: 2 }, // TODO Hollow beat: + Hollow bite, knockback-immune, breakthrough
    loot: [
      { type: "resource", resource: "bristlehide", chance: 0.4, min: 1, max: 1 },
      { type: "resource", resource: "tusk_shard", chance: 1, min: 1, max: 1 },
      { type: "resource", resource: "cloven_hoof", chance: 0.8, min: 1, max: 2 },
      { type: "resource", resource: "boar_skull", chance: 0.4, min: 1, max: 1 },
    ],
    aiTier: "feral"
  },
  {
    id: "tainted_patriarch_boar",
    name: "Tainted Patriarch",
    icon: "🐗",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/tainted_patriarch.png",
    revealPortrait: true, // the mission fiction describes it before we reach the spring
    description: "The old father of the herd, and the most ruined of them. Grey to the bone, weeping black from a dozen wounds that never close. It should have died a season ago. It did not. It guards the bad water as though it were still its own.",
    tier: 3,
    stats: { str: 11, dex: 4, int: 1, vit: 18, wis: 1 },
    tags: ["beast"],
    boss: true,
    charge: { range: 40, cooldown: 3 }, // TODO Hollow beat: + Hollow bite, death-vomit zone, breakthrough
    loot: [
      { type: "resource", resource: "tusk_shard", chance: 1, min: 2, max: 3 },
      { type: "resource", resource: "bristlehide", chance: 0.6, min: 1, max: 2 },
      { type: "resource", resource: "cloven_hoof", chance: 1, min: 2, max: 3 },
      { type: "resource", resource: "boar_skull", chance: 1, min: 1, max: 1 },
    ],
    aiTier: "feral"
  },

  // ── Tier 2 — New Organized Threats ──────────────────────────────
  {
    id: "ghoul",
    name: "Ghoul",
    icon: "🧟",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/ghoul.png",
    description: "Not quite undead, not quite alive. Something that ate the wrong corpse near the Wastes and became this. It remembers being human. It doesn't care.",
    tier: 2,
    stats: { str: 14, dex: 10, int: 4, vit: 16, wis: 3 },
    tags: ["undead"],
    abilities: [{ id: "paralyzing_touch", name: "Paralyzing Touch", icon: "🥶", cooldown: 3, trigger: "always", effect: { type: "debuff_target", stat: "dex", pct: 50, rounds: 1 } }],
    loot: [
      { type: "resource", resource: "ghoul_marrow", chance: 0.3, min: 1, max: 2 },
      { type: "resource", resource: "grave_dust", chance: 0.2, min: 1, max: 2 },
    ],
    aiTier: "feral"
  },
  {
    id: "alpha_wolf",
    name: "Greyfang",
    icon: "🐺",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/alpha_wolf.png",
    description: "A great pale wolf, half again the size of the pack he leads and cleverer than a beast has any right to be. He watches a defense before he breaks it, and spends his own pack freely to reach what he truly wants. The one Nell named, and would not say above a whisper.",
    tier: 2,
    stats: { str: 16, dex: 14, int: 4, vit: 18, wis: 4 },
    raw: { mobility: 10, dodge: 5 }, // the pack's fastest — leads the charge
    tags: ["beast"],
    boss: true,
    abilities: [
      { id: "pack_howl", name: "Pack Howl", icon: "🌕", cooldown: 4, trigger: "round_start", effect: { type: "pack_howl", buffStat: "str", buffPct: 20, rounds: 2 } },
      { id: "lunge", name: "Lunge", icon: "💨", cooldown: 2, trigger: "always", effect: { type: "damage_mult", mult: 1.8, targets: 1 } },
      { id: "throat_tear", name: "Throat Tear", icon: "🦷", cooldown: 3, trigger: "always", effect: { type: "damage_mult", mult: 1.4, targets: 1, ignoreArmor: true } },
    ],
    pack: "wolves",
    loot: [
      // Signature trophy: exactly ONE of fang/sinew per kill (50/50). The alpha
      // hunt is one-time, so you get one and TRADE for the other.
      { type: "oneOf", chance: 1, options: [
        { resource: "alpha_fang", min: 1, max: 1 },
        { resource: "alpha_sinew", min: 1, max: 1 },
      ] },
      { type: "resource", resource: "thick_pelt", chance: 0.6, min: 1, max: 2 },
      { type: "resource", resource: "sinew_cord", chance: 0.4, min: 1, max: 2 },
      { type: "resource", resource: "meat", chance: 0.8, min: 4, max: 10 },
    ],
    // No routsAt: the pack leader stands and fights to the death — it's the
    // deliberate reckoning the mission sends you for, not a beast to shoo off.
  },
  /* STASHED 2026-06-28 — Bog Witch enemy retired alongside the stale `bog_witch_lair`
     mission. Preserved for a future remake per the tragic Aldith/Ada design in
     docs/cast/aldith-the-bog-witch.md. Not referenced by any active mission.
  */
  {
    id: "burnt_skeleton",
    name: "Burnt Skeleton",
    icon: "🔥",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/burnt_skeleton.png",
    description: "Blackened bones wreathed in sickly orange flame. Whatever killed them, the fire stayed. Touch them and you'll understand why.",
    tier: 2,
    stats: { str: 12, dex: 8, int: 8, vit: 10, wis: 2 },
    tags: ["undead", "elemental_fire"],
    abilities: [{ id: "self_immolate", name: "Self-Immolate", icon: "💥", cooldown: 99, trigger: "hp_below_50", effect: { type: "aoe_damage", pct: 20, magical: true } }],
    loot: [
      { type: "resource", resource: "charite", chance: 0.25, min: 1, max: 1 },
      { type: "resource", resource: "bonewalk_shard", chance: 0.2, min: 1, max: 2 },
      { type: "resource", resource: "crude_ruby", chance: 0.08, min: 1, max: 1 },
    ],
    aiTier: "feral"
  },

  // ── Tier 3 — New Dangerous Foes ─────────────────────────────────
  {
    id: "necromancer_acolyte",
    name: "Necromancer Acolyte",
    icon: "💀",
    description: "A student of the forbidden arts, too clever for their own good. They raise the dead not out of malice but curiosity. That's worse.",
    tier: 3,
    stats: { str: 8, dex: 10, int: 22, vit: 16, wis: 16 },
    tags: ["humanoid", "undead", "magical"],
    combatRole: "back",
    boss: true,
    abilities: [
      { id: "raise_dead_acolyte", name: "Raise Dead", icon: "💀", cooldown: 5, trigger: "always", effect: { type: "summon", enemyId: "skeleton", count: 2 } },
      { id: "dark_bolt_acolyte", name: "Dark Bolt", icon: "⚡", cooldown: 1, trigger: "always", effect: { type: "damage_mult", mult: 1.5, targets: 1 } },
    ],
    loot: [
      { type: "resource", resource: "soul_shard", chance: 0.3, min: 1, max: 1 },
      { type: "resource", resource: "grave_dust", chance: 0.4, min: 1, max: 3 },
      { type: "resource", resource: "lichglass", chance: 0.1, min: 1, max: 1 },
      { type: "resource", resource: "gold", chance: 0.6, min: 10, max: 30 },
      { type: "resource", resource: "nettle", chance: 0.25, min: 1, max: 2 },
      { type: "resource", resource: "nightbloom", chance: 0.1, min: 1, max: 1 },
    ],
    aiTier: "cunning"
  },
  {
    id: "dire_bear",
    name: "Dire Bear",
    icon: "🐻",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/dire_bear.png",
    description: "The old hunters call them 'mountain kings.' Twice the size of a forest bear, scarred from a lifetime of fighting everything, including other dire bears. This one has claimed your territory.",
    tier: 3,
    stats: { str: 24, dex: 8, int: 4, vit: 30, wis: 6 },
    tags: ["beast"],
    boss: true,
    abilities: [
      { id: "savage_maul", name: "Savage Maul", icon: "🐾", cooldown: 2, trigger: "always", effect: { type: "damage_mult", mult: 2.0, targets: 1 } },
      { id: "roar", name: "Roar", icon: "🗣️", cooldown: 4, trigger: "round_start", effect: { type: "debuff_target", stat: "dex", pct: 30, rounds: 2 } },
    ],
    loot: [
      { type: "resource", resource: "thick_pelt", chance: 0.8, min: 2, max: 4 },
      { type: "resource", resource: "bear_claw", chance: 0.6, min: 1, max: 3 },
      { type: "resource", resource: "beast_heart", chance: 0.15, min: 1, max: 1 },
      { type: "resource", resource: "meat", chance: 0.9, min: 8, max: 20 },
      { type: "item", itemId: "beast_heart_charm", chance: 0.08 },
    ],
    aiTier: "feral"
  },
  {
    id: "swamp_revenant",
    name: "Swamp Revenant",
    icon: "👻",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/swamp_revenant.png",
    description: "Something drowned in the bog and didn't stay down. It rises from the black water trailing weeds and old rage. The locals say it's a Dominion soldier who deserted and was executed by his own unit.",
    tier: 3,
    stats: { str: 14, dex: 8, int: 14, vit: 20, wis: 10 },
    tags: ["undead", "ghost"],
    abilities: [
      { id: "drain_life", name: "Drain Life", icon: "💜", cooldown: 2, trigger: "always", effect: { type: "damage_mult", mult: 1.3, targets: 1 } },
    ],
    loot: [
      { type: "resource", resource: "ghostweave", chance: 0.15, min: 1, max: 1 },
      { type: "resource", resource: "grave_dust", chance: 0.3, min: 1, max: 2 },
      { type: "resource", resource: "snake_oil", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "mugwort", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "nettle", chance: 0.15, min: 1, max: 1 },
    ],
    aiTier: "feral"
  },

  // ── Tier 4 — New Elite Threats ──────────────────────────────────
];

export function getEnemy(id: string): EnemyDefinition | undefined {
  return ENEMIES.find((e) => e.id === id);
}
