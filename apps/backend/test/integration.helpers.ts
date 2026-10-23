// Shared helpers for the integration tests: they run against the real dev
// DATABASE_URL, QUEUE_URL and api.github.com from .env.
//
// Test data is quarantined: synthetic user ids live in [1e9, 2e9) which never
// collide with real GitHub user ids; deleteMany on them cascades through
// projects -> deployments -> environments, so cleanup never touches real rows.
//
// Race note: a live executor polls the same shared queue, so it may consume
// the test's job before the test does. awaitJobOrExecution therefore accepts
// either observation. Unrelated messages are never deleted — they age out of
// their visibility timeout back to the queue.
import crypto from "crypto";
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { prisma } from "../src/lib/prisma.js";
import { env } from "../src/lib/env.js";
import { listInstalledRepos } from "../src/lib/githubApp.js";

const sqs = new SQSClient({ region: env.AWS_REGION });

export interface InstalledRepoLite {
  id: number;
  cloneUrl: string;
  defaultBranch: string;
  installationId: number;
}

// Removes every leftover test user (from earlier crashed runs included).
export async function cleanupTestUsers() {
  await prisma.user.deleteMany({
    where: { id: { gte: 1_000_000_000, lt: 2_000_000_000 } },
  });
}

export async function firstInstalledRepo(): Promise<InstalledRepoLite | null> {
  const repos = await listInstalledRepos();
  return repos[0] ?? null;
}

// An installed repo with no existing rows of any user, so webhook-fan-out
// only touches test data.
export async function unusedInstalledRepo(): Promise<InstalledRepoLite | null> {
  const repos = await listInstalledRepos();
  if (repos.length === 0) return null;
  const used = await prisma.project.findMany({
    where: { githubRepoId: { in: repos.map((repo) => BigInt(repo.id)) } },
    select: { githubRepoId: true },
  });
  return (
    repos.find(
      (repo) => !used.some((project) => project.githubRepoId === BigInt(repo.id)),
    ) ?? null
  );
}

export function fakeCommitHash(): string {
  return crypto.randomBytes(20).toString("hex");
}

export async function createUserAndProject(repo: InstalledRepoLite) {
  await cleanupTestUsers();
  const userId =
    1_000_000_000 + Math.floor(Math.random() * 1_000_000_000);
  const suffix = `${userId}${crypto.randomBytes(2).toString("hex")}`;
  const user = await prisma.user.create({
    data: {
      id: userId,
      email: `ship-integration-${suffix}@test.invalid`,
      login: `ship-integration-${suffix}`,
      accessToken: "integration-test-token",
      avatarUrl: "https://example.com/avatar.png",
    },
  });
  const project = await prisma.project.create({
    data: {
      publicId: crypto.randomBytes(8).toString("hex"),
      userId: user.id,
      githubRepoId: BigInt(repo.id),
      name: `ship-integration-${suffix}`,
      repoUrl: repo.cloneUrl,
      // the UI always normalizes this to "" — keep the test row honest
      rootDir: "",
      envVars: { SHIP_TEST_KEY: "integration" },
      environments: {
        create: [{ name: "production", branch: repo.defaultBranch, isProduction: true }],
      },
    },
    include: { environments: true },
  });
  return { user, project };
}

export type JobArrival =
  | { via: "sqs"; body: Record<string, unknown> }
  | { via: "executor"; status: string };

export async function awaitJobOrExecution(
  deploymentId: number,
): Promise<JobArrival> {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const { Messages } = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: env.QUEUE_URL,
        MaxNumberOfMessages: 5,
        WaitTimeSeconds: 10,
      }),
    );
    for (const message of Messages ?? []) {
      const body = JSON.parse(message.Body!) as Record<string, unknown>;
      if (body.deploymentId === deploymentId) {
        await sqs.send(
          new DeleteMessageCommand({
            QueueUrl: env.QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle,
          }),
        );
        return { via: "sqs", body };
      }
    }
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });
    if (deployment && deployment.status !== "pending") {
      return { via: "executor", status: deployment.status };
    }
  }
  throw new Error(
    `No SQS job or status change observed for deployment ${deploymentId} within 60s`,
  );
}

// Minimal Response double: records status/json, nothing else.
export function fakeRes() {
  const res: any = { statusCode: 0, body: undefined };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: unknown) => {
    res.body = payload;
    return res;
  };
  res.sendStatus = (code: number) => {
    res.statusCode = code;
    return res;
  };
  return res;
}
