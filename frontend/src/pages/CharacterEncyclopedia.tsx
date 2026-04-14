import { createSignal, For, Show } from "solid-js";
import { PREMADE_CHARACTERS, type PremadeCharacter } from "~/data/premade-characters";
import { RACE_NAMES, RANK_NAMES, getClassMeta, AGE_LABELS, getFoodPref, type AdventurerClass, type Origin } from "~/data/adventurers";
import { ORIGINS } from "~/data/adventurers";

const CDN_CHARS = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/characters";

const CLASS_ORDER: AdventurerClass[] = ["warrior", "wizard", "priest", "archer", "assassin"];

export default function CharacterEncyclopedia() {
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
      <h1 class="page-title">📖 Character Encyclopedia</h1>
      <p style={{ color: "var(--text-muted)", "margin-bottom": "16px", "font-size": "0.85rem" }}>
        All {PREMADE_CHARACTERS.length} known adventurers across the realm. These are the people who may answer your call.
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
          Showing {filtered().length} / {PREMADE_CHARACTERS.length}
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
              <div style={{
                display: "grid",
                "grid-template-columns": "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "12px",
              }}>
                <For each={chars}>
                  {(char) => {
                    const cls = () => getClassMeta(char.class);
                    const portraitUrl = `${CDN_CHARS}/${char.origin}/${char.portrait}.png`;
                    return (
                      <div style={{
                        background: "var(--bg-secondary)",
                        "border-radius": "8px",
                        overflow: "hidden",
                        border: "1px solid var(--border-color)",
                        transition: "border-color 0.2s",
                      }}>
                        {/* Portrait */}
                        <div style={{
                          width: "100%",
                          "aspect-ratio": "1",
                          overflow: "hidden",
                          position: "relative",
                        }}>
                          <img
                            src={portraitUrl}
                            alt={char.name}
                            loading="lazy"
                            style={{
                              width: "100%",
                              height: "100%",
                              "object-fit": "cover",
                              display: "block",
                            }}
                          />
                          {/* Class icon badge */}
                          <div style={{
                            position: "absolute",
                            bottom: "4px",
                            right: "4px",
                            width: "24px",
                            height: "24px",
                            "border-radius": "50%",
                            background: "rgba(0,0,0,0.7)",
                            display: "flex",
                            "align-items": "center",
                            "justify-content": "center",
                            "font-size": "0.75rem",
                          }}>
                            {cls().icon}
                          </div>
                          {/* Food preference icon */}
                          <Show when={getFoodPref(char.foodPreference)}>
                            <div style={{
                              position: "absolute",
                              bottom: "4px",
                              left: "4px",
                              width: "20px",
                              height: "20px",
                              "border-radius": "50%",
                              background: "rgba(0,0,0,0.7)",
                              display: "flex",
                              "align-items": "center",
                              "justify-content": "center",
                              "font-size": "0.6rem",
                            }}>
                              {getFoodPref(char.foodPreference)!.icon}
                            </div>
                          </Show>
                        </div>
                        {/* Info */}
                        <div style={{ padding: "8px 10px" }}>
                          <div style={{
                            "font-size": "0.85rem",
                            "font-weight": "bold",
                            color: "var(--text-primary)",
                            "margin-bottom": "2px",
                          }}>
                            {char.name}
                          </div>
                          <div style={{
                            "font-size": "0.72rem",
                            color: "var(--text-muted)",
                          }}>
                            {RACE_NAMES[char.race]} {cls().name} · {AGE_LABELS[char.age]}
                          </div>
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
