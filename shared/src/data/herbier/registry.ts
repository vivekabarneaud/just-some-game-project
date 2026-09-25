// ─── The Herbier — one list of every plant the settlement knows ─────────────
// The Lord's book covers what he FINDS, not what he sows. Nobody misidentifies a
// cabbage they planted, and identification is the book's whole purpose — so the
// farmed crops and the orchard stay out, and so do the reagents on the alchemy
// shelf that never grew at all (bone, tusk shard, serpent fang, snake oil, and
// honey, which is a bee's work rather than a plant's).
//
// Three sources, which between them have no id collisions at all:
//   FORAGE_PLANTS  (23) — what grows in the woods, decoys included
//   INGREDIENTS    (14 of 19 are plants) — what goes on the alchemy shelf
//   HERBS          — the stragglers with no ingredient page, which arrive by
//                    mission and trade rather than by hand
//
// See docs/design/world/FORAGING_MINIGAME.md §4.

import { FORAGE_PLANTS } from "../foraging/plants.js";
import type { ForagePlant } from "../foraging/types.js";
import { INGREDIENTS } from "../alchemy/ingredients.js";
import type { Ingredient } from "../alchemy/types.js";
import { HERBS } from "../herbs.js";
import { FOOD_INGREDIENTS } from "../kitchen/ingredients.js";
import type { FoodIngredient } from "../kitchen/types.js";

/** Things on the alchemy shelf that never grew. They have brewing pages on the
 *  desk book; they do not belong in a herbarium. */
const NOT_PLANTS = new Set(["bone", "snake_oil", "serpent_fang", "tusk_shard", "honey"]);

/** Which part of the book an entry sits in. Ordering only — the grid groups by
 *  this so a reader can find a thing, and so a decoy lands beside what it apes. */
export type HerbierGroup = "mushroom" | "green" | "fruit" | "herb";

export interface HerbierPlant {
  id: string;
  name: string;
  icon: string;
  group: HerbierGroup;
  /** Found in the woods: carries the mimic, the size, and Edda's line. */
  forage?: ForagePlant;
  /** On the alchemy shelf: carries the technique table. */
  alchemy?: Ingredient;
  /** In the larder: carries the cooking stats. */
  kitchen?: FoodIngredient;
  /** This one is the impostor, and this is what it apes. */
  mimicOf?: string;
  /** This one is the real thing, and these wear its face. */
  mimickedBy: string[];
}

const MUSHROOM_HINTS = ["mushroom", "bolete", "morel", "chanterelle", "agaric", "dapperling", "galerina", "shank", "judas_ear", "parasol", "cepe"];
const FRUIT_HINTS = ["berry", "rosehip"];

function groupOf(id: string, forage?: ForagePlant): HerbierGroup {
  if (MUSHROOM_HINTS.some((h) => id.includes(h))) return "mushroom";
  if (FRUIT_HINTS.some((h) => id.includes(h))) return "fruit";
  // Anything from the woods that is not a fungus or a fruit is something you
  // pull up or pick: greens, roots, and the two that will kill you.
  return forage ? "green" : "herb";
}

function build(): HerbierPlant[] {
  const by = new Map<string, HerbierPlant>();
  const kitchenById = new Map(FOOD_INGREDIENTS.map((f) => [f.id, f]));

  const add = (id: string, name: string, icon: string, patch: Partial<HerbierPlant>) => {
    const cur = by.get(id);
    if (cur) { Object.assign(cur, patch); return; }
    by.set(id, { id, name, icon, group: "herb", mimickedBy: [], ...patch });
  };

  for (const p of FORAGE_PLANTS) {
    add(p.id, p.name, p.icon, {
      forage: p,
      group: groupOf(p.id, p),
      // A foraged plant's `yields` is its own id in every case today, so the
      // larder entry is found under the same name. Guarded anyway.
      kitchen: p.yields ? kitchenById.get(p.yields) : undefined,
      ...(p.mimics ? { mimicOf: p.mimics } : {}),
    });
  }
  for (const ing of INGREDIENTS) {
    if (NOT_PLANTS.has(ing.id)) continue;
    add(ing.id, ing.name, ing.icon, { alchemy: ing, group: groupOf(ing.id) });
  }
  for (const h of HERBS) {
    if (by.has(h.id)) continue; // already covered as a forage plant or an ingredient
    add(h.id, h.name, h.icon, { group: groupOf(h.id) });
  }

  // Reverse the mimic index, so the real plant knows who wears its face. Built
  // here rather than authored, so the two halves can never disagree.
  for (const p of by.values()) {
    if (!p.mimicOf) continue;
    by.get(p.mimicOf)?.mimickedBy.push(p.id);
  }
  return [...by.values()];
}

export const HERBIER_PLANTS: HerbierPlant[] = build();

const BY_ID = new Map(HERBIER_PLANTS.map((p) => [p.id, p]));
export const getHerbierPlant = (id: string): HerbierPlant | undefined => BY_ID.get(id);
export const isHerbierPlant = (id: string): boolean => BY_ID.has(id);

/** The order the book runs in: by section, and inside a section a decoy sits
 *  directly after the plant it apes, so the pair never drifts apart however the
 *  grid wraps. Everything else falls in by name. */
const GROUP_ORDER: HerbierGroup[] = ["mushroom", "green", "fruit", "herb"];

export function herbierOrder(): HerbierPlant[] {
  // An impostor borrows its victim's name to sort by, then sits just behind it.
  const anchor = (p: HerbierPlant): string =>
    p.mimicOf ? (BY_ID.get(p.mimicOf)?.name ?? p.name) : p.name;
  return [...HERBIER_PLANTS].sort((a, b) => {
    const ga = GROUP_ORDER.indexOf(a.group), gb = GROUP_ORDER.indexOf(b.group);
    if (ga !== gb) return ga - gb;
    const na = anchor(a), nb = anchor(b);
    if (na !== nb) return na.localeCompare(nb);
    // Same anchor: the real thing first, its impostor immediately after.
    return (a.mimicOf ? 1 : 0) - (b.mimicOf ? 1 : 0);
  });
}
