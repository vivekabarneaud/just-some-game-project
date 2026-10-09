import { For, Show, createMemo, createSignal, onMount } from "solid-js";
import { A } from "@solidjs/router";
import { useGame, buildingOfFounder } from "~/engine/gameState";
import { BUILDINGS } from "~/data/buildings";
import { settlers, adventurers, visitors, type FolkPerson } from "~/data/folk";
import FolkCard from "~/components/FolkCard";
import FolkModal from "~/components/FolkModal";

/**
 * The Folk: every named person in the settlement, on one page.
 *
 * Before this page, illness lived on a building card and an adventurer lived on
 * their own route. A person was something you found by looking for their job.
 * Here the person comes first, and the job is one line on their card.
 *
 * The page is never gated on a building. Six founders exist from the first
 * minute, and the Thornwoods can arrive before the guild hall stands.
 */

const HEAD = {
  "font-family": "var(--font-heading)", "font-size": "1.05rem",
  margin: "22px 0 10px", color: "var(--text-primary)",
} as const;
const COUNT = { color: "var(--text-muted)", "font-size": "0.8rem", "font-weight": 400 } as const;

export default function Folk() {
  const { state, actions } = useGame();
  const [open, setOpen] = createSignal<FolkPerson | null>(null);

  // The guild's roster tab used to clear the sidebar spark. The roster is gone,
  // so this page carries that job. Without it the "new!" dot never clears.
  onMount(() => { actions.markAdventurersSeen(); });

  /** A founder's workplace, as a name a player reads, not a building id. */
  const workplaceOf = (founderId: string) => {
    const bid = buildingOfFounder(founderId);
    if (!bid) return undefined;
    // A founder is assigned to a building that may not stand yet. Say nothing
    // rather than promise a job at a building the player has not built.
    const built = state.buildings.find((b) => b.buildingId === bid);
    if (!built || built.level <= 0) return undefined;
    return BUILDINGS.find((b) => b.id === bid)?.name ?? bid;
  };

  const theSettlers = createMemo(() => settlers(state, workplaceOf));
  const theAdventurers = createMemo(() => adventurers(state));
  const theVisitors = createMemo(() => visitors(state));

  const Group = (p: { title: string; icon: string; people: FolkPerson[]; empty: string }) => (
    <>
      <h2 style={HEAD}>
        {p.icon} {p.title} <span style={COUNT}>· {p.people.length}</span>
      </h2>
      <Show
        when={p.people.length > 0}
        fallback={<p style={{ color: "var(--text-muted)", "font-size": "0.85rem", "font-style": "italic" }}>{p.empty}</p>}
      >
        <div class="recruit-grid">
          <For each={p.people}>
            {(person) => <FolkCard person={person} onOpen={setOpen} />}
          </For>
        </div>
      </Show>
    </>
  );

  return (
    <div>
      <h1 class="page-title">The Folk</h1>
      <p style={{ color: "var(--text-muted)", "font-size": "0.85rem", "font-style": "italic", "margin-bottom": "4px" }}>
        A settlement is the people in it. Here they all are.
      </p>

      <Group title="Settlers" icon="🏘️" people={theSettlers()}
        empty="Nobody yet." />

      <Group title="Adventurers" icon="⚔️" people={theAdventurers()}
        empty="No one has taken your coin yet. Build the guild hall and send word." />
      <Show when={state.adventurers.some((a) => !a.alive)}>
        <p style={{ "font-size": "0.8rem", "margin-top": "10px" }}>
          <A href="/shrine" style={{ color: "var(--text-muted)" }}>
            Those you lost are remembered at the shrine.
          </A>
        </p>
      </Show>

      <Group title="Visitors" icon="🧳" people={theVisitors()}
        empty="Nobody is passing through today." />

      <Show when={open()}>
        {(person) => <FolkModal person={person()} onClose={() => setOpen(null)} />}
      </Show>
    </div>
  );
}
