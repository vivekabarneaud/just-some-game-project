import ForagingScene from "~/components/ForagingScene";

/** TEMP dev-only sandbox for the foraging minigame. Standalone (outside the
 *  GameProvider) like the alchemy and kitchen sandboxes: a pure tuning tool with
 *  no game state, so the settlement save-loop can't reload it mid-experiment.
 *
 *  All of the behaviour lives in <ForagingScene>, which the real trip page uses
 *  too. `sandbox` is what adds the season/seed/rain/refill controls, the mask
 *  legend and the stock readout — none of which the player ever sees. */
export default function ForagingDev() {
  return <ForagingScene season="autumn" sandbox />;
}
