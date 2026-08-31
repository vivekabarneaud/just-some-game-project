import type { ExpeditionTemplate } from "./types.js";

// ─── Starter Expeditions ────────────────────────────────────────
// Multi-event missions. Each event slot resolves in order as the mission ticks.
// See docs/DESIGN_EXPEDITIONS.md.

export const EXPEDITION_POOL: ExpeditionTemplate[] = [
  // ── Spider Hollow Descent — forest/cave ────────────────────────
  {
    id: "spider_hollow_descent",
    name: "Spider Hollow Descent",
    description: "The well at the eastern edge drops deeper than anyone remembered. Your scouts report tunnels beyond, silk-clogged and humming. Descend, clear what can be cleared, and bring back what's worth taking.",
    icon: "🕳️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/spider_hollow.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 1800, // 30 min
    rewards: [{ resource: "gold", amount: 40 }, { resource: "stone", amount: 30 }],
    deployCost: 10,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["combat", "dungeon", "exploration"],
    biome: "Cave",
    events: [
      // Event 1: fixed light combat to warm up
      { type: "fixed", event: { kind: "combat", encounters: [{ enemyId: "cave_spinner", count: 1 }] } },
      // Event 2: random pool — mostly combat, sometimes a cache
      { type: "random", pool: [
        { weight: 3, event: { kind: "combat", encounters: [{ enemyId: "cave_spinner", count: 2 }] } },
        { weight: 1, event: { kind: "treasure", rewards: [{ resource: "gold", amount: 25 }] } },
        { weight: 1, event: { kind: "trap", dcStat: "dex", dc: 10, damagePct: 15 } },
      ]},
      // Event 3: the broodmother chamber
      { type: "fixed", event: { kind: "combat", encounters: [{ enemyId: "cave_spinner", count: 3 }] } },
      // Event 4: the loot chamber
      { type: "fixed", event: { kind: "treasure", rewards: [{ resource: "gold", amount: 60 }, { resource: "stone", amount: 25 }] } },
    ],
  },

  // ── Burnt Crypt Expedition — undead dungeon ────────────────────
];
