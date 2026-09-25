# Presentation pages

Snapshots of the two Claude artifacts used to present Valenheart to collaborators.
The live pages are edited through Claude Code and republished; these files are the
backup, re-exported after each working session.

| File | What it is | Live page |
|---|---|---|
| `parcel-14.html` | The first hour of the game as plain facts, with a switch between what the player knows and what is true. Editable in place when opened as its owner. | https://claude.ai/code/artifact/5fb29820-7a48-4fc2-a1d1-0336f4086206 |
| `valenheart-tree.html` | The lore as a zoomable tree, from the eight gods down to the end of Act 1. Every node is approved bullets now except three (the cult assault, the northern war, Halldora's failing binding), which still carry the older paragraph text. | https://claude.ai/artifact/ExUDsjUzBphKzfNahEnDbR |

Both open directly in a browser from disk, with no server and nothing to install, which
is how to give the tree to someone outside the organization when link-sharing is blocked.

In the tree: **drag a node** to move it, **drag the gold square** at its lower-right corner
to resize it, and drag the background to pan. An arrangement is saved per browser and can
be handed back with **Copy layout** to be baked into the published page for everyone.
Edges are drawn faintly and light up for whichever node is hovered or open. The band at the
bottom, **Not written yet**, is deliberate: it holds the parts of the story that do not
exist on paper.

Both open directly in a browser from disk. The tree's data (eras, nodes, edges, bullets)
is the JSON block inside `valenheart-tree.html`. A bullet starting with two spaces is a
sub-bullet; one starting with `~` is marked undecided; `**text**` is emphasis.

Canon decisions made while writing these pages that are NOT yet in `docs/lore/TIMELINE.md`
are tracked in Claude's memory notes and should be folded into the timeline on its next
revision: Netheron's death as an accident in the six's hands (his light fell, not his body);
the Eighth as truly evil, sealed for the imbalance his cruelty caused; the Church's one-god
teaching as the Lord's education; Nordveld as Ashwick's lifelong enemy who honour Netheron;
Nell speaks and Tomas is mute; Corin has no notebook; Parcel 14 is a wild clearing.
