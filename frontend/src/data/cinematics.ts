import type { CinematicSlide } from "~/components/CinematicOverlay";

// Use local images in dev, CDN in production
const IS_DEV = import.meta.env.DEV;
const CDN_STORIES = IS_DEV
  ? "/images/stories"
  : "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories";

// ─── Story mission cinematics ──────────────────────────────────

/** Map of story mission ID → cinematic slides shown on reward claim */
export const STORY_CINEMATICS: Record<string, CinematicSlide[]> = {
  story_1_scouting: [
    {
      image: `${CDN_STORIES}/story_1_slide_1.png`,
      text: ``,
      position: "bottom",
    },
    {
      image: `${CDN_STORIES}/story_1_slide_2.png`,
      text: ``,
      position: "bottom",
    },
    {
      image: `${CDN_STORIES}/story_1_slide_3.png`,
      text: ``,
      position: "bottom",
    },
    {
      image: `${CDN_STORIES}/story_1_slide_4.png`,
      text: ``,
      position: "bottom",
    },
  ],
};

// ─── Intro cinematic ───────────────────────────────────────────

export const INTRO_CINEMATIC: CinematicSlide[] = [
  {
    image: `${CDN_STORIES}/intro_slide_1_parchment_text.png`,
    text: ``,
    position: "bottom",
  },
  {
    image: `${CDN_STORIES}/intro_slide_2_parchment_text.png`,
    text: ``,
    position: "bottom",
  },
  {
    // Slide 3 uses parchment-only image + HTML text overlay for dynamic village name
    image: `${CDN_STORIES}/intro_slide_3_parchment.png`,
    text: `This is it. The map calls it **{villageName}**. Right now it's mud, timber, and a long list of things we don't have.\n\nBut the river is clean and the soil is dark. That's a start.`,
    position: "bottom",
  },
  {
    image: `${CDN_STORIES}/intro_slide_4_parchment_text.png`,
    text: ``,
    position: "bottom",
  },
];
