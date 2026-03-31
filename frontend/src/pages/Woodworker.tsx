import { useGame } from "~/engine/gameState";
import CraftingPage from "~/components/CraftingPage";

export default function Woodworker() {
  const { state } = useGame();
  return (
    <CraftingPage
      title="Woodworker"
      buildingId="woodworker"
      buildingName="Woodworker"
      icon="🪚"
      materials={[
        { icon: "🪵", label: "Wood", value: () => Math.floor(state.resources.wood) },
        { icon: "🪻", label: "Fiber", value: () => Math.floor(state.fiber) },
        { icon: "⚒️", label: "Iron", value: () => Math.floor(state.iron) },
      ]}
    />
  );
}
