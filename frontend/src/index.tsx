import { ErrorBoundary, lazy, type ParentProps } from "solid-js";
import { render } from "solid-js/web";
import { Router, Route, Navigate } from "@solidjs/router";
import App from "./App";
import { GameProvider } from "./engine/gameState";
import { isLoggedIn, logout } from "./api/auth";
import { wsClient } from "./api/ws";
import "./styles/global.css";

// Open the realtime WS if we already have a token (returning visitor).
if (isLoggedIn()) wsClient.connect();

/** Fallback shown when a render-time error crashes the app tree (the Sidebar
 *  logout button is unreachable in that case). Gives the user a way to wipe
 *  their local save and re-auth from a clean slate. */
function CrashFallback(props: { err: unknown; reset: () => void }) {
  const message = props.err instanceof Error ? props.err.message : String(props.err);
  return (
    <div style={{
      "max-width": "520px", margin: "80px auto", padding: "24px",
      "font-family": "system-ui, sans-serif", color: "#e6e1d7",
      background: "rgba(30, 25, 20, 0.9)",
      border: "1px solid rgba(180, 150, 100, 0.4)", "border-radius": "8px",
    }}>
      <h1 style={{ margin: "0 0 12px 0", "font-size": "1.4rem" }}>Something went wrong.</h1>
      <p style={{ "line-height": "1.5", color: "#c9c1b1" }}>
        The game ran into an unexpected error. This can happen if your saved data
        drifted out of sync with a new release. Log out to clear your local save
        and start fresh — your account on the server will still be there.
      </p>
      <pre style={{
        background: "rgba(0,0,0,0.3)", padding: "10px", "border-radius": "4px",
        "font-size": "0.75rem", "white-space": "pre-wrap", "word-break": "break-word",
        color: "#e67e22", "margin-bottom": "16px",
      }}>{message}</pre>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => props.reset()}
          style={{
            padding: "8px 16px", border: "1px solid rgba(180, 150, 100, 0.4)",
            background: "transparent", color: "#e6e1d7", "border-radius": "4px",
            cursor: "pointer",
          }}
        >Try again</button>
        <button
          onClick={() => logout()}
          style={{
            padding: "8px 16px", border: "1px solid rgba(231, 76, 60, 0.5)",
            background: "rgba(231, 76, 60, 0.15)", color: "#e74c3c",
            "border-radius": "4px", cursor: "pointer",
          }}
        >Log out &amp; clear save</button>
      </div>
    </div>
  );
}

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
const Leatherworking = lazy(() => import("./pages/Leatherworking"));
const Alchemy = lazy(() => import("./pages/Alchemy"));
const Enchanting = lazy(() => import("./pages/Enchanting"));
const Jewelcrafting = lazy(() => import("./pages/Jewelcrafting"));
const Kitchen = lazy(() => import("./pages/Kitchen"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const WorldMap = lazy(() => import("./pages/WorldMap"));
const Chronicle = lazy(() => import("./pages/Chronicle"));
const Friends = lazy(() => import("./pages/Friends"));
const Shrine = lazy(() => import("./pages/Shrine"));
const CharacterEncyclopedia = lazy(() => import("./pages/CharacterEncyclopedia"));
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
    <ErrorBoundary fallback={(err, reset) => <CrashFallback err={err} reset={reset} />}>
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
        <Route path="/leatherworking" component={Leatherworking} />
        <Route path="/alchemy" component={Alchemy} />
        <Route path="/enchanting" component={Enchanting} />
        <Route path="/jewelcrafting" component={Jewelcrafting} />
        <Route path="/kitchen" component={Kitchen} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/map" component={WorldMap} />
        <Route path="/chronicle" component={Chronicle} />
        <Route path="/friends" component={Friends} />
        <Route path="/encyclopedia" component={CharacterEncyclopedia} />
        <Route path="/shrine" component={Shrine} />
        <Route path="*" component={ComingSoon} />
      </Route>
    </Router>
    </ErrorBoundary>
  ),
  document.getElementById("root")!,
);
