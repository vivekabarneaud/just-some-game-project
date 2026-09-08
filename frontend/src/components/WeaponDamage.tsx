import { Show } from "solid-js";
import { rarityWeaponRange } from "@medieval-realm/shared/data/combat";
import type { ItemDefinition } from "@medieval-realm/shared/data/items";

// Physical weapon families whose auto-attack rolls the weapon's damage range.
// Staves/wands are magical (INT / spell-driven) — no physical range to show
// until the Phase 2 caster spell-weapon pass.
const PHYSICAL_WEAPONS = new Set(["sword", "greatsword", "axe", "dagger", "mace", "spear", "bow"]);

/** The physical damage range to display for a weapon, or null if it isn't a
 *  physical weapon. Mirrors the combat resolver: explicit range, else the
 *  rarity default. */
function weaponDamageRange(item: ItemDefinition): { min: number; max: number } | null {
  if (item.slot !== "mainHand" || !item.weaponType) return null;
  if (!PHYSICAL_WEAPONS.has(item.weaponType)) return null;
  if (item.dmgMin != null && item.dmgMax != null) return { min: item.dmgMin, max: item.dmgMax };
  return rarityWeaponRange(item.rarity);
}

/** A "⚔️ 5–8 dmg" line for a weapon card. Renders nothing for non-weapons. */
export default function WeaponDamage(props: { item: ItemDefinition; style?: import("solid-js").JSX.CSSProperties }) {
  const range = () => weaponDamageRange(props.item);
  return (
    <Show when={range()}>
      <div style={{ "font-size": "0.72rem", color: "var(--accent-gold)", "font-weight": 600, ...(props.style ?? {}) }}>
        ⚔️ {range()!.min}–{range()!.max} dmg
      </div>
    </Show>
  );
}
