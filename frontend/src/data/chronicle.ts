export interface ChronicleEntry {
  id: string;
  title: string;
  category: "world" | "history" | "factions" | "mystery" | "people";
  text: string;
  unlockedBy?: string; // quest ID or story mission ID that unlocks this entry
}

// Starting knowledge — every player begins with these
export const STARTING_ENTRIES: ChronicleEntry[] = [
  {
    id: "the_sundering",
    title: "The Sundering",
    category: "history",
    text: "Thousands of years ago, a cataclysm called the Sundering broke the world. The old kingdom fell. The gods — if they ever existed — vanished. Nobody alive remembers it. Nobody knows exactly what happened. But the ruins are everywhere, and the stories persist.",
  },
  {
    id: "the_hollow_wastes",
    title: "The Hollow Wastes",
    category: "world",
    text: "A dead zone in the deep south, left over from the Sundering. Everyone knows about the Wastes. Nobody worries about them. They're far away, they've always been there, and they've never moved. At least, that's what everyone says.",
  },
  {
    id: "the_dominion",
    title: "The Ashenmark Dominion",
    category: "factions",
    text: "The largest kingdom in the known world, ruled by the Ashford dynasty for over five centuries. Their state religion is the Church of the Radiant One. They tax heavily but maintain roads, fight bandits, and keep order. You left their territory for a reason.",
  },
  {
    id: "the_corsair_league",
    title: "The Corsair League",
    category: "factions",
    text: "A loose federation of coastal city-states run by merchants and pirates. They gave you your land grant — cheap land on the southern frontier, far from Dominion tax collectors. They profit from Free Settlements as trade partners and as a buffer against the Dominion.",
  },
  {
    id: "free_settlements",
    title: "The Free Settlements",
    category: "factions",
    text: "Independent settlements in the unclaimed lands between the Dominion and the Hollow Wastes. No king, no taxes, no protection. You're one of them now. Freedom has a price — you're on your own.",
  },
  {
    id: "the_old_gods",
    title: "The Old Gods",
    category: "history",
    text: "Before the Sundering, people worshipped the Eternal Court — seven deities who supposedly shaped the world. Ferros the Smith, Sylvana the Green, Nereia the Deep, Solara the Bright, Korrath the Shield, Lunara the Wise. Some still whisper their names at shrines. The Church says they were aspects of the Radiant One. Nobody knows the truth.",
  },
];

// Entries unlocked by tutorial quests
export const QUEST_ENTRIES: ChronicleEntry[] = [
  {
    id: "previous_settlers",
    title: "Those Who Came Before",
    category: "mystery",
    text: "Your workers found old foundation stones buried in the undergrowth. Someone built here before you. The stones are weathered but not ancient — maybe a century or two old. Whatever settlement stood here, it didn't last. Why?",
    unlockedBy: "foundation_of_stone",
  },
  {
    id: "sylvana_blessing",
    title: "Sylvana's Blessing",
    category: "history",
    text: "One of your settlers mentioned that the old folk attributed the thickness of these forests to Sylvana's blessing — one of the old gods of the Eternal Court, associated with nature and growth. Whether it's true or just superstition, the forest IS unusually generous.",
    unlockedBy: "the_foragers_path",
  },
  {
    id: "empty_woods",
    title: "The Emptied Woods",
    category: "mystery",
    text: "The game in these woods is plentiful — almost suspiciously so. The deer don't even run from your hunters. Whatever drove the last settlers away, it wasn't a lack of food. Something cleared out and the animals reclaimed the land. But what drove the people out?",
    unlockedBy: "the_hunt_begins",
  },
  {
    id: "dominion_refugees",
    title: "Refugees from the North",
    category: "world",
    text: "Your settlers are a mixed lot — some left the Dominion to escape taxes, others to escape the Church's growing strictness. A few don't talk about why they left at all. The Dominion isn't evil, but it's heavy. Out here, people breathe easier.",
    unlockedBy: "a_roof_over_their_heads",
  },
  {
    id: "nereias_vein",
    title: "Nereia's Vein",
    category: "history",
    text: "The river near your settlement is marked on old Corsair maps as 'Nereia's Vein' — named after the old goddess of water and fortune. The Corsairs kept the old names on their charts long after the Dominion replaced them with numbers. Tradition or superstition? Either way, the fishing is excellent.",
    unlockedBy: "from_the_deep",
  },
  {
    id: "frontier_drifters",
    title: "Frontier Drifters",
    category: "people",
    text: "The adventurers who answer your guild's call are a rough bunch — deserters, treasure hunters, scholars with dangerous curiosities, warriors with pasts they don't discuss. The frontier attracts people who don't fit anywhere else. That makes them useful. And unpredictable.",
    unlockedBy: "heroes_wanted",
  },
  {
    id: "corsair_trade",
    title: "The Corsair Connection",
    category: "factions",
    text: "The Corsair League trades with everyone — Dominion, Thornveil, even, it's whispered, the Cult of the Hollow. They have no ideology except profit. Your marketplace connects to their trade network now. Captain Mira Stormglass, the legendary pirate, reportedly funds Free Settlements as a buffer against the Dominion she despises.",
    unlockedBy: "merchants_welcome",
  },
  {
    id: "the_faiths",
    title: "A Question of Faith",
    category: "world",
    text: "Your settlers don't agree on religion. Some follow the Church of the Radiant One — the Dominion's official faith, which teaches that one supreme god watches over all. Others keep the Old Faith, honoring the names of the Eternal Court at small shrines. A few follow neither. Out here, far from the Church's Inquisitors, people worship as they please. For now.",
    unlockedBy: "faith_and_solace",
  },
  {
    id: "dominion_notice",
    title: "The Dominion Takes Notice",
    category: "factions",
    text: "Your settlement is growing. That means you're visible. The Dominion considers all unclaimed land to be 'unincorporated territory' — which is a polite way of saying they think it's theirs. Sooner or later, a tax collector or a Dawn Knight patrol will come knocking. Best to be ready when they do.",
    unlockedBy: "the_road_to_greatness",
  },
];

export function getUnlockedEntries(questRewardsClaimed: string[]): ChronicleEntry[] {
  const unlocked = [...STARTING_ENTRIES];
  for (const entry of QUEST_ENTRIES) {
    if (entry.unlockedBy && questRewardsClaimed.includes(entry.unlockedBy)) {
      unlocked.push(entry);
    }
  }
  return unlocked;
}

export const CATEGORY_INFO: Record<ChronicleEntry["category"], { label: string; icon: string; color: string }> = {
  world: { label: "The World", icon: "🌍", color: "var(--accent-green)" },
  history: { label: "History", icon: "📜", color: "var(--accent-gold)" },
  factions: { label: "Factions", icon: "⚔️", color: "var(--accent-blue)" },
  mystery: { label: "Mysteries", icon: "❓", color: "var(--accent-purple)" },
  people: { label: "People", icon: "👤", color: "var(--text-secondary)" },
};
