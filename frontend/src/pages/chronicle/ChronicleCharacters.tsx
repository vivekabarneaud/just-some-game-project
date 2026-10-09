import { createMemo, createSignal, For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { PREMADE_CHARACTERS, CHAR_RELATIONSHIPS, type PremadeCharacter } from "@medieval-realm/shared/data/premade-characters";
import { RACE_NAMES, getClassMeta, getFoodPref, CLASS_COLORS, type AdventurerClass, BACKSTORY_TRAITS, CDN_CHARS } from "@medieval-realm/shared/data/adventurers";
import { ORIGINS } from "@medieval-realm/shared/data/adventurers";
import TraitBadge from "~/components/TraitBadge";

const CLASS_ORDER: AdventurerClass[] = ["warrior", "wizard", "priest", "archer", "assassin"];

/**
 * Chronicle → Adventurers. A census of everyone who could come, not a catalogue
 * of everyone who has.
 *
 * THE ??? RULE, the same one the recipe census holds: a person you have not met
 * shows that they EXIST and nothing more. No name, no class, no backstory. This
 * page used to print all of it, which spoiled every arrival before it happened.
 */
export default function ChronicleCharacters() {
  const { state } = useGame();
  // A premade is MET once a live adventurer carries their id. The fallen count:
  // you met them, and the Chronicle does not unlearn a person.
  const met = createMemo(() => new Set(state.adventurers.map((a) => a.premadeId).filter(Boolean)));
  const metCount = () => PREMADE_CHARACTERS.filter((c) => met().has(c.id)).length;
  const [filterOrigin, setFilterOrigin] = createSignal<string>("all");
  const [filterClass, setFilterClass] = createSignal<string>("all");

  const filtered = () => {
    let chars = PREMADE_CHARACTERS;
    if (filterOrigin() !== "all") chars = chars.filter((c) => c.origin === filterOrigin());
    if (filterClass() !== "all") chars = chars.filter((c) => c.class === filterClass());
    return chars;
  };

  const grouped = () => {
    const groups: Record<string, PremadeCharacter[]> = {};
    for (const c of filtered()) {
      const key = c.origin;
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    }
    return groups;
  };

  return (
    <div>
      <p style={{ color: "var(--text-muted)", "margin-bottom": "16px", "font-size": "0.85rem" }}>
        {metCount()} of {PREMADE_CHARACTERS.length} adventurers across the realm have crossed your path.
      </p>

      {/* Filters */}
      <div style={{
        display: "flex", gap: "12px", "margin-bottom": "20px", "flex-wrap": "wrap",
        padding: "10px 14px", background: "var(--bg-secondary)", "border-radius": "6px",
      }}>
        <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
          <span style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>Origin:</span>
          <select
            value={filterOrigin()}
            onChange={(e) => setFilterOrigin(e.currentTarget.value)}
            style={{
              background: "var(--bg-primary)", border: "1px solid var(--border-color)",
              color: "var(--text-primary)", "border-radius": "4px", padding: "4px 8px", "font-size": "0.8rem",
            }}
          >
            <option value="all">All Origins</option>
            <For each={ORIGINS}>{(o) => <option value={o.id}>{o.name}</option>}</For>
          </select>
        </div>
        <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
          <span style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>Class:</span>
          <select
            value={filterClass()}
            onChange={(e) => setFilterClass(e.currentTarget.value)}
            style={{
              background: "var(--bg-primary)", border: "1px solid var(--border-color)",
              color: "var(--text-primary)", "border-radius": "4px", padding: "4px 8px", "font-size": "0.8rem",
            }}
          >
            <option value="all">All Classes</option>
            <For each={CLASS_ORDER}>{(cls) => <option value={cls}>{getClassMeta(cls).icon} {getClassMeta(cls).name}</option>}</For>
          </select>
        </div>
        <span style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-left": "auto" }}>
          {filtered().filter((c) => met().has(c.id)).length} / {filtered().length} met
        </span>
      </div>

      {/* Character groups by origin */}
      <For each={Object.entries(grouped())}>
        {([origin, chars]) => {
          const originDef = () => ORIGINS.find((o) => o.id === origin);
          return (
            <div style={{ "margin-bottom": "28px" }}>
              <h2 style={{
                "font-size": "1.1rem", color: "var(--accent-gold)", "margin-bottom": "12px",
                "padding-bottom": "6px", "border-bottom": "1px solid var(--border-color)",
              }}>
                {originDef()?.name ?? origin} — {originDef()?.region}
                <span style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-left": "8px" }}>
                  ({chars.length})
                </span>
              </h2>
              <Show when={originDef()}>
                <p style={{
                  "font-size": "0.8rem", color: "var(--text-muted)", "font-style": "italic",
                  "margin-bottom": "12px", "line-height": "1.5",
                }}>
                  {originDef()!.description}
                  <br />
                  <span style={{ color: "var(--text-secondary)", "font-style": "italic" }}>
                    "{originDef()!.quote}"
                  </span>
                </p>
              </Show>
              <div class="recruit-grid">
                <For each={chars}>
                  {(char) => {
                    const cls = () => getClassMeta(char.class);
                    const portraitUrl = `${CDN_CHARS}/${char.origin}/${char.portrait}.png`;
                    const traitDef = () => char.trait ? BACKSTORY_TRAITS.find((t) => t.id === char.trait) : null;
                    const known = () => met().has(char.id);
                    return (
                      <div class="building-card adv-card" classList={{ dimmed: !known() }}>
                        <Show when={known()}>
                          <span class="building-card-category" style={{ color: CLASS_COLORS[char.class] }}>
                            {cls().icon} {cls().name}
                          </span>
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
                            <img src={portraitUrl} alt={char.name} loading="lazy" />
                          </Show>
                        </div>
                        <div class="adv-card-content">
                          <Show
                            when={known()}
                            fallback={
                              <div class="building-card-title" style={{
                                "font-style": "italic", color: "var(--text-muted)",
                                "letter-spacing": "0.15em",
                              }}>???</div>
                            }
                          >
                          <div class="building-card-title">{char.name}</div>
                          <div style={{ "font-size": "0.85rem", color: "var(--text-muted)" }}>
                            {RACE_NAMES[char.race]} · {originDef()?.name}
                          </div>
                          <Show when={CHAR_RELATIONSHIPS[char.id]}>
                            <div style={{
                              "font-size": "0.73rem", color: "var(--accent-gold)", "margin-top": "2px",
                            }}>
                              {CHAR_RELATIONSHIPS[char.id]}
                            </div>
                          </Show>
                          <Show when={getFoodPref(char.foodPreference)}>
                            <div style={{
                              "font-size": "0.75rem", color: "var(--text-muted)", "margin-top": "2px",
                              display: "flex", "align-items": "center", gap: "4px",
                            }}>
                              <span>{getFoodPref(char.foodPreference)!.icon}</span>
                              <span>{getFoodPref(char.foodPreference)!.trait}</span>
                            </div>
                          </Show>
                          <Show when={traitDef()}>
                            <div style={{ "margin-top": "4px" }}>
                              <TraitBadge traitId={char.trait!} />
                            </div>
                          </Show>
                          <Show when={!traitDef()}>
                            <div style={{
                              "margin-top": "4px", "font-size": "0.78rem",
                              color: "var(--text-muted)", "font-style": "italic",
                            }}>
                              {cls().passive.name}: {cls().passive.description}
                            </div>
                          </Show>
                          <Show when={char.backstory}>
                            <div style={{
                              "margin-top": "6px", "font-size": "0.75rem",
                              color: "var(--text-secondary)", "line-height": "1.4",
                            }}>
                              {char.backstory}
                            </div>
                          </Show>
                          </Show>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
