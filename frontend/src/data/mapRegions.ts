// ─── Mission-map reveal regions ─────────────────────────────────────────────
// The valley starts as undrawn parchment; each region is a hand-drawn, soft-
// edged mask (aligned to the full map) that scratches the parchment away in its
// painted shape when revealed. A region reveals for good the moment its trigger
// fires (a scout/story mission completed, or a chronicle beat). Settlement +
// Hometown are always drawn (handled in the map as fixed windows, not here).
// PLACEHOLDER triggers (2026-08-05): the region art (region_1..5, from IMG_0144
// –48) and these mappings are provisional. Refine — rename ids + retune triggers
// — once the final regions are painted.

export interface MapRegion {
  id: string;
  /** Soft-edged mask PNG, full-map aligned. */
  mask: string;
  /** What reveals it (once satisfied, it stays revealed): a mission completed
   *  (any count, via missionCompletions) OR a chronicle entry fired. */
  revealedBy: { missionDone?: string; chronicleFired?: string };
}

export const MAP_REGIONS: MapRegion[] = [
  { id: "near_fold",    mask: "/images/map/region_1.png", revealedBy: { missionDone: "story_1_scouting" } },  // near south / the fold
  { id: "west_marsh",   mask: "/images/map/region_2.png", revealedBy: { missionDone: "marsh_clearing" } },    // west / the fen
  { id: "lammast_road", mask: "/images/map/region_3.png", revealedBy: { chronicleFired: "ch1_lammast_arrival" } }, // north-east / Lammast
  { id: "old_watch",    mask: "/images/map/region_4.png", revealedBy: { missionDone: "story_1_scouting" } },  // south / the Old Watch
  // The east reach stays FOGGED on purpose. Its old trigger (first_patrol) was
  // cut 2026-08-31, and the obvious replacements all come from the wrong
  // direction — Cobb travels the north road, so escorting him should not
  // uncover the east. Sentinel id: nothing satisfies it until an eastward
  // exploration mission is authored, at which point put its id here.
  { id: "east_reach",   mask: "/images/map/region_5.png", revealedBy: { missionDone: "east_reach_exploration" } }, // east / the reach — AWAITING CONTENT
];
