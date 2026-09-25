import { For, Show, createMemo, createSignal } from "solid-js";
import { useGame } from "~/engine/gameState";
import { herbierOrder, getHerbierPlant, type HerbierPlant, type HerbierGroup } from "@medieval-realm/shared/data/herbier/registry";
import { buildPage, triedKey } from "@medieval-realm/shared/data/herbier/alchemyPage";
import { LIVE_TECHNIQUES, type Technique } from "@medieval-realm/shared/data/alchemy/types";
import { describeCooked } from "@medieval-realm/shared/data/kitchen/cook";
import type { CookTechnique } from "@medieval-realm/shared/data/kitchen/types";
import FramedModal from "~/components/FramedModal";

/**
 * Chronicle → Herbier. The settlement's record of every plant it has met.
 *
 * The companion to the painted book under the alchemy desk: that one is the
 * working reference that fills as you brew, this is the complete collection.
 * The thing it does that the desk book cannot is the COMPARISON — a decoy sits
 * directly beside the plant it apes, with both tells, which is the whole point
 * of the foraging minigame and had nowhere to live until now.
 *
 * Undiscovered entries follow the bestiary exactly (ChronicleBestiary.tsx): a
 * dimmed card, a `?` where the drawing goes, and an italic muted `???`. Nothing
 * else is shown, so the card tells you a thing exists and not one word more.
 */

const GROUPS: { id: HerbierGroup; label: string; icon: string }[] = [
  { id: "mushroom", label: "Fungi", icon: "🍄" },
  { id: "green", label: "Greens and roots", icon: "🌿" },
  { id: "fruit", label: "Fruit", icon: "🫐" },
  { id: "herb", label: "Herbs", icon: "🌱" },
];

const VERB: Record<Technique, string> = {
  crush: "Crushed", boil: "Boiled", steep: "Steeped",
  distil: "Distilled", dry: "Dried", char: "Charred", ferment: "Fermented",
};
const COOK_VERB: Record<CookTechnique, string> = {
  boil: "Boiled", skewer: "Skewered", fry: "Fried",
  roast: "Roasted", chop: "Chopped raw", preserve: "Preserved",
};

/** His drawing, when he has made one; the shelf glyph until then. */
function Drawing(props: { plant: HerbierPlant; size: number }) {
  const [failed, setFailed] = createSignal(false);
  return (
    <Show when={!failed()} fallback={<span style={{ "font-size": `${props.size * 0.55}px` }}>{props.plant.icon}</span>}>
      <img src={`/images/herbier/${props.plant.id}.png`} alt="" loading="lazy" onError={() => setFailed(true)}
        style={{ "max-width": "100%", "max-height": `${props.size}px`, "object-fit": "contain" }} />
    </Show>
  );
}

export default function ChronicleHerbier() {
  const { state } = useGame();
  const seen = createMemo(() => new Set(state.herbierPages ?? []));
  const tried = createMemo(() => new Set(state.herbierTried ?? []));
  const cooked = createMemo(() => new Set(state.herbierCooked ?? []));
  const knownRecipes = createMemo(() => new Set(Object.keys(state.alchemyRecipes ?? {})));
  const [open, setOpen] = createSignal<HerbierPlant | null>(null);

  const plants = createMemo(() => herbierOrder());
  const isSeen = (p: HerbierPlant) => seen().has(p.id);
  const found = () => plants().filter(isSeen).length;

  /** What he has cooked with it, derived rather than authored: the kitchen's
   *  numbers are a product of the ingredient's stats and the technique's
   *  multipliers, so the "discovery" is the calculation, not hidden writing. */
  const cookLines = (p: HerbierPlant) => {
    const ing = p.kitchen;
    if (!ing) return [];
    return (ing.techniques ?? []).filter((t) => cooked().has(`${p.id}:${t}`)).map((t) => ({
      technique: t,
      text: describeCooked(ing, t),
    }));
  };

  const brewLines = (p: HerbierPlant) =>
    p.alchemy ? buildPage(p.alchemy, tried(), knownRecipes()).lines : [];

  return (
    <div>
      <div style={{ display: "flex", "align-items": "baseline", gap: "12px", "margin-bottom": "14px", "flex-wrap": "wrap" }}>
        <p style={{ color: "var(--text-muted)", "font-size": "0.85rem", margin: 0, "font-style": "italic", flex: "1 1 320px" }}>
          Edda names what you bring her. What it is good for, you find out yourself.
        </p>
        <span style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>{found()} of {plants().length} drawn</span>
      </div>

      <For each={GROUPS}>
        {(g) => {
          const inGroup = () => plants().filter((p) => p.group === g.id);
          return (
            <Show when={inGroup().length > 0}>
              <h2 style={{ "font-family": "var(--font-heading)", "font-size": "1rem", margin: "18px 0 10px", color: "var(--text-primary)" }}>
                {g.icon} {g.label}
                <span style={{ color: "var(--text-muted)", "font-size": "0.8rem", "font-weight": 400 }}>
                  {" "}· {inGroup().filter(isSeen).length}/{inGroup().length}
                </span>
              </h2>
              <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
                <For each={inGroup()}>
                  {(p) => (
                    <div class="building-card" classList={{ dimmed: !isSeen(p) }}
                      style={{ cursor: isSeen(p) ? "pointer" : "default", "text-align": "center" }}
                      onClick={() => { if (isSeen(p)) setOpen(p); }}>
                      <div style={{
                        height: "96px", display: "flex", "align-items": "center", "justify-content": "center",
                        background: "rgba(0,0,0,0.3)", "border-radius": "6px", overflow: "hidden",
                      }}>
                        <Show when={isSeen(p)} fallback={
                          <span style={{ "font-size": "2.4rem", color: "rgba(200,200,210,0.4)", "text-shadow": "0 0 8px rgba(0,0,0,0.7)" }}>?</span>
                        }>
                          <Drawing plant={p} size={92} />
                        </Show>
                      </div>
                      <div class="building-card-title" style={{
                        "margin-top": "8px", "font-size": "0.82rem",
                        "font-style": isSeen(p) ? "normal" : "italic",
                        color: isSeen(p) ? "var(--text-primary)" : "var(--text-muted)",
                        ...(isSeen(p) ? {} : { "letter-spacing": "0.15em" }),
                      }}>
                        {isSeen(p) ? p.name : "???"}
                      </div>
                      {/* A found plant that kills you says so on the card. The
                          warning is worth more than the surprise. */}
                      <Show when={isSeen(p) && p.forage && !p.forage.yields}>
                        <div style={{ "font-size": "0.66rem", color: "var(--accent-red)", "margin-top": "2px" }}>☠️ Not food</div>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          );
        }}
      </For>

      <Show when={open()}>
        {(p) => (
          <FramedModal title={p().name} icon={p().icon} onClose={() => setOpen(null)} maxWidth="640px"
            subtitle={[p().forage ? "Found in the woods" : null, p().alchemy ? "On the alchemy shelf" : null,
                       p().kitchen ? "In the larder" : null].filter(Boolean).join(" · ")}>
            <div style={{ display: "flex", "flex-direction": "column", gap: "14px" }}>
              <div style={{ display: "flex", "align-items": "center", "justify-content": "center", "min-height": "120px" }}>
                <Drawing plant={p()} size={160} />
              </div>

              <Show when={p().forage?.note}>
                <div style={{ "font-style": "italic", color: "var(--text-muted)", "font-size": "0.85rem", "line-height": 1.5 }}>
                  “{p().forage!.note}”
                  <span style={{ opacity: 0.7 }}> — Edda</span>
                </div>
              </Show>

              {/* ── The comparison. The reason this tab exists. ── */}
              <Show when={[...(p().mimickedBy), ...(p().mimicOf ? [p().mimicOf!] : [])].length > 0}>
                <div style={{ "border-top": "1px solid var(--border-color)", "padding-top": "12px" }}>
                  <div style={{ "font-family": "var(--font-heading)", "font-size": "0.9rem", "margin-bottom": "8px" }}>
                    ⚠️ Telling them apart
                  </div>
                  <For each={[...(p().mimickedBy), ...(p().mimicOf ? [p().mimicOf!] : [])]}>
                    {(otherId) => {
                      const other = () => getHerbierPlant(otherId);
                      return (
                        <Show when={other() && seen().has(otherId)} fallback={
                          <div style={{ "font-size": "0.8rem", "font-style": "italic", color: "var(--text-muted)" }}>
                            Something in these woods wears this one's face. He has not met it yet.
                          </div>
                        }>
                          <div style={{ display: "flex", gap: "12px", "align-items": "flex-start", "margin-bottom": "10px" }}>
                            <div style={{ flex: "0 0 96px", height: "96px", display: "flex", "align-items": "center", "justify-content": "center", background: "rgba(0,0,0,0.3)", "border-radius": "6px" }}>
                              <Drawing plant={other()!} size={92} />
                            </div>
                            <div style={{ flex: "1 1 auto", "font-size": "0.8rem", "line-height": 1.45 }}>
                              <div style={{ "font-weight": 600, "margin-bottom": "3px" }}>
                                {other()!.name}
                                <Show when={!other()!.forage?.yields}>
                                  <span style={{ color: "var(--accent-red)" }}> ☠️</span>
                                </Show>
                              </div>
                              <div style={{ color: "var(--text-muted)", "font-style": "italic" }}>{other()!.forage?.note}</div>
                            </div>
                          </div>
                        </Show>
                      );
                    }}
                  </For>
                </div>
              </Show>

              {/* ── What he has found it good for, each line earned. ── */}
              <Show when={p().alchemy}>
                <div style={{ "border-top": "1px solid var(--border-color)", "padding-top": "12px" }}>
                  <div style={{ "font-family": "var(--font-heading)", "font-size": "0.9rem", "margin-bottom": "6px" }}>🧪 On the bench</div>
                  <Show when={brewLines(p()).length > 0} fallback={
                    <div style={{ "font-size": "0.8rem", "font-style": "italic", color: "var(--text-muted)" }}>He has not brewed with it yet.</div>
                  }>
                    <For each={brewLines(p())}>
                      {(line) => (
                        <div style={{ "font-size": "0.8rem", "line-height": 1.45, opacity: line.barren ? 0.65 : 1 }}>
                          <span style={{ "font-weight": 600 }}>{VERB[line.technique]}:</span>{" "}
                          <span style={{ "font-style": line.barren ? "italic" : "normal" }}>{line.label}</span>
                          <Show when={line.detail}><span style={{ color: "var(--text-muted)" }}> — {line.detail}</span></Show>
                        </div>
                      )}
                    </For>
                  </Show>
                  <Show when={!LIVE_TECHNIQUES.every((t) => tried().has(triedKey(p().alchemy!.id, t)))}>
                    <div style={{ "font-size": "0.72rem", "font-style": "italic", color: "var(--text-muted)", "margin-top": "4px" }}>
                      Its proper preparation is still to be worked out.
                    </div>
                  </Show>
                </div>
              </Show>

              <Show when={p().kitchen}>
                <div style={{ "border-top": "1px solid var(--border-color)", "padding-top": "12px" }}>
                  <div style={{ "font-family": "var(--font-heading)", "font-size": "0.9rem", "margin-bottom": "6px" }}>🍲 In the pot</div>
                  <Show when={cookLines(p()).length > 0} fallback={
                    <div style={{ "font-size": "0.8rem", "font-style": "italic", color: "var(--text-muted)" }}>He has not cooked with it yet.</div>
                  }>
                    <For each={cookLines(p())}>
                      {(line) => (
                        <div style={{ "font-size": "0.8rem", "line-height": 1.45 }}>
                          <span style={{ "font-weight": 600 }}>{COOK_VERB[line.technique]}:</span> {line.text}
                        </div>
                      )}
                    </For>
                  </Show>
                </div>
              </Show>
            </div>
          </FramedModal>
        )}
      </Show>
    </div>
  );
}
