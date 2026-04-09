import { useGame } from "~/engine/gameState";
import CraftingPage from "~/components/CraftingPage";

export default function Leatherworking() {
  const { state } = useGame();
  return (
    <CraftingPage
      title="Leatherworking"
      buildingId="leatherworking"
      buildingName="Leatherworking"
      icon="🪡"
      materials={[
        { icon: "🪡", label: "Leather", value: () => Math.floor(state.leather) },
        { icon: "🧵", label: "Fiber", value: () => Math.floor(state.fiber) },
        { icon: "🛡️", label: "Armor", value: () => state.armor },
      ]}
    />
  );
}
