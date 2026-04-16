#!/usr/bin/env node
// Rename character portraits from class_origin_gender_variant → character_name
// Updates: local files, R2 CDN, premade-characters.ts, adventurers.ts

import { S3Client, PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { readFileSync, writeFileSync, renameSync, existsSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

config();

const CHARS_DIR = join(process.cwd(), "frontend/public/images/characters");
const PREMADE_FILE = join(process.cwd(), "frontend/src/data/premade-characters.ts");

// ── Step 1: Parse premade characters to build rename map ──
const src = readFileSync(PREMADE_FILE, "utf8");
const charRegex = /name:\s*"([^"]+)".*?origin:\s*"([^"]+)".*?portrait:\s*"([^"]+)"/g;
const renameMap = []; // { origin, oldPortrait, newPortrait }
let match;
while ((match = charRegex.exec(src)) !== null) {
  const [, name, origin, oldPortrait] = match;
  const newPortrait = name.toLowerCase().replace(/['']/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  renameMap.push({ origin, oldPortrait, newPortrait, name });
}
console.log(`Found ${renameMap.length} characters to rename`);

// Check for duplicate new names
const newNames = renameMap.map(r => r.newPortrait);
const dupes = newNames.filter((n, i) => newNames.indexOf(n) !== i);
if (dupes.length > 0) {
  console.error("DUPLICATE NEW NAMES:", [...new Set(dupes)]);
  process.exit(1);
}

// ── Step 2: Rename local files ──
let localRenamed = 0;
let localMissing = 0;
for (const { origin, oldPortrait, newPortrait } of renameMap) {
  const dir = join(CHARS_DIR, origin);
  for (const suffix of [".png", "_zoomed.png"]) {
    const oldPath = join(dir, oldPortrait + suffix);
    const newPath = join(dir, newPortrait + suffix);
    if (existsSync(oldPath)) {
      renameSync(oldPath, newPath);
      localRenamed++;
    } else if (suffix === ".png") {
      localMissing++;
      console.warn(`  MISSING: ${oldPath}`);
    }
  }
}
console.log(`Local: renamed ${localRenamed} files, ${localMissing} missing base files`);

// ── Step 3: Update premade-characters.ts ──
let newSrc = src;
for (const { oldPortrait, newPortrait } of renameMap) {
  newSrc = newSrc.replace(`portrait: "${oldPortrait}"`, `portrait: "${newPortrait}"`);
}
writeFileSync(PREMADE_FILE, newSrc);
console.log("Updated premade-characters.ts");

// ── Step 4: Build new portrait arrays for adventurers.ts ──
// Group by origin → "class_gender" → [portrait names]
// Also group age-tagged: origin → "class_gender_age" → [portrait names]
const portraitsByOrigin = {};
const agePortraitsByOrigin = {};
for (const { origin, oldPortrait, newPortrait } of renameMap) {
  // Parse the old portrait name to extract class, gender, age
  // Patterns: class_origin_gender_n or class_origin_gender_age_n
  const parts = oldPortrait.replace(`_${origin}_`, "_").split("_");
  // After removing origin: class_gender_n or class_gender_age_n
  const cls = parts[0];
  // Find if there's an age tag
  const ages = ["young", "middle", "mature", "old"];
  let gender, age;
  if (ages.includes(parts[2])) {
    // class_gender_age_n
    gender = parts[1];
    age = parts[2];
  } else {
    // class_gender_n
    gender = parts[1];
    age = null;
  }

  const key = `${cls}_${gender}`;
  if (!portraitsByOrigin[origin]) portraitsByOrigin[origin] = {};
  if (!portraitsByOrigin[origin][key]) portraitsByOrigin[origin][key] = [];
  portraitsByOrigin[origin][key].push(newPortrait);

  if (age) {
    const ageKey = `${cls}_${gender}_${age}`;
    if (!agePortraitsByOrigin[origin]) agePortraitsByOrigin[origin] = {};
    if (!agePortraitsByOrigin[origin][ageKey]) agePortraitsByOrigin[origin][ageKey] = [];
    agePortraitsByOrigin[origin][ageKey].push(newPortrait);
  }
}

// Write the mapping as JSON for the next step
writeFileSync(join(process.cwd(), "scripts/portrait-map.json"), JSON.stringify({
  portraitsByOrigin,
  agePortraitsByOrigin,
  renameMap: renameMap.map(r => ({ origin: r.origin, old: r.oldPortrait, new: r.newPortrait }))
}, null, 2));
console.log("Wrote portrait-map.json");

// ── Step 5: Upload new files to R2 and delete old ones ──
const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_S3_API,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET;

let uploaded = 0, deleted = 0;
const toDelete = [];

for (const { origin, oldPortrait, newPortrait } of renameMap) {
  const dir = join(CHARS_DIR, origin);
  for (const suffix of [".png", "_zoomed.png"]) {
    const newPath = join(dir, newPortrait + suffix);
    const oldKey = `images/characters/${origin}/${oldPortrait}${suffix}`;
    const newKey = `images/characters/${origin}/${newPortrait}${suffix}`;

    if (existsSync(newPath)) {
      const body = readFileSync(newPath);
      await client.send(new PutObjectCommand({
        Bucket: BUCKET, Key: newKey, Body: body,
        ContentType: "image/png",
        CacheControl: "public, max-age=31536000, immutable",
      }));
      uploaded++;
      toDelete.push({ Key: oldKey });
    }
  }
}
console.log(`R2: uploaded ${uploaded} files`);

// Delete old files in batches of 1000
for (let i = 0; i < toDelete.length; i += 1000) {
  const batch = toDelete.slice(i, i + 1000);
  await client.send(new DeleteObjectsCommand({
    Bucket: BUCKET, Delete: { Objects: batch },
  }));
}
console.log(`R2: deleted ${toDelete.length} old files`);

console.log("\nDone! Now update adventurers.ts portrait system manually.");
