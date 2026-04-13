import { Show, type ParentProps } from "solid-js";
import Sidebar from "./components/Sidebar";
import ResourceBar from "./components/ResourceBar";
import CinematicOverlay from "./components/CinematicOverlay";
import { INTRO_CINEMATIC } from "./data/cinematics";
import { useGame } from "./engine/gameState";

export default function App(props: ParentProps) {
  const { state, actions } = useGame();

  return (
    <>
      {/* Intro cinematic — shows once for new settlements */}
      <Show when={!state.introSeen}>
        <CinematicOverlay
          slides={INTRO_CINEMATIC}
          villageName={state.villageName}
          onComplete={() => actions.markIntroSeen()}
        />
      </Show>

      <div class="app-layout">
        <Sidebar />
        <header class="topbar">
          <ResourceBar />
        </header>
        <main class="content">{props.children}</main>
      </div>
    </>
  );
}
