import { Show, createSignal, createEffect, onMount, onCleanup, type JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { CardFrame } from "~/components/CardFrame";

/**
 * The shared framed modal shell — a gold ornament frame drawn as an overlay over
 * an edge-to-edge image banner + scrollable body. Matches the building modal's
 * look so every "detail" modal (buildings, pens, …) reads as one world. Closes on
 * the ✕, outside click, or Escape, with a soft scale/fade.
 */
export default function FramedModal(props: {
  image?: string;
  icon?: string;
  title: string;
  subtitle?: JSX.Element;
  onClose: () => void;
  maxWidth?: string;
  children: JSX.Element;
}) {
  const [exiting, setExiting] = createSignal(false);
  const close = () => { setExiting(true); setTimeout(() => props.onClose(), 180); };
  // Only fade the bottom edge when the content actually scrolls (a plain modal
  // that fits has nothing being cut off, so it doesn't need the fade).
  let scrollEl: HTMLDivElement | undefined;
  const [scrollable, setScrollable] = createSignal(false);
  onMount(() => {
    const check = () => setScrollable(!!scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 2);
    check();
    const ro = new ResizeObserver(check);
    if (scrollEl) ro.observe(scrollEl);
    onCleanup(() => ro.disconnect());
  });
  createEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    onCleanup(() => window.removeEventListener("keydown", handler));
  });

  return (
    <Portal>
      <div
        style={{ position: "fixed", inset: "0", background: "rgba(0,0,0,0.78)", "z-index": 1050, display: "flex", "align-items": "center", "justify-content": "center", padding: "24px", opacity: exiting() ? 0 : 1, transition: "opacity 0.18s ease" }}
        onClick={close}
      >
        <div
          style={{ position: "relative", "max-width": props.maxWidth ?? "640px", width: "100%", "box-shadow": "0 10px 40px rgba(0,0,0,0.6)", transform: exiting() ? "scale(0.98)" : "scale(1)", transition: "transform 0.18s ease" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Scrollable content — banner bleeds to the edges; the frame overlay
              (below) is drawn on top of it, never insetting the content. */}
          <div ref={scrollEl} style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", "max-height": "88vh", overflow: "auto" }}>
            <div style={{ position: "relative" }}>
              <Show when={props.image}>
                <div style={{ position: "relative", height: "128px", overflow: "hidden", "border-bottom": "1px solid var(--accent-gold)" }}>
                  <img src={props.image!} alt="" style={{ width: "100%", height: "100%", "object-fit": "cover" }} />
                  <div style={{ position: "absolute", inset: "0", background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.1))" }} />
                </div>
              </Show>
              <button
                onClick={close}
                title="Close"
                style={{ position: "absolute", top: "26px", right: "26px", background: "rgba(0,0,0,0.4)", border: "none", color: "var(--text-secondary)", "font-size": "1.2rem", cursor: "pointer", "line-height": 1, width: "28px", height: "28px", "border-radius": "0", "z-index": "6" }}
              >✕</button>
              <div style={{ display: "flex", "align-items": "center", gap: "12px", padding: "14px 28px", ...(props.image ? { position: "absolute", bottom: "0", left: "0", right: "0" } : {}) }}>
                <Show when={!props.image && props.icon}>
                  <div style={{ "font-size": "2rem" }}>{props.icon}</div>
                </Show>
                <div>
                  <div style={{ "font-family": "var(--font-heading)", "font-size": "1.3rem", color: "var(--text-primary)" }}>{props.title}</div>
                  <Show when={props.subtitle}>
                    <div style={{ color: "var(--text-secondary)", "font-size": "0.8rem" }}>{props.subtitle}</div>
                  </Show>
                </div>
              </div>
            </div>

            <div style={{ padding: "24px 32px 28px" }}>{props.children}</div>
          </div>

          {/* Gold ornament frame, drawn OVER the edges (banner bleeds underneath). */}
          <CardFrame rarity="uncommon" border={20} bottomFade={scrollable()} />
        </div>
      </div>
    </Portal>
  );
}
