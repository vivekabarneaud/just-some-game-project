import { For, Show } from "solid-js";
import { getEnemy } from "@medieval-realm/shared/data/enemies";
import MissionEnemyCard from "~/components/MissionEnemyCard";
import { CardFrame } from "~/components/CardFrame";

/**
 * TEMPORARY dev-only page for eyeballing the enemy-card frames (esp. the boss
 * flourish placement) and prototyping the Main Story panel frame tints, at a
 * large size. Reachable at /dev-frames. Not linked in the sidebar — delete this
 * page + its route once the frames are tuned.
 */

const SIZES = [140, 240, 340];
// A boss (journeyman boss frame) and a plain tier-3 rare, side by side.
const IDS = ["captain_hale_stub", "wailing_phantom", "aether_wraith"];

// Candidate CSS filters for tinting a base frame PNG (no repaint needed). The
// exact values depend on the base art's hue, so these are starting points to
// compare by eye — pick one (or tell me "more gold / less" and I'll nudge).
const GOLD_TINTS: { label: string; filter: string }[] = [
  { label: "gold A (warm)", filter: "sepia(0.45) saturate(1.5) hue-rotate(-8deg) brightness(1.05)" },
  { label: "gold B (rich)", filter: "sepia(0.65) saturate(1.9) hue-rotate(-12deg)" },
  { label: "gold C (subtle)", filter: "saturate(1.5) brightness(1.08) hue-rotate(-4deg)" },
];
const SILVER_TINTS: { label: string; filter: string }[] = [
  { label: "silver A", filter: "grayscale(0.6) brightness(1.15)" },
  { label: "silver B", filter: "saturate(0.25) brightness(1.1)" },
  { label: "silver C (cool)", filter: "grayscale(0.85) contrast(1.05) brightness(1.12)" },
];

/** One wide sample box wearing a (optionally filtered) frame — mimics how the
 *  full-width Main Story panel would read. Filter is applied to the frame layer
 *  only, so the label text stays untinted. */
function TintSample(props: { label: string; rarity: string; filter?: string }) {
  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "6px" }}>
      <div style={{ "font-size": "0.75rem", color: "var(--text-muted)" }}>{props.label}</div>
      <div style={{ position: "relative", width: "420px", height: "100px", background: "var(--bg-secondary)" }}>
        <div style={{ position: "absolute", inset: "0", filter: props.filter ?? "none", "pointer-events": "none" }}>
          <CardFrame rarity={props.rarity} border={16} ornamentRarity="common" />
        </div>
        <div style={{
          position: "absolute", inset: "0", display: "flex", "align-items": "center", "justify-content": "center",
          "font-family": "var(--font-heading)", "font-size": "1.1rem", color: "var(--text-primary)",
        }}>
          The Main Story
        </div>
      </div>
    </div>
  );
}

export default function FramePreview() {
  return (
    <div style={{ padding: "24px", display: "flex", "flex-direction": "column", gap: "32px" }}>
      <h1 style={{ "font-family": "var(--font-heading)", color: "var(--text-primary)" }}>
        Frame preview (dev)
      </h1>

      {/* ── Main Story panel frame tints ─────────────────────────── */}
      <div>
        <h2 style={{ "font-family": "var(--font-heading)", color: "var(--text-primary)", "font-size": "1.1rem" }}>
          Main Story panel frame — tint candidates
        </h2>
        <div style={{ display: "flex", "flex-wrap": "wrap", gap: "24px", "margin-top": "12px" }}>
          <TintSample label="base — common (reference)" rarity="common" />
          <TintSample label="base — uncommon (untinted)" rarity="uncommon" />
          <For each={GOLD_TINTS}>
            {(t) => <TintSample label={`uncommon → ${t.label}`} rarity="uncommon" filter={t.filter} />}
          </For>
          <For each={SILVER_TINTS}>
            {(t) => <TintSample label={`uncommon → ${t.label}`} rarity="uncommon" filter={t.filter} />}
          </For>
        </div>
      </div>

      {/* ── Enemy card frames ────────────────────────────────────── */}
      <h2 style={{ "font-family": "var(--font-heading)", color: "var(--text-primary)", "font-size": "1.1rem" }}>
        Enemy frames
      </h2>
      <For each={SIZES}>
        {(w) => (
          <div>
            <div style={{ color: "var(--text-muted)", "margin-bottom": "10px", "font-size": "0.85rem" }}>
              --assembly-card-width: {w}px
            </div>
            <div style={{ display: "flex", gap: "24px", "align-items": "flex-start", "flex-wrap": "wrap" }}>
              <For each={IDS}>
                {(id) => {
                  const enemy = getEnemy(id);
                  return (
                    <Show when={enemy} fallback={<div style={{ color: "var(--accent-red)" }}>missing: {id}</div>}>
                      <div style={{ "--assembly-card-width": `${w}px` } as any}>
                        <MissionEnemyCard enemy={enemy!} count={1} reveal="full" />
                      </div>
                    </Show>
                  );
                }}
              </For>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
