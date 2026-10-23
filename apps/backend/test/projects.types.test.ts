import { test } from "node:test";
import assert from "node:assert/strict";
import { CreateProjectSchema, UpdateProjectSchema } from "../src/modules/projects/projects.types.js";

const validEnvironment = { name: "production", branch: "main", isProduction: true };

test("CreateProjectSchema parses a minimal valid create body", () => {
  const parsed = CreateProjectSchema.parse({
    userId: 1,
    githubRepoId: 123,
    name: "my-site",
    repoUrl: "https://github.com/owner/repo",
    environments: [validEnvironment],
  });
  assert.equal(parsed.name, "my-site");
  assert.equal(parsed.rootDir, "");
  assert.equal(parsed.installCmd, "npm install");
  assert.equal(parsed.buildCmd, "npm run build");
  assert.equal(parsed.outputDir, "dist");
  assert.deepEqual(parsed.envVars, {});
  assert.equal(parsed.framework, undefined);
});

test("CreateProjectSchema rejects a body without environments (regression: create would 500)", () => {
  assert.throws(() => CreateProjectSchema.parse({
    userId: 1,
    githubRepoId: 123,
    name: "my-site",
    repoUrl: "https://github.com/owner/repo",
  }));
});

test("CreateProjectSchema rejects a non-github repoUrl", () => {
  assert.throws(() => CreateProjectSchema.parse({
    userId: 1,
    githubRepoId: 123,
    name: "my-site",
    repoUrl: "https://gitlab.com/owner/repo",
    environments: [validEnvironment],
  }));
});

test("CreateProjectSchema allows a nullable framework", () => {
  const parsed = CreateProjectSchema.parse({
    userId: 1,
    githubRepoId: 123,
    name: "my-site",
    repoUrl: "https://github.com/owner/repo",
    framework: null,
    environments: [validEnvironment],
  });
  assert.equal(parsed.framework, null);
});

test("UpdateProjectSchema requires an id on top of CreateProjectSchema", () => {
  assert.throws(() => UpdateProjectSchema.parse({
    userId: 1,
    githubRepoId: 123,
    name: "my-site",
    repoUrl: "https://github.com/owner/repo",
    environments: [validEnvironment],
  }));
  const parsed = UpdateProjectSchema.parse({
    id: 7,
    userId: 1,
    githubRepoId: 123,
    name: "my-site",
    repoUrl: "https://github.com/owner/repo",
    environments: [validEnvironment],
  });
  assert.equal(parsed.id, 7);
});