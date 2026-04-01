import { prisma } from "../lib/prisma.js";

const DEFAULT_WORLD_NAME = "Eldoria";
const MIN_SETTLEMENT_DISTANCE = 30;

export async function getOrCreateDefaultWorld() {
  let world = await prisma.world.findUnique({ where: { name: DEFAULT_WORLD_NAME } });
  if (!world) {
    world = await prisma.world.create({
      data: { name: DEFAULT_WORLD_NAME, width: 1000, height: 1000, maxSettlements: 50 },
    });
  }
  return world;
}

export async function randomPosition(worldId: string, width: number, height: number): Promise<{ x: number; y: number }> {
  const existing = await prisma.settlement.findMany({
    where: { worldId },
    select: { x: true, y: true },
  });

  const margin = 20;
  for (let attempt = 0; attempt < 100; attempt++) {
    const x = margin + Math.floor(Math.random() * (width - 2 * margin));
    const y = margin + Math.floor(Math.random() * (height - 2 * margin));

    const tooClose = existing.some(
      (s) => Math.hypot(s.x - x, s.y - y) < MIN_SETTLEMENT_DISTANCE
    );

    if (!tooClose) return { x, y };
  }

  // Fallback: just pick random coords if we can't find a spaced spot
  return {
    x: margin + Math.floor(Math.random() * (width - 2 * margin)),
    y: margin + Math.floor(Math.random() * (height - 2 * margin)),
  };
}
