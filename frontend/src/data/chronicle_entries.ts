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

/** Split an entry's fullText into authored slides for the paged modal. A
 *  paragraph consisting only of "---" is a page-turn; everything between markers
 *  is one slide (an array of paragraphs). Entries with no marker return a single
 *  slide (the whole entry), so the view is unchanged for short entries. */
export function splitChronicleSlides(fullText: string): string[][] {
  const groups: string[][] = [[]];
  for (const p of fullText.split("\n\n")) {
    if (p.trim() === "---") { groups.push([]); continue; }
    groups[groups.length - 1].push(p);
  }
  return groups.filter((g) => g.length > 0);
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
  {
    id: "ch3",
    number: 3,
    title: "Hands Beside Ours",
    tagline: "We learn what we have been sitting inside of, and who has been keeping it standing.",
  },
  {
    id: "ch4",
    number: 4,
    title: "The Hand That Broke It",
    tagline: "The war comes home.",
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
      "The map calls this Parcel 14. The clerk who drew the map never stood in it. It has a river bending east, a ridge of stone to the north, and a forest older than anything any of us has ever seen. There are old stumps in the clearing, grey and grown over: someone was here long before us, and then was not. I will not ask why tonight.\n\n" +
      "The others are sleeping. The fire is low. I am writing because I do not know what else a man does with the first night of the rest of his life.",
    cinematicId: "intro",
  },
  {
    id: "ch1_thornwoods",
    chapterId: "ch1",
    order: 2,
    title: "Two bows, a strong back, and a loud boy",
    teaser: "A family of hunters walked in from the trees. I have their names. The rest will take longer.",
    fullText:
      "They came in from the north trees a little after midday: four of them. Three grown, walking with the easy quiet of people who have come a long way and learned not to spend breath on it, and a small boy who was not quiet in the least. Hunters, the elder three. They asked for less than I expected and offered more, fresh meat for the pot and their bows for whatever the camp needs hunted or watched. I said yes. We are a small handful against a forest older than any king who ever claimed it; I would have said yes to almost anyone. But I think I would have said yes to these in any case.\n\n" +
      "They are a family. Thornwood. The eldest is Brenna, and it took me about one breath to see that she is the one who decides things, for all three of them. She does not raise her voice. She does not need to. She looked the camp over once, the way Tomas looks at a stone he means to cut, and I had the sense she had already counted our stores and guessed to the day how long they would last. I would rather have her counting than not.\n\n" +
      "---\n\n" +
      "The second is Gareth, who talks enough for all three and laughs before the joke is finished. Good company, the kind a camp wants by its fire. But I marked something under the ease: the laughter comes a beat too quickly, the way a man laughs who has found it safer than the alternative. I do not yet know what he is covering. I only know the covering is practiced.\n\n" +
      "The third is Godric, and you notice him the way you notice weather. He is the largest man I have ever stood beside and, so far, the gentlest. He carried half our firewood before anyone asked, and gave his share of the meat to the children before anyone could tell him to keep it. He has said perhaps ten words since midday. When Brenna speaks he listens as though it were scripture.\n\n" +
      "---\n\n" +
      "The boy is perhaps seven, and the loudest thing that has happened to this camp since we raised the first tent. He had told me his name, and a good deal of other business besides, before the grown three had finished saying good day. He is not theirs by blood, I think, though I would not swear to it and I did not ask; they keep him in the middle of them the way you keep the one thing you carried out of a burning house. Our Nell watched him the whole while from the tent flap and did not say a word. I do not know yet what to make of that. I made a note of it all the same.\n\n" +
      "I have their names and almost nothing else, and that is right. People do not arrive at the edge of the world with their whole story written on them. But I have set the names down here, and that is the small thing that turns a stranger into one of us: that someone troubled to keep the record. The guild has its first hands. The rest, who they were before the trees, I will learn the way you learn anything true out here. Slowly, and usually by accident.",
  },
  {
    id: "ch1_first_scouts",
    chapterId: "ch1",
    order: 3,
    title: "South, on a hill",
    teaser: "The first scouts return. The map is good. The news, less so.",
    fullText:
      "The scouts came back today with a map and a look I did not like. A wolf pack chased them once on the ridge, hungry enough to misjudge them, but they were back at the gate before dark, on their own feet. Father Corin said a blessing over their bread when they came in. Edda gave them water with mint in it. Then they sat down with me and Tomas and we read the map by candle.\n\n" +
      "The land they brought back is workable. Game trails to the north. Berry thickets along the river. A quarry site on the eastern ridge: Tomas brightened at that, which is the closest thing to a smile I have seen on him this week. Water in three places that did not dry by dusk. I have a list now, and a use for each line of it.\n\n" +
      "But two days' march south, on a hilltop, there is an abandoned watchtower. Stone foundations. A collapsed well. Half the tower still standing. The work of people who had thought ahead. The scouts found no bodies, no signs of a fight, no graves anyone took the trouble to dig. They left, or they were made to leave. The scouts could not tell which.\n\n" +
      "They had stone walls. They had a watchtower. It was not enough. I do not yet know what we know that they did not, or what they knew that we do not.\n\n" +
      "I will pray on it and put the book away.",
    cinematicId: "story_1_scouting",
  },
  {
    id: "ch1_garrison_ruins",
    chapterId: "ch1",
    order: 4,
    title: "Forty-seven days",
    teaser: "A name on a journal cover. A seal I do not know. Forty-seven days I cannot make sense of.",
    fullText:
      "The team came back from the old watch with a tin chest. They were tired but unhurt. Tomas walked them up to my tent himself and stayed while they set the chest on the long table. They told me they had pushed a little further south while they had the daylight: the trees go strange about three days down, they said. They had not walked that far. They felt it from a ridge.\n\n" +
      "The chest held a journal. The name on the cover is Captain Vardin Hale, of a Crown garrison whose seal I cannot place. Folded beneath it was something else: a small square of cloth, a child's first try at stitching, a few uneven flowers, no name. I set it aside before I began to read.\n\n" +
      "I read it alone, by candle, after the others had gone to bed.\n\n" +
      "---\n\n" +
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
      "---\n\n" +
      "I sat with the page open for a long time. I do not know what I have just read.\n\n" +
      "The men heard the dead. The voices called by name. They walked through barred gates at midnight. They walked at noon in plain daylight, calmly, where the others could see them go. Hale records all of this with the patience of a man who hopes the next page will explain. The next page never does.\n\n" +
      "What kind of plague does this? What kind of madness travels through walls and calls a man's brother by name? I do not know. I do not think Hale knew either. He kept writing because writing was what he could still do.\n\n" +
      "There is one more thing I cannot place. Hale wrote his garrison stood seven days' march from the Hollow Wastes. His gate is the old watch. My team felt the wrongness three days south of it.\n\n" +
      "A captain does not miscount a march. My team are not soldiers but they have eyes. I will send them back tomorrow to count the days honestly.\n\n" +
      "---\n\n" +
      "I went back to the folded cloth before I closed the chest. It was hers. Of course it was hers.\n\n" +
      "The rest I cannot place. I will sleep on it, if I manage to sleep at all.",
    cinematicId: "story_2_ruins",
  },
  {
    id: "ch1_warden",
    chapterId: "ch1",
    order: 5,
    title: "The Warden",
    teaser: "She walked my team home from a fight they should not have survived. She came inside. She had business to discuss.",
    fullText:
      "The team came back from the trees with a stranger.\n\n" +
      "She had walked them home from a fight they should not have survived. Two of them are bandaged tonight. They came up to the gate at dusk, and behind them was a woman in dark green, a bow across her back, the long ears and moss-grey hair of the Silvaneth. I had not stood near an elf before.\n\n" +
      "She introduced herself as Niamh, Warden of the Thornveil Rangers. She said she had business to discuss. She said it the way a stonemason says the wall needs a new course before winter. No warmth. No apology. Just the fact.\n\n" +
      "I sat her down at the long table. Edda put a cup of chamomile in front of her. Niamh wrapped her hands around it and drank slowly.\n\n" +
      "---\n\n" +
      "The team told me what happened. They had walked past the old watch, south, counting their steps the way I had asked them to. The trees went quiet a little less than three days down. They felt it before they heard it. Then they heard a man's voice in the trees, calling a name they did not know.\n\n" +
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
      "---\n\n" +
      "I asked her how far the Wastes really were. She said she did not know. Her work is at the edge, she said. The edge is where the dead are still close enough to be heard. The Wastes lie further. She does not go there.\n\n" +
      "I asked her another thing. The captain heard the voices at his garrison. We have walked his ground twice now and not heard them. She was quiet for a moment, looking into her cup.\n\n" +
      "'There are two wards near the old watch,' she said. 'Standing stones, older than us, set into the land where you would not see them. One north of the tower, one south. Together they hold the edge back from where you live, and from the road between.'\n\n" +
      "I asked who placed them. She said she did not know. 'The work is older than the Pact. Whoever set them is gone, and so are the rangers who knew them.'\n\n" +
      "Then she said the captain had camped in the gap between them. 'The south stone broke around the time his company came. The line of women who kept it had thinned to nothing, and an unkept ward cracks like an unkept roof. The north stone held, but one stone keeps one circle, and his walls stood past the reach of it. He felt what a broken ward fails to keep.'\n\n" +
      "She set down her cup. 'My grandmother's teacher reset the south stone after he fell. We have kept the pair since. Old things end.'\n\n" +
      "She drank her tea.\n\n" +
      "---\n\n" +
      "When she stood to leave I asked where she was sleeping. She said the trees were fine.\n\n" +
      "'Three days,' she said again, and was gone.\n\n" +
      "I do not know what I am dealing with. I know she did not have to walk my team home. I know she did not have to tell me what she told me tonight. I know she could have left me to read Hale's journal alone for the rest of my life and never appeared at my gate.\n\n" +
      "She came. I am taking the help.",
    cinematicId: "story_3_dark_treeline",
  },
  {
    id: "ch1_captains_rest",
    chapterId: "ch1",
    order: 6,
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
    order: 7,
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
    // Beat 1 — the rescue (fires when "Run Down" is claimed). She flees; the
    // word "murderer" is left hanging. The Lord wasn't there; this is the report.
    id: "ch1_hester_rescue",
    chapterId: "ch1",
    order: 7.5,
    title: "A murderer, they said",
    teaser: "The team came back from a chase with a rescue that thanked no one, and a word I cannot put down.",
    fullText:
      "Gareth would not ride past it. A woman, alone, run down through the brush the way you course a deer, and Gareth has never once in his life been able to watch that and keep walking. The team put the men on their knees, not in the ground, and let them go: nothing else to do with them, no one to hold them, and the woman already gone.\n\n" +
      "One of them spat as he went. \"Why would you save this murderer?\" And then, bitter, that she had not even stayed to say thank you, she was into the trees the moment the hands came off her.\n\n" +
      "So I have a rescue that thanked no one, a woman with a price on her head and no name to me, and a word left lying in the dirt where the men dropped it. Murderer. I was not there; I have only the team's telling of it. I do not know what she did. I know what many-against-one looks like, and we did not come to the edge of the world to look away from it. The rest will keep, or it will not.",
  },
  {
    // Beat 2a — the ghost puzzle (fires when "No One Followed" is claimed).
    // The mystery, and the "it's a ghost" joke. NO reveal yet — that's 2b,
    // days later (the timed Hester return).
    id: "ch1_woodcutter_ghost",
    chapterId: "ch1",
    order: 7.9,
    title: "The ghost in the woodpile",
    teaser: "Clean-cut timber keeps appearing at the mill overnight, and no one will own to it. I called it a ghost. We laughed.",
    fullText:
      "Jory came to me with a puzzle and a grin. Wood has been turning up on the mill stack overnight, more each morning, clean-felled and squared better than any hand we have can manage, and no one will own to it. We agreed it must be a ghost, then, and had a laugh about it. It is easy to laugh at a ghost you have not yet been given a reason to fear.\n\n" +
      "It has gone on for days now. The mill-hands leave the pile half-watched, half-hoping. Whoever it is wants nothing for the work, and does not want to be seen wanting nothing. Jory has stopped asking who and started just being glad of the timber. A ghost, then. Ours. I can think of stranger things to be haunted by than good clean wood.",
  },
  {
    // Beat 2b — the reveal (fires when Hester returns, ~a day after 2a). The
    // recognition scene; she stays; her thank-you was the wood all along.
    id: "ch1_woodcutter",
    chapterId: "ch1",
    order: 8,
    title: "The woman who came back",
    teaser: "The ghost in our woodpile let herself be found this morning. I knew her the moment Gareth did, and I did not send her away.",
    fullText:
      "This morning she let herself be found. Jory brought her to my tent pleased as a boy with a bird's nest, not knowing what he had caught. Gareth was with me when she came in. He went still, and then he said it: that is her. The woman from the chase. The one the men called a murderer, the day we put them on their knees and she was already gone.\n\n" +
      "So now I knew. The ghost in our woodpile was a hunted woman with some price on her, who had crept back to the one place that had done her a kindness and paid it the only way she seemed to have, in timber, in the dark, asking nothing.\n\n" +
      "She did not explain herself. She did not ask me to take her word over the word of the men who hunted her. She stood with her jaw set like a barred door and waited for me to decide what she was. I have learned to weigh what a person does against what is said of them. What this one had done was leave us a week of honest work in the dark and take nothing for it. The word of men who run a lone woman through the brush does not weigh much against that.\n\n" +
      "I told her she could stay. She nodded, once, and went back to the mill. Gareth looked glad, and tried to hide it. We have a feller now, the finest I have ever seen, and a great many questions I have decided not to ask. The wood was her thanks. I understood that much, at least.",
  },
  {
    id: "ch1_cobb_returns",
    chapterId: "ch1",
    order: 8.5,
    title: "The road opens",
    teaser: "Cobb came back, and not with two mules. A wagon, an axle groaning with goods, and the plain fact of it: someone judged the way to us worth the risk.",
    fullText:
      "Cobb came back. I had half thought the wagon was a boast, the kind a trader makes to be polite about a place he does not expect to see again. It was not a boast. The team met him at the boundary marker and brought him in whole, axle groaning, and he climbed down looking pleased with himself and the world.\n\n" +
      "He walked the market we built for him, and looked a long moment at the tavern, and said little, which for Cobb is a kind of ceremony. Then, climbing back up to his seat: \"You will see me again. I have told others.\"\n\n" +
      "That last part is what I keep turning over. Not the goods. The plain fact that a man weighed the road to us against the risk of it and decided we were worth the wheels, and then said so to other men. We are on someone's map now: a place people come to, and not only a clearing we are holding against the dark. I did not expect to feel it so much.",
  },
  {
    id: "ch1_cobb_robbed",
    chapterId: "ch1",
    order: 8.6,
    title: "The road turns",
    teaser: "Cobb came in on foot, at dusk, with no wagon and no boots. They took the lot on the downriver road and left him the walk.",
    fullText:
      "Cobb came in on foot tonight, at dusk, and I did not know him at first. No wagon. No mules. No boots. They had taken the lot on the downriver road, the goods and the beasts and the coat off his back, and left him the long walk to think about it. We had known the road was souring; we had been sending our own out to walk merchants past the worst of it for weeks. But knowing a thing and seeing it done to a friend are two different animals.\n\n" +
      "He was more shaken than hurt, and more ashamed of the shaking than of either. He kept saying he should have known, should have come armed, should have come in daylight, as though the fault were his for trusting a road we had told him was safe. I told him it was ours. We are the reason he came. We are the reason he will come again, if I have any say in it.\n\n" +
      "It is a strange grief, this one. A season ago a hard road was only the world being the world. Now it is a thing done to one of ours, on the way to us, and I feel it as such. That is what it is to have a place people come to. You inherit the road that leads to it.",
  },
  {
    id: "ch1_road_organized",
    chapterId: "ch1",
    order: 8.7,
    title: "Someone is giving orders",
    teaser: "This is not desperation anymore. They turn back every wagon, from the same ground, on the same plan. Someone is giving the orders.",
    fullText:
      "The team came back from the road saying what I did not want to hear. This is not a handful of hungry men chancing a wagon. They turn back every trader who tries the track, from the same ground, waiting the same way, breaking off the same way when it turns against them. That is not desperation. That is a plan. Someone is giving the orders.\n\n" +
      "I keep coming back to that. A desperate man I can pity, and pity is an easy thing to act on gently. A man who has taken desperate men and made a company of them, who has learned that our road pays and set himself to milking it, that is another thing entirely. He is not hungry. He is in business, and we are the business.\n\n" +
      "Brenna has asked to go and find where they hole up. I have said yes. I do not want a war on the road. I want the road, and I would like it without burying the men standing in the way of it. We will see whether the one giving the orders leaves me the choice.",
  },
  {
    id: "ch1_road_ours",
    chapterId: "ch1",
    order: 8.8,
    title: "The road is ours",
    teaser: "We broke their captain in front of them and the company came apart. We brought home what they took. We buried none of them.",
    fullText:
      "Brenna found the camp, a gully a half-day down, and the team went in at first light. It went the way I had hoped and had not let myself expect. They broke the man they call the Tollman in front of his own company, and the moment he was down and running the rest of them went with him, because it was him they followed and not the road. A company is only a company while the man at its head is still standing.\n\n" +
      "We brought home what was piled in that camp, Cobb's coat among it, and other folk's goods we will find the owners of where we can. We took a bar of fine steel the Tollman had kept back for himself, worth more than the men he spent. The Blacksmith turned it over a long while and said he could make one good blade of it. I told him to. A road paid for that steel. Let it keep the road.\n\n" +
      "And here is the part I mean to hold onto: we buried none of them. We frightened them off their trade and out of our country, and every one of them walked away with the chance to be something other than a bandit somewhere else, if they have the sense for it. I did not want a pile of bodies at the boundary marker. I wanted the road. Tonight the road is ours, and the ledger is clean.",
  },
  {
    id: "ch2_mothers_errand",
    chapterId: "ch2",
    order: 20,
    title: "The gambler and his mother",
    teaser: "The fool we pulled off the ford is already at our fire, telling the tale like a winning hand. The woman who begged for him sits apart, and her needles never stop.",
    fullText:
      "The men at the old ford wanted the boy dead over a hand of cards. We put them on the ground instead and brought him home, and by nightfall Edmund Blackwood was at our fire telling the whole thing like it was the best game he ever lost, grinning, doing the voices of the men who had meant to kill him. Good company. The kind a camp warms to fast.\n\n" +
      "His mother is not like that. She gave no name at the gate, only that her son was cornered and she could not reach him. Elspeth, he calls her. She sat a little apart from the fire tonight, where she could see both doors, with yarn in her hands and the needles going the whole time, turning out some small soft thing for one of the children. She smiled when he did. But when he laughed at how close it had been, at the odds of it, something in her face did not smile.\n\n" +
      "I do not know their story. I know she came to my gate before dawn with no name and begged for the boy, and I know she watches him the way you watch a spark that has landed near dry thatch. They will stay. We have room for the hunted, and it seems we are becoming the kind of place they come to.",
  },
  {
    id: "ch2_whose_blood",
    chapterId: "ch2",
    order: 20.1,
    title: "Whose blood",
    teaser: "Edmund cannot sit still without a wager on it. His mother watches him do it, and I have stopped needing to ask why she is afraid.",
    fullText:
      "I have had some days to watch them now. Edmund cannot sit an hour without turning it into a wager: dice with the hunters, a bet on whose arrow flies truest, his own skin against a bad road when a safer one runs beside it. He wins more than he should. Whether the luck is real or he is the finest cheat I have met, I cannot say, and I have watched closely.\n\n" +
      "Elspeth watches closer. She taught him what he knows, I think: the quiet way of moving, the patience, the blade held low. What she did not mean to teach him was the joy of it, and that is the thing she cannot take back. Her needles never stop. The little things she makes are gentle past anything in her eyes when she looks at her grown son laughing at a long odd.\n\n" +
      "She has not told me what she fears, and she does not have to. It is not the frontier. It is him: what he loves, and where it will take him. There is a small pouch at her belt she never opens in company, and a stillness in her when a stranger stands too near a door. I have decided not to ask what she did before she came here. A man learns which questions to keep to himself, and I have kept harder ones than these.",
  },
  {
    id: "ch1_reeds_voice",
    chapterId: "ch1",
    order: 9,
    title: "The voice in the reeds",
    teaser: "The gatherers brought back the fenbalm and a strange tale: an old woman at the water's edge who did not run from armed men, and offered a bargain.",
    fullText:
      "The gatherers came back from the fen whole, the fenbalm cut and the adders turned away, and one of them with a story I have turned over since. There is an old woman living out past the reeds. None of us knew she was there. She did not run from armed men; she came to the edge of the firm ground and offered a bargain, plain as a market-wife: leave a little something for her at the flat stone by the water, and the snakes will let my people cut in peace.\n\n" +
      "We are new to this country and do not know its people, if she is to be counted one of them, alone as she is out there in the wet. I do not much like owing a marsh. But sending armed men every time the winter fevers come is a dearer price than a handful of grain left on a stone, and Edda wants her fenbalm. We will try the old woman's terms. I will keep my eyes open.",
  },
  {
    id: "ch1_reeds_price",
    chapterId: "ch1",
    order: 9.1,
    title: "What the reeds cost",
    teaser: "We left the offering and the gatherers walked safe. A fair trade, and an easy one.",
    fullText:
      "We left what she asked at the flat stone, a measure of grain and nothing stranger, and it was as she promised: the gatherers walked the fen and cut their fenbalm, and not one adder rose at them. A fair trade, and an easy one.\n\n" +
      "They say she watched them from the reeds the whole while and did not come near, and that when they turned for home she raised a hand, almost friendly. An old woman living alone in a marsh, glad of a little grain and a little company kept at a distance. Stranger folk than that keep to themselves out here, I am sure.\n\n" +
      "Edda has her fenbalm for the winter, and the snakes kept their peace. I will take the easy bargain while it stays easy.",
  },
  {
    id: "ch1_reeds_tea",
    chapterId: "ch1",
    order: 9.2,
    title: "The old woman's tea",
    teaser: "The gatherers stay for tea now, out at the fen. Bett came home full of Aldith's kindness, and a small, funny thing about the little painting by her stove.",
    fullText:
      "The gatherers have stopped hurrying home from the fen. Aldith has them in for tea now, that is her name, sits them down by the stove and talks their ears off, and sends them back with the fenbalm and half a loaf besides. Bett came home this evening still laughing about it. Talked half to death, she said, and worth every minute. A widow, Bett reckons, forty years someone's wife and no one's now, and she bakes as though she still had a full table to feed. There is always bread, more than one old woman could eat in a week.\n\n" +
      "I sent word through the gatherers that she would be welcome behind our walls, that no one should winter alone in a marsh. She would not hear of it. The fen is her home, she told them, and she will not leave it now. I can respect that in a soul, even while I wish she would not.\n\n" +
      "And there is a small thing Bett told me, the way you would mention the weather. Aldith keeps a little painting by the stove, of herself and her granddaughter, and Bett swears the girl is the spitting image of our Nell. The same face, she says. You would take them for sisters. Aldith was delighted to hear it and wanted to know all about our Nell, and Bett, who has never once in her life left a question unanswered, told her the lot.\n\n" +
      "It is a good thing to have a kindly neighbour in a country this hard, even a strange one alone in a marsh. I am glad the trade turned out to be more than a trade.",
  },
  {
    id: "ch1_reeds_doubt",
    chapterId: "ch1",
    order: 9.3,
    title: "Grain, and only grain",
    teaser: "Three tusks, then two hooves, then a skull. I sent the skull. And then I drew a line, and did not tell Edda that I had drawn it.",
    fullText:
      "It went as I feared it would, and I am not easy about how easily it went. The skull to the flat stone by dark, the fenbalm home by morning, the adders still, Aldith raising her hand from the reeds as the gatherers turned for home. Nothing happened. Same as ever. I am tired of writing that down.\n\n" +
      "It is the shape of it that troubles me. Three tusks. Then two hooves. Then one skull. The asking growing smaller in number and worse in kind, as though she needed less of a thing the nearer it came to whatever she is truly after. I know her name now, and I find that is very near all I know true of her: not where she came from, not who it is she has lost, not what an old woman alone in a fen means to do with the picked skull of a boar. A remedy, Edda says. I have stopped believing it is a remedy.\n\n" +
      "So I sent the skull, but I sent word with it, plain: grain, from here, and grain only. We will trade her the herb for our bread as we always have, and gladly. But no more teeth, no more hooves, no more bone. One more asking like the last three and we are done with the reeds, fenbalm or no.\n\n" +
      "I have not told Edda I drew the line, nor why. She is fond of the old woman, and the fondness is a good thing, and I have no cause yet to spoil it. Only a shape, and a count I keep, and this page.",
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
  // ── The Stonebridge arrival (early Ch2) — the magic the Lord HARBORS ──
  {
    id: "ch2_stonebridge_arrival",
    chapterId: "ch2",
    order: 1.2,
    title: "The priest at the gate",
    teaser: "A wandering priest and his quiet brother came up the south road. Before he had eaten, he asked how he could be of use.",
    fullText:
      "A wandering priest came to the gate today, worn from a long road south, and a younger brother at his shoulder so quiet I twice forgot he was standing there. Aldwin, he calls himself. He is the kind of man you are glad to see on a frontier: he has kept chapels that took in the hungry and the hunted, sat with the dying, asked no questions of anyone. A real priest is a godsend out here, and I welcomed them both easily.\n\n" +
      "What stayed with me was that he would not be idle. Before he had eaten, before he had slept a night under a roof he could trust, he asked how he could be of use. I told him the truth: our teams come back from the south hurt more often than I like. He said then that is where he would go. Not to fight, he has no stomach for the blade, but to keep them whole, so that fewer come home broken. A man given shelter for nothing, he said, ought to earn it. I did not argue. We can use the hands, and I think he needs the earning more than we need the help.\n\n" +
      "The brother said almost nothing. He kept to the priest's shadow and watched the door more than a man with nothing to mind. When I asked after him, Aldwin answered a half-beat too carefully, and then found somewhere else to look. There is more to these two than a priest and his kin on the road. But a man who took in five strangers can spare two their secrets a while longer.",
  },
  {
    id: "ch2_stonebridge_hunch",
    chapterId: "ch2",
    order: 1.4,
    title: "What I have decided not to ask",
    teaser: "Edda dotes on the silent boy. Corin keeps low company with the priest and goes quiet when I come near.",
    fullText:
      "Edda has taken to the priest's quiet brother in a way I cannot account for. The boy says ten words a day, and she treats him as though he were made of glass and gold both, saving him the softest bread, finding reasons to keep him near the stove where it is warm.\n\n" +
      "And Father Corin, who I have never known to keep a thing from me, keeps long low company with Aldwin down by the chapel, and goes quiet the moment I come near, the way men do when the talk was not meant for you.\n\n" +
      "I have not asked. Whatever it is, it is theirs, and they carry it carefully, and no harm has come of it. A man who took in five strangers off the road can let two more keep their own counsel a while longer. If it wants telling, it will be told.",
  },
  {
    id: "ch2_stonebridge_confession",
    chapterId: "ch2",
    order: 1.6,
    title: "The word the Order burns men for",
    teaser: "The quiet one came to me alone tonight. He said the word himself, with his hands shaking.",
    fullText:
      "The quiet one came to me alone tonight, and I will not soon forget the sound of a voice I had barely heard. He told me, plainly, that he is a wizard. He said the word himself, the word the Order burns men for, the word I was raised to cross myself against, and he said it with his hands shaking, because his brother would sooner die than say it and someone had to.\n\n" +
      "I know what he set in my hands. Shelter a wizard and you are a heretic; they burn the village that hides one. He knows that better than I do. He told me anyway. Not to save himself, but because he could not stand to watch his brother give up one more home for his sake.\n\n" +
      "I made my choice before he had finished speaking. The courage of it decided me, more than any argument for or against: a boy that frightened, telling me the one thing that could get him killed, to buy his brother a life with him no longer in the shadows. I told him he and Aldwin were both staying. He looked at me as though I had spoken in a language he did not know.",
  },
  {
    id: "ch2_stonebridge_plea",
    chapterId: "ch2",
    order: 1.7,
    title: "A hand held out",
    teaser: "Aldwin came at a dead run, grey as ash, to beg for a life I had already spared.",
    fullText:
      "Aldwin came an hour later at a dead run, grey as ash; he had learned where his brother had gone. He did not ask what I meant to do. He begged. For the boy's life, offering me his own, offering to leave, offering anything, the words falling over each other faster than I could answer them.\n\n" +
      "I let him get most of the way through before I told him to stop. I told him his brother had already come to me, that I had made my choice before the boy finished speaking, and that they were both staying. He looked at me the way a man looks who has braced against a blow his whole life and felt, instead, a hand held out.\n\n" +
      "Twenty years, I think, he has carried this alone. I do not believe he knew how to set it down. I told him, gently, because he needed to hear it: that he had raised a brave one, braver than himself maybe, a boy who did not wait to be sure of me.",
  },
  {
    id: "ch2_stonebridge_aftermath",
    chapterId: "ch2",
    order: 1.8,
    title: "God forgive me if I am wrong",
    teaser: "I have done a thing the Doctrine has one word for, and the word is damnable. I keep waiting to feel damned.",
    fullText:
      "I have done a thing tonight the Doctrine has only one word for, and the word is damnable. I keep waiting to feel damned. Instead I feel afraid, which is a different thing, and beneath the fear something I have no name for, that might be the first honest feeling I have had about my faith in years.\n\n" +
      "I have set every soul here at risk for two men I have known a season. If the Order ever comes, what I decided tonight is the rope they hang us with. And I would decide it again.\n\n" +
      "I told the brothers what I will tell no one beyond these walls: the boy stays a shadow when strangers are near. Not for shame, never that, but because the world past our fields would burn him for being born, and I will not give it the chance. God forgive me if I am wrong. I find, to my own surprise, that I do not think I am.",
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
  {
    id: "ch2_walking_the_line",
    chapterId: "ch2",
    order: 3,
    title: "Walking the line",
    teaser: "The team walks the ridge of stones and brings back the first map of the line we have apparently been living inside.",
    fullText:
      "The team rode out at first light with bread, ink, and a roll of parchment. I had asked them to walk the line. Map the stones. Mark which were standing and which had fallen. Bring back enough that I could see the shape of the thing we have apparently been sitting inside.\n\n" +
      "They were gone six days.\n\n" +
      "The first stone they reached was east of us, on a ridge I had walked past more than once. They had ridden past it more than once too. Until now none of us had thought to look at it. It was twice the height of a man, weathered, carved on three sides with the same kind of lines Marigold had described. The air around it was still. The kind of stillness that does not feel empty. Birds rested at the base, the team said. There were more birds at the base than around it. They marked it standing.\n\n" +
      "They turned south to the old watch. We have ridden through that country half a dozen times. We have buried a man there. We have bound a captain there. We never once thought to look at the two standing stones a half-mile north and a half-mile south of the watchtower. The team said they had not seen them on the way down to Hale's mission either. The mind does not see what it has no name for.\n\n" +
      "Both stones were standing. Both whole. But not both unmarked. The south stone carries old mend lines, seams of paler stone where someone made it whole again long after it had broken. The air around them was still in the way the air around the east stone is still. The team said that when they stood between them they could feel the boundary the stones make, very faint, like a held breath. They marked both stones on the parchment.\n\n" +
      "And the team understood, standing there, what Niamh had told me over her tea. The stillness between those stones is younger than the bones in the old watch above them. The south stone broke around the time Hale's company came. For the forty-seven days of his garrison there was a hole in the wall where it should have stood. The north stone held its own circle, but one stone keeps one circle, and his walls stood past the reach of it. What came up out of the unwatched ground to the south was close enough to be heard. His men did not know what was reaching for them. They walked toward it because it called. The same ground is quiet now because a ranger whose name I will never know put the stone back together, when it was too late to matter to anyone but us.\n\n" +
      "They rode west then. The road west goes through country I have never seen. They marked one more standing stone on the parchment, west of where we sit, intact. They said it hummed at them, very faintly, the way a stretched string hums when the wind passes over it. They marked it.\n\n" +
      "Then they came to the next stone, deeper west, well outside any ground I had walked or thought about. This one was broken. The team did not say so directly but I read it in the way they wrote it down on the parchment. They put a small mark there I have not seen before in any of their handwriting: a single short line, like a wound. The ground around the stone was bad ground. They fought there, briefly, and lost no one, and got out with the map. They told me afterward that the breakage on that stone looked different from anything weather alone would have made. There were chiseled lines that crossed the original carving in places, faint and shallow, that could have been the work of a careless tool or could have been something else. They could not say.\n\n" +
      "I am writing this in plain sight, because I want it on the page: someone may have broken that stone. Or the weather did, and weather is harder on standing things than I had ever believed. The team could not say. The cracks were too clean for me to want to let it rest. But who would have done it, and why, and how long ago, none of us could say.\n\n" +
      "They came home on the seventh day.\n\n" +
      "I have the parchment on my desk. It shows eight things I did not know yesterday: a settlement, the old watch, four standing stones, and two broken ones, counting the one Marigold's brother fell beside. Whatever the stones are, they are doing something where they still stand, and they are not doing it where they have fallen. The land moves around them in a way the team can describe but not explain. I cannot explain it either. But I can count, and I am counting.\n\n" +
      "A robin came in this evening. There was a piece of paper tied to its leg in the same hand that the first robin's note was written in. It said: *east, three days, at the bend of the stream where the silver birches grow. She is there for the next moon.*\n\n" +
      "I do not know who is writing to me. I do not know how they know what I am looking for. I know now where she is. I am going to ride.",
  },
  {
    id: "ch2_silver_birches",
    chapterId: "ch2",
    order: 4,
    title: "The silver birches",
    teaser: "The team rides east to fetch Niamh, and the Warden sits at our table.",
    fullText:
      "I sent two of the team east the morning after the robin came. I asked them for nothing but quiet courtesy. I asked them to be the smallest party I could send and still feel that I had sent something.\n\n" +
      "They were gone six days.\n\n" +
      "On the second day they passed the east standing stone, the one we had marked on the map. They paused there for a long time. One of them wrote in the report that the stone \"asked them to slow down a little\" and then crossed the line out, then wrote it back in.\n\n" +
      "On the third day they came to the bend of the stream where the silver birches grow. The camp was small: a fire ring, a stretched canvas, a horse, a single Thornveil ranger sitting cross-legged in the moss working with a strip of bark and a knife. They had expected Niamh. They had not expected to find her at her work. They stood at the edge of the clearing until she looked up. She nodded once. She put down the bark and the knife and stood.\n\n" +
      "The team delivered the message carefully. They said that the lord had been looking for her, and that there was a map at the lord's table waiting for her eyes, and that the lord asked her to come if she would.\n\n" +
      "Niamh did not ask why. She did not ask what kind of map. She packed her camp inside an hour. They rode south for three days and arrived at our gate at sundown.\n\n" +
      "She came into the hall and read the parchment without speaking. She looked at the east stone on the map. She looked at the west stone. She looked at the line of three broken ones. She looked at the small mark like a wound my team had drawn at the deep west stone. She put her finger on each of them in turn.\n\n" +
      "Then she said: *They are wards. My people put them down a long time ago. Most of them are older than we remember. Some we have kept up. Some we have lost. The one near where your dwarves were hurt was one we should not have lost.*\n\n" +
      "I asked her what they hold back. She said: *Things that would otherwise be where you are sitting.*\n\n" +
      "I asked her if more had failed than the ones we had found. She said: *Yes. Below the line we walked, there are stones we cannot reach anymore. They have been broken for a long time. The Wastes are over them. We will not get them back. The fight is for the ones we can still reach.*\n\n" +
      "I asked her who broke them. She did not answer that question directly. She looked at the parchment for a long time and then she said: *Different stones, different hands. I will tell you what I know when there is reason to. For now, the question is which of the standing stones we will lose next, and the answer is whichever one we leave alone.*\n\n" +
      "We talked terms. She did not hide that her people are few. She said they cannot walk the line alone, that they have not been able to for centuries, and that finding a settlement with hands and a head and a willingness to count was the first piece of good news her people had had in her lifetime. She asked us to be the eyes that watch the line. She and her rangers would be the hands that mend what we find.\n\n" +
      "I asked her where to start. She put her finger on the easternmost broken mark, where Marigold's brother had told her to ride. *There. We close that wound first. Then we walk west.*\n\n" +
      "I asked her about the robin. I asked who had been writing to me.\n\n" +
      "She looked at me for a long moment. Then she said: *There are watchers older than my people. Some of them keep us alive. Some of them prefer that we do not look at them. Be grateful and do not chase the bird.*\n\n" +
      "She stayed three nights at the settlement. She slept little. She met with Edda one evening and they spoke quietly in a kitchen in a way I did not ask about. She rode out on the fourth morning with two of her rangers who had come up to meet her here. She said she would meet us at the broken stone in eight days, with what she needed.\n\n" +
      "I have eight days to ready a team. I have eight days to consider that for the first time since I came to this country, my settlement is part of something larger than itself, and that the something larger has been losing ground for a thousand years, and that we have just stopped it from losing another inch.",
  },
  {
    id: "ch2_first_inch",
    chapterId: "ch2",
    order: 5,
    title: "The first inch",
    teaser: "Niamh meets us at the eastern broken stone. The stone goes back up. We win an inch.",
    fullText:
      "The team rode out at sunrise on the eighth day. Niamh met them where she said she would, with two of her rangers behind her on horseback. She had a small wooden case with her that she did not open until they reached the stone. They did not ask what was in it.\n\n" +
      "The ride out was quiet, they said. They passed the east intact stone on the second morning. They rode through the air around it without comment. They knew what it was now. There was nothing to say about it that the silence did not say.\n\n" +
      "They reached the broken stone at midday on the third day. They told me afterward that the parchment had not shown how tall it had once been. The pieces lay in long grass around a stump that came up to a man's waist. The carved lines were still legible in places, very old. What the parchment had also not shown was that the country around the stone felt watched in a way the country between the settlement and the stone did not.\n\n" +
      "Niamh asked them to make a perimeter around the stump. She said she would need the better part of an hour. She said the worst things would come up out of the ground when she started, because the ground would not want her to do what she was about to do. She said that her binding would let their blades cut what should not cut, but only while she stood. She said: *if I fall, get out. Do not stay for me. Get out and ride for Edda's table and forget this place. I will be no use to you dead.*\n\n" +
      "They made the perimeter. She opened the case. She knelt at the broken pieces and began.\n\n" +
      "It is not their place to tell me what she did, and they could not have if they had wanted to. What they brought home was their side of the perimeter.\n\n" +
      "The first ones came up within the first minute. They described it as the air thickening, then peeling open, then a shape stepping through the peel. The shapes did not look like the dead any of them had ever seen drawn or described. They looked like the dead might look if no one had ever told them they were dead. The team's blades struck them; the blades worked; the binding held.\n\n" +
      "More came up as Niamh worked. The team kept the perimeter. There was a moment in the middle, they said, where one of the wraith-shaped things turned away from the team and toward Niamh, and one of them got between them, and that one did not die but came back to the settlement walking. He will heal. He told me afterward he had not known the cold could move that fast.\n\n" +
      "Niamh worked. She did not speak, they said. She did not look up from the broken pieces once.\n\n" +
      "When she was done the stone was whole. There was no flash of light. There was no roar. There was a humming that started in their teeth, they said, before it reached their ears, and then a quiet that was different from the quiet before. The shapes that had been pressing against the perimeter were gone. The cold lifted, they said, the way a fog lifts off a river in the morning. Not all at once. In sheets.\n\n" +
      "Niamh stood up slowly. She closed the case. She walked the circle of the stone once, very slowly, looking at the air around it. She said: *good.* It was the first word any of them had heard her speak since she knelt down.\n\n" +
      "They rode home. They carried nothing back that they had not brought except the man with the cold-edge cut and a feeling none of them yet had a name for. Edda treated the cut. He will recover.\n\n" +
      "Niamh sat at our table that evening. She ate. She did not say much, but she said one thing that I have written down twice because I did not want to lose it. She said: *more and more stones are breaking recently. More than the years can account for. My people do not yet know what is wrong. We will work this line as fast as we can.*\n\n" +
      "She rode out the following morning. She said she would be back to mend the next one when she had what she needed.\n\n" +
      "We have won an inch. I have written it on the parchment beside the eastern stone, on a small line of my own: *mended.*",
  },
  {
    id: "ch2_an_inch",
    chapterId: "ch2",
    order: 6,
    title: "An inch",
    teaser: "Some weeks pass. The settlement breathes. The Lord tallies what an inch is worth.",
    fullText:
      "Some weeks have passed since the stone went back up.\n\n" +
      "The team that walked the line that first time has been east twice more, on no errand more dangerous than counting. They report that the ground around the restored stone is doing what Niamh said it would do. The air is sitting still in the way it sits at the east stone and the west stone, the way it did not sit before. Songbirds are back in trees that had been quiet for as long as anyone we have asked can remember. Tomas walked it himself with his cat under his arm and came home saying the cat had not bristled once, which is the highest praise the cat gives.\n\n" +
      "Sorrel and Tansy rode out together three mornings after the stone went up, with a flask of ale and a small bundle of grey-leafed sprigs from Edda's stove. They came back at sunset with lighter saddlebags than they had ridden out with. None of us asked. Marigold sat with them at the table that night. None of them spoke much. Edda set bread between them and did not ask anything either.\n\n" +
      "I have tried to make myself believe that what we have done is small. It is small. One stone, of many. A line that runs for hundreds of miles, broken in places we cannot reach, and we have mended one piece of it in a country we can ride to in two days. I am supposed to be a grown man about this. I am supposed to know what proportion is.\n\n" +
      "But we did not have it, and now we have it. There is ground that was bad ground a season ago and is good ground now. Songbirds came back. A boy will grow up here who does not know how close it was, who walks a hill in spring without the cold catching at his bones, and that boy was not going to grow up here a year ago.\n\n" +
      "I do not claim a victory. I claim an inch.\n\n" +
      "I have been at my desk all morning looking at the parchment. The west stone, deep in country none of us had walked before the team rode out, is the next one we can reach. It is broken in the way that suggests new work, not old work. Niamh said the marks there were fresher. She said when she comes back we will mend that one too, and then we will see what we can see.\n\n" +
      "The two stones flanking the old watch are both standing today, and I know now that this was not always true. The south stone broke around the time Hale's company came, and a ranger reset it long after he was past saving. A mended stone, and a garrison that needed the mending a hundred and fifty years before it came. I did not know any of this until last month, and now I owe those stones more than I have. The line does not end with them. There are more stones further south, two days into country we cannot ride to, and the team's parchment says some of them are down. The stones south of those are in the Wastes proper, and have been for a long time. We will not mend any of these. I have written this out to myself in the parchment's margin, in small letters, and then I have written under it: *not yet, not now, possibly not ever, but I want to remember to remember.*\n\n" +
      "There is good ground east of here that there was not a season ago. That is enough for tonight.",
  },
  {
    id: "ch2_nell_wandering",
    chapterId: "ch2",
    order: 7,
    title: "Gone from the beds",
    teaser: "Nell was gone from Edda's herb beds by midday. Edda stands at the treeline and will not come in.",
    fullText:
      "Nell was gone from Edda's beds by midday, and the whole camp felt it before anyone could say why. She keeps her own hours and her own silence, and most days that is no trouble at all. But the woods to the south run further than a small girl should walk alone, and if she is lost out there she cannot call for us, or she will not.\n\n" +
      "Edda has said nothing either. She only stands at the treeline, watching the green, the way she does when she is most afraid. I have sent word to the guild. Someone who can read a small pair of footprints through summer grass will find her faster than the rest of us tramping about and calling a name she has never once answered to.",
  },
  {
    id: "ch2_nell_found",
    chapterId: "ch2",
    order: 8,
    title: "Red to the wrists",
    teaser: "They found her past the treeline, asleep in a hollow of wild strawberries, and not the least bit sorry.",
    fullText:
      "They found her near dusk, past the treeline, asleep in a hollow full of wild strawberries. Stained red to the wrists, curled up like a fox in the last of the sun, and not the least bit sorry to be found. Edda laughed and wept at the same time and insisted it was only the weeping.\n\n" +
      "Nell had filled her apron with the little berries and would not give them up, not even sleeping. Edda says the wild ones bruise and will not keep a season, but a cutting will take to a tended bed if we mind it through the summer. So we will. Nell decided it, the way she decides everything, without a word.",
  },
  {
    id: "ch3_post_the_line",
    chapterId: "ch3",
    order: 1,
    title: "Post the line",
    teaser: "The team rides the arc with stakes and red paint. The line becomes visible.",
    fullText:
      "I asked the team to do something the Thornveils could not. The Thornveils mend stones. The stones break again. We cannot stop them from breaking. What we can do, the smallest among us can do as well as anyone, is mark the line so that anyone who walks south of where we sit knows what we have learned in the past year.\n\n" +
      "I sent them out with stakes cut from young oak, with rope, with a small clay pot of red paint Edda had made for me from beet root and oak gall. They were to plant stakes in a line a few yards north of each known stone, intact or broken. They were to wind the rope between the stakes, loose enough to walk through, tight enough to feel under your hand. They were to paint a red mark on the south face of each stake. They were to make the boundary something a tired rider could see in fading light.\n\n" +
      "They were gone seven days.\n\n" +
      "They started south, at the old watch. They worked first at the two stones that flank the watchtower, which we have come to think of as the gates of our country whether we like the word or not. The team posted markers in the long grass between the two stones, three to the north of each, well clear of the tower itself. They marked the line with rope and red paint and rode east.\n\n" +
      "They posted the next line above the dwarves' stone, which I have written *mended* beside on the parchment. The air around that stone has changed since the work, the team said. Birds are at the base now that were not at the base in summer. They marked the line anyway. We do not yet trust permanence.\n\n" +
      "They rode further east still and a small pack of wolves came at them in a clearing. The team sent the wolves off with no losses on our side and no time wasted; they continued the work the same afternoon.\n\n" +
      "They turned west on the fifth day and posted markers above the west intact stone without incident. Further west still, where the parchment showed the deep-west broken stone, the team approached the place we had drawn for them on the map and stopped before they reached it. The voices were closer than they had been when our team walked that ground last. Not as loud as Marigold described at the moment the shapes came up, but loud. The team retreated a half-mile and posted the stake-line there instead, north of where the parchment had said.\n\n" +
      "They marked the broken stone's stake differently. They put a small notch above the red line, the way they had agreed, so the difference would be visible: this is the line, and this is where it has failed and not yet been put back. They wrote a small note on the parchment beside the stake-line, in their own hand: *the line is a half-mile north of where we drew it last time. We cannot say if we drew it wrong then or whether the ground moves.*\n\n" +
      "They came home in the evening.\n\n" +
      "I have walked out to the nearest line of markers since they returned. I can see the stakes from a hill not far from the settlement. The line is visible now. It was not visible a week ago. We have not made the stones permanent. We have made the boundary legible.\n\n" +
      "I have written this in the chronicle because I want to mark something else too. The work was not heroic. It was carpentry. There was no fight worth speaking of, no ritual, no revelation. There was a team of our people taking stakes and rope and a pot of paint out into country we now know, and putting markers down where markers had not been, and coming home. We have been at the work for a year. There are days when the work that matters is the simplest work there is.\n\n" +
      "But I have also been looking at the parchment a great deal since they came home. The half-mile they pulled the stake-line north of where they had drawn the stone is a small thing. The team and I both said so. We may have walked off our paces wrong before, and the team that goes back next will measure it again and find the old number, and the new mark on the parchment will become a footnote we tease the cartographer about for years. Or the bad ground around that stone may be a half-mile wider than it was, and the line of markers we just planted may need to be re-planted a half-mile further north before another year is out. I have written both possibilities under the new mark. I will write them under the next one too, if there is a next one to write.",
  },
  {
    id: "ch3_second_inch",
    chapterId: "ch3",
    order: 2,
    title: "The second inch",
    teaser: "Niamh returns to mend the deep-west stone. The fight is harder than the first.",
    fullText:
      "The team rode out with Niamh and two of her rangers at first light. She had come back to us three days before with a fresh wooden case and the same patience we had learned to read as readiness.\n\n" +
      "They rode west through the country we marked when we planted the line. They passed the west intact stone on the second morning and the air around it sat still as it had before. They rode further west and on the fifth day reached the line of markers our own team had posted above the deep-west broken stone.\n\n" +
      "Niamh stood at the markers for a long time, looking south. The team said her face did not change. She said only: *the team that posted these markers was right to set them where they did.*\n\n" +
      "They told me afterward that she had not let them ride closer to the stump than the marker line. She had sent her two rangers further south to make a smaller perimeter around the broken pieces themselves. The team held the outer line at the stakes. Niamh worked inside the smaller circle the rangers held. The team's task was to keep anything that came up out of the ground from reaching the inner perimeter.\n\n" +
      "The first ones came up before her case was open. The shapes the team had described from the eastern stone came up here too, more of them, faster. The team's blades worked because Niamh's binding held; they fought hard for what the team afterward called the better part of an hour, the longest fight any of them had been in since the captain's grave.\n\n" +
      "Niamh's two rangers got hurt. Both walked out.\n\n" +
      "When Niamh finished, the stone was whole. The humming started in their teeth again. The cold lifted in sheets again. The shapes that had been pressing on the outer line broke. The bad ground retreated, not all at once, but enough that the team could ride back through where they had fought without difficulty.\n\n" +
      "Niamh walked the circle of the stone once. She did not say *good* this time. She said: *we are losing this line faster than we are mending it. We need more hands. I will send word.*\n\n" +
      "I have written that down. I have written it down twice. I do not yet know what *I will send word* means in her voice, but I know enough to expect a letter.\n\n" +
      "The team came home on the eighth day. Edda's stove was lit for whoever needed her. Niamh and her rangers rode out the morning after they got back; she said she would be back when she had what she needed.\n\n" +
      "We have won a second inch. I have written *mended* beside the deep-west mark on the parchment. There are now two such marks. Beside both, I have written something I did not write last time: the date.",
  },
  {
    id: "ch3_watch_the_walls_start",
    chapterId: "ch3",
    order: 3,
    title: "A stone that was standing",
    teaser: "A patrol returns with news of a broken stone. The Lord turns inside the gate.",
    fullText:
      "A patrol returned this morning. They had been east to check the line of markers we posted in the long-grass country. They brought news I had not expected so soon. One of the stones the team marked *standing* a season ago is lying in pieces in the grass.\n\n" +
      "The break is clean. The team would not commit to whether it is weather or whether it is someone's hand. They wrote on the parchment, in the same careful way they always do: *the cracks are too neat for weather. The pieces have not been moved, but they did not fall the way an old thing falls. We cannot say.*\n\n" +
      "I cannot send anyone to look more closely. Niamh said she would send word and rode out. I do not know where she is. I cannot ride after her. The team that found the broken stone could not cross into the bad ground around it because they had no one to make the cold edge less cold.\n\n" +
      "I have sat with the parchment most of the afternoon.\n\n" +
      "I cannot ride after Niamh and I cannot mend a stone without her. What I can do, while I wait, is turn my hand back to the work inside my own gate. I have been pouring my attention into the line for a year. I should ask my settlement whether everything inside it is as ready as it ought to be. We can always do more.\n\n" +
      "I have called the cast together. Tomorrow we start.",
  },
  {
    id: "ch3_inside_the_gate",
    chapterId: "ch3",
    order: 4,
    title: "Inside the gate",
    teaser: "Walls raised, watchtower built, the settlement readies. A raven arrives.",
    fullText:
      "The work took longer than I hoped and less time than I had feared. Tomas drew up a list the first night and walked the palisade with his hand against every post; he marked the ones that had to be replaced with a smear of soot and his thumb, and Jory replaced them one by one. The new posts are younger oak. They will outlast the old. They will also, I think, outlast me, though I have stopped saying that kind of thing where the team can hear.\n\n" +
      "We have raised what could be raised. The palisade stands taller and steadier than it did. The eastern corner has a watchtower now, three storeys, with a bell at the top that Jory cast from an old kettle Edda refused to give up until she did. Tomas has slept in it the last two nights, which is to say he has not slept in it but he has sat in it and counted things, which for Tomas is the same as resting. The barracks has more hands than it did. We have hands at the gate we did not have before.\n\n" +
      "I walked the perimeter at dusk with the cast and we did not say much. The settlement looks like a settlement now. It looked like a camp before, even after a year. I had not noticed when it had stopped being a camp.\n\n" +
      "A raven came in this evening. It was not a robin. There was a wax seal I had not seen before, dark green, pressed with the mark of a tree's open leaf. The letter inside was three lines:\n\n" +
      "*Elder Rowena Ashford of the Thornveil intends to call at your settlement. She will arrive within the next moon, with two of her people. We send our regards.*\n\n" +
      "I read it twice. I put it on the desk beside the parchment of stones. I have not told the cast yet what is in it. I think I will tonight at the table.",
  },
  {
    id: "ch3_hands_beside_ours",
    chapterId: "ch3",
    order: 5,
    title: "Hands beside ours",
    teaser: "Elder Rowena Ashford comes to the settlement. The alliance is named.",
    fullText:
      "In the eleven days between the letter and her arrival, Edda did things I had never seen her do. She baked twice as much bread as the household needed and gave half of it to anyone who would take it. She swept the front room three times in two days. She rewashed cups that had been clean since the spring. Father Corin watched her, I noticed, and said nothing. I did not say anything either. Edda would tell us if it mattered.\n\n" +
      "She came at noon on the eleventh day after the letter arrived. We had been watching the east road from the new tower since dawn.\n\n" +
      "There were three riders. The two flanking her were Thornveil rangers in dark green; the one in the middle wore a riding cloak of the same colour and rode a tall grey mare. She wore her hair pinned at the nape, grey running through brown, and she sat the horse the way a person sits a horse when they have done it for longer than most people are alive. I went out to the gate myself.\n\n" +
      "I knelt when she dismounted. I did not think about it. She was an Ashford. I am loyal to House Ashford as I am loyal to the king it gave us, and the king is her grand-nephew. The name is the name. I knelt.\n\n" +
      "She looked at me for a moment with something that was not quite tenderness but was close to it. She said: *We are not at the Crown here, my friend. I left that title a long time ago. Stand up, please. You have done good work and I would rather not see you on your knees for it.* Her voice carried the weight of someone who has commanded for a long time and the warmth of someone who has spent her life raising people up.\n\n" +
      "I stood. I took her hand because I did not know what else to do. She let me, briefly, then took it back. She said: *I am Rowena. Sit down. There is bread on the table and we should not let it get cold. You have been keeping company with my people for some months and I came to see who you were.*\n\n" +
      "I brought her inside. Edda had laid out bread and cheese on the long table; Father Corin had lit a candle on the shelf above the stove. Jory had cleaned his hands and was waiting in the doorway. Tomas, in the corner, watched the rangers and said nothing. Nell was on the ladder.\n\n" +
      "Rowena took the bread. She broke it. She ate it slowly, the way a person eats who is paying attention. She thanked Edda by name. Edda did not say anything to that, but her hand was on the rim of the bread board and her thumb was on the wood, and she did not lift it. I have seen Edda thanked by many people over many years. I have not seen her ear redden like that since the year she came to us. Father Corin nodded at Edda, who had not moved, and a smile got loose on his face that he tried to keep small. He covered his mouth with his hand and looked down at his lap. His shoulders kept moving for a moment after they should have stopped. He did not look up again. Rowena did not seem surprised by anyone present.\n\n" +
      "We sat. I put the parchment on the table between us and laid it open. She looked at it for a long time. She put her finger on the east stone. Then on the west. Then on the dwarves' stone, where I had written *mended* in my own hand. Then on the deep-west stone, where I had written *mended* and a date. Then on the stone the patrol had reported broken, where I had not written anything.\n\n" +
      "She said: *Two stones in a year. With one ranger. With a settlement that did not know what wards were a year ago. I have not seen work this fast in fifty years.*\n\n" +
      "I said the work was Niamh's. She said: *The work was hers and yours. She has told me. She has also told me she is losing the line faster than she can mend it, and that she needs hands she does not have. That is why I came.*\n\n" +
      "She set out what she wanted plainly. Her people work the line; my settlement extends the line. Her rangers ritualize the restoration; my team scouts, marks, and protects. Two stones a year, she said, is not enough. We need ten. We will not get ten. We may get four. Four is twice two, and twice two is what we have not had in any year she had lived.\n\n" +
      "I asked her if she could put names to who was breaking the stones. She did not look away. She said: *I can. I will not, yet. The names would do you no good without the context to hold them, and the context is long and difficult. When the time is right we will speak them. For now, when you see their work, you will recognize it from what you learned as a boy. The Church will hand you a name. They have their reasons for handing it the way they do, and I am not going to argue with them at your table tonight.* She glanced once at Father Corin as she said this, briefly, then back at me. Father Corin nodded, very small, and went back to looking at his hands. *Write the name down when you see it. Write it small, the way a careful person writes things they do not yet trust. When you are ready to know more, ask me.*\n\n" +
      "I did not push. I had been told, kindly, to wait. I have been told that before.\n\n" +
      "She stayed two nights. She walked the new wall with Tomas the first morning and asked him questions about angles of sight that I did not understand. She sat with Edda the second afternoon in the kitchen for a long time and they spoke quietly, the way Niamh and Edda had spoken quietly some months before, in a way I did not ask about and have stopped expecting to.\n\n" +
      "She rode out on the third morning. As she swung up on the grey mare she said one more thing, almost in passing. She said: *I am sending some of my own south to you. Two of my grandchildren, who have been wanting work that mattered, and a cousin of theirs who needs to be somewhere the Crown's reach does not. They will arrive when they arrive. Be kind to them.*\n\n" +
      "She did not say her grandchildren's names. She did not have to. I knew there was an Ashford line that had not gone back to the court after she had walked out; I had read the names in books. I would meet them when they came.\n\n" +
      "I have read back what I wrote when the team came home from the captain's grave. *I do not know who is writing to me.* I have read what I wrote after the first stone. *I am going to find out who has been keeping us alive without telling us.* I have read what I wrote after the second. *I have written it on the parchment beside the eastern stone, on a small line of my own: mended.* I read these things tonight not because they make me proud, although they do, but because I want to mark how much of what I now know was not known to me a year ago.\n\n" +
      "The Crown will call them heretics. The Church will call them worse. But they are the ones who hold the line against what the Church teaches us to fear. They are doing the Radiant One's work whether their priests would name it that or not. I cannot believe my alliance with them is heresy when it is exactly the work my faith would have me do. I am loyal to the king. I serve the Radiant One. The rest of this I will write when I have figured out what the rest of this is.\n\n" +
      "For tonight, it is enough. She came. She broke our bread. She saw what we have done. She has sent us help we did not have a way to ask for. I will sleep.",
  },
  {
    id: "ch4_hand_that_broke_it",
    chapterId: "ch4",
    order: 1,
    title: "The hand that broke it",
    teaser: "Niamh returns. The team rides east to a broken stone. The Lord writes a word in the margin.",
    fullText:
      "Niamh came back to us a week before her word said she would. She rode in alone, on the same grey mare she had ridden out on, with a fresh wooden case strapped behind her saddle. She had been working further north, she said when asked. She had heard about the patrol's report from the east. She would not stay long. There was work to do.\n\n" +
      "She nodded at Edda's table without sitting. She took bread. She asked how soon I could put three in the saddle. I had three in the saddle the next morning.\n\n" +
      "The new broken stone was a day east of where we had posted the line, in country we had ridden through twice this season already. The patrol that had found the break a month ago had not approached it; they had marked the spot from a distance and ridden home. Niamh and our team rode in close enough this time to see what they had to see.\n\n" +
      "It was not weather. Even before they could ask Niamh, the team knew. The pieces did not lie the way old stones lie when they fall. The breaks were too clean. There were chisel marks across the original carving in three places, fresh enough that the cuts had not yet gone grey at the edges. There were burn marks in the grass near the base in a shape the team did not have a word for.\n\n" +
      "Niamh looked at the burn pattern for a long moment. The team said her shoulders went very still in a way they had not seen before. She said only: *I had not expected to see this work this close to your gate.*\n\n" +
      "The team asked her what work she meant. She said: *Work I have seen twice before. Both times on stones inside the thinning. The hand that did this is not new at it.* She did not say more. She did not seem to want to. The team did not press her. They had been told what they needed to be told.\n\n" +
      "She set her case on the ground a half-mile north of the broken stone and began.\n\n" +
      "The fight that came up was harder than the last one and the team said so plainly. More shapes than at the deep-west stone, faster, more coordinated, as if they had been waiting to be loosed. The team's blades worked because Niamh's binding held. They held the outer line for the better part of an hour. Some came home with cold-edge cuts. Edda has them.\n\n" +
      "When Niamh finished, the stone was whole. She walked the circle once. She did not say *good* this time either. She turned the grey mare back the way she had come without staying for our table.\n\n" +
      "The team came home with rubbings of the chisel marks and a careful drawing of the burn pattern. They put them on my desk and went to wash and eat.\n\n" +
      "I have been looking at the rubbings since the candle went down. I have seen these marks before. Not in this country. In a book my father did not want me to read at twelve and that I read twice. The book was about the heresies the Church teaches us to recognize. The marks in the book were said to be the iconography of the Cult of the Hollow.\n\n" +
      "Rowena told me, the night she stayed at our table, that the Church would hand me a name when I saw their work. She told me to write the name small, the way a careful person writes things they do not yet trust. She told me Father Corin would not object to careful reading, and Father Corin did not object that night.\n\n" +
      "I am writing the name in the margin tonight. I am writing it small.\n\n" +
      "*Hollow.*\n\n" +
      "I am not yet writing more. I will hold this for tonight. Tomorrow I will think about what comes next.",
  },
  {
    id: "ch4_what_the_margin_holds",
    chapterId: "ch4",
    order: 2,
    title: "What the margin holds",
    teaser: "The Lord wrestles with what he has written. He speaks briefly with Father Corin. He writes home.",
    fullText:
      "I have been at my desk most evenings this week. The parchment is open. The word in the margin has not moved.\n\n" +
      "I have been thinking about what the Church taught me at twelve and what Rowena taught me four months ago. The Church taught me the Cult of the Hollow are devil-worshippers who would unmake the world to bring back a god who deserved to fall. Rowena taught me to read carefully and to write small. I do not know yet which to trust.\n\n" +
      "Both, perhaps. Most of what I have been taught in my life has been some part true and some part not, and I have learned the trick is to hold the parts open and let them sort themselves with time.\n\n" +
      "I spoke briefly with Father Corin tonight. I did not say much. I said only that I had been told to read carefully something I had been taught to read plainly. He did not answer for a long time. Then he said: *the Radiant One does not, in my reading, condemn careful reading. He gave us minds that were meant to be used.* He went back to his hymnal. I have written this down because I want to remember it.\n\n" +
      "I have also been writing other things in the margin. Not large. I have written a second word beside the first. The word is *Crown?* I have written it small too. I do not know that the Crown has done me wrong. I was given this land by King Aldren, by way of clerks who have not seen this country in my lifetime, and I will not believe he meant me ill. He has been a good king. The Crown writes to me about the tithe and about nothing else. I have not, in fairness, written to them about anything but the tithe in return. I have been handling what I had in front of me, and I have had Niamh, and I did not want to bother an office in Tessoria with work I thought was mine to do. I am beginning to wonder if it was.\n\n" +
      "I wrote to my mother tonight. I told her the work is going well, that Jory is impossible and Tomas is steady, that Edda has put up so much bread we may have to give some to the cows. I did not tell her the rest of what I have written in this chronicle. She has worried enough for one lifetime already. I will not add to it.\n\n" +
      "Tomorrow I will go back to the wall. There is work that holds while I think.",
  },
  {
    id: "ch4_three_nights",
    chapterId: "ch4",
    order: 3,
    title: "Three nights",
    teaser: "A robin lands with a warning. The Lord crosses from wondering into action.",
    fullText:
      "A robin came in at dusk three days after I wrote the breath into this chronicle. Blue wax, the same anonymous hand as the two previous papers. I knew where it came from before I broke the seal, or as much as anyone can know who has been sent useful things by no one.\n\n" +
      "The note was five lines.\n\n" +
      "*Hollow knows your name now. At your gate in three nights, from the south road. Two score in robes. Their dead walking at twice that number. Set your watch. They are not who your Church says they are, but they are still coming for you.*\n\n" +
      "I read it twice. Then I went to the desk and turned to the parchment of stones and looked at the margin where I had written *Hollow* a week ago. The two words faced each other across the room. I had been right. The last line did not tell me what to do. It told me what not to assume.\n\n" +
      "Twice before, the same hand had brought me work I could begin, a recipe to make, a person to find. This time the message was the gift. There was no errand to ride out for. There was only the work that was riding toward us.\n\n" +
      "I called the cast to the table that evening. I read them the note. I did not soften it. Edda listened with her hand on the bread board, the way she does. Jory whistled once through his teeth, very low, and said nothing. Tomas listened without speaking. Halfway through my reading he stood, took his cloak from the peg by the door, and went out toward the eastern tower. He did not return until well after dark. Father Corin closed his hymnal and put his hand on the cover and left it there. Nell came down off the ladder and stood beside Edda for the rest of the conversation.\n\n" +
      "I gave the orders that needed giving. Tomas would set the watch in two shifts of three from tonight onward. The bell in the eastern tower would be rung at any sign of approach from the south. Jory would lay another row of stakes inside the south wall, where the country slopes down toward the river, a second line behind the first, low and unfinished but better than nothing in three nights. Edda would make as much salve as we had Greymantle for; I would not let her stop until the jar was full. Nell would help her. Father Corin would go among the people who lived along the lower lanes, who would not have heard yet, and tell them what was coming and what to do.\n\n" +
      "I sent two riders out at dawn. One east, with a sealed note for Niamh wherever she could be reached. One north along Rowena's path, on the slim chance her party was still on the road. I did not expect either rider to reach their person in time to bring help back. I sent them anyway. We were not going to be the last people who tried to tell someone what was happening to us.\n\n" +
      "I have not asked the cast to be brave. I do not think any of us would have a word for what we are being asked to be. We are being asked to be in a building when something comes for it. We do not run. There is nowhere we would run to that would have us, and we built the wall for exactly this. The work that matters now is the work of staying in the building.\n\n" +
      "I have not enlarged the word in the margin. They have given me their name themselves, but they have not yet given me everything the Church teaches that name means. I will defend my settlement. I will hold the larger question until it is mine to answer. Both things at once.\n\n" +
      "I walked the wall after the cast had gone to bed. Tomas was already in the tower. The eastern country was quiet. The southern country was not loud. It was nothing I could yet hear that was wrong. It was something I knew was coming. There is a difference between those two things and I have not slept since I learned it.\n\n" +
      "Three nights.",
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
