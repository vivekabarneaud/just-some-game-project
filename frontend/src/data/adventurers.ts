// ─── Races & Origins ───────────────────────────────────────────

export type Race = "human" | "elf" | "dwarf";

export type Origin =
  | "dunhollow" | "nordveld" | "meridian" | "zahkari" | "tianzhou" | "khorvani"   // human
  | "silvaneth" | "hautsciels"                                                      // elf
  | "khazdurim" | "feldgrund";                                                      // dwarf

export interface OriginDef {
  id: Origin;
  name: string;
  race: Race;
  region: string;
  description: string;
  quote: string;
  statMods: Partial<AdventurerStats>;
  firstNamesMale: string[];
  firstNamesFemale: string[];
  lastNames: string[];
  backstories: { fighter: string; scholar: string; refugee: string; misfit: string; merchant: string; healer: string };
}

export const RACE_WEIGHTS: Record<Race, number> = {
  human: 0.60,
  elf: 0.15,
  dwarf: 0.25,
};

export const RACE_NAMES: Record<Race, string> = {
  human: "Human",
  elf: "Elf",
  dwarf: "Dwarf",
};

export const ORIGINS: OriginDef[] = [
  // ── Human Origins ────────────────────────────────────────────
  {
    id: "dunhollow", name: "Dunhollow", race: "human",
    region: "The Dominion Heartlands",
    description: "Common folk and displaced elite of the Ashenmark Dominion.",
    quote: "Every Dunhollow settler brought three things south: a plow, a prayer book, and a grudge against their landlord.",
    statMods: {},
    firstNamesMale: ["Aldric", "Cedric", "Elwin", "Gareth", "Kael", "Osric", "Quinlan", "Dorian", "Finn", "Henrik", "Nolan", "Pavel", "Wren", "Edmund", "Jareth", "Corin", "Bram", "Roderick", "Ansel", "Callum", "Duncan", "Emory", "Godric", "Hadrian", "Kendrick", "Leland"],
    firstNamesFemale: ["Brenna", "Daria", "Hilda", "Lyra", "Petra", "Rowena", "Gwen", "Isla", "Kira", "Mira", "Oona", "Rhea", "Talia", "Cora", "Elara", "Ysolde", "Maren", "Isolde", "Winifred", "Enid", "Bethan", "Lenora", "Seren", "Tamsin", "Ailis", "Cordelia"],
    lastNames: ["Ashford", "Blackwood", "Coldwell", "Dawnforge", "Emberheart", "Foxglove", "Greystone", "Hawkwind", "Ironbark", "Thornwood", "Underhill", "Valeheart", "Wintermere", "Brightwater", "Copperfield", "Eldergrove"],
    backstories: {
      fighter: "A former soldier of the Dominion, discharged after questioning an order. Came south to find a war worth fighting.",
      scholar: "Studied at the Academy annex before the Inquisition shut it down. Carries banned texts sewn into the lining of a coat.",
      refugee: "Lost the family farm to Dominion taxes. Came south with nothing but strong hands and a long memory.",
      misfit: "Third child of a minor noble house — no inheritance, no prospects, and no patience for court politics.",
      merchant: "Ran a trading post on the King's Road. Left when the Church started inspecting cargo for 'heretical materials.'",
      healer: "Village healer who was getting too many questions from the Inquisition about where the remedies came from.",
    },
  },
  {
    id: "nordveld", name: "Nordveld", race: "human",
    region: "The Thornveil Borderlands",
    description: "Hardy frontier folk from the cold northwest, Thornveil-adjacent.",
    quote: "In Nordveld, you either learn to swing an axe by twelve or you don't see thirteen.",
    statMods: {},
    firstNamesMale: ["Bjorn", "Tormund", "Leif", "Ragnar", "Soren", "Ulf", "Erik", "Halvard", "Sigurd", "Magnus", "Wulf", "Gunnar", "Haldor", "Styrkar", "Vidar", "Torvald", "Kjartan", "Brynjar", "Oddvar", "Eirik", "Fenris", "Grimm", "Asmund", "Ragnvald"],
    firstNamesFemale: ["Sigrid", "Freya", "Astrid", "Ingrid", "Thora", "Helga", "Kara", "Runa", "Ylva", "Vara", "Solveig", "Gudrun", "Brynja", "Sif", "Eirunn", "Herja", "Torhild", "Alvhild", "Vigdis", "Svanhild", "Jorunn", "Dagmar"],
    lastNames: ["Stormveil", "Coldhammer", "Frostwind", "Ironhide", "Stonehelm", "Iceforge", "Wolfbane", "Frostvik"],
    backstories: {
      fighter: "Former shield-bearer of the Thornveil Rangers. Left when the wards started failing and nobody would admit it.",
      scholar: "An elder's apprentice who memorized the old sagas. Came south chasing a story that hasn't ended yet.",
      refugee: "The winters are getting worse. The last one took the livestock and almost took the children. Had to leave.",
      misfit: "Youngest of seven — no land to inherit, only a blade and a grudge against the cold.",
      merchant: "Traded furs and amber down the river routes. The routes dried up when the forest started dying.",
      healer: "A völva — keeper of the old remedies. The Church calls it heresy. The Nordveld call it survival.",
    },
  },
  {
    id: "meridian", name: "Meridian", race: "human",
    region: "The Corsair League Coast",
    description: "Traders, sailors, artisans, and pirates from the sun-drenched Corsair ports.",
    quote: "A Meridian will stab you with a smile. A Dunhollow man will just stab you.",
    statMods: {},
    firstNamesMale: ["Luciano", "Baldassare", "Matteo", "Enzo", "Vittorio", "Dante", "Lorenzo", "Marco", "Alessandro", "Giancarlo", "Salvatore", "Renato", "Fabrizio", "Cesare", "Emilio", "Giacomo", "Raffaele", "Silvio", "Valerio", "Adriano", "Nicolo", "Tomasso"],
    firstNamesFemale: ["Fiora", "Serafina", "Chiara", "Bianca", "Rosalia", "Alessia", "Valentina", "Isabella", "Giuliana", "Francesca", "Donatella", "Lucrezia", "Elisabetta", "Carlotta", "Ginevra", "Simonetta", "Arabella", "Teodora", "Carmela", "Lorenza", "Paola", "Viola"],
    lastNames: ["Ferraro", "Castellani", "Monteverdi", "Solari", "Veronesi", "Bianchi", "Corsini", "DeLuca"],
    backstories: {
      fighter: "Grew up brawling on the docks of Porto Solari. Can fight, sail, and cook — in that order.",
      scholar: "Apprenticed to a Corsair League cartographer. Maps bore her now — she wants the territory, not the drawing.",
      refugee: "Watched pirates sink the family fleet. Traded the ledger for a sword and never looked back.",
      misfit: "Disowned by a merchant family for refusing an arranged marriage. Found freedom tastes better than wine.",
      merchant: "Ran a spice stall in Saltmere. Came here because a settlement with no guild structure is an open market.",
      healer: "Nereia's devoted — a ship's surgeon who lost the ship but kept the healing hands.",
    },
  },
  {
    id: "zahkari", name: "Zah'kari", race: "human",
    region: "The Sunward Kingdoms",
    description: "Proud city-states east of the Dominion with deep oral histories and sophisticated governance.",
    quote: "The Zah'kari don't write their laws — they sing them. Try burning a song.",
    statMods: {},
    firstNamesMale: ["Kofi", "Kwame", "Jabari", "Tendai", "Sekou", "Chike", "Emeka", "Olu", "Idris", "Bakari", "Dayo", "Folami", "Kamau", "Obinna", "Tariq", "Zuberi", "Azizi", "Jelani", "Mosi", "Nkosi", "Taiwo", "Abioye"],
    firstNamesFemale: ["Amara", "Nia", "Zuri", "Makena", "Adama", "Fatoumata", "Asha", "Kalista", "Imani", "Sanaa", "Kesia", "Dalila", "Efua", "Jamila", "Lina", "Nala", "Sade", "Yaa", "Ayana", "Chiamaka", "Ife", "Mariama"],
    lastNames: ["Sunspear", "Lionmane", "Dustwalker", "Ironroot", "Thornshield", "Goldmask", "Stormcaller", "Hearthkeeper"],
    backstories: {
      fighter: "Champion of the Zah'kari war games. Came north to find opponents she hasn't already beaten.",
      scholar: "A griot — keeper of stories. Traveled here following a tale that hasn't ended yet.",
      refugee: "The droughts pushed his family north. Stayed when they moved on — says this land needs people who know dry seasons.",
      misfit: "Daughter of a chieftain who wanted to be a painter. Took up the sword only because the road north was dangerous.",
      merchant: "Traded Zah'kari salt and goldwork across three continents. Says adventuring pays worse but is more honest.",
      healer: "Herbalist from the savanna plains. Says the northern herbs are weak but 'interesting.'",
    },
  },
  {
    id: "tianzhou", name: "Tianzhou", race: "human",
    region: "The Jade Empire",
    description: "Scholars, strategists, and exiles from a vast continental empire across the eastern sea.",
    quote: "The Tianzhou sent cartographers first. That means soldiers follow.",
    statMods: {},
    firstNamesMale: ["Wei", "Zheng", "Bowen", "Changming", "Feng", "Hao", "Tao", "Jun", "Chenguang", "Daiyu", "Guowei", "Hanyu", "Jianyu", "Kuang", "Longwei", "Minghan", "Qiang", "Renshu", "Shaozu", "Tianming", "Wenzhong", "Yanlei"],
    firstNamesFemale: ["Lian", "Mei", "Yuehan", "Xiulan", "Ruoxi", "Jingyi", "Mingzhu", "Shuyin", "Baihe", "Chunhua", "Fangyin", "Huifen", "Lanying", "Nuying", "Peizhi", "Qiuyue", "Shanshan", "Tingxue", "Weiwei", "Xiangling", "Yuelin", "Zhenyi"],
    lastNames: ["Ironpetal", "Jadecrest", "Mistborne", "Moonridge", "Silkblade", "Stoneriver", "Cloudpeak", "Goldengate"],
    backstories: {
      fighter: "Former imperial border guard. Deserted after being ordered to burn a village. Doesn't talk about it.",
      scholar: "Cartographer mapping the western continent. The adventuring is just a side effect of going where the map is blank.",
      refugee: "Fled a political purge in the capital. Keeps a low profile. Uses a false name.",
      misfit: "Failed the imperial examinations three times. Decided the world beyond the sea might have better questions.",
      merchant: "Silk trader who got swindled in a foreign port. Took up the sword to get the debt back. Stayed for the lifestyle.",
      healer: "Physician from Tianzhou's medical academies. Came west because a plague here had symptoms she'd never read about.",
    },
  },
  {
    id: "khorvani", name: "Khor'vani", race: "human",
    region: "The Amber Crossroads",
    description: "Mystics, alchemists, and merchants from the desert trade crossroads.",
    quote: "If a Khor'vani tells you something is priceless, it means they haven't named the price yet.",
    statMods: {},
    firstNamesMale: ["Arjun", "Ravi", "Kiran", "Vikram", "Dev", "Amir", "Sanjay", "Rohan", "Naveen", "Ishaan", "Habib", "Jalil", "Karim", "Rashid", "Suresh", "Haroun", "Darshan", "Faisal", "Omid", "Samir", "Anand", "Bharat"],
    firstNamesFemale: ["Zahra", "Leila", "Farah", "Nadia", "Yasmin", "Priya", "Soraya", "Dalia", "Amira", "Deepika", "Fatima", "Hasina", "Inaya", "Kamala", "Laleh", "Meera", "Nasreen", "Padma", "Rehana", "Samira", "Tara", "Zara"],
    lastNames: ["Sandweaver", "Duskfire", "Silkwind", "Stargazer", "Goldhand", "Ashveil", "Sunforge", "Emberspice"],
    backstories: {
      fighter: "A caravan guard who kept walking after the caravan stopped. Says the horizon here is different.",
      scholar: "Astronomer who read a star chart that predicted his own death in a 'cold northern ruin.' Came to prove the stars wrong.",
      refugee: "Fled the desert wars with her family's recipe book. Turns out combat potions sell better than cooking spices.",
      misfit: "Kicked out of the alchemist's guild for 'unsanctioned experimentation.' The explosion was mostly contained.",
      merchant: "Spice trader who followed the trade routes north. Where there's a new settlement, there's a new market.",
      healer: "Trained in the old alchemy — physical processes, not Aether manipulation. The Church can't touch her, and she knows it.",
    },
  },

  // ── Elf Origins ──────────────────────────────────────────────
  {
    id: "silvaneth", name: "Silvaneth", race: "elf",
    region: "The Deep Forests",
    description: "Nature elves, archers, druids. Cities grown from living wood, Thornveil-adjacent.",
    quote: "The Silvaneth were old when the Dominion was young. They remember a world that worked. That's why they're so sad.",
    statMods: { dex: 1, wis: 1, str: -1 },
    firstNamesMale: ["Thalion", "Faenor", "Galadhrim", "Thranduil", "Celeborn", "Earendil", "Aelindor", "Caelith", "Finrod", "Glorfindel", "Haldir", "Lindir", "Orophin", "Rumil", "Saeros", "Tauriel", "Voronwe", "Amroth", "Beleg", "Cirdan", "Ecthelion", "Maedhros"],
    firstNamesFemale: ["Aelindra", "Sylvari", "Elowen", "Ithilwen", "Miriel", "Luthien", "Nimloth", "Tinuviel", "Arwen", "Celebrian", "Idril", "Nerdanel", "Galadriel", "Finduilas", "Aredhel", "Earwen", "Nellas", "Silmaris", "Vanima", "Lothiriel", "Melineth", "Brethilwen"],
    lastNames: ["Starweaver", "Moonshadow", "Dawnwhisper", "Leafsong", "Silverbrook", "Nightbloom", "Sunshard", "Mistwalker"],
    backstories: {
      fighter: "A Thornveil ranger who's been patrolling the ward-line for sixty years. The wards are failing. She's tired.",
      scholar: "Studies the slow death of the ancient trees. Each ring tells a story — and the recent ones are frightening.",
      refugee: "The forest is shrinking. Not from axes — from the inside. The heartwood is going grey.",
      misfit: "Left the canopy cities out of restlessness. Says the forest feels like a beautiful cage.",
      merchant: "Traded Silvaneth remedies to Thornveil villages. Came south because the herbs grow stranger near the frontier.",
      healer: "A keeper of the old groves. Sylvana's dreaming essence still responds to those who tend her trees.",
    },
  },
  {
    id: "hautsciels", name: "Hauts-Ciels", race: "elf",
    region: "Mountain-top Ruins Above the Clouds",
    description: "Scholar-mages, archivists, melancholy nobility living among pre-Sundering ruins.",
    quote: "The Hauts-Ciels were built to outlast the world. They're starting to wonder if the world will outlast them.",
    statMods: { int: 1, wis: 1, str: -1 },
    firstNamesMale: ["Aurelien", "Lucien", "Gaston", "Armand", "Bastien", "Renaud", "Thierry", "Philippe", "Corentin", "Donatien", "Emilien", "Florian", "Gaspard", "Hadrien", "Isidore", "Leandre", "Marcelin", "Perceval", "Raphael", "Sylvain", "Thibault", "Valentin"],
    firstNamesFemale: ["Celeste", "Eloise", "Vivienne", "Solange", "Giselle", "Adeline", "Margaux", "Colette", "Amelie", "Blanche", "Delphine", "Eglantine", "Fleur", "Heloise", "Isaure", "Josephine", "Lisette", "Madeleine", "Ninon", "Ondine", "Rosalinde", "Severine"],
    lastNames: ["Feuillemorte", "Boisvert", "Clairdelune", "Fontargent", "Brumesang", "Verdelys", "Aubepine", "Lunargent"],
    backstories: {
      fighter: "A spire-guard who watched a library platform fall into the clouds. Came down to find answers before more are lost.",
      scholar: "Has read every surviving scroll in the upper archives. Descended because the answers aren't up there.",
      refugee: "The Aether holding the old structures aloft is thinning. Left before the floor gave way.",
      misfit: "Couldn't bear another century of cataloguing what was lost. Wants to build something new instead of mourning the old.",
      merchant: "Traded ancient Hauts-Ciels star charts to fund expeditions. Knowledge is currency when you have nothing else.",
      healer: "Trained in pre-Sundering medical texts that no human academy has seen. The techniques still work — barely.",
    },
  },

  // ── Dwarf Origins ────────────────────────────────────────────
  {
    id: "khazdurim", name: "Khazdurim", race: "dwarf",
    region: "The Ironspine Mountains",
    description: "Deep miners, smiths, engineers. The lowest holds have been sealed against something terrible.",
    quote: "Ask a Khazdurim about the Deep Seals and watch how fast the conversation ends.",
    statMods: { str: 1, vit: 1, dex: -1 },
    firstNamesMale: ["Durin", "Thordak", "Grimjaw", "Balin", "Thorin", "Oin", "Nori", "Bombur", "Dwalin", "Gimli", "Gloin", "Bofur", "Dori", "Farin", "Gror", "Narvi", "Telchar", "Azaghal", "Brokkr", "Fundin", "Ithilbor", "Khim"],
    firstNamesFemale: ["Bruna", "Hilde", "Sigga", "Dagna", "Helka", "Magna", "Gretta", "Svala", "Disa", "Agna", "Bera", "Frida", "Gerda", "Halla", "Inga", "Kelda", "Lofn", "Marga", "Nessa", "Ragna", "Sigrun", "Thrain"],
    lastNames: ["Stonefist", "Deepforge", "Ironhold", "Hammerfall", "Copperbeard", "Fireaxe", "Goldvein", "Anvilborn"],
    backstories: {
      fighter: "The mine collapsed. Everyone else is still down there. Fights because stopping means remembering.",
      scholar: "A rune-carver who found inscriptions in the deep tunnels that predate the clan records. Needs answers.",
      refugee: "Was in the lowest hold when they sealed the doors. Won't say what was on the other side.",
      misfit: "Refused to take the smith's oath. Says there's more to life than hammering the same anvil for two hundred years.",
      merchant: "Traded Ironspine ore to every kingdom on the continent. The deep veins are thinning. Time to diversify.",
      healer: "A stone-singer — dwarven tradition of using resonance to mend bone and ease pain. It's not magic. Don't call it magic.",
    },
  },
  {
    id: "feldgrund", name: "Feldgrund", race: "dwarf",
    region: "The Rolling Hills, Dominion Midlands",
    description: "Surface-dwelling dwarves. Brewers, farmers, innkeepers, and natural settlers.",
    quote: "A Feldgrund dwarf will outdrink you, outfarm you, and then lend you money for the privilege.",
    statMods: { str: 1, vit: 1, dex: -1 },
    firstNamesMale: ["Bardin", "Rogar", "Grundy", "Flint", "Torben", "Algar", "Bodger", "Cask", "Dorri", "Elgar", "Fenwick", "Gordi", "Hamfast", "Koli", "Larder", "Mugwort", "Norris", "Ogden", "Pip", "Stumpy"],
    firstNamesFemale: ["Willa", "Tilda", "Marta", "Hildi", "Dagny", "Berta", "Clover", "Dottie", "Ember", "Greta", "Hazel", "Ivy", "Juniper", "Kettle", "Mabel", "Nell", "Olive", "Posie", "Ruby", "Sage"],
    lastNames: ["Barrelhouse", "Hearthstone", "Alewell", "Meadbrook", "Hillfoot", "Kettleblack"],
    backstories: {
      fighter: "Won every bar brawl in three counties. Figured real fighting couldn't be much harder. Was wrong. Stayed anyway.",
      scholar: "Keeps meticulous brewing logs going back four generations. Says fermentation is 'applied chemistry, not magic.'",
      refugee: "The Dominion raised taxes on hill-folk again. Easier to move than to argue with a tax collector backed by knights.",
      misfit: "Every Feldgrund wants to settle down. This one wants to see what's over the next hill. And the next. And the next.",
      merchant: "Feldgrund ale is famous across the midlands. Came south because new settlements mean thirsty people.",
      healer: "Grandmother's remedies — poultices, broths, and a firm belief that most wounds heal faster with a stiff drink.",
    },
  },
];

export function getOrigin(id: Origin): OriginDef {
  return ORIGINS.find((o) => o.id === id)!;
}

export function getOriginsForRace(race: Race): OriginDef[] {
  return ORIGINS.filter((o) => o.race === race);
}

// ─── Backstory Traits ──────────────────────────────────────────

export interface BackstoryTrait {
  id: string;
  name: string;
  flavor: string;
  description: string;
  weight: number; // higher = more common
}

export const BACKSTORY_TRAITS: BackstoryTrait[] = [
  { id: "demon_hunter", name: "Demon Hunter", flavor: "Survived the Ashland incursions", description: "+5% damage vs demon", weight: 8 },
  { id: "grave_walker", name: "Grave Walker", flavor: "Grew up near the Barrowfields", description: "+5% damage vs undead & ghost", weight: 8 },
  { id: "beast_tracker", name: "Beast Tracker", flavor: "Hunted dire wolves as a child", description: "+5% damage vs beast", weight: 10 },
  { id: "dragonmarked", name: "Dragonmarked", flavor: "Bears a scar from dragonfire", description: "+5% damage vs dragon", weight: 3 },
  { id: "spirit_sensitive", name: "Spirit Sensitive", flavor: "Can hear whispers from the other side", description: "Can hit ghosts with physical attacks", weight: 5 },
  { id: "pious_heart", name: "Pious Heart", flavor: "Devoted to the old gods since youth", description: "+5% damage vs demon & divine", weight: 7 },
  { id: "elemental_attuned", name: "Elemental Attuned", flavor: "Born during a great storm", description: "+5% damage vs elemental", weight: 6 },
  { id: "iron_will", name: "Iron Will", flavor: "Tortured by bandits and didn't break", description: "+10% resist to fear/taunt", weight: 8 },
  { id: "survivor", name: "Survivor", flavor: "Has already died once, technically", description: "-15% death chance on failure", weight: 6 },
  { id: "veteran_campaigner", name: "Veteran Campaigner", flavor: "Served in the Border Wars", description: "+5% damage vs humanoid", weight: 10 },
  { id: "lucky", name: "Lucky", flavor: "Found a four-leaf clover at age six. Still carries it.", description: "+3% crit chance", weight: 7 },
  { id: "quick_learner", name: "Quick Learner", flavor: "Reads every book they find", description: "+10% XP gain", weight: 7 },
];

// ─── Personality Quirks ────────────────────────────────────────

export const PERSONALITY_QUIRKS: string[] = [
  "Talks to their sword. The sword has a name.",
  "Refuses to enter a building without knocking first.",
  "Keeps a tally of every creature killed.",
  "Hums off-key before every fight. Says it 'centers the spirit.'",
  "Sleeps with one eye open. Claims it's a learned habit, not paranoia.",
  "Collects teeth from defeated enemies. Won't explain why.",
  "Always the last to eat, first to volunteer for watch.",
  "Writes poetry. Terrible poetry. Reads it aloud to the party.",
  "Never sits with their back to the door.",
  "Names every animal they encounter. Gets upset when others don't use the names.",
  "Whistles the same tune constantly. Nobody knows where it's from.",
  "Carves a small notch into their weapon after every mission.",
  "Prays to a different god each morning. Just to cover all the bases.",
  "Claims to have once arm-wrestled a troll. The details change every telling.",
  "Keeps a pressed flower in a locket. Won't say who gave it to them.",
  "Counts everything — stairs, trees, enemies. Everything.",
];

// ─── Adventurer classes ─────────────────────────────────────────

export type AdventurerClass = "warrior" | "wizard" | "priest" | "archer" | "assassin";

export interface ClassPassive {
  name: string;
  description: string;
}

export interface ClassMeta {
  id: AdventurerClass;
  name: string;
  icon: string;
  description: string;
  passive: ClassPassive;
}

export const ADVENTURER_CLASSES: ClassMeta[] = [
  {
    id: "warrior", name: "Warrior", icon: "⚔️",
    description: "Frontline fighter. Increases success on combat missions.",
    passive: { name: "Shield Wall", description: "+10% success (+15% on escort/combat). Can protect an ally from death." },
  },
  {
    id: "wizard", name: "Wizard", icon: "🔮",
    description: "Arcane caster. Essential for magical and exploration missions.",
    passive: { name: "Arcane Haste", description: "Reduces mission duration by 15%. Bonus success on magical missions." },
  },
  {
    id: "priest", name: "Priest", icon: "✝️",
    description: "Keeps the party alive. Greatly reduces death chance on failure.",
    passive: { name: "Divine Grace", description: "-60% party death risk. 15% revive chance. +5% success on survival missions." },
  },
  {
    id: "archer", name: "Archer", icon: "🏹",
    description: "Keen-eyed marksman. Good at scouting and ranged combat.",
    passive: { name: "Eagle Eye", description: "+8% success (+13% on outdoor/exploration). Bonus on outdoor/exploration missions." },
  },
  {
    id: "assassin", name: "Assassin", icon: "🗡️",
    description: "Fast and stealthy. Excels at infiltration and high-risk missions.",
    passive: { name: "Cunning", description: "+20% bonus loot on success. Partial loot on failure. +8% success on spying/assassination." },
  },
];

export function getClassMeta(cls: AdventurerClass) {
  return ADVENTURER_CLASSES.find((c) => c.id === cls)!;
}

// ─── Ranks ──────────────────────────────────────────────────────

export type AdventurerRank = 1 | 2 | 3 | 4 | 5;

export const RANK_NAMES: Record<AdventurerRank, string> = {
  1: "Novice",
  2: "Apprentice",
  3: "Journeyman",
  4: "Veteran",
  5: "Elite",
};

export const CLASS_COLORS: Record<AdventurerClass, string> = {
  warrior: "#e74c3c",   // red
  wizard: "#9b59b6",    // purple
  priest: "#3498db",    // blue
  archer: "#2ecc71",    // green
  assassin: "#f5c542",  // gold
};

// Synced with DIFFICULTY_COLORS so rank and difficulty look consistent
export const RANK_COLORS: Record<AdventurerRank, string> = {
  1: "var(--accent-green)",
  2: "var(--accent-blue)",
  3: "var(--accent-gold)",
  4: "#e67e22",
  5: "var(--accent-red)",
};

// ─── Adventurer type ────────────────────────────────────────────

export interface Adventurer {
  id: string;
  name: string;
  class: AdventurerClass;
  race: Race;
  origin: Origin;
  backstory: string;       // origin story text
  quirk: string;           // personality quirk text
  trait: string;           // backstory trait id
  rank: AdventurerRank;
  level: number;
  xp: number;
  alive: boolean;
  onMission: boolean; // true while deployed
  bonusStats: Partial<AdventurerStats>; // player-allocated stat points
  equipment: {
    head: string | null;
    chest: string | null;
    legs: string | null;
    boots: string | null;
    cloak: string | null;
    mainHand: string | null;
    offHand: string | null;
    ring1: string | null;
    ring2: string | null;
    amulet: string | null;
    trinket: string | null;
  };
  talents: string[];  // unlocked talent IDs
}

// ─── Stats ──────────────────────────────────────────────────────

export interface AdventurerStats {
  str: number;
  int: number;
  dex: number;
  vit: number;
  wis: number;
}

export const STAT_KEYS: (keyof AdventurerStats)[] = ["str", "int", "dex", "vit", "wis"];

export const STAT_META: { key: keyof AdventurerStats; name: string; icon: string; color: string; description: string }[] = [
  { key: "str", name: "Strength", icon: "💪", color: "#e74c3c", description: "Combat & escort mission success" },
  { key: "int", name: "Intelligence", icon: "🧠", color: "#3498db", description: "Magical & exploration mission success" },
  { key: "dex", name: "Dexterity", icon: "🏃", color: "#2ecc71", description: "Stealth & outdoor mission success" },
  { key: "vit", name: "Vitality", icon: "❤️", color: "#e67e22", description: "Reduces death chance" },
  { key: "wis", name: "Wisdom", icon: "📖", color: "#9b59b6", description: "Bonus XP from missions" },
];

export const CLASS_BASE_STATS: Record<AdventurerClass, AdventurerStats> = {
  warrior: { str: 6, int: 2, dex: 3, vit: 5, wis: 1 },
  wizard:  { str: 2, int: 7, dex: 2, vit: 3, wis: 4 },
  priest:  { str: 2, int: 5, dex: 2, vit: 5, wis: 5 },
  archer:  { str: 3, int: 2, dex: 7, vit: 3, wis: 2 },
  assassin:{ str: 4, int: 3, dex: 6, vit: 3, wis: 1 },
};

export const CLASS_STAT_GROWTH: Record<AdventurerClass, AdventurerStats> = {
  warrior: { str: 6, int: 1, dex: 2, vit: 5, wis: 1 },
  wizard:  { str: 1, int: 7, dex: 1, vit: 2, wis: 4 },
  priest:  { str: 1, int: 5, dex: 1, vit: 4, wis: 4 },
  archer:  { str: 2, int: 2, dex: 6, vit: 3, wis: 1 },
  assassin:{ str: 4, int: 2, dex: 6, vit: 2, wis: 1 },
};

/** Stat points gained per level that player can allocate */
export const STAT_POINTS_PER_LEVEL = 0; // No manual stat allocation — gear is the main customization

/** Calculate total stats for an adventurer (base + growth + origin + bonus + equipment) */
export function calcStats(adv: Adventurer, equipmentStats?: Partial<AdventurerStats>): AdventurerStats {
  const base = CLASS_BASE_STATS[adv.class];
  const growth = CLASS_STAT_GROWTH[adv.class];
  const bonus = adv.bonusStats;
  const equip = equipmentStats ?? {};
  const originDef = adv.origin ? getOrigin(adv.origin) : null;
  const originMods = originDef?.statMods ?? {};
  return {
    str: Math.floor(base.str + growth.str * (adv.level - 1)) + (originMods.str ?? 0) + (bonus.str ?? 0) + (equip.str ?? 0),
    int: Math.floor(base.int + growth.int * (adv.level - 1)) + (originMods.int ?? 0) + (bonus.int ?? 0) + (equip.int ?? 0),
    dex: Math.floor(base.dex + growth.dex * (adv.level - 1)) + (originMods.dex ?? 0) + (bonus.dex ?? 0) + (equip.dex ?? 0),
    vit: Math.floor(base.vit + growth.vit * (adv.level - 1)) + (originMods.vit ?? 0) + (bonus.vit ?? 0) + (equip.vit ?? 0),
    wis: Math.floor(base.wis + growth.wis * (adv.level - 1)) + (originMods.wis ?? 0) + (bonus.wis ?? 0) + (equip.wis ?? 0),
  };
}

/** Get unspent stat points */
export function getUnspentStatPoints(adv: Adventurer): number {
  const totalEarned = (adv.level - 1) * STAT_POINTS_PER_LEVEL;
  const b = adv.bonusStats;
  const totalSpent = (b.str ?? 0) + (b.int ?? 0) + (b.dex ?? 0) + (b.vit ?? 0) + (b.wis ?? 0);
  return totalEarned - totalSpent;
}

// ─── XP & Leveling ─────────────────────────────────────────────

/** XP needed to reach next level (exponential curve) */
export function getXpForLevel(level: number): number {
  // First levels are fast (15 for lvl 2), ramps up steeply
  return Math.floor(15 * Math.pow(1.5, level - 1));
}

/** Total XP accumulated across all levels */
export function getTotalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += getXpForLevel(i);
  return total;
}

/** XP gained from a mission */
export function getMissionXp(difficulty: number, success: boolean): number {
  const base = difficulty * 15;
  return success ? base : Math.floor(base * 0.4);
}

/** Rank thresholds — auto rank-up at these levels */
export const RANK_LEVEL_THRESHOLDS: Record<AdventurerRank, number> = {
  1: 1,   // Novice: level 1+
  2: 4,   // Apprentice: level 4+
  3: 8,   // Journeyman: level 8+
  4: 13,  // Veteran: level 13+
  5: 20,  // Elite: level 20+
};

/** Get the rank for a given level */
export function getRankForLevel(level: number): AdventurerRank {
  if (level >= 20) return 5;
  if (level >= 13) return 4;
  if (level >= 8) return 3;
  if (level >= 4) return 2;
  return 1;
}

/** Apply XP to an adventurer — returns { leveled, newRank } for notifications */
export function applyXp(adv: Adventurer, xpGain: number): { leveled: boolean; rankUp: boolean; oldRank: AdventurerRank } {
  const oldRank = adv.rank;
  adv.xp += xpGain;
  let leveled = false;

  while (adv.xp >= getXpForLevel(adv.level)) {
    adv.xp -= getXpForLevel(adv.level);
    adv.level += 1;
    leveled = true;
  }

  adv.rank = getRankForLevel(adv.level);
  return { leveled, rankUp: adv.rank !== oldRank, oldRank };
}

// ─── Name generation ────────────────────────────────────────────

// Build FEMALE_NAMES set from all origin data + manual additions for legacy names
const FEMALE_NAMES = new Set([
  ...ORIGINS.flatMap((o) => o.firstNamesFemale),
  "Xara", "Zara", "Maia", "Nyx", "Thea", "Raya", "Aria", "Luna", "Selene",
]);

// ─── Portrait system ────────────────────────────────────────────
// Origin-aware portraits: CDN_BASE/characters/{origin}/{class}_{origin}_{gender}_{n}.png
// Falls back to generic portraits for origins without images (e.g. feldgrund).

const CDN_CHARS = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/characters";

// How many portrait variants exist per origin/class/gender
const ORIGIN_PORTRAIT_COUNTS: Partial<Record<Origin, Partial<Record<string, number>>>> = {
  dunhollow:  { warrior_male: 3, warrior_female: 2, wizard_male: 3, wizard_female: 2, priest_male: 3, priest_female: 3, archer_male: 2, archer_female: 2, assassin_male: 1 },
  nordveld:   { warrior_male: 1, warrior_female: 2, wizard_male: 1, wizard_female: 2, priest_male: 1, priest_female: 1, archer_male: 1, archer_female: 1, assassin_male: 1, assassin_female: 1 },
  meridian:   { warrior_male: 1, warrior_female: 1, wizard_male: 1, wizard_female: 1, priest_male: 2, priest_female: 1, archer_male: 1, archer_female: 1, assassin_male: 2, assassin_female: 2 },
  zahkari:    { warrior_male: 1, warrior_female: 1, wizard_male: 1, wizard_female: 1, priest_male: 1, priest_female: 3, archer_male: 1, archer_female: 1, assassin_male: 1, assassin_female: 1 },
  tianzhou:    { warrior_male: 1, warrior_female: 1, wizard_male: 1, wizard_female: 1, priest_male: 1, priest_female: 1, archer_male: 1, archer_female: 1, assassin_male: 1, assassin_female: 2 },
  khorvani:   { warrior_male: 1, warrior_female: 1, wizard_male: 1, wizard_female: 1, priest_male: 1, priest_female: 1, archer_male: 1, archer_female: 1, assassin_male: 1, assassin_female: 1 },
  silvaneth:  { warrior_male: 1, warrior_female: 1, wizard_male: 1, wizard_female: 1, priest_male: 1, priest_female: 1, archer_male: 1, archer_female: 1, assassin_male: 1, assassin_female: 1 },
  hautsciels: { warrior_male: 1, warrior_female: 1, wizard_male: 1, wizard_female: 1, priest_male: 1, priest_female: 1, archer_male: 1, archer_female: 1, assassin_male: 1, assassin_female: 1 },
  khazdurim:  { warrior_male: 1, warrior_female: 1, wizard_male: 1, wizard_female: 1, priest_male: 1, priest_female: 1, archer_male: 1, archer_female: 1, assassin_male: 1, assassin_female: 1 },
};

// Generic fallback portraits (used when origin has no images)
const GENERIC_PORTRAITS: Record<AdventurerClass, { male: string[]; female: string[] }> = {
  warrior: { male: [`${CDN_CHARS}/warrior_male_1.png`, `${CDN_CHARS}/warrior_male_2.png`], female: [`${CDN_CHARS}/warrior_female_1.png`, `${CDN_CHARS}/warrior_female_2.png`] },
  wizard:  { male: [`${CDN_CHARS}/wizard_male_1.png`, `${CDN_CHARS}/wizard_male_2.png`], female: [`${CDN_CHARS}/wizard_female_1.png`, `${CDN_CHARS}/wizard_female_2.png`] },
  priest:  { male: [`${CDN_CHARS}/priest_male_1.png`, `${CDN_CHARS}/priest_male_2.png`], female: [`${CDN_CHARS}/priest_female_1.png`, `${CDN_CHARS}/priest_female_2.png`, `${CDN_CHARS}/priest_female_3.png`] },
  archer:  { male: [`${CDN_CHARS}/archer_male_1.png`, `${CDN_CHARS}/archer_male_2.png`], female: [`${CDN_CHARS}/archer_female_1.png`, `${CDN_CHARS}/archer_female_2.png`] },
  assassin:{ male: [`${CDN_CHARS}/assassin_male_1.png`, `${CDN_CHARS}/assassin_male_2.png`], female: [`${CDN_CHARS}/assassin_female_1.png`, `${CDN_CHARS}/assassin_female_2.png`] },
};

export function isFemale(name: string): boolean {
  return FEMALE_NAMES.has(name.split(" ")[0]);
}

function nameHash(name: string): number {
  return name.split(" ")[0].split("").reduce((h, c) => h + c.charCodeAt(0), 0);
}

export function getPortrait(name: string, cls: AdventurerClass, origin?: Origin): string {
  const female = isFemale(name);
  const gender = female ? "female" : "male";
  const hash = nameHash(name);

  // Try origin-specific portrait
  if (origin) {
    const key = `${cls}_${gender}`;
    const count = ORIGIN_PORTRAIT_COUNTS[origin]?.[key];
    if (count && count > 0) {
      const n = (hash % count) + 1;
      return `${CDN_CHARS}/${origin}/${cls}_${origin}_${gender}_${n}.png`;
    }
  }

  // Fallback to generic
  const portraits = female ? GENERIC_PORTRAITS[cls].female : GENERIC_PORTRAITS[cls].male;
  return portraits[hash % portraits.length];
}

export function getZoomedPortrait(name: string, cls: AdventurerClass, origin?: Origin): string {
  return getPortrait(name, cls, origin).replace(".png", "_zoomed.png");
}

// Simple seeded random for reproducibility within a session
let adventurerSeed = Date.now();
function seededRandom(): number {
  adventurerSeed = (adventurerSeed * 1664525 + 1013904223) & 0x7fffffff;
  return adventurerSeed / 0x7fffffff;
}

export function resetAdventurerSeed(seed: number) {
  adventurerSeed = seed;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)];
}

/** Pick a race using weighted probabilities */
function pickRace(): Race {
  const roll = seededRandom();
  if (roll < RACE_WEIGHTS.elf) return "elf";
  if (roll < RACE_WEIGHTS.elf + RACE_WEIGHTS.dwarf) return "dwarf";
  return "human";
}

/** Pick a weighted random backstory trait */
function pickTrait(): BackstoryTrait {
  const totalWeight = BACKSTORY_TRAITS.reduce((sum, t) => sum + t.weight, 0);
  let roll = seededRandom() * totalWeight;
  for (const trait of BACKSTORY_TRAITS) {
    roll -= trait.weight;
    if (roll <= 0) return trait;
  }
  return BACKSTORY_TRAITS[BACKSTORY_TRAITS.length - 1];
}

/** Pick a backstory archetype */
function pickBackstory(origin: OriginDef): string {
  const keys = Object.keys(origin.backstories) as (keyof OriginDef["backstories"])[];
  return origin.backstories[randomFrom(keys)];
}

/** Generate a name from an origin's name pool */
function generateOriginName(origin: OriginDef): string {
  const isMale = seededRandom() > 0.5;
  const firstNames = isMale ? origin.firstNamesMale : origin.firstNamesFemale;
  return `${randomFrom(firstNames)} ${randomFrom(origin.lastNames)}`;
}

export function generateName(): string {
  // Legacy fallback — uses Dunhollow pool
  const origin = getOrigin("dunhollow");
  return generateOriginName(origin);
}

// ─── Recruitment ────────────────────────────────────────────────

/** Gold cost to recruit an adventurer based on their rank */
export function getRecruitCost(rank: AdventurerRank): number {
  const COSTS: Record<AdventurerRank, number> = {
    1: 25,
    2: 75,
    3: 200,
    4: 500,
    5: 1200,
  };
  return COSTS[rank];
}

/** Generate a random adventurer candidate */
export function generateCandidate(id: string, maxRank: AdventurerRank = 2): Adventurer {
  // Higher ranks are rarer
  let rank: AdventurerRank = 1;
  const roll = seededRandom();
  if (maxRank >= 5 && roll > 0.97) rank = 5;
  else if (maxRank >= 4 && roll > 0.90) rank = 4;
  else if (maxRank >= 3 && roll > 0.75) rank = 3;
  else if (maxRank >= 2 && roll > 0.50) rank = 2;

  // Pick race, origin, name, backstory, trait
  const race = pickRace();
  const origins = getOriginsForRace(race);
  const origin = randomFrom(origins);
  const name = generateOriginName(origin);
  const backstory = pickBackstory(origin);
  const quirk = randomFrom(PERSONALITY_QUIRKS);
  const trait = pickTrait();

  // Recruits start just below rank threshold — they're fresh at that rank
  const level = Math.max(1, RANK_LEVEL_THRESHOLDS[rank] - 1);
  return {
    id,
    name,
    class: randomFrom(ADVENTURER_CLASSES).id,
    race,
    origin: origin.id,
    backstory,
    quirk,
    trait: trait.id,
    rank,
    level,
    xp: 0,
    alive: true,
    onMission: false,
    bonusStats: {},
    equipment: { head: null, chest: null, legs: null, boots: null, cloak: null, mainHand: null, offHand: null, ring1: null, ring2: null, amulet: null, trinket: null },
    talents: [],
  };
}

/** Max adventurer rank available — based on guild level AND average top-3 adventurer levels */
export function getMaxRecruitRank(guildLevel: number, adventurers?: Adventurer[]): AdventurerRank {
  // Guild level sets the hard cap
  const guildCap: AdventurerRank = guildLevel >= 5 ? 5 : guildLevel >= 4 ? 4 : guildLevel >= 3 ? 3 : guildLevel >= 2 ? 2 : 1;

  if (!adventurers || adventurers.length === 0) return Math.min(guildCap, 1) as AdventurerRank;

  // Average level of top 3 adventurers determines soft cap
  const sorted = [...adventurers].filter((a) => a.alive).sort((a, b) => b.level - a.level);
  const top3 = sorted.slice(0, 3);
  const avgLevel = top3.reduce((sum, a) => sum + a.level, 0) / top3.length;

  let levelCap: AdventurerRank = 1;
  if (avgLevel >= 16) levelCap = 5;
  else if (avgLevel >= 10) levelCap = 4;
  else if (avgLevel >= 6) levelCap = 3;
  else if (avgLevel >= 3) levelCap = 2;

  return Math.min(guildCap, levelCap) as AdventurerRank;
}

/** Number of recruitment candidates shown per refresh */
export function getCandidateCount(guildLevel: number): number {
  return Math.min(2 + guildLevel, 6); // 3 at Lv1, up to 6
}

/** Max roster size based on guild level */
export function getMaxRoster(guildLevel: number): number {
  return 3 + guildLevel * 2; // 5 at Lv1, 7 at Lv2, ... 13 at Lv5
}

/** Number of simultaneous mission slots */
export function getMissionSlots(guildLevel: number): number {
  // Lv1: 2 slots, Lv2: 3, Lv3: 4, Lv4: 5, Lv5: 6
  return Math.min(guildLevel + 1, 6);
}

// ─── Recruitment refresh interval (game-hours) ──────────────────

export const RECRUIT_REFRESH_HOURS = 6; // ~1 real day with 4-day seasons
export const MISSION_REFRESH_HOURS = 6; // ~1 real day with 4-day seasons
