import { prisma } from "../lib/prisma.js";
import { SPAWN_MASK } from "../data/spawnMask.js";

const DEFAULT_WORLD_NAME = "Valenheart";
const MIN_SETTLEMENT_DISTANCE = 30;
const MASK_GRID = SPAWN_MASK.length; // 100

function isLand(x: number, y: number, width: number, height: number): boolean {
  const gx = Math.min(MASK_GRID - 1, Math.max(0, Math.floor((x / width) * MASK_GRID)));
  const gy = Math.min(MASK_GRID - 1, Math.max(0, Math.floor((y / height) * MASK_GRID)));
  return SPAWN_MASK[gy]?.[gx] === "1";
}

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
  for (let attempt = 0; attempt < 500; attempt++) {
    const x = margin + Math.floor(Math.random() * (width - 2 * margin));
    const y = margin + Math.floor(Math.random() * (height - 2 * margin));

    if (!isLand(x, y, width, height)) continue;

    const tooClose = existing.some(
      (s) => Math.hypot(s.x - x, s.y - y) < MIN_SETTLEMENT_DISTANCE
    );

    if (!tooClose) return { x, y };
  }

  // Fallback: find any land position
  for (let attempt = 0; attempt < 100; attempt++) {
    const x = margin + Math.floor(Math.random() * (width - 2 * margin));
    const y = margin + Math.floor(Math.random() * (height - 2 * margin));
    if (isLand(x, y, width, height)) return { x, y };
  }

  return { x: Math.floor(width / 2), y: Math.floor(height / 2) };
}
