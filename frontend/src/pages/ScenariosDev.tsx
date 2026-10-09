import { For, Show, createSignal } from "solid-js";
import {
  writeSaveAndReload, snapshotSavedGame, restoreSavedSnapshot,
  hasSavedSnapshot, savedSnapshotTime,
} from "~/engine/gameState";
import { SCENARIOS, buildScenario, type Scenario } from "~/data/scenarios";
import { BUILDINGS } from "~/data/buildings";
import { PREMADE_CHARACTERS } from "@medieval-realm/shared/data/premade-characters";
import { getAilment } from "@medieval-realm/shared/data/ailments";
import FramedModal from "~/components/FramedModal";

/** TEMP dev page (/dev-scenarios) — start the game at a chosen point.
 *
 *  Testing a change used to mean replaying from the first winter. Pick a
 *  scenario, confirm, and the save is replaced and the page reloads. It is
 *  the same route the dev snapshot restore takes, so the normal load pipeline
 *  runs against the new save and nothing is special-cased.
 *
 *  THE SAVE IS OVERWRITTEN. The confirm step is the whole safety net, and the
 *  snapshot buttons at the foot of the page are how you keep what you have. */

const CARD = {
  background: "var(--bg-card)", border: "1px solid var(--border-color)",
  "border-radius": "8px", padding: "16px 18px",
  display: "flex", "flex-direction": "column", gap: "8px",
} as const;

const nameOfBuilding = (id: string) => BUILDINGS.find((b) => b.id === id)?.name ?? id;
const nameOfPremade = (id: string) => PREMADE_CHARACTERS.find((c) => c.id === id)?.name ?? id;

/** What a recipe will actually do, in the words the game uses. The player of
 *  this page is the developer, and they need to know before they overwrite. */
function Summary(props: { scenario: Scenario }) {
  const sc = () => props.scenario;
  const rows = () => {
    const out: [string, string][] = [];
    const b = Object.entries(sc().buildings ?? {});
    if (b.length) out.push(["Buildings", b.map(([id, lv]) => `${nameOfBuilding(id)} ${lv}`).join(", ")]);
    if (sc().storyDone?.length) out.push(["Story behind you", sc().storyDone!.join(", ")]);
    if (sc().questsDone?.length) out.push(["Quests claimed", sc().questsDone!.join(", ")]);
    const r = Object.entries(sc().roster ?? {});
    if (r.length) out.push(["Roster", r.map(([id, lv]) => `${nameOfPremade(id)} Lv.${lv}`).join(", ")]);
    const res = Object.entries(sc().resources ?? {});
    if (res.length) out.push(["Store", res.map(([k, v]) => `${v} ${k}`).join(", ")]);
    const f = Object.entries(sc().foods ?? {});
    if (f.length) out.push(["Larder", f.map(([k, v]) => `${v} ${k}`).join(", ")]);
    const c = Object.entries(sc().citizens ?? {});
    if (c.length) out.push(["Folk", c.map(([k, v]) => `${v} ${k}`).join(", ")]);
    const a = Object.entries(sc().ailments ?? {});
    if (a.length) out.push(["Ailing", a.map(([p, id]) => `${p}: ${getAilment(id)?.name ?? id}`).join(", ")]);
    if (sc().season) out.push(["Season", `${sc().season}, year ${sc().year ?? 1}`]);
    if (sc().tweak) out.push(["Also", "a tweak the recipe could not say in fields"]);
    return out;
  };

  return (
    <Show
      when={rows().length > 0}
      fallback={<div style={{ color: "var(--text-muted)", "font-size": "0.85rem", "font-style": "italic" }}>
        Nothing. This is the fresh state.
      </div>}
    >
      <For each={rows()}>
        {([label, value]) => (
          <div style={{ "font-size": "0.82rem", "line-height": 1.5 }}>
            <span style={{ color: "var(--accent-gold)" }}>{label}:</span>{" "}
            <span style={{ color: "var(--text-secondary)" }}>{value}</span>
          </div>
        )}
      </For>
    </Show>
  );
}

export default function ScenariosDev() {
  const [confirming, setConfirming] = createSignal<Scenario | null>(null);
  // Read once at mount: the page is standalone, so nothing changes these under
  // it except its own buttons, which reload or set the signal.
  const [snapAt, setSnapAt] = createSignal<number | null>(savedSnapshotTime());
  const [snapExists, setSnapExists] = createSignal(hasSavedSnapshot());

  return (
    <div>
      <h1 class="page-title">Start from here</h1>
      <p style={{ color: "var(--text-muted)", "font-size": "0.85rem", "margin-bottom": "6px" }}>
        A scenario is a recipe over a fresh state, not a saved game, so it never
        goes stale when the save shape changes. Applying one <b>overwrites your
        save</b> and reloads.
      </p>
      <p style={{ color: "var(--text-muted)", "font-size": "0.85rem", "margin-bottom": "18px" }}>
        Add one in <code>frontend/src/data/scenarios.ts</code>. A test checks
        that every building, hero and mission a recipe names still exists.
      </p>

      <div style={{
        display: "grid", "grid-template-columns": "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px",
      }}>
        <For each={SCENARIOS}>
          {(sc) => (
            <div style={CARD}>
              <div style={{ "font-family": "var(--font-heading)", "font-size": "1.05rem" }}>{sc.name}</div>
              <div style={{ color: "var(--text-muted)", "font-size": "0.82rem", "font-style": "italic", "line-height": 1.5 }}>
                {sc.blurb}
              </div>
              <div style={{ "border-top": "1px solid var(--border-color)", "padding-top": "8px", "margin-top": "2px" }}>
                <Summary scenario={sc} />
              </div>
              <button class="btn-primary" style={{ "margin-top": "auto", "align-self": "flex-start" }}
                onClick={() => setConfirming(sc)}>
                Start from here
              </button>
            </div>
          )}
        </For>
      </div>

      {/* Keeping what you have, before you throw it away. */}
      <div style={{
        "margin-top": "28px", "padding-top": "16px", "border-top": "1px solid var(--border-color)",
        display: "flex", gap: "10px", "flex-wrap": "wrap", "align-items": "center",
      }}>
        {/* This page runs outside the game, so it copies the SAVED game, not
            the live one. Open the game once to flush the live state first. */}
        <button class="btn-tertiary"
          onClick={() => { if (snapshotSavedGame()) { setSnapAt(savedSnapshotTime()); setSnapExists(true); } }}>
          📸 Snapshot the saved game
        </button>
        <button class="btn-tertiary" disabled={!snapExists()}
          onClick={() => restoreSavedSnapshot()}>
          ↩︎ Restore the snapshot
        </button>
        <Show when={snapAt()}>
          {(t) => (
            <span style={{ color: "var(--text-muted)", "font-size": "0.8rem" }}>
              Taken {new Date(t()).toLocaleString()}
            </span>
          )}
        </Show>
      </div>

      <Show when={confirming()}>
        {(sc) => (
          <FramedModal title={sc().name} icon="⚠️" maxWidth="520px" onClose={() => setConfirming(null)}
            subtitle="This replaces your save">
            <div style={{ display: "flex", "flex-direction": "column", gap: "14px" }}>
              <div style={{ "font-size": "0.88rem", "line-height": 1.6, color: "var(--text-secondary)" }}>
                Your current settlement goes away and cannot come back, unless
                you took a snapshot first.
              </div>
              <div><Summary scenario={sc()} /></div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button class="btn-primary" onClick={() => writeSaveAndReload(buildScenario(sc()))}>
                  Overwrite and start
                </button>
                <button class="btn-tertiary" onClick={() => setConfirming(null)}>Keep my save</button>
              </div>
            </div>
          </FramedModal>
        )}
      </Show>
    </div>
  );
}
