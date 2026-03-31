import { useGame } from "~/engine/gameState";
import CraftingPage from "~/components/CraftingPage";

export default function Tailoring() {
  const { state, actions } = useGame();
  return (
    <CraftingPage
      title="Tailoring Shop"
      buildingId="tailoring_shop"
      buildingName="Tailoring Shop"
      icon="🧵"
      materials={[
        { icon: "🐑", label: "Wool", value: () => Math.floor(state.wool) },
        { icon: "🪻", label: "Fiber", value: () => Math.floor(state.fiber) },
        { icon: "👕", label: "Clothing", value: () => `${actions.getClothingInfo().current}/${actions.getClothingInfo().needed}` as any },
      ]}
    />
  );
}
