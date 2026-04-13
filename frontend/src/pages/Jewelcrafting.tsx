import { useGame } from "~/engine/gameState";
import CraftingPage from "~/components/CraftingPage";

export default function Jewelcrafting() {
  const { state, actions } = useGame();
  return (
    <CraftingPage
      title="Jewelcrafting"
      buildingId="jewelcrafter"
      buildingName="Jewelcrafter"
      icon="💎"
      materials={[
        { icon: "🪙", label: "Gold", value: () => Math.floor(state.resources.gold) },
        { icon: "⚒️", label: "Iron", value: () => Math.floor(state.iron) },
        { icon: "💎", label: "Gems", value: () => state.gems },
      ]}
    />
  );
}
