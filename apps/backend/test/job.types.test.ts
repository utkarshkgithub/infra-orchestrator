import { test } from "node:test";
import assert from "node:assert/strict";
import { JobSchema } from "../src/modules/deployments/job.types.js";

const baseJob = {
  publicId: "abc123",
  repoUrl: "https://github.com/owner/repo",
  rootDir: "",
  installCmd: "npm install",
  buildCmd: "npm run build",
  outputDir: "dist",
  framework: null,
  envVars: {},
};

test("JobSchema accepts a short commit hash (7 hex chars)", () => {
  assert.doesNotThrow(() => JobSchema.parse({ ...baseJob, commitHash: "abcdef1" }));
});

test("JobSchema accepts a full commit hash (40 hex chars)", () => {
  const full = "a".repeat(40);
  assert.doesNotThrow(() => JobSchema.parse({ ...baseJob, commitHash: full }));
});

test("JobSchema rejects too-short commit hashes", () => {
  assert.throws(() => JobSchema.parse({ ...baseJob, commitHash: "abcdef" }));
});

test("JobSchema rejects too-long commit hashes", () => {
  assert.throws(() => JobSchema.parse({ ...baseJob, commitHash: "a".repeat(41) }));
});

test("JobSchema rejects non-hex commit hashes", () => {
  assert.throws(() => JobSchema.parse({ ...baseJob, commitHash: "zzzzzzz" }));
});

test("JobSchema rejects a malformed repoUrl", () => {
  assert.throws(() => JobSchema.parse({ ...baseJob, commitHash: "abcdef1", repoUrl: "not a url" }));
});