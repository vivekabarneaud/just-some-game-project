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
const AdventurerDetail = lazy(() => import("./pages/AdventurerDetail"));
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
        <Route path="*" component={ComingSoon} />
      </Router>
    </GameProvider>
  ),
  document.getElementById("root")!,
);
