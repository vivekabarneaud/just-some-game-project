import type { CinematicSlide } from "~/components/CinematicOverlay";

// Use local images in dev, CDN in production
const IS_DEV = import.meta.env.DEV;
const CDN_STORIES = IS_DEV
  ? "/images/stories"
  : "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories";

// ─── Story mission cinematics ──────────────────────────────────

/** Map of story mission ID → cinematic slides shown on reward claim.
 *
 *  The slide text is rendered onto the image itself (rendering issue with the
 *  page-turn animation made overlaid text unreliable). The `text` strings
 *  below are the **source of truth** for the prose: they're not displayed
 *  in-game right now, but they:
 *  - keep the canonical wording in code so chronicle entries + future
 *    rewrites can grep against it;
 *  - make later i18n / translation work straightforward;
 *  - survive image regeneration (text stays even if a slide is redone).
 *  When updating a slide image, update the matching `text` string here too. */
export const STORY_CINEMATICS: Record<string, CinematicSlide[]> = {
  story_1_scouting: [
    {
      image: `${CDN_STORIES}/story_1_slide_1.png`,
      text:
        "The scouts came back today with a map and a look I didn't like.\n\n" +
        "The land around us is rich: game trails, berry thickets, a quarry site on the eastern ridge, good water sources. We can work with this.",
      position: "bottom",
    },
    {
      image: `${CDN_STORIES}/story_1_slide_2.png`,
      text:
        "But they found something I didn't expect: a day's march south on a hilltop, an abandoned watchtower.\n\n" +
        "Stone foundations, a collapsed well, the tower still half standing. Someone built here before us. Someone who thought to build to last.",
      position: "bottom",
    },
    {
      image: `${CDN_STORIES}/story_1_slide_3.png`,
      text:
        "They left. Or they were made to leave.\n\n" +
        "The scouts couldn't tell which. No bodies, no signs of battle. Just empty buildings and silence.",
      position: "bottom",
    },
    {
      image: `${CDN_STORIES}/story_1_slide_4.png`,
      text:
        "I keep thinking about it. Whoever they were, they had stone walls and a watchtower, and it still wasn't enough.\n\n" +
        "What did they know that we don't?",
      position: "bottom",
    },
  ],
  story_2_ruins: [
    {
      image: `${CDN_STORIES}/story_2_slide_1.png`,
      text:
        "They went back with steel. Past the new fence-line at first light. They did not say much before they left.\n\n" +
        "What the scouts brought back last week was a sketch. What this team brought back is a name.",
      position: "bottom",
    },
    {
      image: `${CDN_STORIES}/story_2_slide_2.png`,
      text:
        "Captain Vardin Hale. The name is on the cover of a tin-bound journal we found under a collapsed beam, dry enough to read.\n\n" +
        "The seal beside it is a Crown seal, but it is not one I know. I taught children to draw the seals of the Reach for fourteen years, and never once did this one come up.",
      position: "bottom",
    },
    {
      image: `${CDN_STORIES}/story_2_slide_3.png`,
      text:
        "Forty-seven days. That is what the journal holds.\n\n" +
        "It does not stop because they were attacked. The handwriting thins. Men leave the watch rota one at a time. The voices come for them: kind voices, brothers and mothers and sergeants long dead.\n\n" +
        "On day forty-four Hale writes a name he has not written before. Ennara. His daughter. She died young.\n\n" +
        "His last entry: 'I heard Ennara again today. I am going to her.' Then nothing.",
      position: "bottom",
    },
    {
      image: `${CDN_STORIES}/story_2_slide_4.png`,
      text:
        "Hale's journal puts the line where the trees go quiet at seven days' march from his gate. My scouts put that line at three days' walk from mine.\n\n" +
        "Four days, in a hundred and fifty years.\n\n" +
        "I do not believe the Crown lied to me. The Crown forgot. I am not going back. I will dig a deeper well.",
      position: "bottom",
    },
  ],
};

// ─── Intro cinematic ───────────────────────────────────────────

export const INTRO_CINEMATIC: CinematicSlide[] = [
  {
    image: `${CDN_STORIES}/intro_slide_1_final.webp`,
    text: ``,
    position: "bottom",
  },
  {
    image: `${CDN_STORIES}/intro_slide_2_final.webp`,
    text: ``,
    position: "bottom",
  },
  {
    image: `${CDN_STORIES}/intro_slide_3_final.webp`,
    text: ``,
    position: "bottom",
  },
];
