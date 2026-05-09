# Talent Tree Diagrams

Conceptual layouts for class talent trees. These are not the final UI — they're for design discussion.

## Pure Assassin (middle tree)

- **Source:** `assassin_tree.mmd` (Mermaid)
- **Render:** `assassin_tree.png` / `assassin_tree.svg`

### Layout legend

- **Gold node:** entry / starting talent
- **Purple round node:** active ability
- **Blue rectangle:** passive cluster (the named anchor of a cluster — "notable" in PoE2 terms)
- **Solid arrow:** progression within a cluster or down the tree
- **Dashed arrow:** cross-cluster bridge (a small linking node that ties two clusters together)

### Conceptual columns

The pure assassin tree has three internal columns:

- **CENTER — Spine.** Iconic identity. Ambush + Vanish + Exploit Weakness. Every assassin walks down some part of this.
- **LEFT — Tricks &amp; Stealth.** Pocket Sand → Smoke Bomb → Slip the Eye. Control + threat-reduction. Edge connects toward the Venomancer tree.
- **RIGHT — Flurry &amp; Hunter.** The Flurry (combo attacks) + Opportunist (Backstab) + Hunter's Eye (Shadow Instinct) + Throat Crush + No Honor (Dirty Fighting). Sustained-damage + anti-caster. Edge connects toward the Shadowblade tree.

> **Caveat about the rendered image.** Mermaid's auto-layout doesn't always honor the conceptual left/right order — the LEFT subgraph may render to the right of the canvas, or below CENTER. The names refer to the game-tree's logical sides (the eventual UI will lay them out as columns properly), not to pixel positions in the diagram.

### Cross-cluster bridges currently shown

- **Vanish → Slip the Eye** — "stealth chain": staying stealth one extra turn after opening pairs naturally with threat reduction.
- **Exploit Weakness → The Flurry** — "stun synergy": armor ignore on stunned targets links to combo chance on stunned targets.
- **Smoke Bomb → Opportunist** — "blind → backstab": blinded targets are flagged for the Backstab passive.

Other bridges to consider but not yet drawn:

- Hunter's Eye ↔ The Flurry: combo chance vs casters.
- Ambush ↔ Exploit Weakness: armor ignore on Ambush-opener.
- The Flurry edge → Shadowblade: dual-wield scaling for combo procs.
- Smoke Bomb / Pocket Sand edge → Venomancer: blind also applies poison stack.

### How to edit

Open `assassin_tree.mmd` in any Mermaid-aware tool (mermaid.live, VS Code's Mermaid preview, GitHub's renderer when committed). Re-render after edits.
