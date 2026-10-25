// Integration: the UI deploy flow against the real dev DB + SQS + GitHub.
// Requires the ShipWebsite GitHub App to be installed on at least one repo.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { createProject } from "../src/modules/projects/projects.service.js";
import { createDeployment } from "../src/modules/deployments/deployments.service.js";
import { CreateProjectSchema } from "../src/modules/projects/projects.types.js";
import { DeploymentSchema } from "../src/modules/deployments/job.types.js";
import { prisma } from "../src/lib/prisma.js";
import {
  cleanupTestUsers,
  createUserAndProject,
  firstInstalledRepo,
  awaitJobOrExecution,
  fakeCommitHash,
  type InstalledRepoLite,
} from "./integration.helpers.js";

after(async () => {
  await cleanupTestUsers();
  await prisma.$disconnect();
});

test(
  "createProject service persists the project with its environments",
  { timeout: 120_000 },
  async (t) => {
    const repo = await firstInstalledRepo();
    if (!repo) return t.skip("ShipWebsite app is not installed on any repo");
    const { user } = await createUserAndProject(repo);
    const parsed = CreateProjectSchema.parse({
      userId: user.id,
      githubRepoId: repo.id,
      name: `integration-create-${crypto.randomBytes(3).toString("hex")}`,
      repoUrl: repo.cloneUrl,
      rootDir: "",
      installCmd: "npm install",
      buildCmd: "npm run build",
      outputDir: "dist",
      framework: null,
      envVars: { SHIP_TEST_KEY: "integration" },
      environments: [
        { name: "production", branch: repo.defaultBranch, isProduction: true },
        { name: "staging", branch: "staging-branch", isProduction: false },
      ],
    });

    const project = await createProject(parsed, user.id);

    const stored = await prisma.project.findUniqueOrThrow({
      where: { id: project.id },
      include: { environments: true },
    });
    assert.equal(stored.userId, user.id);
    assert.equal(stored.name, parsed.name);
    assert.equal(stored.publicId, project.publicId);
    assert.deepEqual(stored.envVars, parsed.envVars);
    assert.deepStrictEqual(
      stored.environments.map((e) => ({ name: e.name, branch: e.branch, isProduction: e.isProduction })).sort((a, b) => a.name.localeCompare(b.name)),
      parsed.environments.sort((a, b) => a.name.localeCompare(b.name)),
    );
  },
);

test(
  "createDeployment service queues a deployable, app-authenticated job",
  { timeout: 120_000 },
  async (t) => {
    const repo = await firstInstalledRepo();
    if (!repo) return t.skip("ShipWebsite app is not installed on any repo");
    const { user, project } = await createUserAndProject(repo);
    const sha = fakeCommitHash();

    const deployment = await createDeployment(project.id, sha, user.id);

    assert.equal(deployment.projectId, project.id);
    assert.equal(deployment.commitHash, sha);
    assert.equal(deployment.status, "pending");

    const arrival = await awaitJobOrExecution(deployment.id);
    if (arrival.via === "executor") {
      // A live executor consumed the job and reported a result — enqueue
      // proven end-to-end; the SQS body was not observable.
      assert.ok(
        ["success", "failed"].includes(arrival.status),
        `executor reported ${arrival.status}`,
      );
      return;
    }
    const job = DeploymentSchema.parse(arrival.body);
    assert.equal(job.deploymentId, deployment.id);
    assert.equal(job.publicId, project.publicId);
    assert.equal(job.commitHash, sha);
    assert.match(
      job.repoUrl,
      /^https:\/\/x-access-token:.+@github\.com\//,
      "every job must clone through the GitHub App installation",
    );
    assert.equal(job.envVars?.SHIP_TEST_KEY, "integration");
  },
);
