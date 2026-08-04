import { createSignal, createMemo, For, Show, onMount, onCleanup } from "solid-js";
import type { MissionTemplate } from "@medieval-realm/shared/data/missions";
import MissionCard from "./MissionCard";
import { IS_DEV } from "~/data/seasons";

// ─── The Mission Map (Phase 1 prototype) ────────────────────────────────────
// The mission board IS a map of the valley. Field missions with authored map
// coords pin on the terrain (WoW world-quest style); click a pin to open the
// team assembly panel (the parent owns selection, same as the old card grid).
// Missions with no coords fall to the "Close to home" dock below the map, so
// nothing goes unreachable while pins are authored one at a time.
// See docs/DESIGN_MISSION_MAP.md.

const MAP_SRC = "/images/map/valley.jpg";
const MAP_W = 2400, MAP_H = 2243;         // the downscaled sketch
const ASPECT = MAP_H / MAP_W;             // world height / world width

const MIN_ZOOM = 1;                        // map width == container width
const MAX_ZOOM = 4.5;
const INITIAL_ZOOM = 2.6;                  // the settlement crop
const INITIAL_CENTER = { x: 0.5, y: 0.55 };

const CLIMATE_ICON: Record<string, string> = { cold: "❄", hot: "☀", temperate: "" };

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

  const pinned = createMemo(() => props.missions.filter((m) => m.map));
  const unplaced = createMemo(() => props.missions.filter((m) => !m.map));

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

  // ── Dev click-to-place: click the terrain, copy the normalized coords ──
  const [placeMode, setPlaceMode] = createSignal(false);
  const [lastPlaced, setLastPlaced] = createSignal<string | null>(null);
  const onMapClick = (e: MouseEvent) => {
    if (moved || !placeMode()) return; // a drag, or not placing
    const r = worldRef.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 1000;
    const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 1000;
    const snippet = `map: { x: ${x}, y: ${y} },`;
    setLastPlaced(snippet);
    navigator.clipboard?.writeText(snippet).catch(() => {});
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
          <For each={pinned()}>
            {(m) => {
              const kind = pinKind(m);
              const selected = () => props.selectedId === m.id;
              const climate = () => CLIMATE_ICON[m.climate ?? "temperate"] ?? "";
              return (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); props.onSelect(m); }}
                  title={`${m.name}  ${"★".repeat(m.difficulty)}${m.climate && m.climate !== "temperate" ? `  ${climate()} ${m.climate}` : ""}`}
                  style={{
                    position: "absolute",
                    left: `${m.map!.x * 100}%`,
                    top: `${m.map!.y * 100}%`,
                    transform: `translate(-50%, -50%) scale(${selected() ? 1.15 : 1})`,
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
                    "box-shadow": selected()
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
              );
            }}
          </For>
        </div>

        {/* Zoom controls */}
        <div style={{ position: "absolute", right: "10px", bottom: "10px", display: "flex", "flex-direction": "column", gap: "4px" }}>
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

        {/* Dev click-to-place */}
        <Show when={IS_DEV}>
          <div style={{ position: "absolute", left: "10px", bottom: "10px", display: "flex", "align-items": "center", gap: "8px" }}>
            <button
              classList={{ "btn-secondary": !placeMode(), "btn-primary": placeMode() }}
              style={{ "font-size": "0.72rem" }}
              onClick={(e) => { e.stopPropagation(); setPlaceMode(!placeMode()); }}
            >
              📍 {placeMode() ? "Placing… (click terrain)" : "Place mode"}
            </button>
            <Show when={lastPlaced()}>
              <span style={{
                "font-family": "monospace", "font-size": "0.72rem", color: "var(--accent-gold)",
                background: "rgba(20,18,14,0.85)", padding: "3px 6px", "border-radius": "4px",
              }}>{lastPlaced()} (copied)</span>
            </Show>
          </div>
        </Show>
      </div>

      {/* Close to home: missions with no pin yet, until coords are authored. */}
      <Show when={unplaced().length > 0}>
        <h3 style={{ "font-family": "var(--font-heading)", color: "var(--text-secondary)", "font-size": "0.9rem", margin: "18px 0 8px" }}>
          Close to home
        </h3>
        <div class="buildings-grid">
          <For each={unplaced()}>
            {(m) => (
              <MissionCard
                mission={m}
                selected={props.selectedId === m.id}
                storyChapter={(m as any).chapter}
                onClick={() => props.onSelect(m)}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
