import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { mockPrisma, sampleProject, sampleDeployment } from "./helpers/prisma.js";

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  prisma: mockPrisma(),
}));

jest.unstable_mockModule("../src/utils/sqs.js", () => ({
  pushDeploymentService: jest.fn(),
}));

const { prisma } = await import("../src/lib/prisma.js");
const { pushDeploymentService } = await import("../src/utils/sqs.js");
const {
  createDeployment,
  getDeployments,
  getDeploymentsByProjectId,
  getDetails,
  updateDeploymentById,
  updateDeploymentByIdWorker,
} = await import("../src/modules/deployments/deployments.service.js");

const mockedPrisma = prisma as unknown as ReturnType<typeof mockPrisma>;
const mockedPush = pushDeploymentService as unknown as jest.Mock;

beforeEach(() => {
  mockedPush.mockReset();
  mockedPush.mockResolvedValue(undefined);
});

describe("createDeployment", () => {
  it("creates a deployment and pushes a job to the queue", async () => {
    mockedPrisma.project.findUnique.mockResolvedValue(sampleProject);
    mockedPrisma.deployment.create.mockResolvedValue(sampleDeployment);

    const result = await createDeployment({ projectId: 1 }, 1);

    expect(result).toEqual(sampleDeployment);
    expect(mockedPrisma.project.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(mockedPush).toHaveBeenCalledWith(
      expect.objectContaining({
        deploymentId: 10,
        publicId: "abc123",
        repoUrl: sampleProject.repoUrl,
      }),
    );
  });

  it("throws 401 when the project belongs to another user", async () => {
    mockedPrisma.project.findUnique.mockResolvedValue({
      ...sampleProject,
      userId: 2,
    });

    await expect(createDeployment({ projectId: 1 }, 1)).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(mockedPrisma.deployment.create).not.toHaveBeenCalled();
  });

  it("throws 401 when the project does not exist", async () => {
    mockedPrisma.project.findUnique.mockResolvedValue(null);

    await expect(createDeployment({ projectId: 999 }, 1)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("propagates a queue push failure as an error", async () => {
    mockedPrisma.project.findUnique.mockResolvedValue(sampleProject);
    mockedPrisma.deployment.create.mockResolvedValue(sampleDeployment);
    mockedPush.mockRejectedValue(
      Object.assign(new Error("Failed to push job"), { statusCode: 500 }),
    );

    await expect(createDeployment({ projectId: 1 }, 1)).rejects.toMatchObject({
      message: "Failed to push job",
    });
  });

  it("propagates db errors", async () => {
    mockedPrisma.project.findUnique.mockRejectedValue(new Error("db down"));

    await expect(createDeployment({ projectId: 1 }, 1)).rejects.toThrow(
      "db down",
    );
  });
});

describe("getDeployments", () => {
  it("returns deployments scoped to the user's projects", async () => {
    mockedPrisma.deployment.findMany.mockResolvedValue([sampleDeployment]);

    const result = await getDeployments(1);

    expect(result).toEqual([sampleDeployment]);
    expect(mockedPrisma.deployment.findMany).toHaveBeenCalledWith({
      where: { project: { userId: 1 } },
    });
  });

  it("returns an empty array when the user has none", async () => {
    mockedPrisma.deployment.findMany.mockResolvedValue([]);

    const result = await getDeployments(1);

    expect(result).toEqual([]);
  });
});

describe("getDeploymentsByProjectId", () => {
  it("returns deployments for a specific project owned by the user", async () => {
    mockedPrisma.deployment.findMany.mockResolvedValue([sampleDeployment]);

    const result = await getDeploymentsByProjectId(1, 1);

    expect(result).toEqual([sampleDeployment]);
    expect(mockedPrisma.deployment.findMany).toHaveBeenCalledWith({
      where: {
        projectId: 1,
        project: { userId: 1 },
      },
    });
  });

  it("returns an empty array when the project has no deployments", async () => {
    mockedPrisma.deployment.findMany.mockResolvedValue([]);

    const result = await getDeploymentsByProjectId(1, 1);

    expect(result).toEqual([]);
  });
});

describe("getDetails", () => {
  it("returns a single deployment scoped to the user", async () => {
    mockedPrisma.deployment.findUnique.mockResolvedValue(sampleDeployment);

    const result = await getDetails(10, 1);

    expect(result).toEqual(sampleDeployment);
    expect(mockedPrisma.deployment.findUnique).toHaveBeenCalledWith({
      where: { id: 10, project: { userId: 1 } },
    });
  });

  it("returns null when not found", async () => {
    mockedPrisma.deployment.findUnique.mockResolvedValue(null);

    await expect(getDetails(999, 1)).resolves.toBeNull();
  });
});

describe("updateDeploymentById", () => {
  it("updates a deployment owned by the user", async () => {
    mockedPrisma.deployment.findFirst.mockResolvedValue(sampleDeployment);
    mockedPrisma.deployment.update.mockResolvedValue({
      ...sampleDeployment,
      status: "building",
    });

    const result = await updateDeploymentById(
      { id: 10, status: "building" },
      1,
    );

    expect(result.status).toBe("building");
    expect(mockedPrisma.deployment.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { id: 10, status: "building" },
    });
  });

  it("throws 403 when the deployment is not owned by the user", async () => {
    mockedPrisma.deployment.findFirst.mockResolvedValue(null);

    await expect(
      updateDeploymentById({ id: 10, status: "building" }, 1),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(mockedPrisma.deployment.update).not.toHaveBeenCalled();
  });
});

describe("updateDeploymentByIdWorker", () => {
  it("updates the deployment directly without ownership checks", async () => {
    mockedPrisma.deployment.update.mockResolvedValue({
      ...sampleDeployment,
      status: "failed",
    });

    const result = await updateDeploymentByIdWorker({
      id: 10,
      status: "failed",
    });

    expect(result.status).toBe("failed");
  });
});