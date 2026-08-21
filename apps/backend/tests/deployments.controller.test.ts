import { mockClient } from "aws-sdk-client-mock";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { Request } from "express";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { mockPrisma, sampleProject, sampleDeployment } from "./helpers/prisma.js";
import { createMockResponse } from "./helpers/response.js";

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  prisma: mockPrisma(),
}));

jest.unstable_mockModule("../src/lib/logger.js", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  },
}));

jest.unstable_mockModule("../src/utils/preview.service.js", () => ({
  generateProjectPreview: jest.fn(),
}));

const { prisma } = await import("../src/lib/prisma.js");
const { generateProjectPreview } = await import("../src/utils/preview.service.js");
const {
  getDeploymentDetails,
  getAllDeployments,
  newDeployment,
  updateDeployment,
  updateDeploymentWorker,
} = await import("../src/modules/deployments/deployments.controller.js");

const sqsMock = mockClient(SQSClient);
const mockedPrisma = prisma as unknown as ReturnType<typeof mockPrisma>;
const mockedPreview = generateProjectPreview as unknown as jest.Mock;

function buildRequest(overrides: Partial<Request> = {}): Request {
  return {
    params: {},
    query: {},
    body: {},
    user: { id: 1 },
    get: jest.fn(),
    ...overrides,
  } as unknown as Request;
}

beforeEach(() => {
  sqsMock.reset();
  sqsMock.on(SendMessageCommand).resolves({ MessageId: "msg-1" });
  process.env.DEPLOY_QUEUE_URL = "https://sqs.mock/queue";
  mockedPreview.mockReset();
});

describe("triggerDeployment handler (newDeployment)", () => {
  it("queues a job and returns 201 on valid input", async () => {
    mockedPrisma.project.findUnique.mockResolvedValue(sampleProject);
    mockedPrisma.deployment.create.mockResolvedValue(sampleDeployment);

    const res = createMockResponse();
    const req = buildRequest({ body: { projectId: 1 } });

    await newDeployment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.body).toEqual(sampleDeployment);
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(1);
    const sent = JSON.parse(
      sqsMock.commandCalls(SendMessageCommand)[0].args[0].input.MessageBody as string,
    );
    expect(sent.deploymentId).toBe(10);
  });

  it("returns the deployment without hitting SQS when project is unauthorized", async () => {
    mockedPrisma.project.findUnique.mockResolvedValue({
      ...sampleProject,
      userId: 99,
    });

    const res = createMockResponse();
    const req = buildRequest({ body: { projectId: 1 } });

    await expect(newDeployment(req, res)).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(0);
  });

  it("rejects when the project does not exist", async () => {
    mockedPrisma.project.findUnique.mockResolvedValue(null);

    const res = createMockResponse();
    const req = buildRequest({ body: { projectId: 404 } });

    await expect(newDeployment(req, res)).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(0);
  });

  it("rejects a non-integer projectId via zod parse", async () => {
    const res = createMockResponse();
    const req = buildRequest({ body: { projectId: "abc" } });

    await expect(newDeployment(req, res)).rejects.toMatchObject({
      name: "ZodError",
    });
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(0);
  });

  it("propagates AppError 500 when SQS push fails after deployment is created", async () => {
    mockedPrisma.project.findUnique.mockResolvedValue(sampleProject);
    mockedPrisma.deployment.create.mockResolvedValue(sampleDeployment);
    sqsMock.on(SendMessageCommand).rejects(new Error("SQS unavailable"));

    const res = createMockResponse();
    const req = buildRequest({ body: { projectId: 1 } });

    await expect(newDeployment(req, res)).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});

describe("status handler (getDeploymentDetails)", () => {
  it("returns 200 with deployment details when it exists", async () => {
    mockedPrisma.deployment.findUnique.mockResolvedValue(sampleDeployment);

    const res = createMockResponse();
    const req = buildRequest({ params: { id: "10" } });

    await getDeploymentDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual(sampleDeployment);
    expect(mockedPrisma.deployment.findUnique).toHaveBeenCalledWith({
      where: { id: 10, project: { userId: 1 } },
    });
  });

  it("returns null (empty) when the deployment does not exist for this user", async () => {
    mockedPrisma.deployment.findUnique.mockResolvedValue(null);

    const res = createMockResponse();
    const req = buildRequest({ params: { id: "999" } });

    await getDeploymentDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toBeNull();
  });

  it("handles a non-numeric deployment id", async () => {
    mockedPrisma.deployment.findUnique.mockResolvedValue(null);

    const res = createMockResponse();
    const req = buildRequest({ params: { id: "abc" } });

    await getDeploymentDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockedPrisma.deployment.findUnique).toHaveBeenCalledWith({
      where: { id: NaN, project: { userId: 1 } },
    });
  });

  it("propagates a database error as 500", async () => {
    mockedPrisma.deployment.findUnique.mockRejectedValue(new Error("db down"));

    const res = createMockResponse();
    const req = buildRequest({ params: { id: "10" } });

    await expect(getDeploymentDetails(req, res)).rejects.toThrow("db down");
  });
});

describe("list handler (getAllDeployments)", () => {
  it("returns an empty list when the user has no deployments", async () => {
    mockedPrisma.deployment.findMany.mockResolvedValue([]);

    const res = createMockResponse();
    const req = buildRequest();

    await getAllDeployments(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual([]);
    expect(mockedPrisma.deployment.findMany).toHaveBeenCalledWith({
      where: { project: { userId: 1 } },
    });
  });

  it("returns all deployments for the user", async () => {
    mockedPrisma.deployment.findMany.mockResolvedValue([sampleDeployment]);

    const res = createMockResponse();
    const req = buildRequest();

    await getAllDeployments(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual([sampleDeployment]);
  });

  it("propagates a database error as 500", async () => {
    mockedPrisma.deployment.findMany.mockRejectedValue(new Error("db down"));

    const res = createMockResponse();
    const req = buildRequest();

    await expect(getAllDeployments(req, res)).rejects.toThrow("db down");
  });
});

describe("updateDeployment handler", () => {
  it("updates an owned deployment and returns 200", async () => {
    mockedPrisma.deployment.findFirst.mockResolvedValue(sampleDeployment);
    mockedPrisma.deployment.update.mockResolvedValue({
      ...sampleDeployment,
      status: "success",
      logs: "done",
    });

    const res = createMockResponse();
    const req = buildRequest({
      body: { id: 10, status: "success", logs: "done" },
    });

    await updateDeployment(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body.status).toBe("success");
    expect(mockedPrisma.deployment.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { id: 10, status: "success", logs: "done" },
    });
  });

  it("throws 403 when the deployment is not owned by the user", async () => {
    mockedPrisma.deployment.findFirst.mockResolvedValue(null);

    const res = createMockResponse();
    const req = buildRequest({ body: { id: 10, status: "success" } });

    await expect(updateDeployment(req, res)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("throws a zod error for an invalid status value", async () => {
    const res = createMockResponse();
    const req = buildRequest({
      body: { id: 10, status: "not-a-status" },
    });

    await expect(updateDeployment(req, res)).rejects.toMatchObject({
      name: "ZodError",
    });
  });

  it("throws a zod error when id is missing", async () => {
    const res = createMockResponse();
    const req = buildRequest({ body: { status: "success" } });

    await expect(updateDeployment(req, res)).rejects.toMatchObject({
      name: "ZodError",
    });
  });
});

describe("updateDeploymentWorker handler", () => {
  it("returns 401 when the worker token is missing or wrong", async () => {
    const res = createMockResponse();
    const req = buildRequest({
      params: { id: "10" },
      body: { status: "success" },
      get: jest.fn().mockReturnValue(undefined),
    });

    await updateDeploymentWorker(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body).toEqual({ message: "Unauthorized" });
  });

  it("returns 500 for a negative deployment id", async () => {
    const res = createMockResponse();
    const req = buildRequest({
      params: { id: "-1" },
      body: { status: "success", logs: "boom" },
      get: jest.fn().mockReturnValue(`Bearer ${process.env.BACKEND_SERVICE_TOKEN}`),
    });

    await updateDeploymentWorker(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body.status).toBe("failed");
  });

  it("updates the deployment on success and triggers a preview", async () => {
    mockedPrisma.deployment.update.mockResolvedValue({
      ...sampleDeployment,
      status: "success",
    });
    mockedPreview.mockResolvedValue(undefined);

    const res = createMockResponse();
    const req = buildRequest({
      params: { id: "10" },
      body: { status: "success", logs: "ok" },
      get: jest.fn().mockReturnValue(`Bearer ${process.env.BACKEND_SERVICE_TOKEN}`),
    });

    await updateDeploymentWorker(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockedPreview).toHaveBeenCalledWith(1, 10);
  });

  it("does not trigger a preview for non-success status", async () => {
    mockedPrisma.deployment.update.mockResolvedValue({
      ...sampleDeployment,
      status: "failed",
    });

    const res = createMockResponse();
    const req = buildRequest({
      params: { id: "10" },
      body: { status: "failed", logs: "err" },
      get: jest.fn().mockReturnValue(`Bearer ${process.env.BACKEND_SERVICE_TOKEN}`),
    });

    await updateDeploymentWorker(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockedPreview).not.toHaveBeenCalled();
  });
});