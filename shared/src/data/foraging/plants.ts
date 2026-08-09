// ─── Foraging — what grows in the woods ─────────────────────────────────────
// A starter set for the sandbox, drawn from foods/herbs that already exist in
// the economy plus the decoys the design calls for. Real items yield into the
// larder; decoys yield nothing and simply teach you what they were.
// See docs/DESIGN_FORAGING_MINIGAME.md §5-§8.

import type { ForagePlant } from "./types.js";

export const FORAGE_PLANTS: ForagePlant[] = [
  // ── Mushrooms (never raw, and two of them have dangerous twins) ──
  { id: "field_mushroom", name: "Field Mushroom", icon: "🍄", yields: "field_mushroom",
    note: "Common as grass, and still good in the pan.",
    clump: 3, rainFlush: 5,
    size: [0.6, 0.95], grows: ["litter", "grass"],
    cap: { spring: 6, summer: 8, autumn: 12 }, regrow: 0.5 },
  { id: "morel", name: "Morel", icon: "🍄", yields: "morel",
    note: "Spring's honeycomb prize. Never eaten raw.",
    clump: 3,
    size: [0.7, 1.1], grows: ["wood", "litter"],
    cap: { spring: 5 }, regrow: 0.2 },
  { id: "chanterelle", name: "Chanterelle", icon: "🍄", yields: "chanterelle", artVariants: 3,
    note: "Golden, and faintly of apricots. The forager's reward.",
    clump: 5, rainFlush: 8,
    size: [0.55, 1.0], grows: ["wood", "litter"],
    cap: { summer: 4, autumn: 10 }, regrow: 0.3 },
  { id: "cepe", name: "King Bolete", icon: "🍄", yields: "cepe", artId: "king_bolete", artVariants: 3,
    note: "The king of the wood. Thick, nutty, and hoarded. A fat pale stalk with a fine net near the top, and cream pores beneath.",
    clump: 2, rainFlush: 3,
    size: [0.9, 1.5], grows: ["wood"],
    cap: { autumn: 4 }, regrow: 0.06 },

  // The parasol pair is the one place where SIZE is the tell, exactly as it is
  // in the real world: a true coulemelle stands a hand-span and more, while the
  // deadly dapperlings that kill people every year are small and squat. So
  // these two are deliberately drawn at very different heights, unlike every
  // other lookalike pair here.
  { id: "parasol", name: "Parasol Mushroom", icon: "🍄", yields: "parasol",
    clump: 3,
    size: [1.6, 2.6], grows: ["grass", "litter"],
    note: "A coulemelle, tall as a hand-span, with a shaggy cap and a ring you can slide up and down the stalk. One of the great finds, and it fills a pan on its own.",
    cap: { summer: 4, autumn: 7 }, regrow: 0.2 },

  // ── Wild greens ──
  { id: "dandelion", name: "Dandelion", icon: "🌼", yields: "dandelion",
    note: "Bitter leaves from the yard's edge. Better than it sounds, and better than nothing.",
    clump: 3,
    size: [0.7, 1.1], grows: ["grass"],
    cap: { spring: 12, summer: 10, autumn: 5 }, regrow: 0.8 },
  { id: "sorrel", name: "Sorrel", icon: "🌿", yields: "sorrel",
    note: "Sharp and lemony. It wakes up a dull pot.",
    clump: 4,
    size: [0.7, 1.05], grows: ["grass"],
    cap: { spring: 9, summer: 7 }, regrow: 0.6 },
  { id: "ramsons", name: "Ramsons", icon: "🧄", yields: "ramsons", artVariants: 3,
    note: "Wild garlic from the spring woods. It lifts whatever it touches.",
    clump: 6,
    size: [1.6, 2.4], grows: ["litter", "wood"],
    cap: { spring: 10 }, regrow: 0.5 },
  { id: "wild_carrot", name: "Wild Carrot", icon: "🥕", yields: "wild_carrot",
    note: "A thin, pale root. Sweeter than it looks.",
    clump: 2,
    size: [1.0, 1.5], grows: ["grass"],
    cap: { summer: 7, autumn: 5 }, regrow: 0.4 },

  // ── The hedgerow. The bush is scenery; the fruit on it is the find. ──
  { id: "bramble", name: "Bramble", icon: "🌿", yields: null, scenery: true, artVariants: 1, aspect: 1,
    size: [3.2, 4.6], clump: 1,
    grows: ["litter", "grass"],
    note: "A bramble thicket. Thorns, mostly.",
    cap: { spring: 2, summer: 3, autumn: 3 }, regrow: 0.05 },

  // ── Wild berries + the hedgerow ──
  { id: "blackberry", name: "Blackberry", icon: "🫐", yields: "blackberry", host: "bramble",
    note: "Hedgerow-dark and seedy, paid for in scratched arms.",
    clump: 4,
    size: [0.7, 1.05], grows: ["litter", "grass"],
    cap: { summer: 8, autumn: 12 }, regrow: 0.7 },
  { id: "blueberry", name: "Blueberry", icon: "🫐", yields: "blueberry",
    note: "Small, sweet, and blue to the fingers.",
    clump: 4,
    size: [0.6, 0.9], grows: ["litter"],
    cap: { summer: 12 }, regrow: 0.7 },
  { id: "raspberry", name: "Raspberry", icon: "🫐", yields: "raspberry",
    note: "Soft and tart, and gone in a day.",
    clump: 4,
    size: [0.7, 1.05], grows: ["litter", "grass"],
    cap: { summer: 9 }, regrow: 0.6 },
  { id: "rosehip", name: "Rosehip", icon: "🌹", yields: "rosehip",
    note: "The scarlet hip of the wild rose. Not for eating raw, but it cooks into a warming jam.",
    clump: 3,
    size: [0.9, 1.35], grows: ["grass", "litter"],
    cap: { autumn: 8, winter: 4 }, regrow: 0.25 },

  // ── Real, and dangerous. We WANT this one in the basket (it's a poison
  //    ingredient), so it yields — it just isn't food. ──
  { id: "hemlock", name: "Hemlock", icon: "☠️", yields: "hemlock", mimics: "wild_carrot",
    note: "Hemlock, and you carried it home in a basket of supper. Smooth stem, purple blotches. The carrot's is hairy.",
    clump: 2,
    size: [1.0, 1.5], grows: ["grass"],
    cap: { summer: 4, autumn: 3 }, regrow: 0.3 },

  // ── Decoys: scene-only. They cost a basket slot and teach you the tell.
  //    Deliberately NOT items — no id in the larder, no RewardType, nothing. ──
  { id: "false_chanterelle", name: "False Chanterelle", icon: "🍄", yields: null, mimics: "chanterelle", artVariants: 3,
    note: "Not a chanterelle. True ones have blunt forked ridges running down the stem; this has proper flat gills.",
    clump: 4, rainFlush: 6,
    size: [0.55, 1.0], grows: ["wood", "litter"],
    cap: { summer: 3, autumn: 6 }, regrow: 0.4 },
  { id: "bitter_bolete", name: "Bitter Bolete", icon: "🍄", yields: null, mimics: "cepe", artVariants: 3,
    clump: 2, rainFlush: 3,
    size: [0.9, 1.5], grows: ["wood"],
    note: "Not a King Bolete. The folk call this one dog-piss, and a single cap will turn a whole pot bitter. Look at the stalk: the king wears a fine pale net near the top, this one a coarse dark net all the way down. Turn it over and its pores blush pink where his stay cream.",
    cap: { autumn: 5 }, regrow: 0.3 },
  { id: "deadly_dapperling", name: "Deadly Dapperling", icon: "🍄", yields: null, mimics: "parasol",
    clump: 3,
    size: [0.4, 0.75], grows: ["grass", "litter"],
    note: "A dapperling, and it would have killed the lot of us. Go by size before anything else: a true coulemelle stands a hand-span and more, this squats no taller than your thumb. Its ring is fixed to the stalk, too, where the parasol's slides.",
    cap: { summer: 3, autumn: 5 }, regrow: 0.35 },
  { id: "false_morel", name: "False Morel", icon: "🍄", yields: null, mimics: "morel",
    note: "Not a morel. A true morel is pitted like a honeycomb and hollow all the way down; this one is lobed, like a brain.",
    clump: 2,
    size: [0.7, 1.1], grows: ["wood", "litter"],
    cap: { spring: 4 }, regrow: 0.25 },
  { id: "lily_of_the_valley", name: "Lily of the Valley", icon: "🌱", yields: null, mimics: "ramsons", artVariants: 3,
    note: "Lily of the valley, which would have stopped a heart. Ramsons smell of garlic and grow one leaf to a stem; these come in pairs and smell of nothing.",
    clump: 5,
    size: [1.6, 2.4], grows: ["litter", "wood"],
    cap: { spring: 5 }, regrow: 0.4 },
];

const BY_ID = new Map(FORAGE_PLANTS.map((p) => [p.id, p]));
export const getForagePlant = (id: string): ForagePlant | undefined => BY_ID.get(id);
/** A decoy yields nothing: it goes in the bin, and into the herbier. */
export const isDecoy = (id: string): boolean => BY_ID.get(id)?.yields == null;
