// ─── Unlock Card ───────────────────────────────────────────────
// Shared blue-frame card surfacing a freshly unlocked chronicle entry or
// character memory inside QuestClaimModal / LootModal. Clicking opens a
// preview modal with the full text.
//
// `image` is either a portrait URL (memory cards) or an emoji icon
// (chronicle-entry cards) so both shapes look like the same kind of thing.

import { Show } from "solid-js";

type CardImage =
  | { kind: "portrait"; src: string; alt: string }
  | { kind: "icon"; emoji: string };

interface Props {
  image: CardImage;
  label: string;
  title: string;
  teaser?: string;
  onClick: () => void;
  animationDelay: string;
}

export default function UnlockCard(props: Props) {
  return (
    <div
      class="loot-section unlock-card"
      onClick={props.onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); props.onClick(); } }}
      style={{
        "animation-delay": props.animationDelay,
        padding: "10px 14px",
        background: "rgba(96, 165, 250, 0.08)",
        border: "1px solid var(--accent-blue)",
        "border-radius": "6px",
        display: "flex",
        "align-items": "center",
        gap: "12px",
      }}
    >
      {props.image.kind === "portrait" ? (
        <img
          src={props.image.src}
          alt={props.image.alt}
          style={{
            width: "48px", height: "48px",
            "border-radius": "6px",
            "object-fit": "cover",
            "flex-shrink": "0",
            border: "1px solid rgba(96, 165, 250, 0.4)",
          }}
        />
      ) : (
        <div style={{
          width: "48px", height: "48px",
          "border-radius": "6px",
          background: "rgba(96, 165, 250, 0.15)",
          border: "1px solid rgba(96, 165, 250, 0.4)",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "font-size": "1.6rem",
          "flex-shrink": "0",
        }}>
          {props.image.emoji}
        </div>
      )}
      <div style={{ "min-width": "0", flex: "1" }}>
        <div class="section-label" style={{
          "font-size": "0.7rem",
          color: "var(--accent-blue)",
          "margin-bottom": "2px",
        }}>
          {props.label}
        </div>
        <div style={{
          "font-size": "0.95rem",
          color: "var(--text-primary)",
          "font-family": "var(--font-heading)",
        }}>
          {props.title}
        </div>
        <Show when={props.teaser}>
          <div style={{
            "font-size": "0.8rem",
            color: "var(--text-secondary)",
            "font-style": "italic",
            "line-height": "1.45",
            "margin-top": "4px",
            display: "-webkit-box",
            "-webkit-line-clamp": "2",
            "-webkit-box-orient": "vertical",
            overflow: "hidden",
          }}>
            {props.teaser}
          </div>
        </Show>
      </div>
    </div>
  );
}
