import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../lib/env.js";
import path from "path";
import fs from "fs/promises";
import { logger } from "../lib/logger.js";
import { createReadStream } from "fs";
import { lookup } from "mime-types";
import { BuildError } from "../lib/build.error.js";

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
  //   endpoint: "http://localhost:4566", // TODO: remove in prod (next lines too)
  //   forcePathStyle: true,
});

// Pre-upload safety limits
const MAX_UPLOAD_SIZE_BYTES = 40 * 1024 * 1024; // 40 MB
const MAX_FILE_COUNT = 5_000;

interface ScanResult {
  fileCount: number;
  totalBytes: number;
}

/** Recursively walks `dir`, skipping excluded directories, and accumulates file count + size. */
async function scanDir(dir: string, acc: ScanResult): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      throw new BuildError(
        "[security] Symbolic links are not allowed in build output",
        ["[executor] UPLOAD BLOCKED: symbolic link detected"],
      );
    }
    if (entry.isDirectory()) {
      await scanDir(path.join(dir, entry.name), acc);
    } else if (entry.isFile()) {
      acc.fileCount += 1;
      const stat = await fs.stat(path.join(dir, entry.name));
      acc.totalBytes += stat.size;
    }
  }
}

/**
 * Validates the build output directory against upload safety limits.
 * Throws BuildError if any limit is exceeded.
 */
export async function validateOutputDir(localDir: string): Promise<void> {
  const acc: ScanResult = { fileCount: 0, totalBytes: 0 };
  await scanDir(localDir, acc);

  logger.info(
    { fileCount: acc.fileCount, totalBytes: acc.totalBytes },
    "Pre-upload validation",
  );

  if (acc.fileCount > MAX_FILE_COUNT) {
    throw new BuildError(
      `[security] Build output has ${acc.fileCount} files which exceeds the limit of ${MAX_FILE_COUNT}`,
      [
        `[executor] UPLOAD BLOCKED: too many files (${acc.fileCount} > ${MAX_FILE_COUNT}). ` +
          `Build output contains too many files. Ensure you're uploading only the generated static assets.`,
      ],
    );
  }

  const sizeMB = (acc.totalBytes / (1024 * 1024)).toFixed(2);
  if (acc.totalBytes > MAX_UPLOAD_SIZE_BYTES) {
    throw new BuildError(
      `[security] Build output is ${sizeMB} MB which exceeds the 40 MB upload limit`,
      [
        `[executor] UPLOAD BLOCKED: build output is too large (${sizeMB} MB > 40 MB). ` +
          `Reduce your build size or exclude large assets.`,
      ],
    );
  }

  logger.info(
    { fileCount: acc.fileCount, sizeMB },
    "Pre-upload validation passed",
  );
}

const pushToS3 = async (filePath: string, key: string) => {
  const pushCommand = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
    Body: createReadStream(filePath),
    ContentType: lookup(filePath) || "application/octet-stream",
  });
  await s3.send(pushCommand);
  return;
};

//TODO: uploadDir is sequential making it slow bottleneck optimal would be 10 concurrent connections/threads with promises
export const uploadDir = async (localDir: string, prefix = "") => {
  const entries = await fs.readdir(localDir, {
    withFileTypes: true,
  });
  for (const entry of entries) {
    const fullPath = path.join(localDir, entry.name); // local filesystem

    if (entry.isDirectory()) {
      await uploadDir(fullPath, path.posix.join(prefix, entry.name));
      continue;
    }
    const key = path.posix.join(prefix, entry.name); // s3 path
    await pushToS3(fullPath, key);
  }
};
