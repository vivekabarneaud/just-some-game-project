import { For, Show, createMemo, createSignal } from "solid-js";
import { useGame } from "~/engine/gameState";
import { INGREDIENTS } from "@medieval-realm/shared/data/alchemy/ingredients";
import { buildPage, triedKey, HERBIER_LAWS, type HerbierPage } from "@medieval-realm/shared/data/herbier/alchemyPage";
import { LIVE_TECHNIQUES, type Ingredient, type Technique } from "@medieval-realm/shared/data/alchemy/types";
import PaintedBook from "./PaintedBook";

/**
 * The Herbier — the Lord's own book of plants.
 *
 * Edda has the knowledge, but she is the midwife AND works the forager's hut, so
 * she has no time to be anyone's tooltip. He brings her the basket, she tells him
 * what he nearly ate, and he writes his own book: a page is drawn the day a plant
 * is in hand, and a line is added each time he actually tries something.
 *
 * The page lists ONLY what he has tried. That is what keeps the book honest while
 * five of the seven techniques have no station — it never shows a treatment he
 * cannot perform, and it simply grows when the lab does.
 *
 * Front matter first: the laws of the craft, which are about how a MIXTURE
 * behaves rather than what one plant does. Knowing mugwort is a hero is worthless
 * until you know a hero wants a base, so the law is the thing worth discovering,
 * and it is learned by feeling it go wrong.
 */

const INK = "#2a2012";
const FADED = "rgba(42,32,18,0.62)";

const VERB: Record<Technique, string> = {
  crush: "Crushed", boil: "Boiled", steep: "Steeped",
  distil: "Distilled", dry: "Dried", char: "Charred", ferment: "Fermented",
};

const ROLE_WORD: Record<string, string> = {
  base: "a base", hero: "a hero", catalyst: "a catalyst",
  toxin: "a poison", wildcard: "a wildcard",
};

type Entry = { kind: "law"; id: string; title: string; text: string } | { kind: "plant"; page: HerbierPage };

/** His drawing of the plant, when he has made one. Falls back to the shelf glyph,
 *  so the book works from the first day and the drawings arrive one at a time. */
function Drawing(props: { ing: Ingredient }) {
  const [failed, setFailed] = createSignal(false);
  return (
    <div style={{ height: "84px", display: "flex", "align-items": "center", "justify-content": "center", margin: "2px 0 6px" }}>
      <Show when={!failed()} fallback={<span style={{ "font-size": "2.6rem", opacity: 0.75 }}>{props.ing.icon}</span>}>
        <img src={`/images/herbier/${props.ing.id}.png`} alt="" onError={() => setFailed(true)}
          style={{ "max-height": "84px", "max-width": "100%", "object-fit": "contain", "mix-blend-mode": "multiply" }} />
      </Show>
    </div>
  );
}

export default function HerbierBook() {
  const { state } = useGame();
  const tried = createMemo(() => new Set(state.herbierTried ?? []));
  const knownLaws = createMemo(() => new Set(state.herbierLaws ?? []));
  const knownRecipes = createMemo(() => new Set(Object.keys(state.alchemyRecipes ?? {})));

  const entries = createMemo<Entry[]>(() => {
    const laws: Entry[] = HERBIER_LAWS
      .filter((l) => knownLaws().has(l.id))
      .map((l) => ({ kind: "law" as const, id: l.id, title: l.title, text: l.text }));
    const drawn = new Set(state.herbierPages ?? []);
    const plants: Entry[] = INGREDIENTS
      .filter((ing) => drawn.has(ing.id))
      .map((ing) => ({ kind: "plant" as const, page: buildPage(ing, tried(), knownRecipes()) }));
    return [...laws, ...plants];
  });

  const pagesDrawn = () => (state.herbierPages ?? []).length;

  return (
    <div style={{ margin: "0 0 24px", display: "flex", gap: "20px", "flex-wrap": "wrap", "align-items": "flex-start" }}>
      <PaintedBook items={entries()} perPage={2} flex="1.4 1 460px"
        empty={<>The book is blank. Bring something back from the woods and he will start drawing.</>}
        render={(entry) => (
          <Show when={entry.kind === "plant" ? entry.page : null} fallback={
            /* ── Front matter: a law of the craft ── */
            <div style={{ color: INK, "font-size": "0.72rem", "line-height": 1.45, padding: "2px 2px 0" }}>
              <div style={{ "font-family": "var(--font-heading)", "font-size": "0.95rem", "font-weight": 700, "margin-bottom": "6px" }}>
                {entry.kind === "law" ? entry.title : ""}
              </div>
              <div style={{ "font-style": "italic" }}>{entry.kind === "law" ? entry.text : ""}</div>
            </div>
          }>
            {(page) => {
              const ing = () => page().ingredient;
              return (
                <div style={{ color: INK, padding: "2px 2px 0", display: "flex", "flex-direction": "column", "min-height": 0 }}>
                  {/* Name, and the shelf Edda put it on. The role is not a secret:
                      it is the grammar of a mixture, and useless without its law. */}
                  <div style={{ display: "flex", "align-items": "baseline", "justify-content": "space-between", gap: "6px" }}>
                    <span style={{ "font-family": "var(--font-heading)", "font-size": "0.95rem", "font-weight": 700 }}>{ing().name}</span>
                    <span style={{ "font-size": "0.62rem", "font-style": "italic", color: FADED, "white-space": "nowrap" }}>
                      {ROLE_WORD[ing().role] ?? ing().role}
                    </span>
                  </div>

                  <Drawing ing={ing()} />

                  {/* Edda's line, in her voice, under the drawing. */}
                  <Show when={ing().note}>
                    <div style={{ "font-size": "0.66rem", "font-style": "italic", color: FADED, "line-height": 1.35, "margin-bottom": "8px", "border-bottom": `1px solid rgba(42,32,18,0.18)`, "padding-bottom": "6px" }}>
                      {ing().note}
                    </div>
                  </Show>

                  {/* What he has actually tried. Nothing else. */}
                  <Show when={page().lines.length > 0} fallback={
                    <div style={{ "font-size": "0.66rem", "font-style": "italic", color: FADED }}>
                      He has not tried anything with it yet.
                    </div>
                  }>
                    <div style={{ display: "flex", "flex-direction": "column", gap: "3px" }}>
                      <For each={page().lines}>
                        {(line) => (
                          <div style={{ "font-size": "0.66rem", "line-height": 1.35, opacity: line.barren ? 0.62 : 1 }}>
                            <span style={{ "font-weight": 700 }}>{VERB[line.technique]}:</span>{" "}
                            <span style={{ "font-style": line.barren ? "italic" : "normal" }}>{line.label}</span>
                            <Show when={line.detail}>
                              <span style={{ color: FADED }}> — {line.detail}</span>
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>

                  {/* What it has been part of. The engine has no plant-to-plant
                      synergy, so this points at the recipe book rather than
                      implying a pairing mechanic that does not exist. */}
                  <Show when={page().recipes.length > 0}>
                    <div style={{ "margin-top": "8px", "font-size": "0.64rem", color: FADED, "line-height": 1.35 }}>
                      Used in: {page().recipes.map((r) => r.name).join(", ")}.
                    </div>
                  </Show>

                  {/* The conclusion of a finished page. Withheld until every live
                      technique has been tried, which needs a lab he does not have
                      yet, which is exactly why it is worth having. */}
                  <Show when={page().complete && page().signature}>
                    <div style={{ "margin-top": "8px", "padding-top": "6px", "border-top": `1px solid rgba(42,32,18,0.18)`, "font-size": "0.68rem", "font-weight": 700 }}>
                      ⭐ Its proper preparation: {VERB[page().signature!].toLowerCase()}.
                    </div>
                  </Show>
                </div>
              );
            }}
          </Show>
        )}
      />

      {/* A quiet marker of how far the book has got. */}
      <div style={{ flex: "1 1 240px", "align-self": "flex-start", padding: "10px 12px", background: "rgba(30,30,50,0.85)", "backdrop-filter": "blur(4px)", "border-radius": "6px", "font-size": "0.78rem", color: "var(--text-muted)", "line-height": 1.5 }}>
        <div style={{ "font-family": "var(--font-heading)", color: "var(--text-primary)", "margin-bottom": "6px" }}>📖 The Herbier</div>
        <div>{pagesDrawn()} of {INGREDIENTS.length} plants drawn.</div>
        <div>{tried().size} of {INGREDIENTS.length * LIVE_TECHNIQUES.length} preparations tried.</div>
        <Show when={knownLaws().size > 0}>
          <div>{knownLaws().size} of {HERBIER_LAWS.length} laws of the craft set down.</div>
        </Show>
        <div style={{ "margin-top": "8px", "font-style": "italic", opacity: 0.8 }}>
          Edda names what you bring her. What it is good for, you find out yourself.
        </div>
      </div>
    </div>
  );
}
