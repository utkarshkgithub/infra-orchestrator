import { mockClient } from "aws-sdk-client-mock";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.unstable_mockModule("../src/lib/logger.js", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  },
}));

const sqsMock = mockClient(SQSClient);

const { pushDeploymentService } = await import("../src/utils/sqs.js");
const { env } = await import("../src/lib/env.js");

const job = {
  publicId: "abc123",
  deploymentId: 10,
  repoUrl: "https://github.com/utkarsh/demo-repo",
  rootDir: "/",
  installCmd: "npm install",
  buildCmd: "npm run build",
  outputDir: "dist",
  framework: null,
  envVars: { NODE_ENV: "production" },
};

beforeEach(() => {
  sqsMock.reset();
});

describe("pushDeploymentService", () => {
  it("sends the job as a JSON message body", async () => {
    sqsMock.on(SendMessageCommand).resolves({ MessageId: "msg-1" });

    await pushDeploymentService(job);

    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(1);
    const input = sqsMock.commandCalls(SendMessageCommand)[0].args[0].input;
    expect(input.QueueUrl).toBe(env.QUEUE_URL);
    expect(JSON.parse(input.MessageBody as string)).toEqual(job);
  });

  it("throws AppError 500 when SQS send fails", async () => {
    sqsMock.on(SendMessageCommand).rejects(new Error("SQS unavailable"));

    await expect(pushDeploymentService(job)).rejects.toMatchObject({
      statusCode: 500,
      message: "Failed to push job",
    });
  });
});