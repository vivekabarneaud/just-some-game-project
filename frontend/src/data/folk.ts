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

import { getBuildingStaffing, buildingOfFounder, type GameState } from "~/engine/gameState";
import { BUILDINGS, BUILDING_STAFF } from "./buildings";
import { FOUNDING_CHARACTERS } from "./founding_characters";
import { TRAVELING_MERCHANTS, type TravelingMerchant } from "./merchants";
import {
  getPortraitUrl, RANK_NAMES, RANK_COLORS, type Adventurer,
} from "@medieval-realm/shared/data/adventurers";
import { calcAdventurerMaxHp } from "@medieval-realm/shared/data/expeditionEngine";
import { getAilment } from "@medieval-realm/shared/data/ailments";
import { getUnspentTalentPoints } from "./talents";

/** Rank 1..5 to a CardFrame rarity name. This used to live on the guild's
 *  roster tab, which the Folk page replaces. */
export const RANK_FRAME = ["", "common", "uncommon", "rare", "epic", "legendary"];

export type FolkKind = "settler" | "adventurer" | "visitor";

/** A dot and a line. The card shows two of these: how the person is, and what
 *  they do. The dot carries the reading at a glance; the line says why. */
export type Dot = "good" | "fair" | "bad" | "idle";
export interface FolkStatus {
  dot: Dot;
  text: string;
}

export const DOT_COLOR: Record<Dot, string> = {
  good: "var(--accent-green)",
  fair: "var(--accent-gold)",
  bad: "var(--accent-red)",
  idle: "var(--text-muted)",
};

export interface FolkPerson {
  /** Unique inside the page. Prefixed by kind, because the registries collide. */
  key: string;
  /** The id in the person's own registry. */
  id: string;
  kind: FolkKind;
  name: string;
  /** A ready portrait URL, or nothing when the person has no art. */
  portrait?: string;
  /** Drawn when there is no portrait. A merchant often has only this. */
  icon?: string;
  /** One short line under the name, in the popin. A role, a class, or a
   *  homeland. The CARD does not draw it: the two status lines say more. */
  line?: string;
  /** How the person is. */
  health: FolkStatus;
  /** What the person does. */
  work: FolkStatus;
  /** Something the player could do about this person, when there is one.
   *  Unspent talent points, empty gear slots. Absent when there is nothing. */
  nudge?: FolkStatus;
  /** Set when the person cannot work right now. The card greys on this. */
  away?: string;
  /** The live record, for an adventurer. The card draws its bars from this. */
  adventurer?: Adventurer;
  /** The founder record, for a settler. Holds the story and the memories. */
  founderId?: string;
  /** What this person is ill with, if anything. */
  ailment?: { id: string; name: string; icon: string };
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

/** Which building an adventurer is posted to, if any. The founder half of this
 *  pair lives in `gameState.tsx`, beside the table both read. */
export function buildingOfAdventurer(premadeId: string | undefined): string | undefined {
  if (!premadeId) return undefined;
  for (const [bid, cfg] of Object.entries(BUILDING_STAFF)) {
    if (cfg.adventurers?.includes(premadeId)) return bid;
  }
  return undefined;
}

const buildingName = (bid: string) => BUILDINGS.find((b) => b.id === bid)?.name ?? bid;
const levelOf = (s: GameState, bid: string) =>
  s.buildings?.find((b) => b.buildingId === bid)?.level ?? 0;

/** The work line for anybody posted to a building.
 *
 *  The percentage is the share of a full worker's pace they pull, which is the
 *  same number the building turns into production. A hurt or ill worker reads
 *  under 100 here before the player sees the yield fall. */
function postedTo(s: GameState, bid: string, personId: string): FolkStatus | undefined {
  const level = levelOf(s, bid);
  if (level <= 0) return { dot: "idle", text: `The ${buildingName(bid)} is not built yet` };
  const member = getBuildingStaffing(s, bid, level).named.find((n) => n.id === personId);
  if (!member) return undefined;
  const pct = Math.round(member.effectiveness * 100);
  return {
    dot: pct >= 100 ? "good" : pct > 0 ? "fair" : "bad",
    text: `Works at the ${buildingName(bid)} (${pct}%)`,
  };
}

/** The six who came from Ashwick. They are always here. */
export function settlers(s: GameState): FolkPerson[] {
  return FOUNDING_CHARACTERS.map((f) => {
    const ail = s.folkAilments?.[f.id];
    const def = ail ? getAilment(ail.ailmentId) : undefined;
    const bid = buildingOfFounder(f.id);

    const health: FolkStatus = def
      ? {
          // A heavy ailment reads red. A cut or a chill is amber: it slows the
          // work, it does not stop it.
          dot: def.workPenalty >= 0.4 ? "bad" : "fair",
          text: `Has ${def.name.toLowerCase()}, ${Math.max(1, Math.round(ail!.hoursRemaining))}h left`,
        }
      : { dot: "good", text: "Healthy" };

    const work: FolkStatus =
      (bid ? postedTo(s, bid, f.id) : undefined) ??
      // Three founders hold no trade at all: the Lord, Nell and Father Corin.
      { dot: "idle", text: "No set trade. Helps where help is needed" };

    return {
      key: `settler:${f.id}`,
      id: f.id,
      kind: "settler" as const,
      name: f.name,
      portrait: f.portrait,
      line: f.role,
      category: { label: "Settler", color: "var(--accent-gold)" },
      founderId: f.id,
      health,
      work,
      ...(def ? { ailment: { id: def.id, name: def.name, icon: def.icon } } : {}),
      // An illness does not send a settler away. They are still here, only
      // working badly, so the card stays lit and the health line says what hurts.
    };
  });
}

/** Everyone alive on the roster. The fallen keep their own page. */
export function adventurers(s: GameState): FolkPerson[] {
  return s.adventurers
    .filter((a) => a.alive)
    .map((a) => {
      const max = calcAdventurerMaxHp(a);
      const hpPct = max > 0 ? Math.round(((a.currentHp ?? max) / max) * 100) : 100;
      const grave = a.conditions?.some((c) => c.type === "venom" || c.type === "froth");

      const health: FolkStatus = grave
        ? { dot: "bad", text: "Too ill to work. Only a cure clears it" }
        : hpPct < 100
          ? { dot: "fair", text: `Wounded (${hpPct}% health)` }
          : { dot: "good", text: "Healthy" };

      const bid = buildingOfAdventurer(a.premadeId);
      const work: FolkStatus = a.onMission
        ? { dot: "fair", text: "Away on a mission" }
        : (bid ? postedTo(s, bid, a.premadeId!) : undefined) ??
          { dot: "idle", text: "In the settlement, with no post" };

      // One line for "there is something for you to do here". It replaces the
      // XP bar, the HP bar, the trait badge and the gear icons that used to
      // crowd the bottom of the card.
      //
      // Empty gear slots are NOT one of these. Early on a hero has eleven of
      // them and no gear to put in any, so the line sat on every card saying
      // nothing the player could act on. A talent point is the opposite: rare,
      // earned, and spendable the moment it appears.
      const points = getUnspentTalentPoints(a);
      const nudge: FolkStatus | undefined = points > 0
        ? { dot: "fair", text: `${points} talent point${points > 1 ? "s" : ""} to spend` }
        : undefined;

      return {
        key: `adventurer:${a.id}`,
        id: a.id,
        kind: "adventurer" as const,
        name: a.name,
        portrait: getPortraitUrl(a),
        line: a.origin,
        category: { label: RANK_NAMES[a.rank], color: RANK_COLORS[a.rank] },
        frame: RANK_FRAME[a.rank] ?? "common",
        adventurer: a,
        health,
        work,
        ...(nudge ? { nudge } : {}),
        ...(awayReason(a) ? { away: awayReason(a) } : {}),
      };
    });
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
    // The stall closes at the next 3AM, so the honest line is the morning, not
    // a count of hours.
    health: { dot: "good", text: "Passing through" },
    work: { dot: "good", text: "At the market stall until morning" },
  }];
}
