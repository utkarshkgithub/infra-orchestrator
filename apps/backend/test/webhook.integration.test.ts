// Integration: the GitHub push webhook against the real dev DB + SQS + GitHub.
// Requires the ShipWebsite GitHub App installed on a repo that no user has
// imported yet, so the fan-out above our test project stays empty.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { createDeploymentWebhook } from "../src/modules/githubApp/githubApp.controller.js";
import { DeploymentSchema } from "../src/modules/deployments/job.types.js";
import { env } from "../src/lib/env.js";
import { prisma } from "../src/lib/prisma.js";
import {
  cleanupTestUsers,
  createUserAndProject,
  unusedInstalledRepo,
  awaitJobOrExecution,
  fakeRes,
  type InstalledRepoLite,
} from "./integration.helpers.js";

after(async () => {
  await cleanupTestUsers();
  await prisma.$disconnect();
});

function signPushWebhook(rawBody: Buffer): string {
  return (
    "sha256=" +
    crypto.createHmac("sha256", env.GITHUB_APP_SECRET).update(rawBody).digest("hex")
  );
}

test(
  "signed push webhook creates a deployment and enqueues its job",
  { timeout: 120_000 },
  async (t) => {
    const repo: InstalledRepoLite | null = await unusedInstalledRepo();
    if (!repo) {
      return t.skip(
        "no installed repo free of existing projects — use one nobody has imported",
      );
    }
    const { project } = await createUserAndProject(repo);
    const sha = crypto.randomBytes(20).toString("hex");
    const rawBody = Buffer.from(
      JSON.stringify({
        after: sha,
        repository: { id: repo.id },
        installation: { id: repo.installationId },
        head_commit: {
          author: {
            name: "Integration Test",
            username: "integration-test",
            email: "integration@test.invalid",
          },
          message: "test push from integration suite",
        },
      }),
    );

    const req: any = {
      headers: {
        "x-hub-signature-256": signPushWebhook(rawBody),
        "x-github-event": "push",
      },
      body: JSON.parse(rawBody.toString()),
      rawBody,
    };
    const res = fakeRes();
    await createDeploymentWebhook(req, res);

    assert.equal(res.statusCode, 200);

    const rows = await prisma.deployment.findMany({
      where: { projectId: project.id },
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].commitHash, sha);
    assert.equal(rows[0].commitMessage, "test push from integration suite");
    assert.equal(rows[0].commitAuthorUsername, "integration-test");
    assert.equal(rows[0].commitAuthorName, "Integration Test");
    assert.equal(rows[0].commitAuthorEmail, "integration@test.invalid");

    const arrival = await awaitJobOrExecution(rows[0].id);
    if (arrival.via === "executor") {
      assert.ok(
        ["success", "failed"].includes(arrival.status),
        `executor reported ${arrival.status}`,
      );
      return;
    }
    const job = DeploymentSchema.parse(arrival.body);
    assert.equal(job.deploymentId, rows[0].id);
    assert.match(
      job.repoUrl,
      /^https:\/\/x-access-token:.+@github\.com\//,
      "webhook jobs must clone through the GitHub App installation",
    );
  },
);
