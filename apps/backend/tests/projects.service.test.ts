import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { mockPrisma } from "./helpers/prisma.js";

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  prisma: mockPrisma(),
}));

const { prisma } = await import("../src/lib/prisma.js");
const {
  getProjects,
  createProject,
  getProjectDetails,
  updateProjectDetails,
} = await import("../src/modules/projects/projects.service.js");

const mockedPrisma = prisma as unknown as ReturnType<typeof mockPrisma>;

const project = {
  id: 1,
  userId: 1,
  publicId: "abc123",
  name: "demo",
  repoUrl: "https://github.com/utkarsh/demo-repo",
  rootDir: "/",
  installCmd: "npm install",
  buildCmd: "npm run build",
  outputDir: "dist",
  framework: null,
  envVars: {},
};

const projectInput = {
  name: "demo",
  userId: 1,
  repoUrl: "https://github.com/utkarsh/demo-repo",
};

beforeEach(() => {
  mockedPrisma.project.findMany.mockReset();
  mockedPrisma.project.findFirst.mockReset();
  mockedPrisma.project.create.mockReset();
  mockedPrisma.project.update.mockReset();
});

describe("getProjects", () => {
  it("returns projects scoped to the user", async () => {
    mockedPrisma.project.findMany.mockResolvedValue([project]);

    const result = await getProjects(1);

    expect(result).toEqual([project]);
    expect(mockedPrisma.project.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
    });
  });
});

describe("createProject", () => {
  it("creates a project with a generated publicId", async () => {
    mockedPrisma.project.create.mockResolvedValue(project);

    const result = await createProject(projectInput);

    expect(result).toEqual(project);
    const callArgs = mockedPrisma.project.create.mock.calls[0][0];
    expect(callArgs.data.publicId).toBeDefined();
    expect(callArgs.data.publicId).toHaveLength(12);
    expect(callArgs.data).toMatchObject(projectInput);
  });
});

describe("getProjectDetails", () => {
  it("returns a single project for the user", async () => {
    mockedPrisma.project.findFirst.mockResolvedValue(project);

    const result = await getProjectDetails(1, 1);

    expect(result).toEqual(project);
    expect(mockedPrisma.project.findFirst).toHaveBeenCalledWith({
      where: { id: 1, userId: 1 },
    });
  });

  it("returns null when not found", async () => {
    mockedPrisma.project.findFirst.mockResolvedValue(null);

    await expect(getProjectDetails(999, 1)).resolves.toBeNull();
  });
});

describe("updateProjectDetails", () => {
  it("updates the project while preserving the publicId", async () => {
    mockedPrisma.project.findFirst.mockResolvedValue(project);
    mockedPrisma.project.update.mockResolvedValue({
      ...project,
      name: "renamed",
    });

    const result = await updateProjectDetails(
      { ...projectInput, id: 1, name: "renamed" },
      1,
    );

    expect(result.name).toBe("renamed");
    expect(mockedPrisma.project.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { ...projectInput, id: 1, name: "renamed", publicId: "abc123" },
    });
  });

  it("throws 403 when the project does not belong to the user", async () => {
    mockedPrisma.project.findFirst.mockResolvedValue(null);

    await expect(
      updateProjectDetails({ ...projectInput, id: 1 }, 1),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(mockedPrisma.project.update).not.toHaveBeenCalled();
  });
});