import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { mockPrisma } from "./helpers/prisma.js";
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

const { prisma } = await import("../src/lib/prisma.js");
const {
  userProjects,
  projectDetails,
  newProject,
  updateProject,
} = await import("../src/modules/projects/projects.controller.js");

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

function buildReq(overrides: Record<string, unknown> = {}): any {
  return {
    params: {},
    body: {},
    user: { id: 1 },
    ...overrides,
  };
}

beforeEach(() => {
  mockedPrisma.project.findMany.mockReset();
  mockedPrisma.project.findFirst.mockReset();
  mockedPrisma.project.create.mockReset();
  mockedPrisma.project.update.mockReset();
});

describe("userProjects", () => {
  it("returns 200 with the user's projects", async () => {
    mockedPrisma.project.findMany.mockResolvedValue([project]);

    const res = createMockResponse();
    await userProjects(buildReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual([project]);
  });

  it("re-throws AppErrors unchanged", async () => {
    mockedPrisma.project.findMany.mockRejectedValue(
      Object.assign(new Error("db"), { statusCode: 500 }),
    );

    const res = createMockResponse();
    await expect(userProjects(buildReq(), res)).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it("wraps unknown errors into AppError 500", async () => {
    mockedPrisma.project.findMany.mockRejectedValue(new Error("boom"));

    const res = createMockResponse();
    await expect(userProjects(buildReq(), res)).rejects.toMatchObject({
      statusCode: 500,
      message: "Projects Fetch failed",
    });
  });
});

describe("projectDetails", () => {
  it("returns 200 with the project details", async () => {
    mockedPrisma.project.findFirst.mockResolvedValue(project);

    const res = createMockResponse();
    await projectDetails(buildReq({ params: { id: "1" } }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual(project);
  });

  it("wraps unknown errors into AppError 500", async () => {
    mockedPrisma.project.findFirst.mockRejectedValue(new Error("boom"));

    const res = createMockResponse();
    await expect(
      projectDetails(buildReq({ params: { id: "1" } }), res),
    ).rejects.toMatchObject({ statusCode: 500 });
  });
});

describe("newProject", () => {
  it("returns 201 with the created project", async () => {
    mockedPrisma.project.create.mockResolvedValue(project);

    const res = createMockResponse();
    await newProject(
      buildReq({
        body: {
          name: "demo",
          repoUrl: "https://github.com/utkarsh/demo-repo",
        },
      }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.body).toEqual(project);
  });

  it("wraps a zod failure into AppError 500", async () => {
    const res = createMockResponse();
    await expect(
      newProject(buildReq({ body: { name: "", repoUrl: "nope" } }), res),
    ).rejects.toMatchObject({ statusCode: 500, message: "Create project Issue" });
    expect(mockedPrisma.project.create).not.toHaveBeenCalled();
  });
});

describe("updateProject", () => {
  it("returns 200 after updating the project", async () => {
    mockedPrisma.project.findFirst.mockResolvedValue(project);
    mockedPrisma.project.update.mockResolvedValue({ ...project, name: "x" });

    const res = createMockResponse();
    await updateProject(
      buildReq({
        body: { id: 1, name: "x", repoUrl: "https://github.com/utkarsh/demo-repo" },
      }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("throws 400 when the project id is missing", async () => {
    const res = createMockResponse();
    await expect(
      updateProject(
        buildReq({
          body: { name: "x", repoUrl: "https://github.com/utkarsh/demo-repo" },
        }),
        res,
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("wraps unknown errors into AppError 500", async () => {
    mockedPrisma.project.findFirst.mockRejectedValue(new Error("boom"));

    const res = createMockResponse();
    await expect(
      updateProject(
        buildReq({
          body: { id: 1, name: "x", repoUrl: "https://github.com/utkarsh/demo-repo" },
        }),
        res,
      ),
    ).rejects.toMatchObject({ statusCode: 500 });
  });
});