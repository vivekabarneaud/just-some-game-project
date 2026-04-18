import { useGame } from "~/engine/gameState";
import CraftingPage from "~/components/CraftingPage";
import { getTotalFood } from "~/data/foods";

export default function Kitchen() {
  const { state } = useGame();
  return (
    <CraftingPage
      title="The Kitchens"
      buildingId="kitchen"
      buildingName="The Kitchens"
      icon="🍳"
      craftVerb="Cook!"
      materials={[
        { icon: "🍖", label: "Food", value: () => Math.floor(getTotalFood(state.foods)) },
        { icon: "🍯", label: "Honey", value: () => Math.floor(state.honey) },
        { icon: "🍎", label: "Fruit", value: () => Math.floor(state.fruit) },
      ]}
    />
  );
}
