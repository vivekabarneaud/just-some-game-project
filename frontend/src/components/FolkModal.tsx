import { For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { FOUNDING_CHARACTERS, getFragmentsForCharacter } from "~/data/founding_characters";
import { CHAR_RELATIONSHIPS } from "@medieval-realm/shared/data/premade-characters";
import { getFoodPref } from "@medieval-realm/shared/data/adventurers";
import FramedModal from "~/components/FramedModal";
import Portrait from "~/components/Portrait";
import TraitBadge from "~/components/TraitBadge";
import AdventurerSheet from "~/components/AdventurerSheet";
import type { FolkPerson } from "~/data/folk";

/**
 * One person, opened from the Folk page.
 *
 * It is the same popin for everybody, and it grows with what the person has. A
 * founder carries a story and memories, and so their popin is short. An
 * adventurer carries gear and talents, so `AdventurerSheet` (the old
 * `/guild/:id` page) draws the rest below.
 */

const LABEL = {
  "font-size": "0.75rem", color: "var(--accent-gold)",
  "letter-spacing": "0.08em", "text-transform": "uppercase",
  "margin-bottom": "10px",
} as const;

export default function FolkModal(props: { person: FolkPerson; onClose: () => void }) {
  const { state, actions } = useGame();
  const p = () => props.person;

  const founder = () => FOUNDING_CHARACTERS.find((f) => f.id === p().founderId);
  // Re-read the hero from the store so a cure or an equip redraws the popin.
  const adv = () => {
    const a = p().adventurer;
    return a ? state.adventurers.find((x) => x.id === a.id) : undefined;
  };
  const ailment = () => actions.getFolkAilment(p().id);
  const memories = () => {
    const f = founder();
    return f ? getFragmentsForCharacter(f.id, state.unlockedBioFragments ?? []) : [];
  };
  const relationship = () => {
    const a = adv();
    return a?.premadeId ? CHAR_RELATIONSHIPS[a.premadeId] : undefined;
  };
  const foodPref = () => {
    const a = adv();
    return a ? getFoodPref(a.foodPreference) : undefined;
  };
  const story = () => founder()?.coreBio ?? adv()?.backstory;

  return (
    <FramedModal
      title={p().name}
      subtitle={p().line}
      onClose={props.onClose}
      // The talent tree alone is about 700px wide, so a founder's short popin
      // and an adventurer's full sheet share the same generous width.
      maxWidth={adv() ? "1100px" : "720px"}
    >
      <div style={{ display: "flex", "flex-direction": "column", gap: "20px" }}>

        {/* ── Who they are ── */}
        <div style={{ display: "flex", gap: "18px", "flex-wrap": "wrap" }}>
          <Portrait src={p().portrait} alt={p().name} size={140} glyph={p().icon ?? "🙂"}
            style={{ "flex-shrink": "0" }} />
          <div style={{ flex: "1 1 240px", "min-width": "0", display: "flex", "flex-direction": "column", gap: "8px" }}>
            <Show when={founder()?.age}>
              {(age) => <div style={{ "font-size": "0.85rem", color: "var(--text-muted)" }}>{age()} years old</div>}
            </Show>
            <Show when={relationship()}>
              {(r) => <div style={{ "font-size": "0.82rem", color: "var(--accent-gold)" }}>{r()}</div>}
            </Show>
            <Show when={foodPref()}>
              {(f) => (
                <div style={{ "font-size": "0.82rem", color: "var(--text-muted)", display: "flex", gap: "6px" }}>
                  <span>{f().icon}</span><span>{f().trait}</span>
                </div>
              )}
            </Show>
            <Show when={adv()?.trait}>
              {(t) => <div><TraitBadge traitId={t()} /></div>}
            </Show>
            <Show when={story()}>
              {(text) => (
                <div style={{ "font-size": "0.9rem", color: "var(--text-secondary)", "line-height": "1.6" }}>
                  {text()}
                </div>
              )}
            </Show>
          </div>
        </div>

        {/* ── Where they stand today ── */}
        <Show when={p().worksAt || p().away || ailment()}>
          <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
            <div style={LABEL}>Today</div>
            <Show when={p().worksAt}>
              {(w) => <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)" }}>Works at the {w()}</div>}
            </Show>
            <Show when={p().away}>
              {(a) => <div style={{ "font-size": "0.85rem", color: "var(--accent-blue)", "text-transform": "capitalize" }}>{a()}</div>}
            </Show>

            {/* The cure buttons, the same pair the building card offers. A
                person with no workplace could never be treated before, because
                the only cure UI in the game sat on a building. */}
            <Show when={ailment()}>
              {(a) => (
                <div style={{
                  padding: "8px 10px", "border-radius": "4px",
                  background: "rgba(231, 76, 60, 0.08)", border: "1px solid var(--accent-red)",
                }}>
                  <div style={{ "font-size": "0.82rem", color: "var(--accent-red)" }}>
                    {a().icon} {a().who} has {a().name.toLowerCase()}
                  </div>
                  <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-top": "3px" }}>
                    Mending on their own (~{Math.max(1, Math.round(a().hoursRemaining))}h).{" "}
                    {a().kind === "injury" ? "A dressing" : "A remedy"} sets it right sooner.
                  </div>
                  <Show
                    when={a().cures.length > 0}
                    fallback={
                      <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "font-style": "italic", "margin-top": "5px" }}>
                        Nothing on hand to treat it. They will rest it off.
                      </div>
                    }
                  >
                    <div style={{ display: "flex", "flex-wrap": "wrap", gap: "5px", "margin-top": "6px" }}>
                      <For each={a().cures}>
                        {(c) => (
                          <button class="btn-tertiary" style={{ "font-size": "0.72rem", padding: "3px 8px" }}
                            onClick={() => actions.cureFolkAilment(p().id, c.id)}>
                            {c.icon} {c.name} ({c.qty})
                          </button>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              )}
            </Show>
          </div>
        </Show>

        {/* ── Memories, for a founder ── */}
        <Show when={founder() && founder()!.fragments.length > 0}>
          <div>
            <div style={LABEL}>
              Memories ({memories().length} / {founder()!.fragments.length})
            </div>
            <Show
              when={memories().length > 0}
              fallback={
                <div style={{ "font-size": "0.85rem", color: "var(--text-muted)", "font-style": "italic" }}>
                  No memories yet. The story has only begun.
                </div>
              }
            >
              <For each={memories()}>
                {(frag) => (
                  <div style={{
                    padding: "10px 14px", "margin-bottom": "10px", "border-radius": "4px",
                    background: "rgba(212, 163, 115, 0.06)",
                    "border-left": "2px solid rgba(212, 163, 115, 0.35)",
                    "font-size": "0.88rem", color: "var(--text-secondary)",
                    "font-style": "italic", "line-height": "1.6",
                  }}>
                    {frag.text}
                  </div>
                )}
              </For>
            </Show>
          </div>
        </Show>

        {/* ── Errands ──
            The slot, not the quests. `quests.ts` already holds three under a
            banner that reads THE FOLK (`see_to_edda`, `see_to_jory`,
            `see_to_tomas`). A later pass points them at this place. */}
        <div>
          <div style={LABEL}>Errands</div>
          <div style={{ "font-size": "0.85rem", color: "var(--text-muted)", "font-style": "italic" }}>
            Nothing asked of you right now.
          </div>
        </div>

        {/* ── Gear and talents, for an adventurer ── */}
        <Show when={adv()}>
          {(a) => (
            <div style={{ "border-top": "1px solid var(--border-color)", "padding-top": "16px" }}>
              <AdventurerSheet adventurer={a()} />
            </div>
          )}
        </Show>
      </div>
    </FramedModal>
  );
}
