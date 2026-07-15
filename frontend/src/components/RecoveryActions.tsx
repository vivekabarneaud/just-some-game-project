import { For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { getAvailableSupplies, getPotionInfo } from "@medieval-realm/shared/data/items";
import { calcAdventurerMaxHp } from "@medieval-realm/shared/data/expeditionEngine";
import type { Adventurer } from "@medieval-realm/shared/data/adventurers";

/** Buttons to patch up a resting hero at home with any owned recovery item —
 *  a Bandage (heal + stop bleeding), a Healing Salve (heal only), a Herbal
 *  Antidote (heal + cure poison), etc. Registry-driven: a button shows for a
 *  recovery item only when it would actually do something for this hero (heals
 *  while wounded, or clears a condition the hero currently carries). Replaces
 *  the old hardcoded single "Use Bandage" button. */
export default function RecoveryActions(props: { adventurer: Adventurer }) {
  const { state, actions } = useGame();

  const options = () => {
    const adv = props.adventurer;
    if (!adv.alive || adv.onMission) return [];
    const maxHp = calcAdventurerMaxHp(adv);
    const wounded = (adv.currentHp ?? maxHp) < maxHp;
    const result: { id: string; icon: string; name: string; qty: number }[] = [];
    for (const s of getAvailableSupplies(state.inventory, "recovery")) {
      const rec = getPotionInfo(s.item.id)?.recovery;
      if (!rec) continue;
      const cures = rec.cures ?? [];
      const healUseful = (rec.healPct ?? 0) > 0 && wounded;
      const cureUseful = (adv.conditions ?? []).some((c) => cures.includes(c.type));
      if (!healUseful && !cureUseful) continue;
      result.push({ id: s.item.id, icon: s.item.icon, name: s.item.name, qty: s.qty });
    }
    return result;
  };

  return (
    <Show when={options().length > 0}>
      <div style={{ display: "flex", "flex-wrap": "wrap", gap: "4px", "margin-top": "6px" }}>
        <For each={options()}>
          {(o) => (
            <button
              class="btn-tertiary"
              style={{ "font-size": "0.72rem", padding: "3px 8px" }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                actions.useRecoveryItem(props.adventurer.id, o.id);
              }}
            >
              {o.icon} {o.name} ({o.qty})
            </button>
          )}
        </For>
      </div>
    </Show>
  );
}
