#!/usr/bin/env node
// Second pass: catch single-line kitchen food items my entry-split missed.

import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, writeFileSync } from "fs";
import { config } from "dotenv";

config();
const APPLY = process.argv.includes("--apply");

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_S3_API,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET;

// Kitchen recipe IDs — scan crafting.ts
const craftSrc = readFileSync("frontend/src/engine/crafting.ts", "utf8");
const kitchenIds = new Set();
const pat = /id: "([^"]+)"[^}]*?building: "kitchen"/g;
let m;
while ((m = pat.exec(craftSrc)) !== null) kitchenIds.add(m[1]);

// Now find every flat URL in items.ts and rewrite those whose basename matches a kitchen recipe
const itemsPath = "shared/src/data/items.ts";
let itemsSrc = readFileSync(itemsPath, "utf8");
const urlPat = /"(https:\/\/[^"]+\/images\/items\/)([a-z_0-9-]+)\.png"/g;
const rewrites = [];
while ((m = urlPat.exec(itemsSrc)) !== null) {
  const base = m[1]; // https://.../images/items/
  const id = m[2];
  if (!kitchenIds.has(id)) continue;
  const oldUrl = `${base}${id}.png`;
  const newUrl = `${base}kitchens/${id}.png`;
  rewrites.push({ id, oldUrl, newUrl });
}

// Dedupe
const uniq = new Map();
for (const r of rewrites) uniq.set(r.oldUrl, r);
const list = [...uniq.values()];
console.log(`Kitchen URLs to relocate: ${list.length}`);

if (!APPLY) {
  list.slice(0, 10).forEach((r) => console.log(`  ${r.id}: flat → kitchens/`));
  if (list.length > 10) console.log(`  ... and ${list.length - 10} more`);
  console.log("\n(dry-run — pass --apply to copy + rewrite + delete orphans)");
  process.exit(0);
}

// R2 key check + copy
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

const toDelete = [];
for (const r of list) {
  const oldKey = r.oldUrl.replace(/https:\/\/[^/]+\//, "");
  const newKey = r.newUrl.replace(/https:\/\/[^/]+\//, "");
  if (!r2keys.has(newKey)) {
    if (!r2keys.has(oldKey)) {
      console.warn(`  ⚠ missing on R2: ${oldKey}`);
      continue;
    }
    await client.send(new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${oldKey}`,
      Key: newKey,
      CacheControl: "public, max-age=31536000, immutable",
    }));
    console.log(`  ✓ ${oldKey} → ${newKey}`);
  }
  toDelete.push(oldKey);
}

// Rewrite items.ts
for (const r of list) itemsSrc = itemsSrc.split(r.oldUrl).join(r.newUrl);
writeFileSync(itemsPath, itemsSrc);
console.log(`  ✓ ${list.length} URLs rewritten in items.ts`);

// Delete orphans
for (const key of toDelete) {
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  console.log(`  ✗ deleted ${key}`);
}
