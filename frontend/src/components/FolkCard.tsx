import { Show } from "solid-js";
import { getClassMeta, getOrigin, RACE_NAMES } from "@medieval-realm/shared/data/adventurers";
import { CardFrame } from "~/components/CardFrame";
import Portrait from "~/components/Portrait";
import { DOT_COLOR, type FolkPerson, type FolkStatus } from "~/data/folk";

/**
 * One card for one person, whoever they are.
 *
 * The card answers two questions and no more: who is this, and what about them
 * today. Everything else — the bars, the story, the gear, the talents — waits
 * in the popin. A grid of twenty people is for scanning, not for reading.
 *
 * The guild roster and the Chronicle cast drew the same card twice, with the
 * same classes (`building-card adv-card` inside `.recruit-grid`) and different
 * data. This is that card, once, over the normalised `FolkPerson`.
 *
 * THE ??? RULE, carried over from `ChronicleRecipes.tsx`: when `known` is false
 * the card shows that a person EXISTS and nothing more. No name, no story, no
 * class. A census must not spoil the people you have not met yet.
 */

/** A dot and a line. Two of these replace the role line, because "Midwife ·
 *  cellarer · keeper of the hearth" never changes and so says nothing about
 *  today. "Has a bad cut, 6h left" does. */
function Status(props: { status: FolkStatus }) {
  return (
    <div style={{
      display: "flex", "align-items": "center", gap: "6px",
      "font-size": "0.78rem", color: "var(--text-secondary)", "margin-top": "3px",
    }}>
      <span style={{
        flex: "0 0 auto", width: "8px", height: "8px", "border-radius": "50%",
        background: DOT_COLOR[props.status.dot],
        "box-shadow": props.status.dot === "idle" ? "none" : `0 0 5px ${DOT_COLOR[props.status.dot]}`,
      }} />
      <span>{props.status.text}</span>
    </div>
  );
}

export default function FolkCard(props: {
  person: FolkPerson;
  /** Left out for a card that only reports, like the Chronicle census. */
  onOpen?: (p: FolkPerson) => void;
}) {
  const p = () => props.person;
  const known = () => p().known !== false;
  const adv = () => p().adventurer;
  const away = () => (known() ? p().away : undefined);

  return (
    <div
      class="building-card adv-card"
      onClick={() => { if (known()) props.onOpen?.(p()); }}
      style={{
        position: "relative",
        width: "100%",
        cursor: known() && props.onOpen ? "pointer" : "default",
        opacity: away() ? 0.65 : 1,
        background: away() ? "var(--bg-secondary)" : "var(--bg-card)",
      }}
    >
      <Show when={known() && p().frame}>
        {(f) => <CardFrame rarity={f()} border={24} ornamentSize={28} ornamentInset={8} z={3} />}
      </Show>

      <Show when={known() && p().category}>
        {(c) => (
          <span class="building-card-category" style={{ color: c().color }}>{c().label}</span>
        )}
      </Show>

      <div class="adv-card-portrait">
        <Show
          when={known()}
          fallback={
            <span style={{
              display: "flex", width: "100%", height: "100%",
              "align-items": "center", "justify-content": "center",
              "font-size": "2.5rem", color: "rgba(200,200,210,0.35)",
              background: "rgba(0,0,0,0.3)",
            }}>?</span>
          }
        >
          <Portrait src={p().portrait} alt={p().name} glyph={p().icon ?? "🙂"}
            style={{ "border-radius": "0" }} />
        </Show>
      </div>

      <div class="adv-card-content">
        <Show
          when={known()}
          fallback={
            <div class="building-card-title" style={{
              "font-style": "italic", color: "var(--text-muted)", "letter-spacing": "0.15em",
            }}>???</div>
          }
        >
          <div class="building-card-title">{p().name}</div>

          {/* Who they are: a class for a hero, a homeland for a visitor. A
              settler's role never changes, so it moved to the popin and the
              card gives the space to the two lines that DO change. */}
          <Show when={adv()} fallback={
            <Show when={p().kind === "visitor" && p().line}>
              <div style={{ "font-size": "0.85rem", color: "var(--text-muted)" }}>{p().line}</div>
            </Show>
          }>
            {(a) => (
              <>
                <div style={{ "font-size": "0.85rem", color: "var(--text-muted)" }}>
                  {a().race ? `${RACE_NAMES[a().race!]} ` : ""}{getClassMeta(a().class).name} · Lv.{a().level}
                </div>
                <Show when={a().origin}>
                  <div style={{ "font-size": "0.75rem", color: "var(--text-muted)" }}>
                    {getOrigin(a().origin)?.name} — {getOrigin(a().origin)?.region}
                  </div>
                </Show>
              </>
            )}
          </Show>

          {/* How they are, and what they do. Every card carries both, whoever
              the person is. */}
          <Status status={p().health} />
          <Status status={p().work} />

          <Show when={p().nudge}>
            {(n) => <Status status={n()} />}
          </Show>
        </Show>
      </div>
    </div>
  );
}
