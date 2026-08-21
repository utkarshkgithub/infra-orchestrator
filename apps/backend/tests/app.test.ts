import { mockClient } from "aws-sdk-client-mock";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { mockPrisma, sampleProject, sampleDeployment } from "./helpers/prisma.js";

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
const { env } = await import("../src/lib/env.js");
const { GithubOAuth } = await import("../src/modules/github/github.oauth.js");
const app = (await import("../src/app.js")).default;

const sqsMock = mockClient(SQSClient);
const mockedPrisma = prisma as unknown as ReturnType<typeof mockPrisma>;
const mockedPreview = generateProjectPreview as unknown as jest.Mock;
const originalFetch = globalThis.fetch;

const token = jwt.sign({ userId: 1 }, env.JWT_SECRET, { expiresIn: "1h" });

const deploymentResponse = JSON.parse(JSON.stringify(sampleDeployment));

const githubUserRow = {
  id: 1,
  name: "utkarsh",
  email: "utkarsh@example.com",
  login: "utkarsh",
  avatarUrl: "https://avatars.github.com/u/1",
};

const reposPayload = [
  {
    id: 1,
    name: "demo-repo",
    full_name: "utkarsh/demo-repo",
    html_url: "https://github.com/utkarsh/demo-repo",
    clone_url: "https://github.com/utkarsh/demo-repo.git",
    default_branch: "main",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

beforeEach(() => {
  sqsMock.reset();
  sqsMock.on(SendMessageCommand).resolves({ MessageId: "msg-1" });
  mockedPreview.mockReset();
  globalThis.fetch = jest.fn() as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("GET /health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GitHub OAuth routes", () => {
  it("redirects to GitHub and sets an oauth state cookie", async () => {
    const res = await request(app).get("/auth/github");
    expect(res.status).toBe(302);
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers.location).toContain("github.com");
  });

  it("rejects a callback with missing state/code", async () => {
    const res = await request(app).get("/auth/github/callback");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/oauth state/i);
  });

  it("rejects a callback whose state does not match the cookie", async () => {
    const res = await request(app)
      .get("/auth/github/callback?state=abc&code=xyz")
      .set("Cookie", "github_oauth_state=def");
    expect(res.status).toBe(400);
  });

  it("completes a valid callback, signs in, and redirects to /projects", async () => {
    const spy = jest
      .spyOn(GithubOAuth, "handleCallbackURL")
      .mockResolvedValue({
        id: 123,
        login: "utkarsh",
        email: "utkarsh@example.com",
        avatar_url: "https://avatars.github.com/u/123",
        accessToken: "access-tok",
      });
    mockedPrisma.user.upsert.mockResolvedValue({ id: 123 });

    const res = await request(app)
      .get("/auth/github/callback?state=abc&code=xyz")
      .set("Cookie", "github_oauth_state=abc");

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("/projects");
    expect(res.headers["set-cookie"]).toBeDefined();
    spy.mockRestore();
  });

  it("returns the user's github repos when authenticated", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ accessToken: "tok" });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => reposPayload,
    });

    const res = await request(app)
      .get("/auth/github/repos")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(reposPayload);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.github.com/user/repos?sort=updated&per_page=100",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer tok" }) }),
    );
  });

  it("throws 401 for /repos when the user has no linked github account", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/auth/github/repos")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(401);
  });
});

describe("auth routes", () => {
  it("blocks dev-login outside development", async () => {
    const res = await request(app).post("/auth/dev-login");
    expect(res.status).toBe(404);
  });

  it("returns ok for the authenticated /auth/health route", async () => {
    const res = await request(app)
      .get("/auth/health")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("returns 401 for /auth/me without a token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the user for /auth/me with a valid token", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(githubUserRow);

    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(githubUserRow);
  });

  it("returns 404 for /auth/me when the user does not exist", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(404);
  });

  it("logs out by clearing cookies", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.status).toBe(204);
    expect(res.headers["set-cookie"]).toBeDefined();
  });
});

describe("deployment routes (behind JWT)", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/deployment/");
    expect(res.status).toBe(401);
  });

  it("lists deployments for the authenticated user", async () => {
    mockedPrisma.deployment.findMany.mockResolvedValue([sampleDeployment]);

    const res = await request(app)
      .get("/deployment/")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([deploymentResponse]);
  });

  it("returns 200 with an empty list when the user has no deployments", async () => {
    mockedPrisma.deployment.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/deployment/")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("creates a deployment and enqueues a job", async () => {
    mockedPrisma.project.findUnique.mockResolvedValue(sampleProject);
    mockedPrisma.deployment.create.mockResolvedValue(sampleDeployment);

    const res = await request(app)
      .post("/deployment/create")
      .set("Cookie", `token=${token}`)
      .send({ projectId: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(deploymentResponse);
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(1);
  });

  it("returns 400 for an invalid deployment body", async () => {
    const res = await request(app)
      .post("/deployment/create")
      .set("Cookie", `token=${token}`)
      .send({ projectId: "not-a-number" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation Failed");
  });

  it("returns 401 when creating a deployment for another user's project", async () => {
    mockedPrisma.project.findUnique.mockResolvedValue({ ...sampleProject, userId: 99 });

    const res = await request(app)
      .post("/deployment/create")
      .set("Cookie", `token=${token}`)
      .send({ projectId: 1 });

    expect(res.status).toBe(401);
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(0);
  });

  it("returns the details of a single deployment", async () => {
    mockedPrisma.deployment.findUnique.mockResolvedValue(sampleDeployment);

    const res = await request(app)
      .get("/deployment/10")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(deploymentResponse);
  });
});

describe("worker status callback route", () => {
  it("rejects requests without the worker service token", async () => {
    const res = await request(app)
      .post("/api/builds/10/status")
      .send({ status: "success" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Unauthorized" });
  });

  it("accepts a valid worker callback and updates the deployment", async () => {
    mockedPrisma.deployment.update.mockResolvedValue({
      ...sampleDeployment,
      status: "success",
    });

    const res = await request(app)
      .post("/api/builds/10/status")
      .set("Authorization", `Bearer ${env.BACKEND_SERVICE_TOKEN}`)
      .send({ status: "success", logs: "done" });

    expect(res.status).toBe(200);
    expect(mockedPreview).toHaveBeenCalledWith(1, 10);
  });
});