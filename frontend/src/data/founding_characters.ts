// ─── Founding Cast ───────────────────────────────────────────────
// The six settlers who founded the Lord's settlement together.
//
// Design: coreBio is a minimal nameplate — name, role, one baseline
// fact. Everything the player "discovers" about a founder — history,
// secrets, relationships, the texture — lives in fragments. Fragments
// unlock through quest and chronicle events, accumulating on the
// character page over the course of play.
//
// Source of truth for all character lore: docs/FOUNDING_CHARACTERS.md.
// Fragments are scenes from the Lord's journal, written in his voice.

export interface BioFragment {
  id: string;
  text: string;
}

export interface FoundingCharacter {
  id: string;
  name: string;
  age?: number;
  role: string;
  /** CDN portrait URL. */
  portrait: string;
  /** Always-visible character summary. Shown at the top of the character page. */
  coreBio: string;
  /** Unlockable flavor fragments. Shown in unlock order as the player accumulates them. */
  fragments: BioFragment[];
}

const CDN_CAST = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories";

export const FOUNDING_CHARACTERS: FoundingCharacter[] = [
  {
    id: "the_lord",
    name: "The Lord",
    age: 37,
    role: "Settlement founder · former schoolmaster of Ashwick",
    portrait: `${CDN_CAST}/the_lord.png`,
    coreBio:
      "I am thirty-seven. I was the schoolmaster of Ashwick. I keep this book because a schoolmaster keeps books.",
    fragments: [],
  },
  {
    id: "edda",
    name: "Edda",
    age: 71,
    role: "Midwife · cellarer · keeper of the hearth",
    portrait: `${CDN_CAST}/edda.png`,
    coreBio:
      "Midwife of Ashwick for forty years. She came south with us.",
    fragments: [
      {
        id: "edda_first_fire",
        text:
          "I got the fire going, and Edda came over with her apron full of herbs she had probably gathered at dawn, while the rest of us were still asleep. She crushed them between her palms and let them fall into a pot — and as I watched her, I began to feel at home for the first time since we left Ashwick.\n\n" +
          "She gave me a cup when it was ready. It was bitter and warm, and there was an old song in it, somewhere.",
      },
      {
        id: "edda_my_boy",
        text:
          "Edda walked into the pantry the minute it was finished, and I followed her in. She climbed onto a stool without asking for help, began setting jars on the top shelf, and muttered the names of herbs under her breath the way she used to in her own kitchen.\n\n" +
          "I stood in the doorway and watched her, remembering all the times she has been there — a remedy for every cut, every fever, every childhood fear that had no name. She still says \"you'll live, my boy\" the way she said it when I was four.\n\n" +
          "She has been here my whole life.",
      },
      {
        id: "edda_gronmoder",
        text:
          "I was crossing behind the forager's hut when I heard Edda's voice in the herb patch, low and deliberate, the way she reads to children.\n\n" +
          "\"Grønmoder,\" she was saying. \"That is the old name. It stays in this patch. You understand?\"\n\n" +
          "I stopped. Nell was kneeling beside her. She mouthed the word back — Grønmoder — and smiled the small smile, the one no one else ever gets.\n\n" +
          "I have known Edda my whole life, and I had never heard her speak that word, or any word like it. I understood without needing to be told that I was not meant to hear it now either.\n\n" +
          "I walked the long way around.",
      },
      {
        id: "edda_nereia_stream",
        text:
          "We finished the fishing hut today. I stayed by the water a while after the others had left. Edda stayed too, a little way upstream. She did not see me.\n\n" +
          "She had a small bundle in her hand — herbs, tied with a length of string. She held it a moment. Then she tossed it into the river, with a small, deliberate motion, the way one might hand something to someone standing in the water.\n\n" +
          "I heard her say a name under her breath. Nereia.\n\n" +
          "I was a schoolmaster for ten years. I do not remember a saint by that name. Probably an old folk ritual, the kind grandmothers pass down without thinking about it. It is Edda. I did not stay.",
      },
    ],
  },
  {
    id: "jory",
    name: "Jory",
    age: 36,
    role: "Carpenter · widower · the Lord's oldest friend",
    portrait: `${CDN_CAST}/jory.png`,
    coreBio:
      "Carpenter. He grew up next door to me.",
    fragments: [
      {
        id: "jory_sawhorse",
        text:
          "Jory spent the morning setting up a sawhorse from the wheels of our own wagon. He said it was foolish to keep a wagon that could not roll home, and he said it with his back to me, which is how he tells me things that matter.\n\n" +
          "We grew up next door. I know the weight of his back.\n\n" +
          "Nell brought him water and lingered by the sawhorse longer than any task required. He let her. He has let her every day of these three years, and I have watched him not say why, and Nell has watched him not say why, and somehow between the three of us the silence has become a kindness instead of a wound.\n\n" +
          "He has begun. That is enough, this week.",
      },
    ],
  },
  {
    id: "tomas",
    name: "Tomas",
    age: 48,
    role: "Stonemason · quarry lead · former militia sergeant",
    portrait: `${CDN_CAST}/tomas.png`,
    coreBio:
      "Stonemason, former militia sergeant. He came home from the border with a limp.",
    fragments: [
      {
        id: "tomas_quarry",
        text:
          "Tomas took three men out to the stone cut this morning, and by sundown they had a block square enough to please him — meaning he looked at it, grunted once, and lit his pipe, which in Tomas's accounting is approximately a standing ovation.\n\n" +
          "He walked the perimeter at dusk anyway, the way he always does. He limps when he thinks no one is looking. I have stopped asking why. Some men build a wall around the town; Tomas is the wall.\n\n" +
          "I told him tonight we were lucky to have him. He did not answer. Then, later, as I was turning in, he said from somewhere I could not see: \"We are lucky to be anywhere at all.\"",
      },
    ],
  },
  {
    id: "father_corin",
    name: "Father Corin",
    age: 68,
    role: "Priest of the Radiant One (retired) · hymnal keeper",
    portrait: `${CDN_CAST}/father_corin.png`,
    coreBio:
      "Priest of the Radiant One, retired. He baptized me.",
    fragments: [
      {
        id: "corin_altar",
        text:
          "Father Corin dragged a flat rock out of the brush this morning, placed it at the edge of the clearing, and blessed it as an altar. No hymnal for this one — he said he knew the words, and he did. He always does.\n\n" +
          "\"The Radiant One does not mind a rough altar,\" he told me after, \"so long as we do not pretend it is not rough.\"\n\n" +
          "I sat in the grass and listened, which I did not do nearly enough in Ashwick. It is easier to pay attention when you cannot hear your own footsteps on stone. The old words still work out here. Maybe they work better.",
      },
    ],
  },
  {
    id: "nell",
    name: "Nell",
    age: 11,
    role: "Jory's daughter · apprentice scribe · too-fearless child",
    portrait: `${CDN_CAST}/nell.png`,
    coreBio:
      "Jory's daughter. She is eleven.",
    fragments: [],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────

export function getFoundingCharacter(id: string): FoundingCharacter | undefined {
  return FOUNDING_CHARACTERS.find((c) => c.id === id);
}

export function getBioFragment(id: string): BioFragment | undefined {
  for (const c of FOUNDING_CHARACTERS) {
    const f = c.fragments.find((frag) => frag.id === id);
    if (f) return f;
  }
  return undefined;
}

export function getFragmentsForCharacter(characterId: string, unlockedIds: string[]): BioFragment[] {
  const char = getFoundingCharacter(characterId);
  if (!char) return [];
  const unlocked = new Set(unlockedIds);
  return char.fragments.filter((f) => unlocked.has(f.id));
}

/** Returns the characters whose bio fragments include any of the given fragment IDs. */
export function getCharactersForFragments(fragmentIds: string[]): FoundingCharacter[] {
  const set = new Set(fragmentIds);
  const result: FoundingCharacter[] = [];
  for (const c of FOUNDING_CHARACTERS) {
    if (c.fragments.some((f) => set.has(f.id))) result.push(c);
  }
  return result;
}
