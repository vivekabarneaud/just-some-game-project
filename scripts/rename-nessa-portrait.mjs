#!/usr/bin/env node
// One-off: rename Brenna Thornwood's portrait on R2 to Nessa (char_000 renamed).
// Server-side copy (no download), verify, then delete the old — a true rename.
// Handles every variant present (.png and _zoomed.png) via a prefix list.

import { S3Client, CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";
import { config } from "dotenv";

config();

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_S3_API,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET;
const OLD = "brenna_thornwood";
const NEW = "nessa_thornwood";
const PREFIX = `images/characters/ashwick/${OLD}`;

// 1. List every object under the old portrait name (.png, _zoomed.png, …).
const listed = await client.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: PREFIX }));
const oldKeys = (listed.Contents ?? []).map((o) => o.Key);
console.log("Old objects found:", oldKeys.length ? oldKeys : "(none)");
if (oldKeys.length === 0) {
  console.error("Nothing to rename — no objects match the prefix. Aborting (no changes made).");
  process.exit(1);
}

const pairs = oldKeys.map((oldKey) => ({ oldKey, newKey: oldKey.replaceAll(OLD, NEW) }));

// 2. Server-side copy each (preserves the original content-type / cache headers).
for (const { oldKey, newKey } of pairs) {
  await client.send(new CopyObjectCommand({ Bucket: BUCKET, CopySource: `${BUCKET}/${oldKey}`, Key: newKey }));
  console.log(`Copied:   ${oldKey}  →  ${newKey}`);
}

// 3. Verify every new object actually landed BEFORE deleting anything.
for (const { newKey } of pairs) {
  await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: newKey }));
  console.log(`Verified: ${newKey}`);
}

// 4. Only now delete the old ones — the bytes live on under the new name.
for (const { oldKey } of pairs) {
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: oldKey }));
  console.log(`Deleted:  ${oldKey}`);
}

console.log("\n✅ Done — Nessa's portrait is renamed on R2.");
