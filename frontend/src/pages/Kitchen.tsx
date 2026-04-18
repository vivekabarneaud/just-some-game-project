import { useGame } from "~/engine/gameState";
import CraftingPage from "~/components/CraftingPage";

export default function Kitchen() {
  const { state } = useGame();
  const f = () => state.foods ?? {} as any;
  return (
    <CraftingPage
      title="The Kitchens"
      buildingId="kitchen"
      buildingName="The Kitchens"
      icon="🍳"
      craftVerb="Cook!"
      materials={[
        { icon: "🌾", label: "Grain",   value: () => Math.floor((f().wheat ?? 0) + (f().barley ?? 0)) },
        { icon: "🍖", label: "Meat",    value: () => Math.floor(f().meat ?? 0) },
        { icon: "🐟", label: "Fish",    value: () => Math.floor(f().fish ?? 0) },
        { icon: "🥚", label: "Eggs",    value: () => Math.floor(f().eggs ?? 0) },
        { icon: "🥛", label: "Milk",    value: () => Math.floor(f().milk ?? 0) },
        { icon: "🥬", label: "Veggies", value: () => Math.floor((f().cabbages ?? 0) + (f().turnips ?? 0) + (f().peas ?? 0) + (f().squash ?? 0)) },
        { icon: "🍎", label: "Fruit",   value: () => Math.floor((f().apples ?? 0) + (f().pears ?? 0) + (f().cherries ?? 0)) },
        { icon: "🍄", label: "Wild",    value: () => Math.floor((f().berries ?? 0) + (f().mushrooms ?? 0) + (f().nuts ?? 0)) },
        { icon: "🍯", label: "Honey",   value: () => Math.floor(state.honey) },
      ]}
    />
  );
}
