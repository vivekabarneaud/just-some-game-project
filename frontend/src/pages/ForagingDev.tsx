import { createSignal, createMemo, createResource, For, Show } from "solid-js";
import { FORAGE_PLANTS, getForagePlant } from "@medieval-realm/shared/data/foraging/plants";
import { buildScene, fullStock, pick, regrow, seasonCap } from "@medieval-realm/shared/data/foraging/scene";
import type { WoodsStock } from "@medieval-realm/shared/data/foraging/types";
import type { Season } from "@medieval-realm/shared";
import { loadTerrainMask, TERRAIN_SWATCH } from "~/engine/foragingMask";

/** TEMP dev-only sandbox for the foraging minigame. Standalone (outside the
 *  GameProvider) like the alchemy and kitchen sandboxes: a pure tuning tool with
 *  no game state, so the settlement save-loop can't reload it mid-experiment.
 *
 *  What it's for: feeling out whether searching a painting is actually FUN
 *  before any of it touches the real game. See docs/DESIGN_FORAGING_MINIGAME.md.
 *
 *  The two rules under test:
 *   · Nothing in the scene is ever labelled. You hover to look closer, and the
 *     close look shows the PLANT, never its name. You decide.
 *   · There is no fail state. A decoy costs a basket slot and tells you what it
 *     really was, which is how the herbier fills in. */

const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];
const BASKET_SIZE = 10;
/** Drop paintings in frontend/public/images/foraging/ named per season. */
/** Sprite art per plant, numbered from 1. Sized by HEIGHT so mushrooms of
 *  different proportions read as consistently "that tall" on the ground. */
const spriteUrl = (plantId: string, variant: number) =>
  `/images/foraging/plants/${plantId}${variant}.png`;
/** Height of a sprite at scale 1, as a percentage of the scene box. Sized by
 *  HEIGHT so plants of different proportions read as consistently "that tall"
 *  standing on the ground. */
const SPRITE_H = 15;

/** Backgrounds live at /images/foraging/scenes/{season}{n}.png, numbered from
 *  1, with an optional painted terrain mask beside each as {season}{n}_mask.png.
 *  Sprites live one folder up in plants/, so the scenes folder stays browsable
 *  as it fills with seasons and variants.
 *  Bump the count when you add one. (No globbing from the browser, so the
 *  sandbox has to be told how many exist.) */
const SCENE_COUNT: Record<Season, number> = { spring: 1, summer: 1, autumn: 1, winter: 1 };
const sceneUrl = (season: Season, n: number) => `/images/foraging/scenes/${season}${n}.png`;
const maskUrl = (season: Season, n: number) => `/images/foraging/scenes/${season}${n}_mask.png`;

interface BasketEntry { plantId: string; }

export default function ForagingDev() {
  const [season, setSeason] = createSignal<Season>("autumn");
  const [stock, setStock] = createSignal<WoodsStock>(fullStock("autumn"));
  const [seed, setSeed] = createSignal(1);
  const [basket, setBasket] = createSignal<BasketEntry[]>([]);
  const [picked, setPicked] = createSignal<Set<string>>(new Set<string>());
  const [hovered, setHovered] = createSignal<string | null>(null);
  const [resolved, setResolved] = createSignal(false);
  const [artFailed, setArtFailed] = createSignal(false);

  const [sceneNo, setSceneNo] = createSignal(1);
  const [showMask, setShowMask] = createSignal(false);

  // The mask is optional: no file means no sampler, and the whole frame stays
  // fair game. That keeps masks an enhancement rather than a prerequisite.
  const [mask] = createResource(
    () => ({ season: season(), n: sceneNo() }),
    (k) => loadTerrainMask(maskUrl(k.season, k.n)),
  );

  // The scene is generated ONCE per walk, from a snapshot of the wood taken as
  // you step in. It must NOT read live stock: picking one plant would rebuild
  // the layout and send every other plant jumping to a new spot.
  const [walkStock, setWalkStock] = createSignal<WoodsStock>(fullStock("autumn"));
  const scene = createMemo(() =>
    buildScene(walkStock(), season(), seed(), { terrainAt: mask() ?? undefined }));
  const visible = () => scene().filter((p) => !picked().has(p.key));
  const full = () => basket().length >= BASKET_SIZE;

  const setSeasonTo = (s: Season) => {
    setSeason(s); setStock(fullStock(s)); setWalkStock(fullStock(s)); setSeed(seed() + 1);
    setBasket([]); setPicked(new Set<string>()); setResolved(false); setArtFailed(false);
  };

  const pickPlant = (key: string, plantId: string) => {
    if (full() || resolved()) return;
    setPicked(new Set<string>([...picked(), key]));
    setStock(pick(stock(), plantId));
    setBasket([...basket(), { plantId }]);
  };

  /** Walking out and back: the scene relays from current stock, so a wood you
   *  stripped is visibly thin until it grows back. */
  const walkAgain = () => {
    // Re-enter: the wood is laid out afresh from whatever is left standing, so a
    // patch you stripped is visibly thin until it has grown back.
    setWalkStock(stock());
    setSeed(seed() + 1); setPicked(new Set<string>()); setBasket([]); setResolved(false);
  };
  const passTime = (hours: number) => {
    const grown = regrow(stock(), season(), hours);
    setStock(grown); setWalkStock(grown); setSeed(seed() + 1); setPicked(new Set<string>());
  };

  const kept = () => basket().filter((b) => getForagePlant(b.plantId)?.yields);
  const binned = () => basket().filter((b) => !getForagePlant(b.plantId)?.yields);

  const BTN = { background: "var(--bg-card)", border: "1px solid var(--border-color)", "border-radius": "3px",
    color: "var(--text-primary)", padding: "4px 10px", cursor: "pointer", "font-size": "0.8rem" } as const;

  return (
    <div style={{ padding: "24px", "max-width": "1200px", margin: "0 auto", color: "var(--text-primary)",
      "font-family": "var(--font-body)", background: "var(--bg-primary)", "min-height": "100vh" }}>
      <h1 style={{ "font-family": "var(--font-heading)", "margin-bottom": "4px" }}>Foraging sandbox</h1>
      <p style={{ color: "var(--text-muted)", "font-size": "0.85rem", "margin-bottom": "16px" }}>
        Hover to look closer. Click to pick. Nothing here is ever labelled in the scene, so you have
        to actually recognise it. Nothing bad happens if you get it wrong.
      </p>

      {/* ── Controls ── */}
      <div style={{ display: "flex", "flex-wrap": "wrap", gap: "8px", "align-items": "center", "margin-bottom": "16px" }}>
        <For each={SEASONS}>
          {(s) => (
            <button style={{ ...BTN, border: `1px solid ${season() === s ? "var(--accent-gold)" : "var(--border-color)"}` }}
              onClick={() => setSeasonTo(s)}>{s}</button>
          )}
        </For>
        <span style={{ width: "12px" }} />
        <button style={BTN} onClick={walkAgain}>Walk in again</button>
        <button style={BTN} onClick={() => passTime(6)}>+6h regrowth</button>
        <button style={BTN} onClick={() => passTime(24)}>+24h</button>
        <button style={BTN} onClick={() => { setStock(fullStock(season())); setWalkStock(fullStock(season())); setSeed(seed() + 1); setPicked(new Set<string>()); }}>Reset the woods</button>
        <span style={{ width: "12px" }} />
        <Show when={SCENE_COUNT[season()] > 1}>
          <For each={Array.from({ length: SCENE_COUNT[season()] }, (_, i) => i + 1)}>
            {(n) => (
              <button style={{ ...BTN, border: `1px solid ${sceneNo() === n ? "var(--accent-gold)" : "var(--border-color)"}` }}
                onClick={() => { setSceneNo(n); setArtFailed(false); walkAgain(); }}>#{n}</button>
            )}
          </For>
        </Show>
        <button style={{ ...BTN, border: `1px solid ${showMask() ? "var(--accent-gold)" : "var(--border-color)"}` }}
          onClick={() => setShowMask(!showMask())}
          title="See the painted terrain mask over the scene, for authoring">
          {mask() ? "mask" : "no mask"}
        </button>
      </div>

      <div style={{ display: "flex", gap: "20px", "flex-wrap": "wrap", "align-items": "flex-start" }}>
        {/* ── The wood ── */}
        <div style={{ flex: "1 1 520px", "max-width": "680px" }}>
          <div style={{ position: "relative", width: "100%", "aspect-ratio": "1 / 1",
            "border-radius": "3px", overflow: "hidden", border: "1px solid var(--border-color)",
            background: artFailed() ? "linear-gradient(160deg,#2b2a20,#171814)" : "transparent" }}>
            <Show when={!artFailed()}>
              <img src={sceneUrl(season(), sceneNo())} alt="" onError={() => setArtFailed(true)}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", "object-fit": "cover" }} />
            </Show>
            <Show when={artFailed()}>
              <div style={{ position: "absolute", inset: 0, display: "flex", "align-items": "center", "justify-content": "center",
                color: "var(--text-muted)", "font-size": "0.8rem", "text-align": "center", padding: "20px" }}>
                Drop a painting at <code>public{sceneUrl(season(), sceneNo())}</code>
              </div>
            </Show>

            {/* Authoring aid: the mask laid over the painting, so you can see
                where things are allowed to grow. Never shown to a player. */}
            <Show when={showMask() && mask()}>
              <img src={maskUrl(season(), sceneNo())} alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
                  "object-fit": "cover", opacity: 0.45, "pointer-events": "none", "z-index": 2 }} />
            </Show>

            <For each={visible()}>
              {(p) => {
                const plant = getForagePlant(p.plantId)!;
                const isHot = () => hovered() === p.key;
                const hasArt = (plant.artVariants ?? 0) > 0;
                return (
                  <button
                    onMouseEnter={() => setHovered(p.key)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => pickPlant(p.key, p.plantId)}
                    /* No title, no aria-label, no name anywhere: identifying it
                       is the entire mechanic. */
                    style={{
                      position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
                      // Anchored near the base, so a plant stands ON the spot
                      // rather than hovering centred over it.
                      transform: `translate(-50%,-88%) scale(${isHot() ? 1.7 : 1}) rotate(${p.rotate}deg)`,
                      "transform-origin": "50% 88%",
                      transition: "transform 130ms ease-out",
                      background: "transparent", border: "none", padding: 0,
                      cursor: full() ? "not-allowed" : "pointer",
                      // Painted sprites size by height against the scene box;
                      // the emoji placeholders keep a font size instead.
                      ...(hasArt ? { height: `${SPRITE_H * p.scale}%`, width: "auto" } : { "font-size": `${1.9 * p.scale}rem`, "line-height": 1 }),
                      filter: isHot() ? "drop-shadow(0 0 10px rgba(245,197,66,0.85))" : "drop-shadow(0 3px 4px rgba(0,0,0,0.55))",
                      "z-index": isHot() ? 3 : 1,
                    }}>
                    <Show when={hasArt} fallback={<span>{plant.icon}</span>}>
                      <img src={spriteUrl(p.plantId, p.variant)} alt=""
                        style={{ height: "100%", width: "auto", display: "block",
                          "user-select": "none", "-webkit-user-drag": "none" }} />
                    </Show>
                  </button>
                );
              }}
            </For>
          </div>
          <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-top": "6px" }}>
            {visible().length} growing here · basket {basket().length}/{BASKET_SIZE}
            {full() ? " · full, head home" : ""}
          </div>
          <Show when={showMask()}>
            <div style={{ display: "flex", gap: "12px", "font-size": "0.72rem", color: "var(--text-muted)", "margin-top": "4px" }}>
              <span>paint the mask in three colours:</span>
              <For each={Object.entries(TERRAIN_SWATCH)}>
                {([id, colour]) => (
                  <span style={{ display: "inline-flex", "align-items": "center", gap: "4px" }}>
                    <span style={{ width: "10px", height: "10px", background: colour, "border-radius": "2px" }} />{id}
                  </span>
                )}
              </For>
              <span>· black or transparent blocks</span>
            </div>
          </Show>
        </div>

        {/* ── Basket + what the woods hold ── */}
        <div style={{ flex: "1 1 320px", "max-width": "420px" }}>
          <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px" }}>Basket</h3>
          <Show when={basket().length > 0} fallback={
            <div style={{ "font-size": "0.8rem", "font-style": "italic", color: "var(--text-muted)" }}>Empty.</div>
          }>
            <Show when={!resolved()} fallback={
              <div>
                <div style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-bottom": "8px" }}>
                  Edda goes through the basket:
                </div>
                <For each={basket()}>
                  {(b) => {
                    const plant = getForagePlant(b.plantId)!;
                    const good = !!plant.yields;
                    return (
                      <div style={{ padding: "6px 8px", "margin-bottom": "6px", "border-radius": "3px",
                        background: "var(--bg-card)",
                        "border-left": `3px solid ${good ? "var(--accent-green)" : "var(--accent-red)"}` }}>
                        <div style={{ "font-size": "0.8rem", "font-weight": 600 }}>{plant.icon} {plant.name}</div>
                        <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "line-height": 1.35 }}>{plant.note}</div>
                      </div>
                    );
                  }}
                </For>
                <div style={{ "font-size": "0.78rem", color: "var(--text-secondary)", "margin-top": "8px" }}>
                  Kept {kept().length} · binned {binned().length}
                </div>
              </div>
            }>
              <div style={{ display: "flex", "flex-wrap": "wrap", gap: "6px", "margin-bottom": "10px" }}>
                <For each={basket()}>
                  {() => (
                    <span style={{ width: "34px", height: "34px", "border-radius": "3px", border: "1px solid var(--border-color)",
                      background: "rgba(0,0,0,0.3)", display: "flex", "align-items": "center", "justify-content": "center", "font-size": "1.1rem" }}>
                      {/* Face-down until Edda looks: you don't know what you got
                          until someone who can tell has been through it. */}
                      🧺
                    </span>
                  )}
                </For>
              </div>
              <button style={{ ...BTN, border: "1px solid var(--accent-gold)" }} onClick={() => setResolved(true)}>
                Head home and show Edda
              </button>
            </Show>
          </Show>

          <h3 style={{ "font-family": "var(--font-heading)", margin: "18px 0 8px" }}>What the woods hold</h3>
          <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "margin-bottom": "6px" }}>
            Tuning view only. The player never sees this.
          </div>
          <For each={FORAGE_PLANTS.filter((p) => seasonCap(p.id, season()) > 0)}>
            {(p) => {
              const have = () => stock()[p.id] ?? 0;
              const cap = () => seasonCap(p.id, season());
              return (
                <div style={{ display: "flex", "align-items": "center", gap: "8px", "font-size": "0.74rem", padding: "2px 0" }}>
                  <span style={{ width: "1.4em" }}>{p.icon}</span>
                  <span style={{ flex: 1, color: p.yields ? "var(--text-primary)" : "var(--accent-red)" }}>
                    {p.name}{p.yields ? "" : " (decoy)"}
                  </span>
                  <span style={{ width: "90px", height: "6px", background: "rgba(0,0,0,0.4)", "border-radius": "2px", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${cap() ? (have() / cap()) * 100 : 0}%`,
                      background: "var(--accent-green)" }} />
                  </span>
                  <span style={{ width: "56px", "text-align": "right", color: "var(--text-muted)" }}>
                    {have().toFixed(1)}/{cap()}
                  </span>
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}
