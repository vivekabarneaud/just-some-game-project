import { lazy, type ParentProps } from "solid-js";
import { render } from "solid-js/web";
import { Router, Route, Navigate } from "@solidjs/router";
import App from "./App";
import { GameProvider } from "./engine/gameState";
import { isLoggedIn } from "./api/auth";
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
const Woodworker = lazy(() => import("./pages/Woodworker"));
const Alchemy = lazy(() => import("./pages/Alchemy"));
const Enchanting = lazy(() => import("./pages/Enchanting"));
const Jewelcrafting = lazy(() => import("./pages/Jewelcrafting"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const Login = lazy(() => import("./pages/Login"));

function AuthGuard(props: ParentProps) {
  if (!isLoggedIn()) {
    return <Navigate href="/login" />;
  }
  return <GameProvider>{props.children}</GameProvider>;
}

render(
  () => (
    <Router>
      <Route path="/login" component={Login} />
      <Route path="/" component={(p) => <AuthGuard><App {...p} /></AuthGuard>}>
        <Route path="/" component={Overview} />
        <Route path="/buildings" component={Buildings} />
        <Route path="/buildings/:id" component={BuildingDetail} />
        <Route path="/farming" component={Farming} />
        <Route path="/guild" component={AdventurersGuild} />
        <Route path="/guild/:id" component={AdventurerDetail} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/tailoring" component={Tailoring} />
        <Route path="/blacksmith" component={Blacksmith} />
        <Route path="/woodworker" component={Woodworker} />
        <Route path="/alchemy" component={Alchemy} />
        <Route path="/enchanting" component={Enchanting} />
        <Route path="/jewelcrafting" component={Jewelcrafting} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="*" component={ComingSoon} />
      </Route>
    </Router>
  ),
  document.getElementById("root")!,
);
