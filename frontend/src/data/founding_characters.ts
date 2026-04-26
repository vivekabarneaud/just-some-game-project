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
      "Midwife of Ashwick for forty years. Delivered the Lord himself.",
    fragments: [
      {
        id: "edda_first_fire",
        text:
          "As soon as the fire caught, Edda was at the mortar, crushing herbs she must have gathered at dawn, while the rest of us were still finding our shoes.\n\n" +
          "It was the first time I had felt at home since we left Ashwick. I did not say so aloud.\n\n" +
          "She put a cup of something hot in my hand without a word. It was bitter and warm, and there was an old song in it somewhere.",
      },
      {
        id: "edda_forager_hut",
        text:
          "We finished the forager's hut a few hours ago. I came by to see how Edda meant to lay it out, and was about to step round the side when I caught sight of them.\n\n" +
          "Edda and Nell were kneeling in the soft dirt. They did not see me.\n\n" +
          "Edda took Nell's small hand and pressed her thumb into the ground beside the green stems, slow and deliberate. \"Say it,\" she said. \"Grønmoder.\" Nell mouthed the word. Edda nodded. \"Again.\" Nell pressed her thumb down on her own this time, and mouthed it again.\n\n" +
          "\"It is the old name. It stays only in this patch. Do you hear me?\" Nell nodded. And then she smiled. A real smile, the kind I had not seen in a long time.\n\n" +
          "I withdrew quietly and went the long way back. Some things are not for me.",
      },
      {
        id: "edda_pantry",
        text:
          "Edda took to the new pantry the moment we hung the door. By the time I passed by, she had pulled up a stool and was setting jars on the highest shelves, working from the back forward.\n\n" +
          "I stood in the doorway watching her, and found myself remembering all the times she had been there with a remedy. For a cut, for a fever, for whatever else came.\n\n" +
          "She delivered me. She has always been there.",
      },
      {
        id: "edda_fishing_hut",
        text:
          "We finished the fishing hut by mid-afternoon, and I stayed a while after the others had gone, to look at the river running, mostly. Edda had stayed too, downstream where the water bends. She did not see me.\n\n" +
          "She held a small bundle in her hand, green leaves wrapped in thread, and dropped it into the current with a slow, practiced motion, speaking words I could not all catch. One I did catch: Nereia.\n\n" +
          "I stepped back into the trees and took the long way home.\n\n" +
          "I taught Dominion children their saints for ten years and have never heard of a Nereia. Some old folk-name, I expect. Every frontier village out here has its own: half-remembered words for the river, the field, the wind. The towns forget; the country keeps.",
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
      "The Lord's oldest friend. Carpenter and maker of wooden instruments. Widowed three years ago; father to Nell.",
    fragments: [
      {
        id: "jory_sawhorse",
        text:
          "We finished the lumber mill at dusk, and Jory was making everyone laugh before the saw had even cooled. Half the men were still smiling when the lamps went up.\n\n" +
          "I came back later. I had forgotten the lantern at the bench. Jory was alone, sitting on the new sawhorse with his hands quiet on his knees. His face was not the one he had been wearing an hour before.\n\n" +
          "He looked up and the grin came back the instant he heard my step. \"I am inspecting my work,\" he said, slapping the sawhorse. \"It is excellent. The carpenter is a genius. Do not tell him.\"\n\n" +
          "I did not push it. We grew up next door, long enough to know which face is the one he keeps for himself.",
      },
      {
        id: "jory_old_songs",
        text:
          "The upgraded mill ran for the first time before noon: pit-saw down, second horse hitched, twice the timber by sundown. Jory was already gone when I came to thank him. Bench wiped, tools hung, no fuss.\n\n" +
          "I went looking for him later and found something I was not meant to see.\n\n" +
          "He was sitting on a low log behind the houses with Nell pressed against his side, lute across his knee. He was playing softly. Not the songs he plays at the fire when others are around. Older than that, slower. The kind of melody mothers use on small children.\n\n" +
          "Nell was not smiling. She was listening, with her cheek against his sleeve.\n\n" +
          "I withdrew before they saw me. I miss Lyra too.\n\n" +
          "Of all the songs Jory plays, those are the ones he keeps for the two of them.",
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
      "Stonemason and quarry lead. Former militia sergeant.",
    fragments: [
      {
        id: "tomas_quarry",
        text:
          "We finished the quarry at noon: three men, two days, more dust than stone for the trouble of it. Tomas was the last to leave the cut, walking up the path with a hammer over one shoulder and his coat over the other.\n\n" +
          "I do not remember the last time I saw him walk like that. In Ashwick he walked like a man counting paving stones to keep his mind off something. Today he walked like a man going somewhere.\n\n" +
          "He brought the first proper block to Edda before sunset, for a doorstep, he said, though no one had asked. Edda told him it was excellent. He said nothing. He limped off to the perimeter the way he always does.\n\n" +
          "I do not think he knows he is more alive here than he was in Ashwick. I think we ought not tell him, in case telling him spoils it.",
      },
      {
        id: "tomas_quarry_shack",
        text:
          "We finished the quarry expansion at dusk: proper steps cut down to the second face, a winch hanging where the old ledge used to be. Tomas walked it twice without saying anything I could hear. Twice, in his accounting, is approval.\n\n" +
          "I went down to the shack later to bring him the lantern oil he had asked for, and stopped in the doorway. I had not expected to find three of them.\n\n" +
          "Nell was sitting on a folded coat in the corner, Tomas's old grey cat on her lap. Tomas was at the bench with his back to them, working at a plank. None of them spoke. None of them needed to.\n\n" +
          "I left the oil on the bench and went back up the path. There are fewer ways to be wanted than I had thought, and most of them do not involve speaking.",
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
          "Father Corin dragged a flat rock out of the brush this morning, placed it at the edge of the clearing, and blessed it as an altar. No hymnal for this one. He said he knew the words, and he did. He always does.\n\n" +
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
