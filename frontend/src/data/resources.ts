export interface Resource {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const RESOURCES: Resource[] = [
  { id: "gold", name: "Gold", icon: "🪙", color: "#f5c542" },
  { id: "wood", name: "Wood", icon: "🪵", color: "#8B4513" },
  { id: "stone", name: "Stone", icon: "🪨", color: "#808080" },
  { id: "food", name: "Food", icon: "🌾", color: "#7CFC00" },
  // Water only shows in the bar once the settlement has a well or cistern.
  { id: "water", name: "Water", icon: "💧", color: "#4a90d9" },
];
