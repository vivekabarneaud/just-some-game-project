// ─── The folk: every named person, in one shape ─────────────────────────────
// The game keeps its people in four registries that share nothing:
//   founders   `founding_characters.ts`   ids like "edda"
//   adventurers `state.adventurers`        ids like "char_000" (premadeId)
//   NPC allies  `shared/data/npcs.ts`      ids like "corin"
//   merchants   `merchants.ts`             ids like "dominion_peddler_first"
// Father Corin sits in two of them under two ids.
//
// This file does not merge them. It maps each one to a common shape at the edge,
// so the Folk page can draw a card without knowing which registry a person came
// from. A real merge of the id-spaces is a separate job.

import type { GameState } from "~/engine/gameState";
import { FOUNDING_CHARACTERS } from "./founding_characters";
import { TRAVELING_MERCHANTS, type TravelingMerchant } from "./merchants";
import { getPortraitUrl, type Adventurer } from "@medieval-realm/shared/data/adventurers";
import { calcAdventurerMaxHp } from "@medieval-realm/shared/data/expeditionEngine";
import { RANK_NAMES, RANK_COLORS } from "@medieval-realm/shared/data/adventurers";
import { getAilment } from "@medieval-realm/shared/data/ailments";

/** Rank 1..5 to a CardFrame rarity name. This used to live on the guild's
 *  roster tab, which the Folk page replaces. */
export const RANK_FRAME = ["", "common", "uncommon", "rare", "epic", "legendary"];

export type FolkKind = "settler" | "adventurer" | "visitor";

export interface FolkPerson {
  /** Unique inside the page. Prefixed by kind, because the registries collide. */
  key: string;
  /** The id in the person's own registry. */
  id: string;
  kind: FolkKind;
  name: string;
  /** A ready portrait URL, or nothing when the person has no art. */
  portrait?: string;
  /** One short line under the name. A role, a class, or where they come from. */
  line?: string;
  /** Set when the person cannot work right now. The card greys and says this. */
  away?: string;
  /** The live record, for an adventurer. The card draws its bars from this. */
  adventurer?: Adventurer;
  /** The founder record, for a settler. Holds the story and the memories. */
  founderId?: string;
  /** What this person is ill with, if anything. */
  ailment?: { id: string; name: string; icon: string };
  /** Where they work. Empty for a person with no job. */
  worksAt?: string;
  /** Drawn when there is no portrait. A merchant often has only this. */
  icon?: string;
  /** False draws the ??? card and nothing else. The Chronicle census uses it;
   *  on the Folk page every person is known, so it defaults to true. */
  known?: boolean;
  /** The small label in the top corner of the card, with its colour. */
  category?: { label: string; color?: string };
  /** A CardFrame rarity name. Only an adventurer earns one. */
  frame?: string;
}

/** Why an adventurer cannot work. The same reasons the building staffing gives,
 *  so a person reads the same on both screens. */
export function awayReason(a: Adventurer): string | undefined {
  if (!a.alive) return "lost";
  if (a.onMission) return "away on a mission";
  const bad = a.conditions?.some((c) => c.type === "venom" || c.type === "froth");
  if (bad) return "too ill to work";
  // maxHp is derived, never stored, so ask the same helper the staffing asks.
  const max = calcAdventurerMaxHp(a);
  if (max > 0 && (a.currentHp ?? max) / max < 1) return "hurt, and working slow";
  return undefined;
}

/** The six who came from Ashwick. They are always here. */
export function settlers(s: GameState, worksAt: (id: string) => string | undefined): FolkPerson[] {
  return FOUNDING_CHARACTERS.map((f) => {
    const ail = s.folkAilments?.[f.id];
    const def = ail ? getAilment(ail.ailmentId) : undefined;
    return {
      key: `settler:${f.id}`,
      id: f.id,
      kind: "settler" as const,
      name: f.name,
      portrait: f.portrait,
      line: f.role,
      category: { label: "Settler", color: "var(--accent-gold)" },
      founderId: f.id,
      worksAt: worksAt(f.id),
      ...(def ? { ailment: { id: def.id, name: def.name, icon: def.icon } } : {}),
      // An illness does not send a settler away. They are still here, just
      // working badly, so the card stays lit and the line says what is wrong.
    };
  });
}

/** Everyone alive on the roster. The fallen keep their own page. */
export function adventurers(s: GameState): FolkPerson[] {
  return s.adventurers
    .filter((a) => a.alive)
    .map((a) => ({
      key: `adventurer:${a.id}`,
      id: a.id,
      kind: "adventurer" as const,
      name: a.name,
      portrait: getPortraitUrl(a),
      line: a.origin,
      category: { label: RANK_NAMES[a.rank], color: RANK_COLORS[a.rank] },
      frame: RANK_FRAME[a.rank] ?? "common",
      adventurer: a,
      ...(awayReason(a) ? { away: awayReason(a) } : {}),
    }));
}

/** Only the merchant whose stall stands right now. The others are elsewhere,
 *  and the game keeps no record of where. */
export function visitors(s: GameState): FolkPerson[] {
  const id = s.merchantStall?.merchantId;
  if (!id) return [];
  const m = TRAVELING_MERCHANTS.find((x: TravelingMerchant) => x.id === id);
  if (!m) return [];
  return [{
    key: `visitor:${m.id}`,
    id: m.id,
    kind: "visitor" as const,
    name: m.name,
    portrait: m.portrait,
    icon: m.icon,
    line: m.culture,
    category: { label: "Visitor", color: "var(--accent-blue)" },
  }];
}
