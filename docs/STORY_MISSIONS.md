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
> But two days' march south, on a hilltop, there are ruins. Stone foundations. A collapsed well. Half a tower still standing. The work of people who had thought ahead. The scouts found no bodies, no signs of a fight, no graves anyone took the trouble to dig. They left, or they were made to leave. The scouts could not tell which.
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
> I asked her another thing. The captain heard the voices at his garrison. We have walked his ground twice now and not heard them. She was quiet for a moment, looking into her cup.
>
> *"There is a ward near the ruins,"* she said. *"A stone older than us, set into the land where you would not see it. It holds the edge back from where you live, and from the road between."*
>
> I asked who placed it. She said she did not know. *"The work is older than the Pact. Whoever set it is gone, and so are the rangers who knew them."*
>
> Then she said the captain stood on its grave. *"It had been forgotten in his time. The line of women who kept it had thinned to nothing. He felt what an unkept ward fails to keep."*
>
> She set down her cup. *"My grandmother's teacher reset it after he fell. We have kept it since. Old things end."*
>
> She drank her tea.
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

## Story 5 — North of the Road

### Mission

| Field | Value |
|---|---|
| ID | `story_5_old_tongue` (kept for save compat) |
| Chapter | Chapter 2: Our Own Hands |
| Prerequisite | `story_4_captains_rest` |
| Slots | 3 × any |
| Duration | 2400s |
| Deploy cost | 12 gold |
| Rewards | 80 gold, 6 Greymantle (+ chance of 10 wheat from herder treasure) |
| Difficulty | 2 |
| Min guild level | 1 |
| Tags | exploration, outdoor, combat |
| Biome | Forest |
| Format | Expedition (4 events) |
| Chronicle entry | `ch2_old_tongue` |

**Description:**

> Edda needs more of the herb the robin's salve was made from. She has drawn a careful picture of it. The plant grows in Feldgrund hills, off the road, north and east. The road is long, the country is rough, and the people up there are private. Bring civility, and bring someone who can handle wolves.

**Expedition events:**

1. **Outbound, fixed:** 3 wild wolves on the forest road.
2. **Outbound, random:** forest bear (w2) / 3 brigands (w2) / 3 wolves (w1).
3. **Return, random:** 2 brigands (w2) / forest bear (w1) / treasure of 10 wheat from a grateful herder (w1).
4. **Return, fixed:** the peaks vision, an encounter event, pure flavor.

### Mechanical effects

- Adds the herb **Greymantle** to inventory (`state.herbs.greymantle`).
- Wraithwound Salve recipe requires Greymantle (replaced nightbloom). Without this mission's reward, players cannot craft more salve once they run out, which is the chapter 2 throughline.
- Greymantle does not drop from foraging (`dropRate: 0`). Sourced via missions and (eventually) trade.

### Chronicle entry — `ch2_old_tongue`

**Title:** North of the road

**Teaser:** Edda needs more of the herb. The team rides north for the first time.

(See `frontend/src/data/chronicle_entries.ts` for the full text. Key beats: Edda's drawing of the plant, the team's two-week ride north through wolves, bandits, and a territorial bear, an iron-haired Feldgrund elder who gives them the herb and politely closes the door, the team glimpsing the northern peaks for the first time on the return ride, and the Lord's closing realization that the Feldgrund are a pocket of normalcy the southerners are no longer in.)

### Narrative direction

The Feldgrund are hobbit-coded pastoral folk. Far north of the Wastes and the thinning, they have never experienced the dead walking. The southerners' story sounds like a frontier ghost tale and they politely don't believe it. They give the plant out of decency and make it clear the door is closing behind them. No language thread, no Helga connection, no hidden lore: the meeting is exactly what it looks like.

The emotional payoff is loneliness. The team came hoping for kinship, advice, help. They get a polite no. The world they live in is not the world the Feldgrund live in. Pockets of normal life persist somewhere. They are not in one.

**Future hook:** Feldgrund-origin recruitment unlocks not on story 5 but on story 6 ("The Broken Stone"), when a wounded Feldgrund party arrives at the gates and the southerners ride to their rescue. The existing premade Feldgrund cast (Clover Meadbrook, Nettle, Tobias, Hazel, etc.) plus the three story-6 survivors (Marigold, Sorrel, Tansy) all enter the recruit pool together.

---

## Story 6 — The Broken Stone

### Mission

| Field | Value |
|---|---|
| ID | `story_6_broken_stone` |
| Chapter | Chapter 2: Our Own Hands |
| Prerequisite | `story_5_old_tongue` |
| Slots | 3 × any |
| Duration | 1800s |
| Deploy cost | 15 gold |
| Rewards | 100 gold, 1 Astral Shard |
| Difficulty | 3 |
| Min guild level | 1 |
| Tags | exploration, combat, magical |
| Encounter | 1 wailing_phantom + 2 wraith + 4 cursed_spirit (single combat at the broken stone) |
| Chronicle entry | `ch2_broken_stone` |

**Description:**

> A wounded dwarf at our gate. Three of her people are still down there, pinned around a broken stone south-east of here. The country has gone bad in a way no one warned us about. Ride hard. Bring them home if you can.

### Mechanical effects

- **Feldgrund recruitment unlocks** on completion. All Feldgrund premade characters, including the three story-6 survivors (`char_226` Marigold Hawthorn, `char_227` Sorrel Hawthorn, `char_228` Tansy Hollowbough), enter the recruit pool.
- Unlock wired via `STORY_UNLOCKED_ORIGINS` in `shared/src/data/adventurers.ts`. The framework extends to future story-gated origins (Nordveld, Silvaneth, etc.).

### Chronicle entry — `ch2_broken_stone`

**Title:** The dwarf at the gate

**Teaser:** A wounded dwarf at the gate. There were four of them. One made it back.

(See `frontend/src/data/chronicle_entries.ts` for the full text. Key beats: Tomas finds Marigold collapsed at the gate; Edda treats her, Nell silently assists, Father Corin sits with her through the night; the team rides south-east within the hour and is gone five days; they return with Sorrel and Tansy alive but Reed buried east of the stone; the team's report establishes that the bad ground here is NOT the Wastes proper, that the Wastes are still five days further south, and that the broken stone was holding something back; the Lord closes with a hard line under his story-5 reread, vowing to find out who has been keeping them alive without telling them.)

### Narrative direction

This mission flips story 5's "polite refusal" beat hard. The Feldgrund who came south to see for themselves were not believed in their own village; they wanted to know. The world they did not believe in killed one of them. The Lord helps without saying I-told-you-so, and the survivors stay south rather than carry the news home, because telling their families would break the same peace the southerners just learned to be jealous of.

**Father Corin earns a beat.** He has been quietly observing Edda's herb-work for 40 years (per founder bio) without ever practicing. The gate event places him in Edda's house at the right moment and gives him a small, late line of usefulness. The chronicle records this without explanation; the player who has read his founder memory will know what it means.

**Slow-burn arc seed.** The team's report says the Wastes proper are "still five days further south, if Hale's reckoning was right" — a deliberate hedge that points the player toward the measurement arc without committing to a precise number yet. The 6-vs-7 measurement still belongs to a future scouting mission past the ruins.

**The bigger reveal.** The chronicle establishes that the settlement has been protected by something neither the Lord nor any of his cast knew about: ward-stones. One is broken. Others exist along the ridge. Who placed them, who maintains them, and what they are holding back becomes the chapter 2 spine.

---

## Story 7 — Walking the Line

### Mission

| Field | Value |
|---|---|
| ID | `story_7_walking_the_line` |
| Chapter | Chapter 2: Our Own Hands |
| Prerequisite | `story_6_broken_stone` |
| Slots | 3 × any |
| Duration | 2400s |
| Deploy cost | 12 gold |
| Rewards | 80 gold, 1 Astral Shard |
| Difficulty | 3 |
| Min guild level | 1 |
| Tags | exploration, combat, magical |
| Biome | Thinning Edge |
| Format | Expedition (5 events) |
| Chronicle entry | `ch2_walking_the_line` |

**Description:**

> I have asked the team to walk the line. Map the stones. Mark which are standing and which have fallen. Bring back enough that I can see the shape of the thing we have apparently been sitting inside.

**Expedition events:**

1. **Fixed: East intact stone** — environment event, atmospheric, no combat. The team marks it standing.
2. **Random pool: Ruins area, the two flanking intact stones** (3 outcomes weighted). The stones themselves are standing, but the Ruins sit at the edge of their protective range and small things still leak through:
   - w2: combat (1 wraith + 2 cursed_spirit)
   - w1: environment event (the Ruins quiet today)
   - w1: light combat (3 cursed_spirit)
3. **Fixed: West intact stone** — environment event, the team is starting to read the pattern.
4. **Fixed: Left X (the unknown broken stone, deep west)** — hard combat (1 wailing_phantom + 1 wraith + 3 cursed_spirit), the expedition's climax. Sabotage evidence described.
5. **Fixed: Return home with the map** — encounter event, narrative wrap-up.

### Narrative direction

The team walks the visible arc and brings back a map of eight things the Lord did not know yesterday. He realizes the principle: stones are protection; where they stand the land sits well, where they have fallen the land does not. He does not yet know who placed them, who maintains them, or who might be breaking them.

**The retroactive read of Hale.** The two stones flanking the Hilltop Ruins are *standing*. They always have been. But their protective reach is finite, and Hale's garrison was south of that reach. The wall that killed him was further down: inner-belt stones two days south of the Ruins that gave way 150 years ago, in country the player cannot ride to. The Lord puts this together. The garrison did not fall by accident; they fell because a wall further down went down and the bad ground reached them. He records this without having the Cult/sabotage frame yet; the player who knows the locked ward-canon will read the implications correctly.

**Subtle sabotage evidence.** At the left X (the new broken stone, deep west), the team finds clues that are not weather: clean cracks, neatly fallen pieces, faint scratches that cross the original carving. Each clue has a benign explanation AND a sinister one. The team and the Lord refuse to commit. The reader does the inferring.

**Halldora's second robin.** At the end of the chronicle, a robin arrives with Niamh's location: *"east, three days, at the bend of the stream where the silver birches grow. She is there for the next moon."* Useful, specific, anonymous gift; matches Halldora's protocol. Tells the Lord he has weeks, not months. Sets up story 8 as a *go now* mission, not optional.

---

## Stories 8+ — slow-burn measurement arc

**Locked approach (May 2026):** the question of whether the Wastes are advancing is *not* answered in one mission. It surfaces as a quiet mismatch in a chapter 2 scouting expedition past Hale's ruins (Hale wrote 7, the team measures 6, could be miscount), gets reinforced by casual scout reports across multiple later missions (5 days south, then 4), and only becomes a panic moment several chapters in when the Lord assembles the data himself. The boundary really is moving, but slowly enough that within any single mission's report it looks like a measurement error.

> Note: the first measurement used to live in Story 5, but story 5 was rewritten as a journey *north* (see "North of the Road" above). The 6-vs-7 measurement now belongs to a separate chapter 2 scouting mission past the ruins, yet to be written.

### Geography (locked)

- **Settlement → ruins:** 2 days' march south.
- **Ruins → Wastes (Hale's record, 150 years ago):** 7 days.
- **Ruins → Wastes (now, first chapter 2 measurement):** 6 days. Reported casually after a scouting expedition past the ruins.
- **Ruins → Wastes (later chapters):** 5 days. Then 4. Each measurement comes from a different scout report or expedition return, said in passing.
- **Settlement → Wastes (now):** 8 days. The settlement is comfortably out of reach. The Lord does not feel personally threatened, yet.

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

### Story 6 — proposed: "The Hollow Line"

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