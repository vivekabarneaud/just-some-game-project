#!/usr/bin/env node
// Upload all images from frontend/public/images/ to Cloudflare R2
// Usage: node scripts/upload-to-r2.mjs

import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { config } from "dotenv";

config(); // Load .env

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_S3_API,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET;
const IMAGES_DIR = join(process.cwd(), "frontend/public/images");
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

// Recursively find all files
function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (entry.endsWith(".png") || entry.endsWith(".jpg") || entry.endsWith(".webp")) {
      files.push(full);
    }
  }
  return files;
}

// Check what's already uploaded
async function listExisting() {
  const existing = new Set();
  let token;
  do {
    const res = await client.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: "images/",
      ContinuationToken: token,
    }));
    for (const obj of res.Contents ?? []) {
      existing.add(obj.Key);
    }
    token = res.NextContinuationToken;
  } while (token);
  return existing;
}

async function main() {
  const files = walk(IMAGES_DIR);
  console.log(`Found ${files.length} images in ${IMAGES_DIR}`);

  const existing = await listExisting();
  console.log(`Already uploaded: ${existing.size} files`);

  let uploaded = 0;
  let skipped = 0;

  for (const file of files) {
    const key = "images/" + relative(IMAGES_DIR, file);
    if (existing.has(key)) {
      skipped++;
      continue;
    }

    const contentType = file.endsWith(".png") ? "image/png"
      : file.endsWith(".jpg") ? "image/jpeg"
      : file.endsWith(".webp") ? "image/webp"
      : "application/octet-stream";

    const body = readFileSync(file);
    await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }));

    uploaded++;
    console.log(`  ✓ ${key} (${(body.length / 1024 / 1024).toFixed(1)} MB)`);
  }

  console.log(`\nDone! Uploaded: ${uploaded}, Skipped: ${skipped}, Total: ${files.length}`);
  console.log(`\nPublic URL base: ${PUBLIC_URL}/images/`);
}

main().catch((err) => { console.error(err); process.exit(1); });
