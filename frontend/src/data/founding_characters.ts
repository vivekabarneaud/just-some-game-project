// ─── Founding Cast ───────────────────────────────────────────────
// The six settlers who founded the Lord's settlement together. They
// have static core bios (always visible) plus unlockable fragments
// that accumulate as the Chronicle unfolds. Fragment unlocks are
// wired through quests (see `unlocksBioFragments` on QuestDefinition).
//
// Fragments carry the texture of each character and accumulate over
// time — they are richer than a one-liner. Character pages are where
// the reader gets to know each person; the journal is for story beats.

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
    role: "Settlement founder · former schoolmaster of Ashwick",
    portrait: `${CDN_CAST}/the_lord.png`,
    coreBio:
      "Took the Crown's land grant the week Ashwick's school was to close. Taught children their letters for a decade; now learns their fathers' trades beside them. Keeps a journal because a schoolmaster keeps books.",
    fragments: [],
  },
  {
    id: "edda",
    name: "Edda",
    age: 71,
    role: "Midwife · cellarer · keeper of the hearth",
    portrait: `${CDN_CAST}/edda.png`,
    coreBio:
      "Delivered half of Ashwick across forty years, including the Lord himself. Lost her own daughter and granddaughter to fever in '47 and never remarried; learned the herbs better instead. She calls the Lord \"my boy\" in private because she earned the right before he could walk.",
    fragments: [
      {
        id: "edda_first_cup",
        text:
          "Edda was up before dawn, which is how Edda is, and she put a tin cup of something hot into my hand before I had even found my shoes.\n\n" +
          "\"My boy,\" she said, \"you will need to sleep when the others sleep, or there will be a day you cannot stand.\" She did not wait for an answer. She walked off toward the stream, herbs already bundled in her apron, and I drank what she gave me. It was bitter and warm and there was an old song in it, somewhere.\n\n" +
          "My father taught me my letters and the names of Dominion princes, and it turns out that is not the knowledge a man needs at the end of a logging road. Edda knows which herbs keep a fever down. I am learning to listen.",
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
      "Grew up next door to the Lord. Took over his father's carpentry shop; married a girl from the neighboring village. Lost her to the hard winter fever three years ago, when Nell was seven. Carries his axe, his grief, and his daughter with the same quiet steadiness.",
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
      "Conscripted fifteen years ago for a border muster against southern bandits. Came home with a limp, a silence, and a decision under pressure he still isn't sure was right. Lays stone because stone doesn't argue. Would die for any of the other five without making a speech about it.",
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
      "Ordained forty-five years ago. Served Ashwick and the neighboring parishes his whole career. Baptized the Lord. Married Jory and his late wife. Buried her. When the Church ordered him to a retirement cloister, he refused and asked for the frontier instead. The shepherd goes with the flock.",
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
      "Her mother died when she was seven; her father went quiet. Edda and the Lord filled the edges. The Lord taught her letters at four, and she has been ahead ever since. She keeps her own small book. She writes in it when she thinks no one is watching.",
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
