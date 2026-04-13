import type { CinematicSlide } from "~/components/CinematicOverlay";

// Use local images in dev, CDN in production
const IS_DEV = import.meta.env.DEV;
const CDN_STORIES = IS_DEV
  ? "/images/stories"
  : "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories";

export const INTRO_CINEMATIC: CinematicSlide[] = [
  {
    image: `${CDN_STORIES}/intro_slide_1_parchment.png`,
    text: `The contract is already creased from folding and unfolding. "Crown Land Grant — Southern Frontier." Free land. Build a settlement. Serve the Crown.\nIt sounded better in the tavern.`,
    position: "bottom",
  },
  {
    image: `${CDN_STORIES}/intro_slide_2_parchment.png`,
    text: `Three weeks on the road. Farmers who lost their fields. Soldiers who stopped asking questions. A priest who blesses everything, including the mules.\nNobody talks about what they left behind.`,
    position: "bottom",
  },
  {
    image: `${CDN_STORIES}/intro_slide_3_parchment.png`,
    text: `This is it. The map calls it **{villageName}**. Right now it's mud, timber, and a long list of things we don't have.\nBut the river is clean and the soil is dark. That's a start.`,
    position: "bottom",
  },
  {
    image: `${CDN_STORIES}/intro_slide_4_parchment.png`,
    text: `The first night is the quietest. By tomorrow, there'll be axes ringing and arguments about where to dig the well.\nBut right now — just the fire and the forest.\nWhatever's coming, we'll build something worth defending.`,
    position: "bottom",
  },
];
