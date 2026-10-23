// E2E: a REAL git push to a live repo fires the REAL GitHub webhook over the
// network; the executor then builds the pushed commit and reports success.
//
// Requires:
// - the ShipWebsite app installed (read-only) on SHIP_E2E_REPO (default:
//   utkarshkgithub/utkarsh-portfolio) so webhooks + authenticated builds work,
// - SHIP_E2E_PAT: a fine-grained PAT with Contents: Write on that repo — the
//   app permission stays read-only, so users never get a write consent,
// - an executor polling QUEUE_URL, dev DB reachable.
//
// Side effects (accepted by design): pushes one empty test commit to the
// repo's default branch; leaves one S3 artifact under a random publicId;
// test DB rows cascade out via cleanup.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { prisma } from "../src/lib/prisma.js";
import { listInstalledRepos } from "../src/lib/githubApp.js";
import { cleanupTestUsers, createUserAndProject } from "./integration.helpers.js";

const exec = promisify(execCb);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const E2E_REPO = process.env.SHIP_E2E_REPO ?? "utkarshkgithub/utkarsh-portfolio";

// never leak the push credential into reported output
export function redact(token: string | null, text: string) {
  return token ? text.replaceAll(token, "<redacted>") : text;
}

after(async () => {
  await cleanupTestUsers();
  await prisma.$disconnect();
});

test(
  "real push -> real webhook -> executor builds the pushed commit successfully",
  { timeout: 15 * 60_000 },
  async (t) => {
    const repos = await listInstalledRepos();
    const repo = repos.find(
      (r) => r.fullName.toLowerCase() === E2E_REPO.toLowerCase(),
    );
    if (!repo) {
      return t.skip(
        `GitHub App is not installed on ${E2E_REPO} (set SHIP_E2E_REPO to change)`,
      );
    }
    const pat = process.env.SHIP_E2E_PAT;
    if (!pat) {
      return t.skip(
        "SHIP_E2E_PAT not set — add a fine-grained PAT with Contents: Write " +
          "on the E2E repo to apps/backend/.env",
      );
    }

    // Mirror the build config of the real project row for this repo, so the
    // executor builds it the same way the owner configured it.
    const existing = await prisma.project.findFirst({
      where: { githubRepoId: BigInt(repo.id) },
      orderBy: { id: "desc" },
    });
    const userData = await createUserAndProject(repo);
    if (existing) {
      await prisma.project.update({
        where: { id: userData.project.id },
        data: {
          rootDir: existing.rootDir,
          installCmd: existing.installCmd,
          buildCmd: existing.buildCmd,
          outputDir: existing.outputDir,
          framework: existing.framework,
        },
      });
    }

    // Push an empty commit authored by the integration identity.
    const dir = `/tmp/opencode/ship-e2e-${crypto.randomBytes(3).toString("hex")}`;
    const git = async (cmd: string) =>
      exec(`git -C ${dir} ${cmd}`).catch((err) => {
        // git surfaces remote URLs containing the PAT on failures
        throw new Error(redact(pat, String(err.stderr ?? err)));
      });
    await exec(`git init -q ${dir}`);
    await git(
      `remote add origin https://x-access-token:${pat}@github.com/${repo.fullName}.git`,
    );
    await git(`fetch -q origin ${repo.defaultBranch} --depth=1`);
    const tree = (await git("rev-parse FETCH_HEAD^{tree}")).stdout.trim();
    const commit = (
      await git(
        `-c user.name="Ship Integration Test" -c user.email="integration@test.invalid" commit-tree ${tree} -p FETCH_HEAD -m "ship-website integration push"`,
      )
    ).stdout.trim();

    await git(`push origin ${commit}:${repo.defaultBranch}`);

    // The real webhook arrives here over HTTPS on GitHub's side; assert its
    // effect: a deployment for our project of exactly the pushed commit, and
    // a real build finishing successfully (executor polls the shared queue).
    const deadline = Date.now() + 12 * 60_000;
    let deployment = null;
    while (Date.now() < deadline) {
      const rows = await prisma.deployment.findMany({
        where: {
          projectId: userData.project.id,
          commitHash: commit,
        },
        orderBy: { id: "desc" },
      });
      if (rows.length > 0) {
        deployment = rows[0];
        if (deployment.status === "success") break;
        if (deployment.status === "failed") {
          assert.fail(
            redact(
              pat,
              `executor reported failed build — logs:\n${deployment.logs ?? "<none>"}`,
            ),
          );
        }
      }
      await sleep(5_000);
    }
    if (!deployment) {
      assert.fail(
        "no deployment was created for the pushed commit — is the backend " +
          "receiving webhooks and reachable?",
      );
    }
    assert.equal(deployment.status, "success");
  },
);
