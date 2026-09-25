import { For, Show, createSignal, createMemo, type JSX } from "solid-js";
import { playSound } from "~/engine/sounds";

/**
 * The painted open book: a cut-out PNG with content inset into its two pages.
 *
 * The recipe book on the alchemy desk and the cookbook in the kitchen are the
 * same construction, written out twice (AlchemyDesk.tsx / KitchenDesk.tsx). The
 * herbier is the third thing that wants it, which is the point at which it stops
 * being a duplicate and becomes a component. The two desks are NOT converted
 * here on purpose — they work, and re-laying-out two live screens is not
 * something to do blind. That is a follow-up for when it can be looked at.
 *
 * `perPage` is per SPREAD, not per page: the grid is two columns with the gap
 * clearing the spine, so 6 reads as 3 down each side and 2 reads as one entry
 * filling each page.
 */
const BOOK_ART = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/kitchen/cookbook.png";

const PAGE_BTN = {
  background: "rgba(42,32,18,0.08)", border: "1px solid #2a2012", "border-radius": "2px",
  color: "#2a2012", padding: "2px 12px", cursor: "pointer", "font-size": "0.9rem",
} as const;

export default function PaintedBook<T>(props: {
  items: readonly T[];
  /** How to draw one entry. An explicit prop rather than a render-prop child:
   *  the children form works, but it leans on how Solid's compiler treats a
   *  function child, and this is plainer to read and impossible to get wrong. */
  render: (item: T) => JSX.Element;
  /** Entries per SPREAD. 6 = three down each page; 2 = one to a page. */
  perPage?: number;
  art?: string;
  empty?: JSX.Element;
  /** Flex basis for the book in its row. Matches the desks' recipe book by default. */
  flex?: string;
  maxWidth?: string;
}) {
  const [page, setPage] = createSignal(0);
  const per = () => props.perPage ?? 6;
  const pageCount = createMemo(() => Math.max(1, Math.ceil(props.items.length / per())));
  // Clamp rather than reset: entries arrive while the book is open (a brew fills
  // a line), and snapping the reader back to page one for that would be rude.
  const current = createMemo(() => Math.min(page(), pageCount() - 1));
  const pageItems = createMemo(() => props.items.slice(current() * per(), current() * per() + per()));
  const turn = (to: number) => { setPage(Math.max(0, Math.min(pageCount() - 1, to))); playSound("page_turn"); };

  return (
    <div class="parchment-panel cookbook-book"
      style={{ position: "relative", flex: props.flex ?? "1.4 1 460px", "max-width": props.maxWidth ?? "720px", "aspect-ratio": "1095 / 740", "align-self": "flex-start" }}>
      <img src={props.art ?? BOOK_ART} alt="" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%", "object-fit": "contain",
        "user-select": "none", "pointer-events": "none",
        filter: "drop-shadow(0 20px 26px rgba(0,0,0,0.78)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
      }} />
      {/* Inset to the painted page area. These four numbers are tuned to the art. */}
      <div style={{ position: "absolute", left: "11%", right: "11%", top: "6%", bottom: "7%", display: "flex", "flex-direction": "column", "min-height": 0 }}>
        <Show when={props.items.length > 0} fallback={
          <div style={{ "font-size": "0.8rem", "font-style": "italic", opacity: 0.7, "text-align": "center", margin: "auto" }}>
            {props.empty ?? "Nothing written here yet."}
          </div>
        }>
          {/* One grid column per page; the column gap is the spine. */}
          <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", "column-gap": "11%", "row-gap": "8px", "flex": "1 1 auto", "min-height": 0, "align-content": "start" }}>
            <For each={pageItems()}>{(item) => props.render(item)}</For>
          </div>
          <Show when={pageCount() > 1}>
            <div style={{ display: "flex", "align-items": "center", "justify-content": "center", gap: "14px", "margin-top": "14px", color: "#2a2012" }}>
              <button style={PAGE_BTN} disabled={current() === 0} onClick={() => turn(current() - 1)}>‹ Prev</button>
              <span style={{ "font-size": "0.82rem", "font-weight": 600 }}>{current() + 1} / {pageCount()}</span>
              <button style={PAGE_BTN} disabled={current() >= pageCount() - 1} onClick={() => turn(current() + 1)}>Next ›</button>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
}
