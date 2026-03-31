import { useGame } from "~/engine/gameState";
import CraftingPage from "~/components/CraftingPage";

export default function Alchemy() {
  const { state } = useGame();
  return (
    <CraftingPage
      title="Alchemy Lab"
      buildingId="alchemy_lab"
      buildingName="Alchemy Lab"
      icon="🧪"
      materials={[
        { icon: "🧪", label: "Potions", value: () => state.potions },
        { icon: "💠", label: "Astral Shards", value: () => state.astralShards },
      ]}
    />
  );
}
