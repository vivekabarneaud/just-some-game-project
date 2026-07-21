import { For, Show, createSignal } from "solid-js";
import { useGame, type KeptAnimal } from "~/engine/gameState";
import { getAnimal } from "@medieval-realm/shared/data/livestock";
import { CardFrame } from "~/components/CardFrame";
import Select from "~/components/Select";
import { SPARK_GOLD } from "~/data/navWidgets";
import { breedName } from "~/data/dogBreeds";
import { kennelDogCapacity } from "~/data/buildings";

// Frame by experience — same hand-drawn frames as the adventurer roster.
// Tier = the higher of the dog's two skills (1..5); CardFrame does the drawing.
const TIER_FRAME = ["", "common", "uncommon", "rare", "epic", "legendary"];

const stars = (level: number) => {
  const n = Math.max(0, Math.min(5, Math.round(level || 0)));
  return "★".repeat(n) + "☆".repeat(5 - n);
};

/** The Kennel — the settlement's working dogs, one card each (mirrors the
 *  adventurer roster). Post each to guard a flock or work the hunting camp.
 *  Skills, happiness and real acquisition come in the next increment. */
export default function Kennel() {
  const { state, actions } = useGame();
  const dogs = () => state.keptAnimals.filter((a) => a.species === "dog");
  const builtPens = () => state.pens.filter((p) => p.level > 0);
  const hasHuntingCamp = () => (state.buildings.find((b) => b.buildingId === "hunting_camp")?.level ?? 0) > 0;
  const kennelLevel = () => state.buildings.find((b) => b.buildingId === "kennel")?.level ?? 0;
  const capacity = () => kennelDogCapacity(kennelLevel());

  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [draft, setDraft] = createSignal("");

  const tierOf = (d: KeptAnimal) => Math.max(1, Math.min(5, Math.max(d.guardLevel ?? 0, d.huntLevel ?? 0)));
  const moodFace = (h: number) => (h >= 70 ? "😊" : h >= 40 ? "🙂" : "😕");

  const description = (d: KeptAnimal): string => {
    if (d.keeper) return `${d.keeper}'s hound, works the hunting camp.`;
    if (d.origin === "thornwoods") return "The Thornwoods' dog.";
    if (d.origin === "bred") {
      const sire = state.keptAnimals.find((a) => a.id === d.sireId);
      const dam = state.keptAnimals.find((a) => a.id === d.damId);
      return sire && dam ? `Pup of ${sire.name} and ${dam.name}.` : "Born here in the settlement.";
    }
    return "A stray that wandered in.";
  };

  const assignValue = (d: KeptAnimal) => (d.job === "guard" ? `guard:${d.penId}` : d.job === "hunt" ? "hunt" : "idle");
  const onAssign = (d: KeptAnimal, value: string) => {
    if (value === "idle") actions.assignAnimal(d.id, "idle");
    else if (value === "hunt") actions.assignAnimal(d.id, "hunt");
    else if (value.startsWith("guard:")) actions.assignAnimal(d.id, "guard", value.slice(6));
  };

  const startEdit = (d: KeptAnimal) => { setDraft(d.name); setEditingId(d.id); };
  const commitEdit = (d: KeptAnimal) => { const v = draft(); if (v.trim()) actions.renameAnimal(d.id, v); setEditingId(null); };

  return (
    <div style={{ padding: "20px", "max-width": "1080px" }}>
      <h1 style={{ "font-family": "var(--font-heading)", color: "var(--accent-gold)", "margin-bottom": "4px" }}>🐕 The Kennel</h1>
      <p style={{ color: "var(--text-secondary)", "font-style": "italic", "margin-bottom": "10px" }}>
        The working dogs of the settlement. Post one to guard a flock or work the hunting camp, or let it rest at the fire.
      </p>

      <Show when={kennelLevel() > 0}>
        <p style={{ color: "var(--text-muted)", "font-size": "0.82rem", "margin-bottom": "18px" }}>
          🏠 {dogs().filter((d) => !d.keeper).length} / {capacity()} dogs kept · a bigger kennel makes room for more, and lets strays and litters join the pack.
        </p>
      </Show>

      <Show
        when={dogs().length > 0}
        fallback={
          <div style={{ color: "var(--text-muted)", "font-style": "italic" }}>
            {kennelLevel() > 0
              ? "The kennel stands empty for now."
              : "No kennel yet. Build one to take in Truffle, the stray who keeps sleeping by the fire."}
          </div>
        }
      >
        <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fill, 320px)", "justify-content": "start", gap: "16px" }}>
          <For each={dogs()}>
            {(dog) => (
              <div class="building-card adv-card" style={{ position: "relative", width: "100%" }}>
                {/* Rarity frame + mid-edge flourishes, drawn over the card. */}
                <CardFrame rarity={TIER_FRAME[tierOf(dog)] ?? "common"} border={24} ornamentSize={28} ornamentInset={8} z={3} />

                <div class="adv-card-portrait">
                  <img src={dog.portrait} alt={dog.name} loading="lazy" />
                </div>
                <div class="adv-card-content" style={{ "padding-right": "24px" }}>
                  {/* Name + rename pen (fixed-name dogs show no pen). */}
                  <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                    <Show
                      when={editingId() === dog.id}
                      fallback={
                        <>
                          <div class="building-card-title">{dog.name}</div>
                          <Show when={!dog.nameFixed}>
                            <button
                              title="Rename"
                              onClick={() => startEdit(dog)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", "font-size": "0.8rem", padding: "0" }}
                            >✏️</button>
                          </Show>
                        </>
                      }
                    >
                      <input
                        value={draft()}
                        ref={(el) => setTimeout(() => el.focus(), 0)}
                        onInput={(e) => setDraft(e.currentTarget.value)}
                        onBlur={() => commitEdit(dog)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitEdit(dog); if (e.key === "Escape") setEditingId(null); }}
                        maxlength={24}
                        style={{ "font-size": "0.95rem", padding: "2px 6px", background: "var(--bg-primary)", border: "1px solid var(--accent-gold)", color: "var(--text-primary)", width: "150px" }}
                      />
                    </Show>
                  </div>

                  <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "font-style": "italic", "margin-top": "1px" }}>
                    {breedName(dog.breed)}{dog.isPuppy ? " pup" : ""} · {description(dog)} <span title={`Happiness ${Math.round(dog.happiness)}`}>{moodFace(dog.happiness)}</span>
                  </div>

                  {/* Two skill tracks — fixed-width labels so the stars line up. */}
                  <div style={{ "font-size": "0.78rem", "margin-top": "6px", display: "flex", "flex-direction": "column", gap: "3px" }}>
                    <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                      <img src={SPARK_GOLD} alt="" style={{ width: "13px", height: "13px", "flex-shrink": "0" }} />
                      <span style={{ color: "var(--text-muted)", width: "42px", "flex-shrink": "0" }}>Guard</span>
                      <span style={{ color: "var(--accent-gold)", "letter-spacing": "1px" }}>{stars(dog.guardLevel ?? 0)}</span>
                    </div>
                    <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                      <img src={SPARK_GOLD} alt="" style={{ width: "13px", height: "13px", "flex-shrink": "0" }} />
                      <span style={{ color: "var(--text-muted)", width: "42px", "flex-shrink": "0" }}>Hunt</span>
                      <span style={{ color: "var(--accent-gold)", "letter-spacing": "1px" }}>{stars(dog.huntLevel ?? 0)}</span>
                    </div>
                  </div>

                  {/* Assignment dropdown — a "growing up" note for pups, or a
                      static note for an owner-bound hound (not ours to move). */}
                  <div style={{ "margin-top": "8px" }}>
                    <Show
                      when={!dog.keeper}
                      fallback={<div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "font-style": "italic" }}>🏹 Posted to the hunt with {dog.keeper}.</div>}
                    >
                      <Show
                        when={!dog.isPuppy}
                        fallback={<div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "font-style": "italic" }}>🐶 Still growing, too young to work.</div>}
                      >
                        <Select
                          value={assignValue(dog)}
                          onChange={(v) => onAssign(dog, v)}
                          options={[
                            { value: "idle", label: "At the fire" },
                            ...(hasHuntingCamp() ? [{ value: "hunt", label: "Hunting camp" }] : []),
                            ...builtPens().map((pen) => ({ value: `guard:${pen.id}`, label: `Guard the ${getAnimal(pen.animal).name.toLowerCase()}` })),
                          ]}
                        />
                      </Show>
                    </Show>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
