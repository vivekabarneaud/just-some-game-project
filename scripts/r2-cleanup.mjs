#!/usr/bin/env node
// R2 cleanup — reorganize items/* into per-craft-building subfolders.
//
// Steps:
//   1. Build canonical URL for every item image in items.ts (by recipe.building).
//   2. For each item whose image URL doesn't match canonical:
//        - copy the source file on R2 (old key → new key) if needed
//        - rewrite the URL in items.ts
//   3. Print a list of R2 keys that are now unreferenced (orphans) for a
//      follow-up delete step (--delete flag).
//
// Run with --dry-run first to preview. Re-run with --apply to make changes.
// Re-run with --delete to purge orphans.

import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { config } from "dotenv";

config();

const APPLY = process.argv.includes("--apply");
const DO_DELETE = process.argv.includes("--delete");

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_S3_API,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET;
const BASE = process.env.R2_PUBLIC_URL + "/";

// ── Parse crafting recipes ─────────────────────────────────────────
const craftSrc = readFileSync("frontend/src/engine/crafting.ts", "utf8");
const alchSrc = readFileSync("shared/src/data/alchemy_recipes.ts", "utf8");

const recipeBuilding = {};
// Match id + building pair within a recipe object
const pat = /id: "([^"]+)"[^}]*?building: "([^"]+)"/g;
let m;
while ((m = pat.exec(craftSrc)) !== null) recipeBuilding[m[1]] = m[2];
// Alchemy recipes don't have a `building` field, but they all craft at alchemy_lab
const alchIdPat = /^\s*id: "([^"]+)"/gm;
while ((m = alchIdPat.exec(alchSrc)) !== null) {
  if (!recipeBuilding[m[1]]) recipeBuilding[m[1]] = "alchemy_lab";
}

// Map code building name → R2 subfolder name
const FOLDER = {
  blacksmith: "blacksmith",
  woodworker: "woodworker",
  tailoring_shop: "tailoring",
  leatherworking: "leatherworking",
  jewelcrafter: "jewelcrafting",
  kitchen: "kitchens",
  alchemy_lab: "alchemy_lab",
};

// Items without a recipe — hand-assigned
const EXTRA_ITEM_FOLDER = {
  alpha_fang_amulet: "jewelcrafting",
  witch_eye_pendant: "jewelcrafting",
  beast_heart_charm: "jewelcrafting",
  infernal_signet: "jewelcrafting",
  goblin_crown: "jewelcrafting", // head-slot, but also a material drop
};

// ── Parse items.ts, compute canonical URL for each ─────────────────
const itemsPath = "shared/src/data/items.ts";
const itemsSrc = readFileSync(itemsPath, "utf8");
const itemsArrMatch = itemsSrc.match(/export const ITEMS: ItemDefinition\[\] = \[([\s\S]*?)\n\];/);
if (!itemsArrMatch) throw new Error("Could not locate ITEMS array");
const itemsBlock = itemsArrMatch[1];

// Rough split on "  {"; each entry keeps its fields
const entries = itemsBlock.split(/\n  \{\n/).slice(1);
const rewrites = []; // { oldUrl, newUrl, id, folder }

for (const e of entries) {
  const id = (e.match(/id: "([^"]+)"/) || [])[1];
  if (!id) continue;
  const recipeId = (e.match(/recipeId: "([^"]+)"/) || [])[1];
  const imageMatch = e.match(/image: "(https:\/\/[^"]+\/images\/items\/[^"]+\.png)"/);
  if (!imageMatch) continue;
  const oldUrl = imageMatch[1];

  const building = recipeId ? recipeBuilding[recipeId] : null;
  const folder = (building && FOLDER[building]) || EXTRA_ITEM_FOLDER[id];
  if (!folder) continue;

  const basename = oldUrl.split("/").pop();
  const newUrl = `${BASE}images/items/${folder}/${basename}`;
  if (oldUrl !== newUrl) rewrites.push({ id, oldUrl, newUrl, folder, basename });
}

console.log(`Found ${rewrites.length} item URLs to relocate into craft subfolders.\n`);

// ── List existing R2 keys to know what's already there ────────────
const r2keys = new Set();
let token;
do {
  const r = await client.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: "images/items/",
    ContinuationToken: token,
  }));
  for (const o of r.Contents ?? []) r2keys.add(o.Key);
  token = r.NextContinuationToken;
} while (token);

// ── Plan: for each rewrite, figure out if we need to copy ─────────
const toCopy = [];
const publicCopies = []; // also mirror into frontend/public so re-uploads align
for (const rw of rewrites) {
  const oldKey = rw.oldUrl.replace(BASE, "");
  const newKey = rw.newUrl.replace(BASE, "");
  if (!r2keys.has(newKey)) {
    if (!r2keys.has(oldKey)) {
      console.warn(`  ⚠ missing source on R2: ${oldKey}`);
      continue;
    }
    toCopy.push({ oldKey, newKey });
  }
  publicCopies.push({
    from: join("frontend/public", oldKey),
    to: join("frontend/public", newKey),
  });
}

console.log(`R2 copies needed: ${toCopy.length}`);
console.log(`URL rewrites in items.ts: ${rewrites.length}\n`);

// Preview a handful
console.log("Sample rewrites:");
for (const rw of rewrites.slice(0, 5)) {
  console.log(`  ${rw.id}`);
  console.log(`    - ${rw.oldUrl}`);
  console.log(`    + ${rw.newUrl}`);
}
if (rewrites.length > 5) console.log(`  ... and ${rewrites.length - 5} more`);

if (!APPLY && !DO_DELETE) {
  console.log("\n(dry-run — pass --apply to execute copies + rewrite items.ts)");
  process.exit(0);
}

// ── Apply: copy on R2, rewrite items.ts, mirror into public ───────
if (APPLY) {
  console.log("\nApplying R2 copies...");
  for (const { oldKey, newKey } of toCopy) {
    await client.send(new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${oldKey}`,
      Key: newKey,
      CacheControl: "public, max-age=31536000, immutable",
    }));
    r2keys.add(newKey);
    console.log(`  ✓ ${oldKey} → ${newKey}`);
  }

  console.log("\nMirroring into frontend/public/ ...");
  for (const { from, to } of publicCopies) {
    if (!existsSync(from)) continue;
    if (!existsSync(dirname(to))) mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
  }

  console.log("\nRewriting items.ts ...");
  let updated = itemsSrc;
  for (const rw of rewrites) {
    updated = updated.split(rw.oldUrl).join(rw.newUrl);
  }
  writeFileSync(itemsPath, updated);
  console.log(`  ✓ ${rewrites.length} URLs rewritten`);
}

// ── Delete: remove flat orphans that are now dead ─────────────────
if (DO_DELETE) {
  console.log("\nComputing orphans...");
  // Re-read items.ts to find all currently-referenced URLs
  const freshItems = readFileSync(itemsPath, "utf8");
  const { execSync } = await import("child_process");
  const grepOut = execSync(
    `grep -roh "images/[a-zA-Z0-9_/.-]*\\.png" shared/src frontend/src`,
    { encoding: "utf8" }
  );
  const referenced = new Set(grepOut.split("\n").map((s) => s.trim()).filter(Boolean));
  const orphans = [...r2keys].filter((k) => k.startsWith("images/items/") && !referenced.has(k));
  // Keep truly unused items that aren't duplicates — user asked to keep these
  const KEEP = new Set([
    "images/items/cinnamon_honeycake.png",
    "images/items/fiery_broth.png",
    "images/items/royal_feast.png",
    "images/items/shepherds_pie.png",
    "images/items/spiced_stew.png",
    "images/items/steeped_tea_leaves.png",
    "images/items/kitchens/cinnamon_honeycake.png",
    "images/items/kitchens/fiery_broth.png",
    "images/items/kitchens/royal_feast.png",
    "images/items/kitchens/shepherds_pie.png",
    "images/items/kitchens/spiced_stew.png",
    "images/items/kitchens/steeped_tea_leaves.png",
    "images/items/novice_item_frame.png",
  ]);
  const toDelete = orphans.filter((k) => !KEEP.has(k));
  console.log(`Orphans to delete: ${toDelete.length}`);
  toDelete.forEach((k) => console.log(`  - ${k}`));

  for (const key of toDelete) {
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    console.log(`  ✗ deleted ${key}`);
  }
}
