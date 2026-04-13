import type { CinematicSlide } from "~/components/CinematicOverlay";

// Use local images in dev, CDN in production
const IS_DEV = import.meta.env.DEV;
const CDN_STORIES = IS_DEV
  ? "/images/stories"
  : "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories";

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
