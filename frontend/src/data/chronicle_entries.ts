// ─── Chronicle Entries ───────────────────────────────────────────
// The Lord's journal. Each entry is a story-level beat — chapter
// openers, closers, or reflective milestones. Character introductions
// live on the Cast tab as bio fragments, not here.
//
// Entries fire on quest completion, cinematic end, or first-time
// triggers. Locked entries appear as "???" placeholders in the
// archive (bestiary pattern).

export interface ChronicleChapter {
  id: string;
  number: number;
  title: string;
  tagline: string;
}

export interface ChronicleEntry {
  id: string;
  chapterId: string;
  order: number;
  title: string;
  /** One-line preview shown on the unlocked entry card. */
  teaser: string;
  /** The full journal page. Rendered in the expanded modal. */
  fullText: string;
  /** Optional cinematic ID — if set, the entry card shows a "Replay cinematic" button. */
  cinematicId?: string;
}

// ─── Chapters ────────────────────────────────────────────────────

export const CHRONICLE_CHAPTERS: ChronicleChapter[] = [
  {
    id: "ch1",
    number: 1,
    title: "The First Camp",
    tagline: "Arrival, survival, and the first names written in this book.",
  },
];

// ─── Entries ─────────────────────────────────────────────────────

export const CHRONICLE_ENTRIES: ChronicleEntry[] = [
  // Chapter 1 — The First Camp
  {
    id: "ch1_arrival",
    chapterId: "ch1",
    order: 1,
    title: "Arrival",
    teaser: "A schoolmaster opens a new book. The first night is colder than the map suggested.",
    fullText:
      "I brought this book because a schoolmaster brings books. I will use it now because I have nowhere else to put the weight.\n\n" +
      "The map calls this Parcel 14. The clerk who drew the map never stood in it. It has a river bending east, a ridge of stone to the north, and a forest older than anything any of us has ever seen. The stumps in the clearing are fresh: someone was here before, and then was not. I will not ask why tonight.\n\n" +
      "The others are sleeping. The fire is low. I am writing because I do not know what else a man does with the first night of the rest of his life.",
    cinematicId: "intro",
  },
  {
    id: "ch1_nell_notebook",
    chapterId: "ch1",
    order: 2,
    title: "Nell's Notebook",
    teaser: "Winter is closer than it should be. She keeps her own book. He would not ask.",
    fullText:
      "Winter feels closer than it should. I caught myself today counting the shelves in the pantry instead of the people who would eat from them. Edda would call that lordly, and she would not mean it as a compliment.\n\n" +
      "Nell has been writing in her little book again. She will not show me, and I would not ask — I gave it to her on her tenth birthday with the understanding that it was hers alone.\n\n" +
      "But I see her some evenings: the stubby pencil between her teeth, her knees pulled up, the book balanced on them, her eyes tracking something I cannot see. Jory asked her tonight what she was writing. She said, very seriously: \"Things.\"\n\n" +
      "I thought, not for the first time, that she will be better at this than I am.",
  },
  {
    id: "ch1_stable_now",
    chapterId: "ch1",
    order: 3,
    title: "We Are Stable Now",
    teaser: "Cooked food under a roof. Six still. A word for this week.",
    fullText:
      "Tonight we ate cooked food under a roof. Only two roofs, really, and one of them leaked — Tomas has already said what he thinks about the leak — but a roof.\n\n" +
      "The wood pile is longer than my shoulder. The quarry has given us three good blocks and a fourth that Tomas called \"honest work, poor stone.\" The well is dug. Edda has a garden patch no bigger than a bedsheet and she has already forbidden any of us from walking near it. Father Corin reads from his hymnal most evenings, which is how I know what day of the week it is.\n\n" +
      "We are not safe. I do not pretend we are safe. There are nights I lie awake listening for something I cannot name, and mornings I count the six of us before I do anything else.\n\n" +
      "But we are stable. That is a word for this week. Next week will have its own.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────

export function getChronicleEntry(id: string): ChronicleEntry | undefined {
  return CHRONICLE_ENTRIES.find((e) => e.id === id);
}

export function getChronicleChapter(id: string): ChronicleChapter | undefined {
  return CHRONICLE_CHAPTERS.find((c) => c.id === id);
}

export function getEntriesByChapter(chapterId: string): ChronicleEntry[] {
  return CHRONICLE_ENTRIES
    .filter((e) => e.chapterId === chapterId)
    .sort((a, b) => a.order - b.order);
}
