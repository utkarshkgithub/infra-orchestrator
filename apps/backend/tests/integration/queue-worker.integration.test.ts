import { SQSClient, CreateQueueCommand, ReceiveMessageCommand, DeleteMessageCommand, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";
import { describe, expect, it, jest } from "@jest/globals";

/**
 * Queue -> worker integration test against Floci (MIT-licensed AWS emulator,
 * drop-in LocalStack replacement — no license token needed).
 *
 * Exercises the REAL AWS SDK path end-to-end: the backend enqueues a job via
 * pushDeploymentService, then we consume it the way the executor worker does
 * (ReceiveMessageCommand + JobSchema.parse) and verify both schemas accept the
 * same payload — proving the backend/worker queue contract.
 *
 * Skipped unless RUN_INTEGRATION=true and Floci is reachable on :4566.
 * Runs in CI via `.github/workflows/test.yml` (job: integration).
 */

const RUN_INTEGRATION = process.env.RUN_INTEGRATION === "true";
const FLOCI_ENDPOINT = process.env.FLOCI_ENDPOINT ?? "http://localhost:4566";

if (RUN_INTEGRATION) {
  process.env.AWS_REGION = "us-east-1";
  process.env.AWS_ACCESS_KEY_ID = "test";
  process.env.AWS_SECRET_ACCESS_KEY = "test";
  process.env.AWS_ENDPOINT_URL_SQS = FLOCI_ENDPOINT;
}

jest.unstable_mockModule("../../src/lib/env.js", () => ({
  env: {
    AWS_REGION: "us-east-1",
    QUEUE_URL: `${FLOCI_ENDPOINT}/000000000000/integration-jobs`,
    NODE_ENV: "test",
  },
}));

jest.unstable_mockModule("../../src/lib/logger.js", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  },
}));

const { pushDeploymentService } = await import("../../src/utils/sqs.js");
const { JobSchema: BackendJobSchema } = await import(
  "../../src/modules/deployments/job.types.js"
);
const { JobSchema: ExecutorJobSchema } = await import(
  "../../../executor/src/lib/job.js"
);

const QUEUE_URL = `${FLOCI_ENDPOINT}/000000000000/integration-jobs`;
const client = new SQSClient({ region: "us-east-1" });

const job = {
  publicId: "abc123",
  deploymentId: 42,
  repoUrl: "https://github.com/utkarsh/demo-repo",
  rootDir: "/",
  installCmd: "npm install",
  buildCmd: "npm run build",
  outputDir: "dist",
  framework: "react",
  envVars: { NODE_ENV: "production" },
};

const skip = RUN_INTEGRATION ? describe : describe.skip;

skip("queue -> worker flow (Floci emulator)", () => {
  beforeAll(async () => {
    await client.send(
      new CreateQueueCommand({ QueueName: "integration-jobs" }),
    );
  });

  it("enqueues a job that the worker schema can consume", async () => {
    await pushDeploymentService(job);

    const { Messages } = await client.send(
      new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
        WaitTimeSeconds: 2,
        MaxNumberOfMessages: 1,
      }),
    );

    expect(Messages).toBeDefined();
    expect(Messages!.length).toBe(1);

    const rawBody = Messages![0].Body!;
    const parsedByBackend = BackendJobSchema.safeParse(JSON.parse(rawBody));
    const parsedByExecutor = ExecutorJobSchema.safeParse(JSON.parse(rawBody));

    expect(parsedByBackend.success).toBe(true);
    expect(parsedByExecutor.success).toBe(true);
    expect(parsedByExecutor.data).toMatchObject({
      deploymentId: 42,
      publicId: "abc123",
      repoUrl: "https://github.com/utkarsh/demo-repo",
    });

    await client.send(
      new DeleteMessageCommand({
        QueueUrl: QUEUE_URL,
        ReceiptHandle: Messages![0].ReceiptHandle!,
      }),
    );
  });

  it("reports zero messages after the job is deleted", async () => {
    const { Attributes } = await client.send(
      new GetQueueAttributesCommand({
        QueueUrl: QUEUE_URL,
        AttributeNames: ["ApproximateNumberOfMessages"],
      }),
    );

    expect(Attributes?.ApproximateNumberOfMessages).toBe("0");
  });
});