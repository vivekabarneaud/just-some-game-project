import { lazy } from "solid-js";
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import App from "./App";
import { GameProvider } from "./engine/gameState";
import "./styles/global.css";

const Overview = lazy(() => import("./pages/Overview"));
const Buildings = lazy(() => import("./pages/Buildings"));
const BuildingDetail = lazy(() => import("./pages/BuildingDetail"));
const Farming = lazy(() => import("./pages/Farming"));
const AdventurersGuild = lazy(() => import("./pages/AdventurersGuild"));
const Inventory = lazy(() => import("./pages/Inventory"));
const AdventurerDetail = lazy(() => import("./pages/AdventurerDetail"));
const Tailoring = lazy(() => import("./pages/Tailoring"));
const Blacksmith = lazy(() => import("./pages/Blacksmith"));
const Alchemy = lazy(() => import("./pages/Alchemy"));
const Enchanting = lazy(() => import("./pages/Enchanting"));
const Jewelcrafting = lazy(() => import("./pages/Jewelcrafting"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));

render(
  () => (
    <GameProvider>
      <Router root={App}>
        <Route path="/" component={Overview} />
        <Route path="/buildings" component={Buildings} />
        <Route path="/buildings/:id" component={BuildingDetail} />
        <Route path="/farming" component={Farming} />
        <Route path="/guild" component={AdventurersGuild} />
        <Route path="/guild/:id" component={AdventurerDetail} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/tailoring" component={Tailoring} />
        <Route path="/blacksmith" component={Blacksmith} />
        <Route path="/alchemy" component={Alchemy} />
        <Route path="/enchanting" component={Enchanting} />
        <Route path="/jewelcrafting" component={Jewelcrafting} />
        <Route path="*" component={ComingSoon} />
      </Router>
    </GameProvider>
  ),
  document.getElementById("root")!,
);
