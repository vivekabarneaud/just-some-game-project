# Morgause Dunwall
- **Status:** locked 2026-06-28
- **Recruit ID:** char_020
- **Portrait file:** morgause_dunwall
- **Class / Race / Origin:** Warrior / Human / Ashwick *(of Zah'kari descent — see Heritage)*
- **Age:** ~60 (joined young, gave forty years' service, retired near 58-60)
- **Food preference:** sweet *(a soft crack in a hard old soldier — a sweet tooth she'll deny to the grave)*
- **Trait(s):** none assigned yet (TBD — something "veteran commander")
- **Family:** None. Never married, no children — this is the wound, not a footnote. No `CHAR_RELATIONSHIPS` entry (solo).

## Name & earned title (decided 2026-06-29)
She is recruited as plain **Morgause Dunwall** — the title was *taken* from her (retired the morning she got too old), and handing it back on the recruit card would spend her whole wound for nothing. The rank **comes back when the frontier makes her one again**: once her retreat-command mechanic is in play / she's running the militia ("Watch the Walls") / at a loyalty milestone, the Chronicle and her card relabel her **Commander Morgause Dunwall**. The frontier needed her and gave back the only name she ever wanted — the title is a *moment*, not a label, mirroring her arc (finding out she's still worth something).
- **Rank = "Commander" (light lore addition — confirm into LORE_TIMELINE).** Attested Dominion ladder: militia **sergeant** (Tomas) → **Captain** = commands one garrison (Vardin Hale, LOCKED) → **Commander** = senior officer over a *stretch* of border garrisons. She "rose to command them" (plural), so Commander seats her one rung above Hale and explains the career. (The Cult's "Commander Drayven" is just the same generic military word in another faction — no conflict; Drayven is an ex-Radiant Knight.)
- **Open:** exact trigger for the relabel (retreat-mechanic first fire vs militia online vs loyalty rank) — pin when the militia/defense gating lands. Tie to her arrival gate (Barracks/troops online).

## Recruit-card bio (public surface)
> Morgause's people came up out of the Sunward Kingdoms generations back, and she carries the old war-craft in her blood: forty years she gave the Dominion's border garrisons, rose to command them, and was retired the morning she grew too old to argue the point. She never married and never had children; there was always another posting, another winter on the line, and by the time she looked up the choice had made itself. The army was the only family she let herself have, and it sent her home the day she got old. What frightens her is not the fighting but the stillness, the silence of a house with no one in it, and a question she has spent forty years not asking: who she even is with no orders to give and no line to hold. She was the commander so long she forgot to be anything else, and the woman left over when the uniform comes off is a stranger to her, one she half suspects is worth nothing at all. So she came to the frontier, where the walls are thin and the threats are real and an old commander's eye is worth something again. She drills the young ones harder than they think they can bear, and pretends she does not watch them the way she might have watched her own.

## Deep lore (discovery-only)
- **The wound is stillness and loneliness, not poverty or ingratitude.** She wasn't robbed; she was *set aside* for being old. The horror isn't the lost pension, it's the empty house and the silence after a life of command.
- **Worth welded to function.** Her entire sense of her own value is fused to being useful at war. Take away the command and she suspects she is *nothing*. The frontier matters to her precisely because it *needs* her again.
- **Childlessness is the buried grief.** The army was the only family she let herself have; the career and the postings made the choice for her. Now, late, she watches the settlement's young the way she might have watched her own, and would die before admitting it.
- **She has lost herself, not just her use.** Deeper than worthlessness: she no longer knows *who she is* outside of command. She was the commander so long she forgot to be anything else, and the woman left when the uniform comes off is a stranger she doesn't know how to be. Under the iron she is genuinely **confused and a little afraid of her own retirement** — and part of her arc on the frontier is, slowly and unwillingly, *finding out who that person is* (mentor, neighbour, almost-family) when she is more than the rank.

## Heritage (light touch — texture, not plot)
- Of **Zah'kari descent** (the Sunward Kingdoms — the savanna people whose war-craft even Varek never conquered), Dominion-born generations down, which is why she carries an Anglo name and a Hearthlands career. This **explains her appearance and even feeds her martial gift**, but it is deliberately *not* her defining story — one quiet fact of who she is, no arc hung on it. (Per the user: acknowledge it, don't let it define her.)

## Personality & tells
- **Can't stop being an officer.** Reads terrain, organizes everyone, has opinions about the walls. Drills the young ones mercilessly.
- Proud, sharp-tongued, impatient with incompetence. "She's not done yet."
- Under the armor: terror of being useless, and a loneliness she won't name. **Watches the children.** Keeps a sweet tooth she denies.

## Relationships
- **Deliberately a clean slate with the Thornwoods.** She commanded on *a* border, left unspecified, with **no tie to the Nordveld war Gareth and Godric deserted** — the settlement is a fresh start for all of them (decided 2026-06-28; revisit only if a very good idea appears).
- **Potential surrogate-family arc** with the settlement's young (Nell, the Thornwood boy, young recruits) — the family-shaped hole quietly filling. Gruff mentor who'd never admit she's adopting them in her heart.
- **Campfire scene idea (user, 2026-06-29):** Morgause and the Thornwoods at the fire, the **Lord witnessing and laughing.** She's raising her voice at the deserters (Gareth, Godric) — *not* cruelly, but the way **family** argues: scolding because she cares, and the two big men taking it from the old commander like sons who know she's right and won't say so. The surrogate-family arc made visible — she has adopted them and would die before admitting it. A candidate for a campfire / tavern vignette ([[project_tavern_conversations]]) once their loyalty is up. *(She has no tie to the war they deserted — this is earned warmth, not old history.)*

## Talent / ability ideas
- **The commander / force-multiplier.** A bespoke warrior tree that *buffs and protects the whole squad* — rally, formation, tactics, terrain reads, ally shielding — rather than personal damage. Distinct from lone fighters (Hester's axe, Godric's wall). **The mechanic is the wound:** a woman who never had her own pours herself into the people around her. Ties naturally to the **militia / "Watch the Walls" defense** system. (Per-character talent rework pending; class stays the chassis.)

## Commander mechanic — the retreat brain (design, 2026-06-29)
Her *signature* mechanic in the Model-C flee/rescue system (full design: `docs/DESIGN_RECOVERY_AND_RETREAT.md`). **She doesn't add damage — she cuts losses to bad judgment.** This is the wound made into a mechanic: a woman who never had her own pours her command into keeping these people alive. Locked in concept; numbers tunable.

**The brain — a deterministic time-to-kill projection** (runs every round; cheap; *identical in real combat AND in the 200× deploy preview*, so previewed odds stay honest — this is why we rejected "rollouts in real combat only," which would make the preview lie):
- our rounds-to-win = enemy effective HP ÷ team effective DPS (alive, non-broken).
- their rounds-to-break-us = our HP (to the rout point) ÷ enemy effective DPS.
- win comfortably → **Hold!** (suppress panic, finish); they win → **Fall back!** now, while whole; borderline → cautious (don't gamble the team).
- Cuts losses both ends: **Hold** saves a winnable fight a jumpy team would flee; **Fall back** pulls them out *before* the wipe (crude AI fights to wipe, THEN flees with terrible odds).

**Her three perks:**
1. **Coordinated +18 (flee-success lever).** Her organized "Fall back!" gives every fleeing hero **+18** to their escape % in the flee-check formula — they withdraw together instead of scattering. A leaderless panic rout never gets this.
2. **Discipline (trigger lever, NOT escape odds).** Her presence suppresses *premature individual panic-bolts* (a scared/low-loyalty hero won't break and run before her order). Governs *who flees when* / keeps the retreat orderly. (Individual overrides like a feign-death assassin still fire; raw panic doesn't.)
3. **Command breaks if she falls.** Lose Morgause mid-fight → team reverts to crude panic rout (+ brief disorder). Makes her a **protect-the-commander** priority and a juicy target for `cunning` backline-hunting enemies. Real stakes for fielding her.

**Teaches itself:** all of it lives in `simulateCombat`, so the deploy preview visibly shows *better survival odds when Morgause is on the team* — the player learns "bring the commander, lose fewer people" from the numbers alone.

**Parked / later ideas (don't forget):**
- **Shallow rollouts** (the literal "she runs a few sims") — only as later polish if the deterministic projection ever feels too blunt; MUST run in both preview + real combat, and MUST disable commander-logic *inside* the rollout (else infinite recursion).
- **Generalize into a small "tactics" quality** other commanders could share later; Morgause stays the gold standard.
- **Optimal-timing emergent play:** "Hold one more round to drop two enemies, *then* Fall back" → fewer pursuers (−8 each) at retreat. Falls out of round-by-round evaluation for free; worth showcasing in the log.
- **Once-per-fight Rally** when she calls Hold in a dire spot (small morale/defense buff) — a possible talent, set aside for now.
- **No-commander baseline** (for contrast): panic rout at team HP < ~30% or half the team broken/down — deliberately noisy; the noise she removes.

## Open threads / TBD
- Assign a backstory trait (veteran-commander flavor).
- The specific border she served is intentionally **left generic** (no Thornwood tie).
- The surrogate-family arc with the young — when/how it surfaces (tavern, loyalty, story).
- Whether her Zah'kari heritage ever surfaces in-fiction beyond the one line (default: it stays light).

## Cross-refs
- `premade-characters.ts` char_020; `LORE_TIMELINE.md` (Zah'kari / the Sunward Kingdoms, Varek); the militia / defense system; [[project_chapter_3_defense_quest]] ("Watch the Walls").
