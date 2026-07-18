/** Coarse human duration: "45s" / "5m" / "2h 30m". Drops sub-minute resolution
 *  once we cross a minute boundary. Use for craft/build estimates where the
 *  rounded number reads cleaner than a precise countdown. */
export function formatTimeShort(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Precise human duration: "45s" / "5m 30s" / "2h 30m". Keeps the seconds
 *  remainder in the minute range. Use for live timers / countdowns where the
 *  player wants to see progress every tick. */
export function formatTimeLong(seconds: number): string {
  seconds = Math.round(seconds); // avoid float tails (e.g. repair time = build × 0.3)
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
