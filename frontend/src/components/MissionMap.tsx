import { createSignal, createMemo, createEffect, For, Show, onMount, onCleanup } from "solid-js";
import type { MissionTemplate } from "@medieval-realm/shared/data/missions";
import { MISSION_POOL, STORY_MISSIONS, EXPEDITION_POOL, getMission, getMissionPhase, SETTLEMENT_MAP_POS } from "@medieval-realm/shared/data/missions";
import MissionCard from "./MissionCard";
import { IS_DEV } from "~/data/seasons";
import { useGame } from "~/engine/gameState";
import { MAP_REGIONS } from "~/data/mapRegions";

// ─── The Mission Map (Phase 1 prototype) ────────────────────────────────────
// The mission board IS a map of the valley. Field missions with authored map
// coords pin on the terrain (WoW world-quest style); click a pin to open the
// team assembly panel (the parent owns selection, same as the old card grid).
// Missions with no coords fall to the "Close to home" dock below the map, so
// nothing goes unreachable while pins are authored one at a time.
//
// DEV "Place mode": pick a mission (click its pin or its dock card), then click
// the map to drop it there. Placements are stored in localStorage as an override
// layer so they preview live over the authored coords; "Copy placements" dumps
// them as JSON to paste back for baking into the mission source.
// See docs/DESIGN_MISSION_MAP.md.

const MAP_SRC = "/images/map/valley.jpg";
const MAP_W = 2400, MAP_H = 2243;         // the downscaled sketch
const ASPECT = MAP_H / MAP_W;             // world height / world width

// The "undrawn map": blank parchment covers the full map; each explored area is
// scratched away (soft-edged) to let the charted map show through beneath. The
// map draws itself in as the scouts range. Replace parchment.jpg / valley.jpg
// with the final paintings when they land; the reveal logic is unchanged.
const PARCHMENT_SRC = "/images/map/parchment.jpg";
// Canvas resolution for the parchment mask (CSS scales it with pan/zoom).
const REVEAL_W = 1200, REVEAL_H = Math.round(REVEAL_W * ASPECT);
/** Normalized reveal windows known from the start (Settlement + Hometown). */
const INITIAL_REVEALED: { x: number; y: number; r: number }[] = [
  { x: 0.492, y: 0.535, r: 0.085 }, // the settlement
  { x: 0.492, y: 0.21, r: 0.075 },  // hometown
];
// Authored reveal-region masks (hand-drawn soft-edged shapes that hug the
// terrain), from the region data. Revealing one scratches the parchment away in
// exactly its painted shape. Which are revealed is persisted game state.
const REGION_MASKS = MAP_REGIONS.map((r) => r.mask);

const MIN_ZOOM = 1;                        // map width == container width
const MAX_ZOOM = 4.5;
const INITIAL_ZOOM = 2.6;                  // the settlement crop
const INITIAL_CENTER = { x: 0.5, y: 0.55 };

const CLIMATE_ICON: Record<string, string> = { cold: "❄", hot: "☀", temperate: "" };

// Dev-only placement override layer (localStorage). Keyed by mission id.
const OVERRIDES_KEY = "mm_dev_placements";
type XY = { x: number; y: number };
function loadOverrides(): Record<string, XY> {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}"); } catch { return {}; }
}

// Dev "show all": every authored mission (story + pool + expeditions), deduped
// by id, so ALL coords can be placed in one pass instead of only today's board.
const ALL_AUTHORED: MissionTemplate[] = (() => {
  const seen = new Set<string>();
  const out: MissionTemplate[] = [];
  for (const m of [...STORY_MISSIONS, ...MISSION_POOL, ...EXPEDITION_POOL]) {
    if (!seen.has(m.id)) { seen.add(m.id); out.push(m); }
  }
  return out;
})();

/** Pin frame + label by mission kind — mirrors the MissionCard styling signals
 *  (story = gold, side-chain = teal, urgent = orange, ordinary = bronze). */
function pinKind(m: MissionTemplate): { color: string; label: string } {
  if ((m as any).storyOrder != null || (m as any).chapter) return { color: "var(--accent-gold)", label: "Story" };
  if (m.urgent) return { color: "#e0803c", label: "At the settlement" };
  if (m.sideChain) return { color: "#3fb0a3", label: "Side story" };
  return { color: "#b9a06a", label: "" };
}

export default function MissionMap(props: {
  missions: MissionTemplate[];
  selectedId?: string;
  onSelect: (m: MissionTemplate) => void;
}) {
  let containerRef!: HTMLDivElement;
  let worldRef!: HTMLDivElement;
  let canvasRef!: HTMLCanvasElement;

  // Explored windows (normalized). The parchment is scratched away here so the
  // charted map shows through. Prototype: in-memory + settlement/hometown known;
  // wiring to real scouting (persisted reveal state) comes next.
  const game = useGame();
  const [revealed, setRevealed] = createSignal(INITIAL_REVEALED); // fixed windows + dev blobs
  const [devRegions, setDevRegions] = createSignal<number[]>([]); // dev preview override
  const [revealTick, setRevealTick] = createSignal(0);            // bumps to re-gate pins
  let parchmentImg: HTMLImageElement | null = null;
  const regionImgs: (HTMLImageElement | null)[] = REGION_MASKS.map(() => null);
  const SAMPLE_W = 240, SAMPLE_H = Math.round(SAMPLE_W * ASPECT);
  const regionAlpha: (Uint8ClampedArray | null)[] = REGION_MASKS.map(() => null);
  // Region indices drawn this frame: revealed in the save ∪ dev-toggled.
  const activeRegions = (): number[] => {
    const on = new Set<number>(devRegions());
    const saved = game.state.revealedRegions ?? [];
    MAP_REGIONS.forEach((r, i) => { if (saved.includes(r.id)) on.add(i); });
    return [...on];
  };
  const drawParchment = () => {
    const cv = canvasRef;
    if (!cv || !parchmentImg) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const w = cv.width, h = cv.height;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(parchmentImg, 0, 0, w, h);
    ctx.globalCompositeOperation = "destination-out";
    // Circular windows (Settlement + Hometown, and dev "reveal here" blobs).
    for (const rg of revealed()) {
      const cx = rg.x * w, cy = rg.y * h, rad = rg.r * w;
      const grad = ctx.createRadialGradient(cx, cy, rad * 0.35, cx, cy, rad);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
    }
    // Authored region masks (charted terrain shapes) — erase in their shape.
    for (const i of activeRegions()) {
      const rimg = regionImgs[i];
      if (rimg) ctx.drawImage(rimg, 0, 0, w, h);
    }
    ctx.globalCompositeOperation = "source-over";
  };
  // Redraw + re-gate whenever the explored set changes.
  createEffect(() => { revealed(); activeRegions(); drawParchment(); setRevealTick((n) => n + 1); });
  // Is a normalized point charted (under a revealed window/region)? Drives pin
  // gating — a mission stays hidden until the map is drawn where it sits.
  const isRevealedAt = (nx: number, ny: number): boolean => {
    for (const c of revealed()) {
      const dx = nx - c.x, dy = ny - c.y;
      if (dx * dx + dy * dy < c.r * c.r) return true;
    }
    for (const i of activeRegions()) {
      const a = regionAlpha[i];
      if (!a) continue;
      const px = Math.floor(nx * SAMPLE_W), py = Math.floor(ny * SAMPLE_H);
      if (px < 0 || py < 0 || px >= SAMPLE_W || py >= SAMPLE_H) continue;
      if (a[(py * SAMPLE_W + px) * 4 + 3] > 100) return true;
    }
    return false;
  };
  const isStoryMission = (m: MissionTemplate) => (m as any).storyOrder != null || (m as any).chapter != null;

  // Dev placement overrides preview live over the authored coords.
  const [overrides, setOverrides] = createSignal<Record<string, XY>>(IS_DEV ? loadOverrides() : {});
  const effMap = (m: MissionTemplate): XY | undefined => overrides()[m.id] ?? m.map;
  const saveOverride = (id: string, xy: XY) => {
    const next = { ...overrides(), [id]: xy };
    setOverrides(next);
    try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next)); } catch { /* private mode */ }
  };
  const clearOverrides = () => {
    setOverrides({});
    try { localStorage.removeItem(OVERRIDES_KEY); } catch { /* private mode */ }
  };

  // Dev "show all" swaps today's board for every authored mission, so they can
  // all be placed in one pass. Off = the normal live board.
  const [showAll, setShowAll] = createSignal(false);
  const source = () => (IS_DEV && showAll() ? ALL_AUTHORED : props.missions);
  const pinned = createMemo(() => source().filter((m) => effMap(m)));
  const unplaced = createMemo(() => source().filter((m) => !effMap(m)));

  // Active-mission team tokens: interpolate settlement→mission→home by phase, so
  // you watch your teams march out, fight, and come home along the real map.
  const lerp = (a: XY, b: XY, t: number): XY => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const activeTokens = createMemo(() =>
    (game.state.activeMissions ?? []).map((am) => {
      const m = getMission(am.missionId);
      if (!m?.map) return null;
      const init = am.initialDuration || m.duration || 1;
      const f = Math.min(1, Math.max(0, (init - am.remaining) / init));
      const phase = getMissionPhase(am);
      let pos: XY, icon: string, color: string;
      if (phase === "combat") { pos = m.map; icon = "⚔️"; color = "var(--accent-red)"; }
      else if (phase === "homeward") { pos = lerp(m.map, SETTLEMENT_MAP_POS, Math.min(1, Math.max(0, (f - 0.5) / 0.5))); icon = "🏡"; color = "var(--accent-green)"; }
      else { pos = lerp(SETTLEMENT_MAP_POS, m.map, Math.min(1, f / 0.5)); icon = "🚶"; color = "var(--accent-blue)"; }
      const team = am.adventurerIds.map((id) => game.state.adventurers.find((a) => a.id === id)?.name).filter(Boolean) as string[];
      return { id: am.missionId, x: pos.x, y: pos.y, icon, color, name: m.name, phase, team };
    }).filter(Boolean) as { id: string; x: number; y: number; icon: string; color: string; name: string; phase: string | null; team: string[] }[],
  );

  const [containerW, setContainerW] = createSignal(800);
  const [containerH, setContainerH] = createSignal(480);
  const [zoom, setZoom] = createSignal(INITIAL_ZOOM);
  const [pan, setPan] = createSignal({ x: 0, y: 0 });

  const worldW = () => containerW() * zoom();
  const worldH = () => worldW() * ASPECT;

  // Clamp a pan so the world always covers the container (or sits centered when
  // it's smaller than the container on an axis).
  const axis = (want: number, world: number, container: number) =>
    world <= container ? (container - world) / 2 : Math.max(container - world, Math.min(0, want));
  const setPanClamped = (x: number, y: number) =>
    setPan({ x: axis(x, worldW(), containerW()), y: axis(y, worldH(), containerH()) });

  /** Put normalized point (nx, ny) at the container centre, clamped. */
  const centerOn = (nx: number, ny: number) => {
    setPanClamped(containerW() / 2 - nx * worldW(), containerH() / 2 - ny * worldH());
  };
  const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));

  /** Zoom toward a container-space point (px, py), keeping what's under it fixed. */
  const zoomAt = (nextZoom: number, px: number, py: number) => {
    const nz = clampZoom(nextZoom);
    const nx = (px - pan().x) / worldW();
    const ny = (py - pan().y) / worldH();
    setZoom(nz);
    setPanClamped(px - nx * worldW(), py - ny * worldH());
  };
  const zoomStep = (factor: number) => zoomAt(zoom() * factor, containerW() / 2, containerH() / 2);

  const measure = () => {
    if (!containerRef) return;
    setContainerW(containerRef.clientWidth);
    setContainerH(containerRef.clientHeight);
    setPanClamped(pan().x, pan().y); // keep in-bounds after a resize
  };
  onMount(() => {
    measure();
    setZoom(INITIAL_ZOOM);
    centerOn(INITIAL_CENTER.x, INITIAL_CENTER.y);
    // Load the parchment overlay, then draw the mask once it's ready.
    const img = new Image();
    img.onload = () => { parchmentImg = img; drawParchment(); };
    img.src = PARCHMENT_SRC;
    // Load the authored region masks + sample their alpha (for pin-gating).
    REGION_MASKS.forEach((src, i) => {
      const rimg = new Image();
      rimg.onload = () => {
        regionImgs[i] = rimg;
        const oc = document.createElement("canvas");
        oc.width = SAMPLE_W; oc.height = SAMPLE_H;
        const octx = oc.getContext("2d");
        if (octx) {
          octx.drawImage(rimg, 0, 0, SAMPLE_W, SAMPLE_H);
          regionAlpha[i] = octx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;
        }
        drawParchment();
        setRevealTick((n) => n + 1);
      };
      rimg.src = src;
    });
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef);
    onCleanup(() => ro.disconnect());
  });

  // ── Drag to pan ──
  let dragging = false, moved = false, startX = 0, startY = 0, startPan = { x: 0, y: 0 };
  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    dragging = true; moved = false;
    startX = e.clientX; startY = e.clientY; startPan = pan();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    setPanClamped(startPan.x + dx, startPan.y + dy);
  };
  const onPointerUp = (e: PointerEvent) => {
    dragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.getBoundingClientRect();
    zoomAt(zoom() * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX - rect.left, e.clientY - rect.top);
  };

  // ── Dev place mode: pick a mission, click the map to drop it there ──
  const [placeMode, setPlaceMode] = createSignal(false);
  const [placeTarget, setPlaceTarget] = createSignal<MissionTemplate | null>(null);
  const [note, setNote] = createSignal<string | null>(null);
  // In place mode, clicking a pin/card selects it as the drop target instead of
  // opening the assembly panel.
  const pickOrSelect = (m: MissionTemplate) => {
    if (placeMode()) { setPlaceTarget(m); setNote(`Placing “${m.name}” — click the map`); }
    else props.onSelect(m);
  };
  const onMapClick = (e: MouseEvent) => {
    if (moved || !placeMode()) return; // a drag, or not placing
    const t = placeTarget();
    if (!t) { setNote("Pick a mission first (click a pin or a “Close to home” card)"); return; }
    const r = worldRef.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 1000;
    const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 1000;
    saveOverride(t.id, { x, y });
    setNote(`${t.id}: { x: ${x}, y: ${y} }  ✓`);
  };
  const copyPlacements = () => {
    const o = overrides();
    const n = Object.keys(o).length;
    if (!n) { setNote("No placements yet — drop some pins first"); return; }
    navigator.clipboard?.writeText(JSON.stringify(o, null, 0)).catch(() => {});
    setNote(`Copied ${n} placement${n > 1 ? "s" : ""} to clipboard`);
  };
  // Dev: scratch away the parchment at the current view centre, to eyeball the
  // "map draws itself in" effect before it's wired to real scouting.
  const revealHere = () => {
    const nx = (containerW() / 2 - pan().x) / worldW();
    const ny = (containerH() / 2 - pan().y) / worldH();
    setRevealed([...revealed(), { x: Math.round(nx * 1000) / 1000, y: Math.round(ny * 1000) / 1000, r: 0.07 }]);
    setNote("Revealed a patch of the map");
  };

  return (
    <div>
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onClick={onMapClick}
        style={{
          position: "relative",
          width: "100%",
          height: "clamp(360px, 60vh, 640px)",
          overflow: "hidden",
          "border-radius": "10px",
          border: "1px solid var(--border-default)",
          background: "#3a3a2a",
          cursor: dragging ? "grabbing" : placeMode() ? "crosshair" : "grab",
          "touch-action": "none",
          "user-select": "none",
        }}
      >
        <div
          ref={worldRef}
          style={{
            position: "absolute",
            left: "0",
            top: "0",
            width: `${worldW()}px`,
            height: `${worldH()}px`,
            transform: `translate(${pan().x}px, ${pan().y}px)`,
          }}
        >
          <img
            src={MAP_SRC}
            alt="Map of the valley"
            draggable={false}
            style={{ display: "block", width: "100%", height: "100%", "pointer-events": "none" }}
          />
          {/* Undrawn-map parchment: covers the map, scratched away over explored
              windows so the chart shows through. Sits over the map, under the pins. */}
          <canvas
            ref={canvasRef}
            width={REVEAL_W}
            height={REVEAL_H}
            style={{ position: "absolute", left: "0", top: "0", width: "100%", height: "100%", "pointer-events": "none" }}
          />
          <For each={pinned()}>
            {(m) => {
              const kind = pinKind(m);
              const em = () => effMap(m)!;
              const highlighted = () => placeMode() ? placeTarget()?.id === m.id : props.selectedId === m.id;
              const climate = () => CLIMATE_ICON[m.climate ?? "temperate"] ?? "";
              // Hidden until the map is charted where it sits (story missions and
              // the dev place/all views are exempt). revealTick re-runs it on change.
              const shown = () => { revealTick(); return placeMode() || showAll() || isStoryMission(m) || isRevealedAt(em().x, em().y); };
              return (
                <Show when={shown()}>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); pickOrSelect(m); }}
                  title={`${m.name}  ${"★".repeat(m.difficulty)}${m.climate && m.climate !== "temperate" ? `  ${climate()} ${m.climate}` : ""}`}
                  style={{
                    position: "absolute",
                    left: `${em().x * 100}%`,
                    top: `${em().y * 100}%`,
                    transform: `translate(-50%, -50%) scale(${highlighted() ? 1.15 : 1})`,
                    width: "42px",
                    height: "42px",
                    "border-radius": "50%",
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "center",
                    "font-size": "1.15rem",
                    padding: "0",
                    cursor: "pointer",
                    background: "rgba(20, 18, 14, 0.82)",
                    border: `2px solid ${kind.color}`,
                    "box-shadow": highlighted()
                      ? `0 0 0 3px ${kind.color}, 0 0 14px ${kind.color}`
                      : "0 2px 6px rgba(0,0,0,0.5)",
                    transition: "transform 0.12s, box-shadow 0.12s",
                  }}
                >
                  {m.icon}
                  <Show when={climate()}>
                    <span style={{
                      position: "absolute", top: "-6px", right: "-6px",
                      "font-size": "0.7rem", "line-height": 1,
                      background: "rgba(20,18,14,0.9)", "border-radius": "50%",
                      width: "16px", height: "16px", display: "flex",
                      "align-items": "center", "justify-content": "center",
                      border: `1px solid ${kind.color}`,
                    }}>{climate()}</span>
                  </Show>
                </button>
                </Show>
              );
            }}
          </For>

          {/* Active-mission team tokens — march out, fight, and return, gliding
              between tick updates. Shown even in unrevealed land (it's your team). */}
          <For each={activeTokens()}>
            {(tok) => (
              <div
                title={`${tok.name} — ${tok.phase === "combat" ? "in combat" : tok.phase === "homeward" ? "returning home" : "on the road"}${tok.team.length ? ` · ${tok.team.join(", ")}` : ""}`}
                style={{
                  position: "absolute",
                  left: `${tok.x * 100}%`,
                  top: `${tok.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                  width: "30px", height: "30px", "border-radius": "50%",
                  display: "flex", "align-items": "center", "justify-content": "center",
                  "font-size": "0.85rem",
                  background: "rgba(20, 18, 14, 0.9)",
                  border: `2px solid ${tok.color}`,
                  "box-shadow": tok.phase === "combat" ? `0 0 12px ${tok.color}` : "0 2px 6px rgba(0,0,0,0.55)",
                  animation: tok.phase === "combat" ? "pulse 1.2s infinite" : undefined,
                  transition: "left 0.9s linear, top 0.9s linear", // glide between ticks
                  "z-index": 5,
                }}
              >
                {tok.icon}
              </div>
            )}
          </For>
        </div>

        {/* Zoom controls */}
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: "absolute", right: "10px", bottom: "10px", display: "flex", "flex-direction": "column", gap: "4px" }}>
          <button class="btn-secondary" style={{ width: "34px", "font-size": "1.1rem", padding: "2px 0" }} onClick={() => zoomStep(1.3)}>+</button>
          <button class="btn-secondary" style={{ width: "34px", "font-size": "1.1rem", padding: "2px 0" }} onClick={() => zoomStep(1 / 1.3)}>−</button>
          <button class="btn-secondary" style={{ width: "34px", "font-size": "0.7rem", padding: "4px 0" }} title="Reset view"
            onClick={() => { setZoom(INITIAL_ZOOM); centerOn(INITIAL_CENTER.x, INITIAL_CENTER.y); }}>⌂</button>
        </div>

        {/* Legend */}
        <div style={{
          position: "absolute", left: "10px", top: "10px",
          display: "flex", gap: "10px", "flex-wrap": "wrap",
          background: "rgba(20,18,14,0.7)", padding: "4px 8px", "border-radius": "6px",
          "font-size": "0.7rem", color: "var(--text-secondary)",
        }}>
          <span><span style={{ color: "var(--accent-gold)" }}>●</span> Story</span>
          <span><span style={{ color: "#3fb0a3" }}>●</span> Side</span>
          <span><span style={{ color: "#e0803c" }}>●</span> Urgent</span>
          <span><span style={{ color: "#b9a06a" }}>●</span> Errand</span>
        </div>

        {/* Dev place mode */}
        <Show when={IS_DEV}>
          <div onPointerDown={(e) => e.stopPropagation()} style={{
            position: "absolute", left: "10px", bottom: "10px",
            display: "flex", "align-items": "center", gap: "8px", "flex-wrap": "wrap",
            "max-width": "calc(100% - 70px)",
          }}>
            <button
              classList={{ "btn-secondary": !placeMode(), "btn-primary": placeMode() }}
              style={{ "font-size": "0.72rem" }}
              onClick={(e) => { e.stopPropagation(); setPlaceMode(!placeMode()); setPlaceTarget(null); setNote(placeMode() ? null : "Click a mission (pin or card), then click the map"); }}
            >
              📍 {placeMode() ? "Placing on" : "Place mode"}
            </button>
            <button
              classList={{ "btn-secondary": !showAll(), "btn-primary": showAll() }}
              style={{ "font-size": "0.72rem" }}
              title="Show every authored mission (dev view — doesn't touch the live board)"
              onClick={(e) => { e.stopPropagation(); setShowAll(!showAll()); setNote(showAll() ? null : `Showing all ${ALL_AUTHORED.length} missions — place away`); }}
            >
              📋 {showAll() ? "All on" : "All missions"}
            </button>
            <button
              class="btn-secondary"
              style={{ "font-size": "0.72rem" }}
              title="Scratch the parchment away at the view centre (preview the reveal)"
              onClick={(e) => { e.stopPropagation(); revealHere(); }}
            >
              🗺️ Reveal here
            </button>
            <button
              class="btn-secondary"
              style={{ "font-size": "0.72rem" }}
              onClick={(e) => { e.stopPropagation(); setRevealed(INITIAL_REVEALED); setDevRegions([]); setNote("Reset dev preview (save's real reveals still apply)"); }}
            >
              Reset preview
            </button>
            <For each={REGION_MASKS}>
              {(_, i) => (
                <button
                  classList={{ "btn-secondary": !devRegions().includes(i()), "btn-primary": devRegions().includes(i()) }}
                  style={{ "font-size": "0.72rem", padding: "2px 7px" }}
                  title={`Dev-preview region ${i() + 1} (${MAP_REGIONS[i()].id})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDevRegions(devRegions().includes(i())
                      ? devRegions().filter((n) => n !== i())
                      : [...devRegions(), i()]);
                  }}
                >
                  R{i() + 1}
                </button>
              )}
            </For>
            <Show when={placeMode()}>
              <button class="btn-secondary" style={{ "font-size": "0.72rem" }} onClick={(e) => { e.stopPropagation(); copyPlacements(); }}>Copy placements</button>
              <button class="btn-secondary" style={{ "font-size": "0.72rem" }} onClick={(e) => { e.stopPropagation(); clearOverrides(); setNote("Cleared local placements (source unchanged)"); }}>Clear</button>
            </Show>
            <Show when={note()}>
              <span style={{
                "font-family": "monospace", "font-size": "0.72rem", color: "var(--accent-gold)",
                background: "rgba(20,18,14,0.88)", padding: "3px 6px", "border-radius": "4px",
              }}>{note()}</span>
            </Show>
          </div>
        </Show>
      </div>

      {/* Close to home: missions with no pin yet, until coords are authored. */}
      <Show when={unplaced().length > 0}>
        <h3 style={{ "font-family": "var(--font-heading)", color: "var(--text-secondary)", "font-size": "0.9rem", margin: "18px 0 8px" }}>
          Close to home
          <Show when={placeMode()}>
            <span style={{ "font-weight": 400, color: "var(--text-muted)", "font-size": "0.8rem" }}> — click one, then click the map to place it</span>
          </Show>
        </h3>
        <div class="buildings-grid">
          <For each={unplaced()}>
            {(m) => (
              <MissionCard
                mission={m}
                selected={placeMode() ? placeTarget()?.id === m.id : props.selectedId === m.id}
                storyChapter={(m as any).chapter}
                onClick={() => pickOrSelect(m)}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
