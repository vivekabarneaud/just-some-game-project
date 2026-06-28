# Sable
- **Status:** locked 2026-06-28 (rename applied to code today; design from `DESIGN_ROSTER_CURATION.md`, 2026-06-22)
- **Recruit ID:** char_008 *(formerly "Lyra Emberheart" — renamed because "Lyra" collided with Jory's dead wife)*
- **Portrait file:** `lyra_emberheart` — **MISMATCH:** the asset still carries the old name. Rename the R2 asset or accept it (same situation as Hester / `helga_ironbark`).
- **Class / Race / Origin:** Assassin / Human / Ashwick
- **Food preference:** smoky
- **Trait(s):** TBD — `lone_wolf` (existing, +2 stats solo, zero code) **or** the bespoke "Nothing to Lose" (light wiring). Leaning bespoke.
- **Name:** a **mononym** on purpose — no family, no surname. "Sable" is simply what she goes by.

## Recruit-card bio (public surface)
> No family, no name worth keeping. Sable raised herself in the streets, stealing to eat and killing anyone who tried to take what little she had. When there was nothing left to stay for, she walked out of the city and sold the only skills she owns.

## Deep lore (discovery-only)
- A street orphan who raised herself. She discarded her birth/family name (nothing there worth keeping) and goes by **Sable**. The mononym *is* the character: a person with no family ledger to her name.
- **She is still, under the armor, a child.** That matters — her hardness is a survival shell over someone very young.

## Personality & tells
- Armored, transactional, hard. She sells skills, not sentiment. Expects nothing from anyone and offers the same back.
- **Her one soft tell: a useless stolen object she kept when she sold everything else** — leading option a **fat brass frog she took "because its face was stupid"** (alt: a cracked glass bead that throws rainbows). Kept armored, not sweet — no sentimental locket (she has no family to miss); the humour is the point. She has exactly *one* thing she'd never admit to caring about, and she'd deny it to your face.

## Ability / signature
- **"Nothing to Lose" (CONFIRMED)** — a crit / damage spike at low HP: the cornered street-fighter who is most dangerous with her back to the wall.
- **The name is a deliberate lie.** She has exactly one thing to lose (the frog), and over time, you. The signature is **narrative, not just a stat** — the frog's job is to anchor her **tavern-conversation** scene, the moment her armor slips.
- **Loyalty-gated progression** (the spine for all signatures): at high loyalty she finally shows you the frog (her tavern scene). Narratively the bond **rewrites her ability** — "Nothing to Lose" was true as a *Stranger*; once *Bonded*, she has something to lose (you). Keep that as flavor/framing even if the mechanic stays the low-HP spike.

## Relationships
- **None by blood — that is the point.** Her arc is the loyalty-bond with the Lord/settlement: the first thing she's ever had to lose.

## Talent / ability ideas
- Bespoke assassin direction built around **"Nothing to Lose"** + the loyalty rewrite. Per the signature taxonomy, her "signature item" is the *narrative frog*, not gear (resolves the "owns nothing" tension — it's a story object, not a stat stick).

## Open threads / TBD
- **Trait wiring:** `lone_wolf` (free) vs bespoke "Nothing to Lose" (needs light combat wiring).
- **The trinket:** brass frog vs cracked-rainbow-glass-bead — pick one.
- **Portrait asset** still named `lyra_emberheart` — rename or accept.
- **Mononym edge case:** `calcFamilyBonuses` (`combat/units.ts`) derives "family" from the surname (everything after the first space). A mononym has an empty surname; harmless with only one mononym on the roster, but if a second mononym is ever added they'd falsely register as "family." Flag for whenever a second mononym appears.

## Cross-refs
- `premade-characters.ts` char_008; `DESIGN_ROSTER_CURATION.md` (full design + ability options); [[project_tavern_conversations]]; loyalty ranks (`LOYALTY_RANKS`).
