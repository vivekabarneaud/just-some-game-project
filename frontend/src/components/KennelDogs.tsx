import { For, Show, createSignal } from "solid-js";
import { useGame, type KeptAnimal } from "~/engine/gameState";
import { getAnimal } from "@medieval-realm/shared/data/livestock";
import { CardFrame } from "~/components/CardFrame";
import Select from "~/components/Select";
import { SPARK_GOLD } from "~/data/navWidgets";
import { breedName } from "~/data/dogBreeds";
import { kennelDogCapacity, animalSlots } from "~/data/buildings";

// Tier (higher of the dog's two skills, 1..5) → rarity frame name.
const TIER_FRAME = ["", "common", "uncommon", "rare", "epic", "legendary"];

const stars = (level: number) => {
  const n = Math.max(0, Math.min(5, Math.round(level || 0)));
  return "★".repeat(n) + "☆".repeat(5 - n);
};

/** The settlement's working dogs — one card each (mirrors the adventurer
 *  roster). Post each to guard a flock or work the hunting camp. Rendered inside
 *  the Kennel's building modal (no page chrome of its own). */
export default function KennelDogs() {
  const { state, actions } = useGame();
  const dogs = () => state.keptAnimals.filter((a) => a.species === "dog");
  const builtPens = () => state.pens.filter((p) => p.level > 0);
  const huntingCampLvl = () => state.buildings.find((b) => b.buildingId === "hunting_camp")?.level ?? 0;
  const kennelLevel = () => state.buildings.find((b) => b.buildingId === "kennel")?.level ?? 0;
  const capacity = () => kennelDogCapacity(kennelLevel());
  // Hunting camp: one dog slot per level. A dog can be posted there only if
  // there's a free slot (Ser Sniffsalot occupies one at L1) or it's already on
  // the hunt. Likewise a pen holds one guard dog.
  const huntPosted = () => state.keptAnimals.filter((a) => a.species === "dog" && a.job === "hunt").length;
  const huntSlotFree = (d: KeptAnimal) => d.job === "hunt" || huntPosted() < animalSlots("hunting_camp", huntingCampLvl());
  const penFreeFor = (penId: string, dogId: string) =>
    !state.keptAnimals.some((a) => a.species === "dog" && a.job === "guard" && a.penId === penId && a.id !== dogId);

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
    <div>
      <p style={{ color: "var(--text-muted)", "font-size": "0.82rem", "margin-bottom": "14px" }}>
        🏠 {dogs().filter((d) => !d.keeper).length} / {capacity()} dogs kept · a bigger kennel makes room for more, and lets strays and litters join the pack.
      </p>

      <Show
        when={dogs().length > 0}
        fallback={
          <div style={{ color: "var(--text-muted)", "font-style": "italic", "font-size": "0.85rem" }}>
            The kennel stands empty for now.
          </div>
        }
      >
        <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
          <For each={dogs()}>
            {(dog) => (
              <div class="building-card adv-card" style={{ position: "relative", width: "100%" }}>
                {/* Rarity frame + mid-edge flourishes, drawn over the card. */}
                <CardFrame rarity={TIER_FRAME[tierOf(dog)] ?? "common"} border={24} ornamentSize={28} ornamentInset={4} z={3} />

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
                            ...(huntingCampLvl() > 0 && huntSlotFree(dog) ? [{ value: "hunt", label: "Hunting camp" }] : []),
                            ...builtPens()
                              .filter((pen) => penFreeFor(pen.id, dog.id))
                              .map((pen) => ({ value: `guard:${pen.id}`, label: `Guard the ${getAnimal(pen.animal).name.toLowerCase()}` })),
                          ]}
                        />
                      </Show>
                    </Show>
                  </div>

                  {/* Wounded — he's off his post by the fire; rest heals him, a
                      poultice/salve speeds it. */}
                  <Show when={actions.getAnimalWound(dog.id)}>
                    {(w) => (
                      <div style={{ "margin-top": "8px", padding: "6px 8px", "border-radius": "6px", background: "rgba(231,76,60,0.1)", border: "1px solid var(--accent-red)" }}>
                        <div style={{ "font-size": "0.75rem", color: "var(--accent-red)" }}>
                          {w().icon} {w().name} — by the fire, {Math.ceil(w().hoursRemaining)}h to mend
                        </div>
                        <Show
                          when={w().cures.length > 0}
                          fallback={<div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "margin-top": "3px" }}>Rest will heal him; a poultice or salve would speed it.</div>}
                        >
                          <div style={{ display: "flex", "flex-wrap": "wrap", gap: "4px", "margin-top": "4px" }}>
                            <For each={w().cures}>
                              {(c) => (
                                <button class="btn-secondary" style={{ "font-size": "0.72rem" }} onClick={() => actions.tendAnimal(dog.id, c.id)}>
                                  {c.icon} Tend with {c.name} ({c.qty})
                                </button>
                              )}
                            </For>
                          </div>
                        </Show>
                      </div>
                    )}
                  </Show>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
