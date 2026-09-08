// ─── Tavern guests (flavor) ──────────────────────────────────────
// The tavern's occupancy is an abstract fill number; this turns the occupied
// beds into a small, charming "who's staying tonight" list. Purely cosmetic and
// DERIVED (no persistent guest state) — deterministic from a seed so it reads
// stable within a period instead of reshuffling every render.

type TavernGuestKind = "traveler" | "notable" | "citizen";

export interface TavernGuest {
  kind: TavernGuestKind;
  icon: string;
  label: string;
}

// The road-folk who make up most of a frontier tavern's custom.
const TRAVELERS: Omit<TavernGuest, "kind">[] = [
  { icon: "🧳", label: "a road-weary trader" },
  { icon: "🎒", label: "a peddler and his mule" },
  { icon: "🧭", label: "a pilgrim bound south" },
  { icon: "🐴", label: "a messenger resting his horse" },
  { icon: "🧕", label: "a family on the move" },
  { icon: "🪕", label: "a minstrel working for supper" },
  { icon: "🧑‍🌾", label: "a drover between markets" },
  { icon: "🥾", label: "a hooded wanderer, saying little" },
  { icon: "⚒️", label: "a pair of tinkers" },
  { icon: "📜", label: "a scribe copying the road" },
];

// Rarer, more notable custom — the kind of guest people talk about.
const NOTABLES: Omit<TavernGuest, "kind">[] = [
  { icon: "💰", label: "a merchant quietly weighing the market" },
  { icon: "🗺️", label: "a cartographer mapping the frontier" },
  { icon: "🎭", label: "a travelling player, full of stories" },
  { icon: "⚔️", label: "a sellsword between contracts" },
];

// Occasionally, one of the settlement's own — between roofs, warming by the fire.
const CITIZENS: Omit<TavernGuest, "kind">[] = [
  { icon: "🏚️", label: "one of our own, waiting on a cottage" },
  { icon: "🔥", label: "a farmhand glad of a warm corner" },
];

/** Stable 0..1 hash. */
function hash01(n: number): number {
  const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * Derive the guests filling `beds` occupied rooms, seeded so the roster is
 * stable within a period. Mostly travelers, an occasional notable, a rare
 * settlement citizen. No two adjacent guests repeat the same label when it can
 * be helped.
 */
export function deriveTavernGuests(beds: number, seed: number): TavernGuest[] {
  const out: TavernGuest[] = [];
  for (let i = 0; i < beds; i++) {
    const roll = hash01(seed * 31.7 + i * 7.13);
    const [kind, pool]: [TavernGuestKind, Omit<TavernGuest, "kind">[]] =
      roll < 0.12 ? ["notable", NOTABLES]
      : roll < 0.20 ? ["citizen", CITIZENS]
      : ["traveler", TRAVELERS];
    let idx = Math.floor(hash01(seed * 17.1 + i * 13.7) * pool.length) % pool.length;
    // Nudge off an immediate duplicate label.
    if (out.length && out[out.length - 1].label === pool[idx].label) idx = (idx + 1) % pool.length;
    out.push({ kind, ...pool[idx] });
  }
  return out;
}
