import { ErrorBoundary, createSignal, lazy, type ParentProps } from "solid-js";
import { render } from "solid-js/web";
import { Router, Route, Navigate } from "@solidjs/router";
import App from "./App";
import { GameProvider } from "./engine/gameState";
import { isLoggedIn, logout } from "./api/auth";
import { wsClient } from "./api/ws";
import "./styles/global.css";

// Open the realtime WS if we already have a token (returning visitor).
if (isLoggedIn()) wsClient.connect();

// Self-heal after deploys: when Vercel replaces the hashed JS chunks while a
// tab is open, the next lazy route import 404s and Vite fires this event.
// One automatic reload picks up the fresh index.html; the sessionStorage
// guard prevents a reload loop if something is genuinely broken.
window.addEventListener("vite:preloadError", (event) => {
  const KEY = "valenheart.chunkReloadAt";
  const last = Number(sessionStorage.getItem(KEY) ?? "0");
  if (Date.now() - last > 30_000) {
    event.preventDefault(); // we handle it; don't surface the error
    sessionStorage.setItem(KEY, String(Date.now()));
    window.location.reload();
  }
});

/** Fallback shown when a render-time error crashes the app tree (the Sidebar
 *  logout button is unreachable in that case). Gives the user a way to wipe
 *  their local save and re-auth from a clean slate. */
function CrashFallback(props: { err: unknown; reset: () => void }) {
  const e = props.err;
  const message = e instanceof Error ? e.message : String(e);
  const stack = e instanceof Error ? (e.stack ?? "") : "";
  // One blob the user can copy and paste into chat. Includes the URL +
  // timestamp + UA so the bug report has the context that matters even on
  // mobile, where dev tools aren't easily available.
  const report = [
    `Time: ${new Date().toISOString()}`,
    `URL: ${typeof window !== "undefined" ? window.location.href : ""}`,
    `UA: ${typeof navigator !== "undefined" ? navigator.userAgent : ""}`,
    "",
    `Error: ${message}`,
    stack ? `\nStack:\n${stack}` : "",
  ].join("\n");

  const [copied, setCopied] = createSignal(false);
  const copyReport = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
      } else {
        // Fallback for older mobile browsers without the Clipboard API.
        const ta = document.createElement("textarea");
        ta.value = report;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div style={{
      "max-width": "640px", margin: "40px auto", padding: "24px",
      "font-family": "system-ui, sans-serif", color: "#e6e1d7",
      background: "rgba(30, 25, 20, 0.9)",
      border: "1px solid rgba(180, 150, 100, 0.4)", "border-radius": "8px",
    }}>
      <h1 style={{ margin: "0 0 12px 0", "font-size": "1.4rem" }}>Something went wrong.</h1>
      <p style={{ "line-height": "1.5", color: "#c9c1b1" }}>
        The game ran into an unexpected error. This can happen if your saved data
        drifted out of sync with a new release. Tap Copy details and paste it back
        to me so I can investigate, then Try again or log out to start clean. Your
        account on the server will still be there.
      </p>
      <div style={{ position: "relative", "margin-bottom": "16px" }}>
        <pre style={{
          background: "rgba(0,0,0,0.3)", padding: "10px", "padding-right": "92px",
          "border-radius": "4px",
          "font-size": "0.72rem", "white-space": "pre-wrap", "word-break": "break-word",
          color: "#e67e22", "max-height": "260px", "overflow": "auto",
          margin: 0,
        }}>{report}</pre>
        <button
          onClick={copyReport}
          style={{
            position: "absolute", top: "8px", right: "8px",
            padding: "4px 10px",
            border: "1px solid rgba(180, 150, 100, 0.5)",
            background: copied() ? "rgba(46, 204, 113, 0.25)" : "rgba(0, 0, 0, 0.4)",
            color: copied() ? "#2ecc71" : "#e6e1d7",
            "border-radius": "4px", cursor: "pointer",
            "font-size": "0.72rem",
          }}
        >{copied() ? "Copied" : "Copy details"}</button>
      </div>
      <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
        <button
          onClick={() => props.reset()}
          style={{
            padding: "8px 16px", border: "1px solid rgba(180, 150, 100, 0.4)",
            background: "transparent", color: "#e6e1d7", "border-radius": "4px",
            cursor: "pointer",
          }}
        >Try again</button>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "8px 16px", border: "1px solid rgba(180, 150, 100, 0.4)",
            background: "transparent", color: "#e6e1d7", "border-radius": "4px",
            cursor: "pointer",
          }}
        >Reload page</button>
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
const Tavern = lazy(() => import("./pages/Tavern"));
const WorldMap = lazy(() => import("./pages/WorldMap"));
const Chronicle = lazy(() => import("./pages/Chronicle"));
const Friends = lazy(() => import("./pages/Friends"));
const Shrine = lazy(() => import("./pages/Shrine"));
const Defenses = lazy(() => import("./pages/Defenses"));
const QuestLog = lazy(() => import("./pages/QuestLog"));
const CharacterEncyclopedia = lazy(() => import("./pages/CharacterEncyclopedia"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const FramePreview = lazy(() => import("./pages/FramePreview")); // TEMP dev-only, remove after frame tuning
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
        <Route path="/tavern" component={Tavern} />
        <Route path="/map" component={WorldMap} />
        <Route path="/chronicle" component={Chronicle} />
        <Route path="/friends" component={Friends} />
        <Route path="/encyclopedia" component={CharacterEncyclopedia} />
        <Route path="/shrine" component={Shrine} />
        <Route path="/defenses" component={Defenses} />
        <Route path="/quests" component={QuestLog} />
        <Route path="/dev-frames" component={FramePreview} />{/* TEMP dev-only, remove after frame tuning */}
        <Route path="*" component={ComingSoon} />
      </Route>
    </Router>
    </ErrorBoundary>
  ),
  document.getElementById("root")!,
);
