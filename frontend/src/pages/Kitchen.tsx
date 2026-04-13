import { useGame } from "~/engine/gameState";
import CraftingPage from "~/components/CraftingPage";

export default function Kitchen() {
  const { state } = useGame();
  return (
    <CraftingPage
      title="The Kitchens"
      buildingId="kitchen"
      buildingName="The Kitchens"
      icon="🍳"
      materials={[
        { icon: "🍖", label: "Food", value: () => Math.floor(state.resources.food) },
        { icon: "🍯", label: "Honey", value: () => Math.floor(state.honey) },
        { icon: "🍎", label: "Fruit", value: () => Math.floor(state.fruit) },
      ]}
    />
  );
}
