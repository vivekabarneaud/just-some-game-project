import type { ParentProps } from "solid-js";
import Sidebar from "./components/Sidebar";
import ResourceBar from "./components/ResourceBar";

export default function App(props: ParentProps) {
  return (
    <div class="app-layout">
      <Sidebar />
      <header class="topbar">
        <ResourceBar />
      </header>
      <main class="content">{props.children}</main>
    </div>
  );
}
