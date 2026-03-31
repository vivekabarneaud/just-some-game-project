import { useGame } from "~/engine/gameState";
import CraftingPage from "~/components/CraftingPage";

export default function Blacksmith() {
  const { state } = useGame();
  return (
    <CraftingPage
      title="Blacksmith"
      buildingId="blacksmith"
      buildingName="Blacksmith"
      icon="🔨"
      materials={[
        { icon: "⚒️", label: "Iron", value: () => Math.floor(state.iron) },
        { icon: "🔧", label: "Tools", value: () => state.tools },
        { icon: "⚔️", label: "Weapons", value: () => state.weapons },
        { icon: "🛡️", label: "Armor", value: () => state.armor },
      ]}
    />
  );
}
