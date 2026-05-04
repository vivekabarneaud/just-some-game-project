#!/usr/bin/env node
// Upload sound effects to Cloudflare R2 under the sfx/ prefix.
// Usage: node scripts/upload-sfx.mjs <file1.wav> [file2.wav ...]
// Each file lands at <R2_PUBLIC_URL>/sfx/<basename>.

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, statSync } from "fs";
import { basename } from "path";
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
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

const CONTENT_TYPES = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
};

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error("Usage: node scripts/upload-sfx.mjs <file1.wav> [file2.wav ...]");
    process.exit(1);
  }

  for (const file of files) {
    const stat = statSync(file);
    if (!stat.isFile()) {
      console.error(`Not a file: ${file}`);
      continue;
    }
    const ext = file.slice(file.lastIndexOf("."));
    const contentType = CONTENT_TYPES[ext.toLowerCase()] ?? "application/octet-stream";
    const key = `sfx/${basename(file)}`;
    const body = readFileSync(file);

    await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }));

    const sizeKB = (body.length / 1024).toFixed(1);
    console.log(`  ✓ ${key} (${sizeKB} KB) — ${PUBLIC_URL}/${key}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
