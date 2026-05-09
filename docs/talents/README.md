# Talent Tree Diagrams

Conceptual layouts for class talent trees. These are not the final UI — they're for design discussion.

## Pure Assassin (middle tree)

Two scales of view:

### High-level overview

- **Source:** `assassin_tree.mmd`
- **Render:** `assassin_tree.png` / `.svg`

Just the cluster anchors and the spine, three columns.

### Detailed views (per column)

Each column with all minor cluster nodes and cross-bridge labels.

| Column | Source | Render |
|---|---|---|
| CENTER (Spine) | `assassin_center.mmd` | `assassin_center.png` / `.svg` |
| LEFT (Tricks &amp; Stealth — toward Venomancer) | `assassin_left.mmd` | `assassin_left.png` / `.svg` |
| RIGHT (Flurry &amp; Hunter — toward Shadowblade) | `assassin_right.mmd` | `assassin_right.png` / `.svg` |

A combined-detail view (`assassin_tree_detailed.mmd`) also exists but renders too cramped at fit-to-screen scale; use the per-column views for design work and the high-level overview for layout discussion.

## Legend

- **Gold node:** entry / starting talent
- **Purple round node:** active ability
- **Blue rectangle:** passive cluster anchor (the named "notable" of a cluster — analogous to PoE2 cluster notables)
- **Dark rectangle (small):** minor cluster talent
- **Brown rectangle (small):** bridge node — a minor talent that links two clusters together
- **Dashed outlined node:** "→ to other column / other tree" — a hint for how this column connects beyond its own bounds
- **Solid arrow:** progression within or between clusters
- **Dashed arrow:** cross-cluster bridge link

## Conceptual columns

The pure assassin tree has three internal columns:

- **CENTER — Spine.** Iconic identity. Ambush + Vanish + Exploit Weakness. Every assassin walks down some part of this.
- **LEFT — Tricks &amp; Stealth.** Pocket Sand → Smoke Bomb → Slip the Eye. Control + threat-reduction. Edge connects toward Venomancer.
- **RIGHT — Flurry &amp; Hunter.** The Flurry (combo) + Opportunist (Backstab) + Hunter's Eye (Shadow Instinct) + Throat Crush + No Honor (Dirty Fighting). Sustained-damage + anti-caster. Edge connects toward Shadowblade.

> **Caveat about the rendered images.** Mermaid's auto-layout doesn't always honor the conceptual left/right order — the LEFT subgraph may render to the right of the canvas, or below CENTER. The names refer to the game-tree's logical sides; the eventual in-game UI will lay them out as proper columns.

## Cross-cluster bridges currently drawn

- **Vanish ↔ Slip the Eye** — "stealth chain": staying stealth one extra turn after opening pairs naturally with threat reduction. Lives in LEFT (Slip the Eye), gates on CENTER (Vanish).
- **Exploit Weakness ↔ The Flurry** — "stun synergy": armor ignore on stunned targets feeds combo chance on stunned targets. Both clusters share the stun trigger via Ambush.
- **Smoke Bomb / Pocket Sand → Opportunist** — "blind → backstab": blinded targets are flagged for the Backstab passive. LEFT crosses to RIGHT.
- **Hunter's Eye ↔ The Flurry** — "caster synergy": +crit vs casters pairs with +combo vs casters. Both inside RIGHT.

## Bridges to add later

- The Flurry → Shadowblade tree: dual-wield combo scaling at the right edge.
- Smoke Bomb / Pocket Sand → Venomancer tree: blind also applies poison stack at the left edge.
- Ambush → Exploit Weakness "+Ignore on Ambush": already drawn but worth a deeper bridge node when Ambush gets its full cluster fleshed out.

## How to edit

Open any `.mmd` file in [mermaid.live](https://mermaid.live) (or VS Code's Mermaid preview). Tweak, copy back into the `.mmd`, regenerate the rendered images by running the diagram through the same tool.
