/**
 * Co-op expedition resolution.
 *
 * Every server tick we scan active coops whose `deployedAt + duration` has
 * passed. For each one we:
 *   1. Load both players' rosters + adventurer data from their settlements
 *   2. Run the shared expedition engine over the combined team
 *   3. Compute per-adventurer outcomes (HP, deaths, XP)
 *   4. Persist the result as CoopRuntimeState, mark status=complete
 *   5. Emit `coop:update` to both players so their clients pull the result
 *
 * Claiming rewards is a separate action (POST /coop/:id/claim). Server authority
 * stops at "this is what happened"; the client applies deltas to local state
 * when the user accepts the loot modal.
 */

import type {
  CoopRuntimeState,
  CoopAdventurerOutcome,
  CoopRosterEntry,
} from "@medieval-realm/shared";
import type { Adventurer } from "@medieval-realm/shared/data/adventurers";
import { calcStats } from "@medieval-realm/shared/data/adventurers";
import { getEquipmentStats } from "@medieval-realm/shared/data/items";
import { EXPEDITION_POOL, isExpedition } from "@medieval-realm/shared/data/missions";
import { resolveFullExpedition, isTeamWiped } from "@medieval-realm/shared/data/expeditionEngine";
import { prisma } from "../lib/prisma.js";
import { emitMany } from "../lib/eventBus.js";

/** Coop duration tolerance — resolve if deployedAt + duration is past by at least this many ms. */
const RESOLUTION_GRACE_MS = 0;

/**
 * Scan for active coops that have reached their end time and resolve them.
 * Safe to call on every tick — only touches rows whose time is up.
 */
export async function resolveActiveCoops(): Promise<void> {
  const now = Date.now();

  // Fetch candidates with enough context to resolve without extra queries
  const candidates = await prisma.coopExpedition.findMany({
    where: { status: "active", deployedAt: { not: null } },
  });

  for (const row of candidates) {
    try {
      const template = EXPEDITION_POOL.find((t) => t.id === row.expeditionId);
      if (!template || !isExpedition(template)) continue;
      if (!row.deployedAt) continue;

      const endMs = row.deployedAt.getTime() + template.duration * 1000;
      if (now - endMs < RESOLUTION_GRACE_MS) continue; // not yet

      await resolveCoop(row.id);
    } catch (err) {
      console.error(`[coop] Resolution failed for ${row.id}:`, err);
    }
  }
}

async function resolveCoop(coopId: string): Promise<void> {
  // Re-read with a fresh snapshot in case tick loops overlapped
  const row = await prisma.coopExpedition.findUnique({ where: { id: coopId } });
  if (!row || row.status !== "active" || !row.deployedAt) return;

  const template = EXPEDITION_POOL.find((t) => t.id === row.expeditionId);
  if (!template || !isExpedition(template)) return;

  const hostRoster = parseRoster(row.hostRoster);
  const guestRoster = parseRoster(row.guestRoster);

  const [hostTeam, guestTeam] = await Promise.all([
    loadTeamFromSettlement(row.hostId, hostRoster.adventurerIds),
    loadTeamFromSettlement(row.guestId, guestRoster.adventurerIds),
  ]);

  if (hostTeam.length + guestTeam.length === 0) {
    // Nothing to resolve — mark complete with empty result so it clears from the UI
    await markEmpty(coopId, [row.hostId, row.guestId]);
    return;
  }

  const combinedTeam = [...hostTeam, ...guestTeam];
  const combinedSupplies = { ...hostRoster.supplies, ...guestRoster.supplies };

  // Seed derived from coopId — both players' resolution is deterministic for the same state
  const seed = hashSeed(coopId);
  const res = resolveFullExpedition(template, combinedTeam, combinedSupplies, seed);

  const advResults: Record<string, CoopAdventurerOutcome[]> = {
    [row.hostId]: computeOutcomes(template, combinedTeam, hostTeam, res.hpMap, res.maxHpMap, res.wiped),
    [row.guestId]: computeOutcomes(template, combinedTeam, guestTeam, res.hpMap, res.maxHpMap, res.wiped),
  };

  const success = !res.wiped && !isTeamWiped(combinedTeam, res.hpMap);

  const runtimeState: CoopRuntimeState = {
    rewards: res.rewards.map((r) => ({ resource: r.resource as string, amount: r.amount })),
    log: res.log.map((l) => ({ kind: l.kind, summary: l.summary, icon: l.icon, success: l.success })),
    wiped: res.wiped,
    advResults,
    success,
  };

  await prisma.coopExpedition.update({
    where: { id: coopId },
    data: {
      status: "complete",
      completedAt: new Date(),
      runtimeState: runtimeState as any,
    },
  });

  emitMany([row.hostId, row.guestId], { type: "coop:update", coopId });
  console.log(`[coop] Resolved ${coopId} — success=${success}, wiped=${res.wiped}, rewards=${runtimeState.rewards.length}`);
}

/**
 * Compute per-player adventurer outcomes. XP is calculated using the same
 * formula as solo missions: (base × slots / deployedSize) × WIS bonus × trait bonus.
 * Both players' adventurers share the same deployedSize (combined team).
 */
function computeOutcomes(
  template: any,
  combinedTeam: Adventurer[],
  myTeam: Adventurer[],
  hpMap: Record<string, number>,
  maxHpMap: Record<string, number>,
  wiped: boolean,
): CoopAdventurerOutcome[] {
  const out: CoopAdventurerOutcome[] = [];
  const totalSlots = template.slots?.length ?? combinedTeam.length;
  const deployedSize = Math.max(1, combinedTeam.length);
  const baseXp = getMissionXp(template.difficulty, !wiped);
  const perAdvBase = (baseXp * totalSlots) / deployedSize;

  for (const adv of myTeam) {
    const hp = hpMap[adv.id] ?? 0;
    const died = hp <= 0;
    const xpGained = died ? 0 : computeAdvXp(adv, perAdvBase);
    out.push({
      id: adv.id,
      finalHp: Math.max(0, hp),
      maxHp: maxHpMap[adv.id] ?? 0,
      died,
      xpGained,
    });
  }
  return out;
}

function computeAdvXp(adv: Adventurer, perAdvBase: number): number {
  const equipStats = getEquipmentStats(adv.equipment);
  const stats = calcStats(adv, equipStats);
  const wisBonus = 1 + stats.wis * 0.02;
  const traitBonus = adv.trait === "quick_learner" ? 1.10 : 1;
  return Math.floor(perAdvBase * wisBonus * traitBonus);
}

/** Mission-XP curve: failure yields 40% of success. Mirrors frontend's getMissionXp. */
function getMissionXp(difficulty: number, success: boolean): number {
  // Matches the frontend table — keep in sync when that changes.
  const xpBySuccessDifficulty = [0, 10, 25, 50, 100, 200];
  const xp = xpBySuccessDifficulty[Math.min(5, Math.max(0, difficulty))] ?? 100;
  return success ? xp : Math.floor(xp * 0.4);
}

async function loadTeamFromSettlement(playerId: string, adventurerIds: string[]): Promise<Adventurer[]> {
  if (adventurerIds.length === 0) return [];
  const settlement = await prisma.settlement.findFirst({
    where: { playerId },
    orderBy: { updatedAt: "desc" },
    select: { gameState: true },
  });
  if (!settlement) return [];
  const state = settlement.gameState as any;
  const advs: Adventurer[] = Array.isArray(state?.adventurers) ? state.adventurers : [];
  const byId = new Map(advs.map((a) => [a.id, a]));
  return adventurerIds
    .map((id) => byId.get(id))
    .filter((a): a is Adventurer => !!a && a.alive !== false);
}

function parseRoster(v: unknown): CoopRosterEntry {
  if (!v || typeof v !== "object") return { adventurerIds: [], supplies: {} };
  const obj = v as any;
  return {
    adventurerIds: Array.isArray(obj.adventurerIds) ? obj.adventurerIds.filter((x: any) => typeof x === "string") : [],
    supplies: typeof obj.supplies === "object" && obj.supplies !== null ? obj.supplies : {},
  };
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

async function markEmpty(coopId: string, playerIds: string[]): Promise<void> {
  const state: CoopRuntimeState = {
    rewards: [], log: [], wiped: true, advResults: {}, success: false,
  };
  await prisma.coopExpedition.update({
    where: { id: coopId },
    data: { status: "complete", completedAt: new Date(), runtimeState: state as any },
  });
  emitMany(playerIds, { type: "coop:update", coopId });
}
