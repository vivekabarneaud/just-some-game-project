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
  {
    id: "ch2",
    number: 2,
    title: "Our Own Hands",
    tagline: "The robin came once. We learn to do the rest ourselves.",
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
    id: "ch1_first_scouts",
    chapterId: "ch1",
    order: 2,
    title: "South, on a hill",
    teaser: "The first scouts return. The map is good. The news, less so.",
    fullText:
      "The scouts came back today with a map and a look I did not like. A wolf pack chased them once on the ridge, hungry enough to misjudge them, but they were back at the gate before dark, on their own feet. Father Corin said a blessing over their bread when they came in. Edda gave them water with mint in it. Then they sat down with me and Tomas and we read the map by candle.\n\n" +
      "The land they brought back is workable. Game trails to the north. Berry thickets along the river. A quarry site on the eastern ridge: Tomas brightened at that, which is the closest thing to a smile I have seen on him this week. Water in three places that did not dry by dusk. I have a list now, and a use for each line of it.\n\n" +
      "But two days' march south, on a hilltop, there are ruins. Stone foundations. A collapsed well. Half a tower still standing. The work of people who had thought ahead. The scouts found no bodies, no signs of a fight, no graves anyone took the trouble to dig. They left, or they were made to leave. The scouts could not tell which.\n\n" +
      "They had stone walls. They had a watchtower. It was not enough. I do not yet know what we know that they did not, or what they knew that we do not.\n\n" +
      "I will pray on it and put the book away.",
    cinematicId: "story_1_scouting",
  },
  {
    id: "ch1_garrison_ruins",
    chapterId: "ch1",
    order: 3,
    title: "Forty-seven days",
    teaser: "A name on a journal cover. A seal I do not know. Forty-seven days I cannot make sense of.",
    fullText:
      "The team came back from the ruins with a tin chest. They were tired but unhurt. Tomas walked them up to my tent himself and stayed while they set the chest on the long table. They told me they had pushed a little further south while they had the daylight: the trees go strange about three days down, they said. They had not walked that far. They felt it from a ridge.\n\n" +
      "The chest held a journal. The name on the cover is Captain Vardin Hale, of a Crown garrison whose seal I cannot place. Folded beneath it was something else: a small square of cloth, a child's first try at stitching, a few uneven flowers, no name. I set it aside before I began to read.\n\n" +
      "I read it alone, by candle, after the others had gone to bed.\n\n" +
      "The first entries are clean. Day one: posting accepted. Three sections of the southern barracks need re-roofing before winter. Hale wrote in a clean clerical hand. He was not a soldier who had given up on writing.\n\n" +
      "Day thirteen, his first strange entry. Sergeant Marrick reported on south-watch that he had heard his brother calling him from the tree-line. Marrick's brother died at sea fifteen years ago. Hale recorded the report and told Marrick to drink less.\n\n" +
      "Day fifteen, Marrick is gone. Bunk cold. Boots gone.\n\n" +
      "Day twenty, three men report hearing Marrick's voice from the trees. He is calling them by name.\n\n" +
      "By day twenty-two, four more have left in four nights. Hale sends a courier north to the Reach asking for guidance. The courier never comes back.\n\n" +
      "By day thirty he is keeping a tally in the corner of each page: how many remain.\n\n" +
      "Day thirty-eight, a recruit walks out the gate at midday. From the watchtower the others see him go, calmly, in plain daylight. They could not stop him without breaking his arm. He went anyway.\n\n" +
      "By day forty-two there are three of them left.\n\n" +
      "Day forty-four. He writes that he heard his daughter Ennara today. She died young. He says he will not go.\n\n" +
      "Day forty-five. Two lines.\n\n" +
      "'I heard Ennara again today. I am going to her.'\n\n" +
      "Then nothing. The journal stops.\n\n" +
      "I sat with the page open for a long time. I do not know what I have just read.\n\n" +
      "The men heard the dead. The voices called by name. They walked through barred gates at midnight. They walked at noon in plain daylight, calmly, where the others could see them go. Hale records all of this with the patience of a man who hopes the next page will explain. The next page never does.\n\n" +
      "What kind of plague does this? What kind of madness travels through walls and calls a man's brother by name? I do not know. I do not think Hale knew either. He kept writing because writing was what he could still do.\n\n" +
      "There is one more thing I cannot place. Hale wrote his garrison stood seven days' march from the Hollow Wastes. His gate is the hilltop ruins. My team felt the wrongness three days south of those same ruins.\n\n" +
      "A captain does not miscount a march. My team are not soldiers but they have eyes. I will send them back tomorrow to count the days honestly.\n\n" +
      "I went back to the folded cloth before I closed the chest. It was hers. Of course it was hers.\n\n" +
      "The rest I cannot place. I will sleep on it, if I manage to sleep at all.",
    cinematicId: "story_2_ruins",
  },
  {
    id: "ch1_warden",
    chapterId: "ch1",
    order: 4,
    title: "The Warden",
    teaser: "She walked my team home from a fight they should not have survived. She came inside. She had business to discuss.",
    fullText:
      "The team came back from the trees with a stranger.\n\n" +
      "She had walked them home from a fight they should not have survived. Two of them are bandaged tonight. They came up to the gate at dusk, and behind them was a woman in dark green, a bow across her back, the long ears and moss-grey hair of the Silvaneth. I had not stood near an elf before.\n\n" +
      "She introduced herself as Niamh, Warden of the Thornveil Rangers. She said she had business to discuss. She said it the way a stonemason says the wall needs a new course before winter. No warmth. No apology. Just the fact.\n\n" +
      "I sat her down at the long table. Edda put a cup of chamomile in front of her. Niamh wrapped her hands around it and drank slowly.\n\n" +
      "The team told me what happened. They had walked past the ruins, south, counting their steps the way I had asked them to. The trees went quiet a little less than three days down. They felt it before they heard it. Then they heard a man's voice in the trees, calling a name they did not know.\n\n" +
      "'Ennara,' they said.\n\n" +
      "I put my hand on the journal that was still open on the desk where I had left it last night. I did not need to move it.\n\n" +
      "Captain Vardin Hale, I told them. Ennara was his daughter. She died young.\n\n" +
      "Niamh nodded once. 'That helps,' she said. 'A name strengthens the work.'\n\n" +
      "Then she gave me the rest of it in pieces, between sips of tea, in her plain way.\n\n" +
      "The thing my team had fought, she said, was dispelled, not killed. It will reform in days, perhaps weeks. Only ritual frees a stuck soul; nothing else does. She could perform the binding herself, but she could not fight while she did it. She had seen my team fight. She thought they could hold a line for as long as the work takes.\n\n" +
      "She would come back in three days, she said. 'Bring them.'\n\n" +
      "I said yes before she finished.\n\n" +
      "I went to the desk and brought back the folded square of cloth from the chest, the one I had set aside before I read.\n\n" +
      "'His daughter made this,' I said. 'I think it is hers.'\n\n" +
      "Niamh leaned forward and unfolded one corner. She looked at the uneven flowers. She folded it again carefully and pushed it back across the table to me. 'Keep it safe,' she said. 'The team brings it on the day.'\n\n" +
      "I told her I wished I could carry it myself, but the village needs me here.\n\n" +
      "'And you cannot fight,' she said. 'You would be a liability.'\n\n" +
      "I think she meant it kindly.\n\n" +
      "I asked her how far the Wastes really were. She said she did not know. Her work is at the edge, she said. The edge is where the dead are still close enough to be heard. The Wastes lie further. She does not go there.\n\n" +
      "I asked her another thing. The captain heard the voices at his garrison. We have walked his ground twice now and not heard them. She was quiet for a moment, looking into her cup.\n\n" +
      "'There is a ward near the ruins,' she said. 'A stone older than us, set into the land where you would not see it. It holds the edge back from where you live, and from the road between.'\n\n" +
      "I asked who placed it. She said she did not know. 'The work is older than the Pact. Whoever set it is gone, and so are the rangers who knew them.'\n\n" +
      "Then she said the captain stood on its grave. 'It had been forgotten in his time. The line of women who kept it had thinned to nothing. He felt what an unkept ward fails to keep.'\n\n" +
      "She set down her cup. 'My grandmother's teacher reset it after he fell. We have kept it since. Old things end.'\n\n" +
      "She drank her tea.\n\n" +
      "When she stood to leave I asked where she was sleeping. She said the trees were fine.\n\n" +
      "'Three days,' she said again, and was gone.\n\n" +
      "I do not know what I am dealing with. I know she did not have to walk my team home. I know she did not have to tell me what she told me tonight. I know she could have left me to read Hale's journal alone for the rest of my life and never appeared at my gate.\n\n" +
      "She came. I am taking the help.",
    cinematicId: "story_3_dark_treeline",
  },
  {
    id: "ch1_captains_rest",
    chapterId: "ch1",
    order: 5,
    title: "The Captain's Rest",
    teaser: "The team rode south with Niamh at dawn. I waited at the gate. They came back at dusk.",
    fullText:
      "The team rode out at first light. Niamh was waiting at the south gate, the same dark green coat, the same patience. She did not greet anyone. She just nodded to the team and turned south.\n\n" +
      "I gave one of them the cloth at the gate. He took it, looked at it, said nothing, and put it inside his coat where the rain could not reach it.\n\n" +
      "I watched them ride off the way you watch ships go. There was nothing else to do.\n\n" +
      "I cannot tell you what I did between sunrise and sunset. I tried to read. I tried to write. I tried to inventory grain. I tried to walk the south fence. Edda came and made me sit down with chamomile twice. The second time she did not say anything. She just sat across from me until the cup was empty.\n\n" +
      "They came back at dusk.\n\n" +
      "Niamh was with them as far as the gate. She stopped on the road. She nodded once at me, said 'it is done,' and walked back into the trees. I do not know where she went. I did not ask.\n\n" +
      "The team came up to the long table. They were tired in the way men are tired when they have been frightened for several hours. They drank water and they sat for a long time before any of them could tell me what had happened.\n\n" +
      "The captain was not hard to find, they said. His voice was loud where the trees go quiet. They walked toward it.\n\n" +
      "Niamh marked her circle in the dirt and began the binding. The captain came at them hard. Cursed spirits drew in around the disturbance. The team held the line and worked. The boy who reported to me said striking a thing of mist with a sword and feeling it bleed was the strangest thing he had ever done. Niamh's binding makes our steel touch them while she stands.\n\n" +
      "The fight was long. The captain's manifestation faded slowly under their work, the way a fire dies when you stop feeding it. When he was on his knees, when he was looking past them at nothing, the boy walked forward with the cloth in his hands. He did not say anything. He just held it open.\n\n" +
      "The captain looked at it.\n\n" +
      "The boy said it was the only quiet thing he had seen in the forest all afternoon.\n\n" +
      "Then Niamh closed her binding. The captain stood up, looked at the cloth and the team, and was not there.\n\n" +
      "The boy said the trees went quiet differently than they had before. 'Quieter,' he said, and could not explain better.\n\n" +
      "They brought the cloth back. Niamh did not need it after the work. It is on my desk now, folded as it was when I gave it.\n\n" +
      "A man rested tonight. A man who walked into a forest a hundred and fifty years ago looking for his daughter is on the other side now. His daughter, wherever she is, is not still being called by her name from a place that is not her. That is a thing that did not happen yesterday and does today.\n\n" +
      "Father Corin will say a prayer at evening service for the captain's soul. He will not know that the prayer comes a day late, and that what released the soul was a Silvaneth ranger who has been doing this work in our forests longer than any of us has been alive. I will not tell him. There are things you do not bring to the altar yet.\n\n" +
      "I will sleep tonight. I think I will sleep well.",
  },
  {
    id: "ch1_first_robin",
    chapterId: "ch1",
    order: 6,
    title: "What the robin brought",
    teaser: "A note. A salve. And a thing about ghost wounds I had not known.",
    fullText:
      "A robin landed on the watchtower at first light. There was a folded scrap of paper and a small parcel tied to its leg. No sigil. No name. The handwriting on the note is precise but trembling, the kind of hand that has been writing for a very long time.\n\n" +
      "The note reads:\n\n" +
      "'What you did for him mattered. Use this when the wounds will not heal.'\n\n" +
      "The parcel was a salve, packed in oiled linen, smelling faintly of moonpetal and something I do not recognize. There was also a folded recipe card, written in the same hand. Quantities, steps, the order to add them.\n\n" +
      "I took it to Edda.\n\n" +
      "She unwrapped the linen and brought it close to her nose. 'Moonpetal,' she said. Then she said the name of the second herb in the old tongue. Then she went quiet, looking at it.\n\n" +
      "'You have seen this before?'\n\n" +
      "'The plants, yes. Not the way they are put together here. Whoever made this knows more than I do.'\n\n" +
      "She told me then what I had not known. The cuts the ghosts make do not heal the way other cuts do. The skin closes but the edge stays cold. The wounds weep slow. She had been changing the dressings every morning, hoping it would resolve, and it had not. She had been wishing for something better. Now there was something better.\n\n" +
      "She is going to use it on them tomorrow.\n\n" +
      "I do not know who sent the bird. I assume the Thornveil. I find I am grateful in a way that does not have a name yet.",
  },
  {
    id: "ch2_old_tongue",
    chapterId: "ch2",
    order: 1,
    title: "North of the road",
    teaser: "Edda needs more of the herb. The team rides north for the first time.",
    fullText:
      "The salve worked. The cold edge eased; the dressings began to dry. The robin had brought what it could carry, which was not much. Edda kept the small jar on a shelf above the stove and counted what was left every morning. Every morning there was less. We knew we had a problem before we said it out loud.\n\n" +
      "She came to me yesterday with a folded paper. On it was a careful drawing: a stem, paired leaves, a small four-petalled flower, a notation about the underside being grey rather than green. She had drawn it the way she draws everything when she means it: clean lines, no flourish, the kind of picture another herbalist could read at a glance.\n\n" +
      "I asked where it grew. She said not here. Not anywhere south of the road. It needs cool hills and a particular soil, and the place she remembered was a fortnight's ride north and east, off the main road, in country we did not cross on the way down.\n\n" +
      "*Feldgrund hills,*" + " she said. " + "*If anywhere still grows it. The men there are dwarves and they are private about their land. They will not be unkind. They may not be helpful either.*\n\n" +
      "I sent a team at first light with the drawing, a half-loaf for the road, and instructions to be civil and quiet.\n\n" +
      "They were gone fourteen days.\n\n" +
      "They came back with hard stories about the road. Wolves on the third day. A bear that did not want to be there any more than they did. Men with rusty knives in a clearing on the way home. They had buried no one, which is what I had asked of them, and they had not boasted about how, which is what I had hoped for.\n\n" +
      "On the seventh day, the road ended in a stream and the stream took them up into the hills. The hills were grey and quiet and full of small farms hidden from the road. They asked at three before they found the village Edda's map pointed to. The villagers were polite. The villagers were not interested.\n\n" +
      "There was an elder, a woman with iron-grey hair tied at the nape, and she received them at her door without inviting them in. She looked at the drawing. She said something quietly to a younger woman behind her, who went into the house and came back with a folded cloth.\n\n" +
      "Inside the cloth: a bundle of grey-leafed plants tied with twine, and a small leather pouch of seeds. The elder did not say much. She said her own people use it for sleep and for old grief; she said it grows wild along stone walls if the soil is right; she said the seeds prefer to be sown in autumn. She did not ask why the southerners wanted it. She did not seem to want to know.\n\n" +
      "The team tried to thank her by mentioning the road south, the wounded, the work they were doing. She let them speak. She did not respond to any of it. When they had finished she said only that she was glad the plant could be of use, and that she hoped they had a quiet road home. She made it clear, gently, that they were being given a thing and not a beginning. They understood. They thanked her again and left.\n\n" +
      "On the seventh day of the return, on a clear afternoon, they crested a ridge and saw the northern peaks for the first time. Snow on them, even in summer. The boy who was riding lead pulled up and looked for a long time. He told me later he had not believed mountains were real before he saw them.\n\n" +
      "Edda took the bundle and breathed it in. She nodded once, very small. She said: *They have it good up there.* And she did not say more.\n\n" +
      "I have the seeds in a small jar on my desk. We will sow them in autumn, the way the elder said. We have enough Greymantle for a few jars of salve. The next time someone is wounded by a thing that does not bleed, we will be ready.\n\n" +
      "I had hoped, going in, that we would find more than a plant. I think we did and we did not. The Feldgrund are people. They have their land, their winters, their small good things. They will not help us with what is coming for us, because they do not know it is coming and they would not believe it if we told them. That is theirs to keep. I am glad it is still there to keep.",
  },
  {
    id: "ch2_broken_stone",
    chapterId: "ch2",
    order: 2,
    title: "The dwarf at the gate",
    teaser: "A wounded dwarf at the gate. There were four of them. One made it back.",
    fullText:
      "Tomas was on the lower watch when he heard her at the gate, calling for the lord in a voice that did not have much breath left in it. He brought her in himself, half-carrying her, and laid her by Edda's stove. Edda was already lighting it. Nell had come down the ladder without being asked and stood ready at Edda's elbow. The salve was on the table before her wound was uncovered, because Edda knew what kind of wound it was the moment she saw the colour of it.\n\n" +
      "Her first words, between Edda's questions, were not about herself. *They are still down there. My brother. Please send someone. Please now.*\n\n" +
      "She was Marigold Hawthorn. They had been four. Her brother Sorrel, two friends called Reed and Tansy. They had gone south two weeks before, looking for the Wastes the southerners had spoken of. They had not believed the story, but they had not been able to stop thinking about it.\n\n" +
      "They had walked south for days and not found what they had come for. They had passed our settlement without stopping, not knowing we would be friends. They had circled east, looking for the bad ground the southerners had described. They had not found that either, until they came over a low rise and saw the stone.\n\n" +
      "Standing, taller than a dwarf, carved on three sides with lines none of them could read, and broken. Not weathered. The pieces lay around the base. Beyond it, Marigold said, the air had been wrong, and the cold in the air had been the cold of a thing watching them.\n\n" +
      "Sorrel had seen the shapes first. Coming up out of nothing, the way breath comes up out of cold water, except shaped, except watching. He had told her to ride. He had used the voice he used to use when she was small and would not listen. She had ridden.\n\n" +
      "I had three in the saddle within the hour. I gave them two spare horses and the little salve we could spare. I told them where to go, and what not to do, and to bring people home.\n\n" +
      "Father Corin came when the shout went up; he had been with Edda already, the way he is most evenings now. He stayed through the night and the day after. He did not say much. Once Marigold opened her eyes and he was there and she closed them again and seemed to breathe easier.\n\n" +
      "The team was gone five days. They brought back two of the three. Sorrel and Tansy were alive. Reed had fallen on the second night, and the team had buried him under stones east of the broken stone, with his face toward the hills, because Sorrel had asked.\n\n" +
      "They reported the country plainly. The ground there had not been the Wastes proper. The Wastes proper were still five days further south, if Hale's reckoning was right. What had killed Reed was something else: bad ground that should not have been bad, growing out from the broken stone the way damp grows up a wall. They had seen other stones along the ridge. They had not had time to look at them.\n\n" +
      "Sorrel and Tansy are with us now. Marigold is up and walking, slowly. Edda checks them twice a day. They are quiet. They sit in the sun in the afternoons and do not look at each other much. We do not ask them anything they have not offered. There will be time.\n\n" +
      "Yesterday Edda was making salve and Marigold was sleeping and Corin was watching her sleep, and Edda said, without looking up from her work, *I am glad you are here.* Father Corin did not answer for a long time. Then he said, *I have been wanting to be useful, for a long time.* Edda did not say anything to that. She went on with her work.\n\n" +
      "I have read back what I wrote when our team returned from the north. *I am glad it is still there to keep.* I do not strike the line through. I leave it where it is. But underneath, tonight, I write this:\n\n" +
      "*There was a stone south-east of us that I did not know about. It was holding something back. It is not holding it back anymore. I do not know how many more of those stones there are, or who put them where, or who knows how to mend them. I do not know who has been keeping us alive without telling us. I am going to find out.*",
  },
  // ─── Disabled until rewritten to match the current chronicle voice ───
  // The entries below were authored before the founding-cast voice pass
  // (Edda fragments, Jory retcon, Tomas/Corin polish). Surfacing them on
  // pantry build / settlement upgrade lands "out of the blue" — the
  // player hasn't earned the depth they assume. Re-enable individually
  // once the prose has been redone in the locked Lord voice. The quest
  // wires that triggered them have been removed (see quests.ts).
  //
  // {
  //   id: "ch1_nell_notebook",
  //   chapterId: "ch1",
  //   order: 2,
  //   title: "Nell's Notebook",
  //   teaser: "Winter is closer than it should be. She keeps her own book. He would not ask.",
  //   fullText:
  //     "Winter feels closer than it should. I caught myself today counting the shelves in the pantry instead of the people who would eat from them. Edda would call that lordly, and she would not mean it as a compliment.\n\n" +
  //     "Nell has been writing in her little book again. She will not show me, and I would not ask — I gave it to her on her tenth birthday with the understanding that it was hers alone.\n\n" +
  //     "But I see her some evenings: the stubby pencil between her teeth, her knees pulled up, the book balanced on them, her eyes tracking something I cannot see. Jory asked her tonight what she was writing. She said, very seriously: \"Things.\"\n\n" +
  //     "I thought, not for the first time, that she will be better at this than I am.",
  // },
  // {
  //   id: "ch1_stable_now",
  //   chapterId: "ch1",
  //   order: 3,
  //   title: "We Are Stable Now",
  //   teaser: "Cooked food under a roof. Six still. A word for this week.",
  //   fullText:
  //     "Tonight we ate cooked food under a roof. Only two roofs, really, and one of them leaked — Tomas has already said what he thinks about the leak — but a roof.\n\n" +
  //     "The wood pile is longer than my shoulder. The quarry has given us three good blocks and a fourth that Tomas called \"honest work, poor stone.\" The well is dug. Edda has a garden patch no bigger than a bedsheet and she has already forbidden any of us from walking near it. Father Corin reads from his hymnal most evenings, which is how I know what day of the week it is.\n\n" +
  //     "We are not safe. I do not pretend we are safe. There are nights I lie awake listening for something I cannot name, and mornings I count the six of us before I do anything else.\n\n" +
  //     "But we are stable. That is a word for this week. Next week will have its own.",
  // },
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
