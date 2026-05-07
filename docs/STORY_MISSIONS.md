# Story Missions — Source-of-truth Reference

Living document. Each story mission's content lives in three places:

1. **Mission template** — `shared/src/data/missions/storyMissions.ts` (gameplay: name, description, encounter, rewards, etc.)
2. **Cinematic slides** — `frontend/src/data/cinematics.ts` (slide prose; source-of-truth even when art is redone)
3. **Chronicle entry** — `frontend/src/data/chronicle_entries.ts` (the Lord's journal page after success)

This doc consolidates all three per story mission for writing and review. When prose changes, update both this doc and the TS files.

---

## Story 1 — Scouting the Surroundings

### Mission

| Field | Value |
|---|---|
| ID | `story_1_scouting` |
| Chapter | Chapter 1: Ashes and Dust |
| Prerequisite | (none) |
| Slots | 2 × any |
| Duration | 900s |
| Deploy cost | 5 gold |
| Rewards | 50 gold, 50 wood |
| Difficulty | 1 |
| Min guild level | 1 |
| Tags | exploration, outdoor |
| Encounter | 3× Wastes Wolf |
| Chronicle entry | `ch1_first_scouts` |

**Description:**

> Time to know our land. Send scouts to map what's around us: water, game trails, stone, anything useful. And anything dangerous.

### Chronicle entry — `ch1_first_scouts`

**Title:** South, on a hill

**Teaser:** The first scouts return. The map is good. The news, less so.

> The scouts came back today with a map and a look I did not like. A wolf pack chased them once on the ridge, hungry enough to misjudge them, but they were back at the gate before dark, on their own feet. Father Corin said a blessing over their bread when they came in. Edda gave them water with mint in it. Then they sat down with me and Tomas and we read the map by candle.
>
> The land they brought back is workable. Game trails to the north. Berry thickets along the river. A quarry site on the eastern ridge: Tomas brightened at that, which is the closest thing to a smile I have seen on him this week. Water in three places that did not dry by dusk. I have a list now, and a use for each line of it.
>
> But a day's march south, on a hilltop, there are ruins. Stone foundations. A collapsed well. Half a tower still standing. The work of people who had thought ahead. The scouts found no bodies, no signs of a fight, no graves anyone took the trouble to dig. They left, or they were made to leave. The scouts could not tell which.
>
> They had stone walls. They had a watchtower. It was not enough. I do not yet know what we know that they did not, or what they knew that we do not.
>
> I will pray on it and put the book away.

---

## Story 2 — The Hilltop Ruins

### Mission

| Field | Value |
|---|---|
| ID | `story_2_ruins` |
| Chapter | Chapter 1: Ashes and Dust |
| Prerequisite | `story_1_scouting` |
| Slots | 2 × any |
| Duration | 1200s |
| Deploy cost | 10 gold |
| Rewards | 80 gold, 60 stone |
| Difficulty | 1 |
| Min guild level | 1 |
| Tags | exploration, combat |
| Encounter | 3× Ruin Rat + 1× Wastes Wolf |
| Chronicle entry | `ch1_garrison_ruins` |

**Description:**

> The hilltop ruins your scouts mapped. Stone foundations, a half-standing watchtower, a collapsed well: the work of someone who built to last. They still failed. Send a team in. Bring someone who can hold a line if the place is not as empty as it looks.

### Chronicle entry — `ch1_garrison_ruins`

**Title:** Forty-seven days

**Teaser:** A name on a journal cover. A seal I do not know. Forty-seven days I cannot make sense of.

> The team came back from the ruins with a tin chest. They were tired but unhurt. Tomas walked them up to my tent himself and stayed while they set the chest on the long table. They told me they had pushed a little further south while they had the daylight: the trees go strange about three days down, they said. They had not walked that far. They felt it from a ridge.
>
> The chest held a journal. The name on the cover is Captain Vardin Hale, of a Crown garrison whose seal I cannot place. Folded beneath it was something else: a small square of cloth, a child's first try at stitching, a few uneven flowers, no name. I set it aside before I began to read.
>
> I read it alone, by candle, after the others had gone to bed.
>
> The first entries are clean. *Day one: posting accepted. Three sections of the southern barracks need re-roofing before winter.* Hale wrote in a clean clerical hand. He was not a soldier who had given up on writing.
>
> Day thirteen, his first strange entry. Sergeant Marrick reported on south-watch that he had heard his brother calling him from the tree-line. Marrick's brother died at sea fifteen years ago. Hale recorded the report and told Marrick to drink less.
>
> Day fifteen, Marrick is gone. Bunk cold. Boots gone.
>
> Day twenty, three men report hearing Marrick's voice from the trees. He is calling them by name.
>
> By day twenty-two, four more have left in four nights. Hale sends a courier north to the Reach asking for guidance. The courier never comes back.
>
> By day thirty he is keeping a tally in the corner of each page: how many remain.
>
> Day thirty-eight, a recruit walks out the gate at midday. From the watchtower the others see him go, calmly, in plain daylight. They could not stop him without breaking his arm. He went anyway.
>
> By day forty-two there are three of them left.
>
> Day forty-four. He writes that he heard his daughter Ennara today. She died young. He says he will not go.
>
> Day forty-five. Two lines.
>
> *'I heard Ennara again today. I am going to her.'*
>
> Then nothing. The journal stops.
>
> I sat with the page open for a long time. I do not know what I have just read.
>
> The men heard the dead. The voices called by name. They walked through barred gates at midnight. They walked at noon in plain daylight, calmly, where the others could see them go. Hale records all of this with the patience of a man who hopes the next page will explain. The next page never does.
>
> What kind of plague does this? What kind of madness travels through walls and calls a man's brother by name? I do not know. I do not think Hale knew either. He kept writing because writing was what he could still do.
>
> There is one more thing I cannot place. Hale wrote his garrison stood seven days' march from the Hollow Wastes. His gate is the hilltop ruins. My team felt the wrongness three days south of those same ruins.
>
> A captain does not miscount a march. My team are not soldiers but they have eyes. I will send them back tomorrow to count the days honestly.
>
> I went back to the folded cloth before I closed the chest. It was hers. Of course it was hers.
>
> The rest I cannot place. I will sleep on it, if I manage to sleep at all.

---

## Story 3 — Past the Ruins

### Mission

| Field | Value |
|---|---|
| ID | `story_3_dark_treeline` (legacy id; display name is "Past the Ruins") |
| Chapter | Chapter 1: Ashes and Dust |
| Prerequisite | `story_2_ruins` |
| Slots | 3 × any |
| Duration | 1800s |
| Deploy cost | 15 gold |
| Rewards | 100 gold, 80 wood |
| Difficulty | 2 |
| Min guild level | 1 |
| Tags | exploration, outdoor, survival |
| Encounter | 1× Wailing Phantom + 3× Cursed Spirit |
| Chronicle entry | `ch1_warden` |

**Description:**

> Send the team back south, past the ruins. Walk further this time and count the days honestly. I want to know what is really beyond. Bring someone who can deal with what does not bleed.

### Chronicle entry — `ch1_warden`

**Title:** The Warden

**Teaser:** She walked my team home from a fight they should not have survived. She came inside. She had business to discuss.

> The team came back from the trees with a stranger.
>
> She had walked them home from a fight they should not have survived. Two of them are bandaged tonight. They came up to the gate at dusk, and behind them was a woman in dark green, a bow across her back, the long ears and moss-grey hair of the Silvaneth. I had not stood near an elf before.
>
> She introduced herself as Niamh, Warden of the Thornveil Rangers. She said she had business to discuss. She said it the way a stonemason says the wall needs a new course before winter. No warmth. No apology. Just the fact.
>
> I sat her down at the long table. Edda put a cup of chamomile in front of her. Niamh wrapped her hands around it and drank slowly.
>
> The team told me what happened. They had walked past the ruins, south, counting their steps the way I had asked them to. The trees went quiet a little less than three days down. They felt it before they heard it. Then they heard a man's voice in the trees, calling a name they did not know.
>
> *"Ennara,"* they said.
>
> I put my hand on the journal that was still open on the desk where I had left it last night. I did not need to move it.
>
> Captain Vardin Hale, I told them. Ennara was his daughter. She died young.
>
> Niamh nodded once. *"That helps,"* she said. *"A name strengthens the work."*
>
> Then she gave me the rest of it in pieces, between sips of tea, in her plain way.
>
> The thing my team had fought, she said, was dispelled, not killed. It will reform in days, perhaps weeks. Only ritual frees a stuck soul; nothing else does. She could perform the binding herself, but she could not fight while she did it. She had seen my team fight. She thought they could hold a line for as long as the work takes.
>
> She would come back in three days, she said. *"Bring them."*
>
> I said yes before she finished.
>
> I went to the desk and brought back the folded square of cloth from the chest, the one I had set aside before I read.
>
> *"His daughter made this,"* I said. *"I think it is hers."*
>
> Niamh leaned forward and unfolded one corner. She looked at the uneven flowers. She folded it again carefully and pushed it back across the table to me. *"Keep it safe,"* she said. *"The team brings it on the day."*
>
> I told her I wished I could carry it myself, but the village needs me here.
>
> *"And you cannot fight,"* she said. *"You would be a liability."*
>
> I think she meant it kindly.
>
> I asked her how far the Wastes really were. She said she did not know. Her work is at the edge, she said. The edge is where the dead are still close enough to be heard. The Wastes lie further. She does not go there.
>
> When she stood to leave I asked where she was sleeping. She said the trees were fine.
>
> *"Three days,"* she said again, and was gone.
>
> I do not know what I am dealing with. I know she did not have to walk my team home. I know she did not have to tell me what she told me tonight. I know she could have left me to read Hale's journal alone for the rest of my life and never appeared at my gate.
>
> She came. I am taking the help.

---

## Story 4 — The Captain's Rest

### Mission

| Field | Value |
|---|---|
| ID | `story_4_captains_rest` |
| Chapter | Chapter 1: Ashes and Dust |
| Prerequisite | `story_3_dark_treeline` |
| Slots | 1× Niamh (locked NPC, passive ritualist) + 3× adventurers (1 warrior + 2 any) |
| Duration | 1500s |
| Deploy cost | 10 gold |
| Rewards | 100 gold + 1 astralShard |
| Difficulty | 2 |
| Min guild level | 1 |
| Tags | combat, magical, escort |
| Encounter | 1× Captain Hale (boss) + 3× wraith + 5× cursed spirit |
| Chronicle entry | `ch1_captains_rest` |

**npcAlly:** Niamh (passive, deathFailsMission, baseThreatVsTag ghost: 80)
**Modifier:** while Niamh is alive, physical attacks pierce ghost immunity (`physical_pierces_tag` on ghost tag)

**Description:**

> Niamh has come back. The team rides with her at first light to bind the captain to his rest. Her work lets our weapons cut what should not bleed, but only while she stands. Keep her alive at any cost.

### Chronicle entry — `ch1_captains_rest`

**Title:** The Captain's Rest

**Teaser:** The team rode south with Niamh at dawn. I waited at the gate. They came back at dusk.

> The team rode out at first light. Niamh was waiting at the south gate, the same dark green coat, the same patience. She did not greet anyone. She just nodded to the team and turned south.
>
> I gave one of them the cloth at the gate. He took it, looked at it, said nothing, and put it inside his coat where the rain could not reach it.
>
> I watched them ride off the way you watch ships go. There was nothing else to do.
>
> I cannot tell you what I did between sunrise and sunset. I tried to read. I tried to write. I tried to inventory grain. I tried to walk the south fence. Edda came and made me sit down with chamomile twice. The second time she did not say anything. She just sat across from me until the cup was empty.
>
> They came back at dusk.
>
> Niamh was with them as far as the gate. She stopped on the road. She nodded once at me, said *"it is done,"* and walked back into the trees. I do not know where she went. I did not ask.
>
> The team came up to the long table. They were tired in the way men are tired when they have been frightened for several hours. They drank water and they sat for a long time before any of them could tell me what had happened.
>
> The captain was not hard to find, they said. His voice was loud where the trees go quiet. They walked toward it.
>
> Niamh marked her circle in the dirt and began the binding. The captain came at them hard. Cursed spirits drew in around the disturbance. The team held the line and worked. The boy who reported to me said striking a thing of mist with a sword and feeling it bleed was the strangest thing he had ever done. Niamh's binding makes our steel touch them while she stands.
>
> The fight was long. The captain's manifestation faded slowly under their work, the way a fire dies when you stop feeding it. When he was on his knees, when he was looking past them at nothing, the boy walked forward with the cloth in his hands. He did not say anything. He just held it open.
>
> The captain looked at it.
>
> The boy said it was the only quiet thing he had seen in the forest all afternoon.
>
> Then Niamh closed her binding. The captain stood up, looked at the cloth and the team, and was not there.
>
> The boy said the trees went quiet differently than they had before. *"Quieter,"* he said, and could not explain better.
>
> They brought the cloth back. Niamh did not need it after the work. It is on my desk now, folded as it was when I gave it.
>
> A man rested tonight. A man who walked into a forest a hundred and fifty years ago looking for his daughter is on the other side now. His daughter, wherever she is, is not still being called by her name from a place that is not her. That is a thing that did not happen yesterday and does today.
>
> Father Corin will say a prayer at evening service for the captain's soul. He will not know that the prayer comes a day late, and that what released the soul was a Silvaneth ranger who has been doing this work in our forests longer than any of us has been alive. I will not tell him. There are things you do not bring to the altar yet.
>
> I will sleep tonight. I think I will sleep well.

---

## Event — First Robin (post-story-4 trigger, not a mission)

Triggered automatically the morning after `story_4_captains_rest` completes. Not a mission; a banner + chronicle modal + alchemy unlock.

### Triggers (engine work, parallel instance)

- Banner: *"A robin landed on the watchtower this morning."*
- Open chronicle entry modal: `ch1_first_robin`
- Unlock alchemy recipe: **Wraithwound Salve** (moonpetal + a Nordveld herb; cures ghost-tagged lingering wounds on adventurers)
- Robin sender stays anonymous; Lord assumes Thornveil. Halldora identity reveal stays many chapters out.

### Chronicle entry — `ch1_first_robin`

**Title:** What the robin brought

**Teaser:** A note. A salve. And a thing about ghost wounds I had not known.

> A robin landed on the watchtower at first light. There was a folded scrap of paper and a small parcel tied to its leg. No sigil. No name. The handwriting on the note is precise but trembling, the kind of hand that has been writing for a very long time.
>
> The note reads:
>
> *"What you did for him mattered. Use this when the wounds will not heal."*
>
> The parcel was a salve, packed in oiled linen, smelling faintly of moonpetal and something I do not recognize. There was also a folded recipe card, written in the same hand. Quantities, steps, the order to add them.
>
> I took it to Edda.
>
> She unwrapped the linen and brought it close to her nose. *"Moonpetal,"* she said. Then she said the name of the second herb in the old tongue. Then she went quiet, looking at it.
>
> *"You have seen this before?"*
>
> *"The plants, yes. Not the way they are put together here. Whoever made this knows more than I do."*
>
> She told me then what I had not known. The cuts the ghosts make do not heal the way other cuts do. The skin closes but the edge stays cold. The wounds weep slow. She had been changing the dressings every morning, hoping it would resolve, and it had not. She had been wishing for something better. Now there was something better.
>
> She is going to use it on them tomorrow.
>
> I do not know who sent the bird. I assume the Thornveil. I find I am grateful in a way that does not have a name yet.

---

## Stories 5+ — slow-burn measurement arc

**Locked approach (May 2026):** the question of whether the Wastes are advancing is *not* answered in one mission. It surfaces as a quiet mismatch in Story 5 (Hale wrote 7, the team measures 6 — could be miscount), gets reinforced by casual scout reports across multiple later missions (5 days south, then 4), and only becomes a panic moment several chapters in when the Lord assembles the data himself. The boundary really is moving, but slowly enough that within any single mission's report it looks like a measurement error.

### Geography (locked)

- **Settlement → ruins:** 1 day's march south.
- **Ruins → Wastes (Hale's record, 150 years ago):** 7 days.
- **Ruins → Wastes (now, Story 5 measurement):** 6 days. The team comes back and reports it casually.
- **Ruins → Wastes (later chapters):** 5 days. Then 4. Each measurement comes from a different scout report or expedition return, said in passing.
- **Settlement → Wastes (now):** 7 days. The settlement is comfortably out of reach. The Lord does not feel personally threatened — yet.

The thinning's leading edge has barely advanced in 150 years. The Wastes have advanced at the same slow rate. Both motions are within the noise floor of any single measurement. What gives the game away is *consistency* across many measurements — and that's a story-spanning beat, not a single mission.

### Vocabulary

The internal word "thinning" is **dropped from player-facing prose**. The two-zone canon stays intact internally (Niamh's work, anchored ghosts vs skeletons, etc.) but no character explains it as a glossary entry. Use descriptive phrases:
- *"the edge where the dead are still close enough to be heard"* (not "the thinning")
- *"the Wastes proper"* / *"the actual Wastes"* (not "the physical Wastes")
- *"voices in the trees"* / *"the cold edge"* / *"the bad ground south"* — descriptive, not categorical

### Halldora's protocol — why she doesn't warn the Lord directly

Halldora's robins carry **specific, useful, anonymous gifts** — never the big-picture warning. Her pattern across the arc:

- Story 4 robin: wraith salve (tied to the just-finished story).
- Subsequent robins: another tool, another small warning, never the Wastes-are-advancing news.
- Late chapter: when the Lord has assembled the truth himself and writes back (or asks Niamh a pointed question that travels north), Halldora confirms with relief, not revelation. Her dramatic moment is *"You finally see what I have been seeing for two thousand years,"* not *"I told you so."*

She has been doing this for centuries. She has learned that anonymous warnings about world-ending news are dismissed as superstition. People only believe what they prove themselves. So she seeds the discovery — never delivers the conclusion. This is wisdom, not coyness, and it deepens her character.

This means: across stories 5–N, the Lord cannot just be told. He has to find out. The robins are tools and small kindnesses; the Wastes truth is his own reckoning.

### Story 5 — proposed: "The Hollow Line"

Lord-driven scouting expedition past the ruins. Team walks ~6 days south, hits dead trees + skeletons (Wastes proper). Encounter: tier 2–3 skeletons, maybe a wraith. Team returns shaken but intact.

Chronicle beat: scout reports the Wastes start at 6 days south of the ruins. Lord notes Hale's journal said 7. *"Could be Hale was off by a day. Could be the line crept. There is no way to tell from one walk."* He poses it casually to Niamh next time he sees her; Niamh says she does not measure the Wastes — her work is at the edge. The Lord shelves the question.

The reveal is *the question itself*, not the answer. The answer takes chapters.

### Story 6+ — open threads

To be drafted. Possible directions:

- **Settlement-side beat.** A villager dies; Father Corin and Edda quietly disagree on the rite. Cast deepening, no Wastes content.
- **Niamh returns with a harder ask.** Another anchored ghost, or a message from the Thornveil higher-ups (Rowena wants to meet).
- **Cult brush.** A small Cult-aligned figure passes through. Not a confrontation — a quiet hint. Adventurers come back having seen "people in dark robes" who watched but did not engage.
- **Second robin.** A specific warning ("three of them passed your south path two nights ago, they wore grey, they were not pilgrims"). Lord realizes someone is *watching* his land, not just remembering Captain Hale.
- **A casual measurement.** A scout returning from a regular mission mentions the Wastes are 5 days south of the ruins. Said in passing, end of conversation. The Lord notes it.

The slow-burn measurement arc threads through whichever of these we pick — the casual scout reports happen as a backdrop to whatever the chapter's main beat is.