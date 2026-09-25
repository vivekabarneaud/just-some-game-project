// ─── The Herbier — the Lord's book of plants ────────────────────────────────
// A former schoolmaster keeps a notebook. Edda has the herb knowledge, but she
// is the midwife AND works the forager's hut, so she has no time to be anyone's
// tooltip: he brings her the basket, she tells him what he nearly ate, and he
// writes his own book.
//
// A page holds the plant's name, his drawing, Edda's line — and nothing else
// until he has TRIED something. Each technique he actually performs adds a line.
// See docs/design/world/FORAGING_MINIGAME.md §4 and docs/IDEAS.md (Herbalist
// discovery); this module is the merge of those two ideas.
//
// Pure and state-free on purpose: it takes the two flat string[] the save holds
// and answers questions about them, so all of it is testable without a DOM.

import type { Ingredient, LawId, Technique } from "./types.js";
import { LIVE_TECHNIQUES } from "./types.js";
import { describeEffectParts } from "./describe.js";
import { NAMED_RECIPES, type NamedRecipe } from "./named_recipes.js";
import { recipeIdFor } from "./brew.js";

/** The save stores tried pairs as flat strings, the same shape as
 *  `discoveredEnemies`, because a save must stay JSON (no Set, no Map). */
export function triedKey(ingredientId: string, technique: Technique): string {
  return `${ingredientId}:${technique}`;
}

/** What one line of a page says. `virtue` is the effect he found; `barren` is
 *  the equally real finding that this plant was never made for this treatment. */
export interface HerbierLine {
  technique: Technique;
  barren: boolean;
  label: string;
  detail?: string;
}

/** One page of the book. `lines` holds only what he has actually tried, in the
 *  book's own technique order, so a page never advertises a treatment he cannot
 *  perform — which is what keeps it honest while five stations are unbuilt. */
export interface HerbierPage {
  ingredient: Ingredient;
  lines: HerbierLine[];
  /** Named recipes he has discovered that use this plant. See recipesFor. */
  recipes: NamedRecipe[];
  /** Every live technique tried. Only then does the plant give up its signature. */
  complete: boolean;
  /** The classic preparation, withheld until the page is complete. */
  signature?: Technique;
}

/** Build a page. `tried` is the player's cumulative set of "<id>:<technique>". */
export function buildPage(
  ing: Ingredient,
  tried: ReadonlySet<string>,
  discoveredRecipes: ReadonlySet<string> = new Set(),
): HerbierPage {
  const lines: HerbierLine[] = [];
  for (const technique of LIVE_TECHNIQUES) {
    if (!tried.has(triedKey(ing.id, technique))) continue;
    const effects = ing.techniques[technique];
    if (!effects || effects.length === 0) {
      // He tried it and nothing came of it. That IS knowledge, and it is the
      // only thing standing between this book and a great many blank pages.
      lines.push({ technique, barren: true, label: `Nothing to be had this way.` });
      continue;
    }
    for (const e of effects) {
      const { label, detail } = describeEffectParts(e);
      lines.push({ technique, barren: false, label, detail });
    }
  }
  const complete = LIVE_TECHNIQUES.every((t) => tried.has(triedKey(ing.id, t)));
  return {
    ingredient: ing, lines, complete,
    recipes: recipesFor(ing.id, discoveredRecipes),
    ...(complete ? { signature: ing.signature } : {}),
  };
}

/** Which named recipes this plant belongs to, out of the ones he has actually
 *  discovered. The engine has NO plant-to-plant synergy — every interaction in
 *  brew.ts is role-level (a hero wants a base), modifier-level (honey lifts the
 *  pot) or channel-level (the same virtue twice diminishes). The nearest real
 *  thing to "these two work together" is a named recipe, so the page points at
 *  the recipe book rather than inventing a mechanic that does not exist.
 *
 *  `discovered` is the key set of state.alchemyRecipes. */
export function recipesFor(ingredientId: string, discovered: ReadonlySet<string>): NamedRecipe[] {
  return NAMED_RECIPES.filter(
    (r) => r.placements.some((pl) => pl.ingredientId === ingredientId) && discovered.has(recipeIdFor(r.placements)),
  );
}

/** Has he drawn this plant yet? A page exists from the moment the plant is in
 *  hand — that is when he would sit down and draw it — and the lines come later. */
export function hasPage(pages: readonly string[] | undefined, ingredientId: string): boolean {
  return !!pages?.includes(ingredientId);
}

/** The four laws of the craft, written in the front of the book. These are about
 *  how a MIXTURE behaves, not what one plant does, which is why they live here
 *  and not on a page: knowing mugwort is a hero is worthless until you know that
 *  a hero wants a base. Each is learned by feeling it go wrong. */
export const HERBIER_LAWS: { id: LawId; title: string; text: string }[] = [
  {
    id: "base",
    title: "On bases",
    text: "A strong herb on its own comes out harsh and thin. It wants something mild underneath to carry it, the way a broth carries a bone. Chamomile will do it. So will lavender.",
  },
  {
    id: "catalyst",
    title: "On catalysts",
    text: "Some things do nothing by themselves and yet lift everything around them. A spoon of honey in the pot and the whole brew speaks louder, though the honey never says a word of its own.",
  },
  {
    id: "stacking",
    title: "On stacking",
    text: "Twice the herb is not twice the virtue. The second measure gives less than the first, and the third less again. Five of a good thing in one pot is four of them wasted.",
  },
  {
    id: "wildcard",
    title: "On wildcards",
    text: "There are plants that will not be told what to do. They give more than they are asked for, and something else besides, and not always the something you wanted.",
  },
];
