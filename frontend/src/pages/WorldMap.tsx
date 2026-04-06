import { createSignal, onMount, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { fetchWorldMap, type WorldSettlement } from "~/api/world";
import { getSettlementId } from "~/engine/gameState";
import type { WorldMapResponse } from "@medieval-realm/shared";

const TIER_ICONS: Record<string, string> = {
  camp: "🏕️",
  village: "🏘️",
  town: "🏙️",
  city: "🏰",
};

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export default function WorldMap() {
  const [mapData, setMapData] = createSignal<WorldMapResponse | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");

  // Viewport
  const [viewBox, setViewBox] = createSignal({ x: 0, y: 0, w: 1000, h: 1000 });

  // Interaction
  const [hoveredSettlement, setHoveredSettlement] = createSignal<WorldSettlement | null>(null);
  const [hoverPos, setHoverPos] = createSignal({ x: 0, y: 0 });
  const [selectedSettlement, setSelectedSettlement] = createSignal<WorldSettlement | null>(null);
  const [panelPos, setPanelPos] = createSignal({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });

  const mySettlement = () => {
    const data = mapData();
    const myId = getSettlementId();
    if (!data || !myId) return null;
    return data.settlements.find((s) => s.id === myId) ?? null;
  };

  const distanceTo = (s: WorldSettlement) => {
    const my = mySettlement();
    if (!my) return null;
    return Math.round(Math.sqrt((s.x - my.x) ** 2 + (s.y - my.y) ** 2));
  };

  const centerOnOwn = () => {
    const my = mySettlement();
    if (my) {
      setViewBox({ x: my.x - 150, y: my.y - 150, w: 300, h: 300 });
    } else {
      setViewBox({ x: 0, y: 0, w: 1000, h: 1000 });
    }
  };

  onMount(async () => {
    try {
      const data = await fetchWorldMap();
      setMapData(data);
      // Center on player's settlement
      const myId = getSettlementId();
      const my = data.settlements.find((s) => s.id === myId);
      if (my) {
        setViewBox({ x: my.x - 150, y: my.y - 150, w: 300, h: 300 });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load world map");
    } finally {
      setLoading(false);
    }
  });

  // Pan — only start dragging after pointer moves 4+ pixels
  const [dragOrigin, setDragOrigin] = createSignal({ x: 0, y: 0 });
  const DRAG_THRESHOLD = 4;

  function onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    setIsDragging(false);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOrigin({ x: e.clientX, y: e.clientY });
  }

  function onMouseMove(e: MouseEvent) {
    if (e.buttons !== 1) return; // left button held
    const origin = dragOrigin();
    const totalDx = Math.abs(e.clientX - origin.x);
    const totalDy = Math.abs(e.clientY - origin.y);

    if (!isDragging() && (totalDx > DRAG_THRESHOLD || totalDy > DRAG_THRESHOLD)) {
      setIsDragging(true);
    }

    if (!isDragging()) return;

    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const vb = viewBox();
    const dx = (e.clientX - dragStart().x) * (vb.w / rect.width);
    const dy = (e.clientY - dragStart().y) * (vb.h / rect.height);
    setViewBox({ ...vb, x: vb.x - dx, y: vb.y - dy });
    setDragStart({ x: e.clientX, y: e.clientY });
  }

  function onMouseUp() {
    setIsDragging(false);
  }

  // Zoom
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const vb = viewBox();
    const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    const newW = clamp(vb.w * factor, 50, 1200);
    const newH = clamp(vb.h * factor, 50, 1200);
    const mouseXRatio = (e.clientX - rect.left) / rect.width;
    const mouseYRatio = (e.clientY - rect.top) / rect.height;
    setViewBox({
      x: vb.x + (vb.w - newW) * mouseXRatio,
      y: vb.y + (vb.h - newH) * mouseYRatio,
      w: newW,
      h: newH,
    });
  }

  function zoom(factor: number) {
    const vb = viewBox();
    const newW = clamp(vb.w * factor, 50, 1200);
    const newH = clamp(vb.h * factor, 50, 1200);
    setViewBox({
      x: vb.x + (vb.w - newW) / 2,
      y: vb.y + (vb.h - newH) / 2,
      w: newW,
      h: newH,
    });
  }

  return (
    <div>
      <h1 class="page-title">World of {mapData()?.world.name ?? "..."}</h1>

      <Show when={loading()}>
        <div style={{ color: "var(--text-secondary)", padding: "40px", "text-align": "center" }}>
          Loading world map...
        </div>
      </Show>

      <Show when={error()}>
        <div style={{ color: "var(--accent-red)", padding: "20px" }}>{error()}</div>
      </Show>

      <Show when={!loading() && !error() && mapData()}>
        <div class="world-map-container">
          <svg
            viewBox={`${viewBox().x} ${viewBox().y} ${viewBox().w} ${viewBox().h}`}
            preserveAspectRatio="xMidYMid meet"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onWheel={onWheel}
            style={{ cursor: isDragging() ? "grabbing" : "grab" }}
          >
            {/* Map background image */}
            <image href="/map.png" x="0" y="0" width="1000" height="1000" preserveAspectRatio="none" />

            {/* Settlement markers */}
            <For each={mapData()!.settlements}>
              {(settlement) => {
                const isOwn = () => settlement.id === getSettlementId();
                const isHovered = () => hoveredSettlement()?.id === settlement.id;
                const showLabel = () => viewBox().w < 600 || isHovered() || isOwn();

                return (
                  <g
                    transform={`translate(${settlement.x}, ${settlement.y})`}
                    style={{ cursor: "pointer" }}
                    onPointerEnter={(e) => {
                      setHoveredSettlement(settlement);
                      setHoverPos({ x: e.clientX, y: e.clientY });
                    }}
                    onPointerLeave={() => setHoveredSettlement(null)}
                    onClick={(e) => {
                      if (isDragging()) return;
                      e.stopPropagation();
                      const container = (e.currentTarget as SVGElement).closest(".world-map-container");
                      if (container) {
                        const rect = container.getBoundingClientRect();
                        setPanelPos({
                          x: e.clientX - rect.left + 20,
                          y: e.clientY - rect.top - 20,
                        });
                      }
                      setSelectedSettlement(settlement);
                    }}
                  >
                    {/* Glow for own settlement */}
                    <Show when={isOwn()}>
                      <circle r="18" fill="none" stroke="#f5c542" stroke-width="0.8" opacity="0.4">
                        <animate attributeName="r" values="16;24;16" dur="3s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" repeatCount="indefinite" />
                      </circle>
                    </Show>

                    {/* Invisible hit area (larger than marker for easier clicking) */}
                    <circle r="14" fill="transparent" />

                    {/* Castle marker */}
                    <polygon
                      points="-6,-10 -6,-4 -8,-4 0,-14 8,-4 6,-4 6,-10 3,-10 3,-6 -3,-6 -3,-10"
                      fill={isOwn() ? "#f5c542" : isHovered() ? "#e0e8f0" : "#c8d4e0"}
                      stroke={isOwn() ? "#d4a017" : isHovered() ? "#ffffff" : "#8090a8"}
                      stroke-width="1"
                    />
                    {/* Base */}
                    <rect x="-8" y="-4" width="16" height="5" rx="1"
                      fill={isOwn() ? "#d4a017" : isHovered() ? "#c0c8d8" : "#a0b0c0"}
                    />

                    {/* Name label with dark outline for readability */}
                    <Show when={showLabel()}>
                      <text
                        y="12"
                        text-anchor="middle"
                        font-size={isOwn() ? "7" : "6"}
                        fill={isOwn() ? "#f5c542" : "#ffffff"}
                        font-family="MedievalSharp, cursive"
                        font-weight="bold"
                        stroke="#000000"
                        stroke-width="2"
                        paint-order="stroke"
                      >
                        {settlement.name}
                      </text>
                    </Show>
                  </g>
                );
              }}
            </For>

          </svg>

          {/* Hover tooltip */}
          <Show when={hoveredSettlement() && !selectedSettlement()}>
            {(() => {
              const s = () => hoveredSettlement()!;
              const dist = () => distanceTo(s());
              return (
                <div class="map-tooltip" style={{
                  left: `${hoverPos().x + 16}px`,
                  top: `${hoverPos().y - 10}px`,
                }}>
                  <div class="map-tooltip-name">{s().name}</div>
                  <div class="map-tooltip-row">
                    <span>Ruler:</span> <span>{s().playerName}</span>
                  </div>
                  <div class="map-tooltip-row">
                    <span>Rank:</span> <span>#{s().rank}</span>
                  </div>
                  <div class="map-tooltip-row">
                    <span>Power:</span> <span>{s().score}</span>
                  </div>
                  <div class="map-tooltip-row">
                    <span>Tier:</span> <span>{TIER_ICONS[s().tier] ?? ""} {s().tier}</span>
                  </div>
                  <Show when={dist() !== null && s().id !== getSettlementId()}>
                    <div class="map-tooltip-row">
                      <span>Distance:</span> <span>{dist()} leagues</span>
                    </div>
                  </Show>
                </div>
              );
            })()}
          </Show>

          {/* Action panel (on click) */}
          <Show when={selectedSettlement()}>
            {(s) => {
              const isOwn = () => s().id === getSettlementId();
              const dist = () => distanceTo(s());
              return (
                <div class="map-action-panel" style={{
                  left: `${Math.min(panelPos().x, window.innerWidth - 320)}px`,
                  top: `${Math.max(10, Math.min(panelPos().y, window.innerHeight - 350))}px`,
                }}>
                  <button class="map-panel-close" onClick={() => setSelectedSettlement(null)}>×</button>
                  <h3>{s().name}</h3>
                  <div class="map-panel-subtitle">
                    {isOwn() ? "Your Settlement" : `Ruled by ${s().playerName}`}
                  </div>

                  <div class="map-panel-stats">
                    <div class="map-panel-row">
                      <span>Rank</span><span>#{s().rank}</span>
                    </div>
                    <div class="map-panel-row">
                      <span>Power</span><span>{s().score}</span>
                    </div>
                    <div class="map-panel-row">
                      <span>Tier</span><span>{TIER_ICONS[s().tier] ?? ""} {s().tier}</span>
                    </div>
                    <Show when={!isOwn() && dist() !== null}>
                      <div class="map-panel-row">
                        <span>Distance</span><span>{dist()} leagues</span>
                      </div>
                    </Show>
                  </div>

                  <Show when={isOwn()}>
                    <A href="/" class="map-panel-action">Go to Overview →</A>
                  </Show>
                  <Show when={!isOwn()}>
                    <div class="map-panel-actions">
                      <button class="map-panel-action-btn" disabled>
                        Trade Offer (coming soon)
                      </button>
                      <button class="map-panel-action-btn" disabled>
                        Send Envoy (coming soon)
                      </button>
                    </div>
                  </Show>
                </div>
              );
            }}
          </Show>

          {/* Zoom controls */}
          <div class="map-zoom-controls">
            <button onClick={() => zoom(1 / 1.3)} title="Zoom in">+</button>
            <button onClick={() => zoom(1.3)} title="Zoom out">−</button>
            <button onClick={centerOnOwn} title="Center on your settlement">⌂</button>
          </div>
        </div>
      </Show>
    </div>
  );
}
