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
