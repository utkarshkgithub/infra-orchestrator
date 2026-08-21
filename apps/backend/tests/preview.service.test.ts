import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { mockPrisma } from "./helpers/prisma.js";

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  prisma: mockPrisma(),
}));

const { prisma } = await import("../src/lib/prisma.js");
const { generateProjectPreview } = await import("../src/utils/preview.service.js");

const mockedPrisma = prisma as unknown as ReturnType<typeof mockPrisma>;
const originalFetch = globalThis.fetch;

function projectRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    publicId: "abc123",
    previewUrl: null,
    deployments: [{ id: 10 }],
    ...overrides,
  };
}

function fetchResponse(ok: boolean, body: unknown): Response {
  return {
    ok,
    json: async () => body,
  } as unknown as Response;
}

beforeEach(() => {
  mockedPrisma.project.findUnique.mockReset();
  mockedPrisma.project.update.mockReset();
  globalThis.fetch = jest.fn() as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("generateProjectPreview", () => {
  it("returns early when the project does not exist", async () => {
    mockedPrisma.project.findUnique.mockResolvedValue(null);

    await generateProjectPreview(1, 10);

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("returns early when the deployment is stale", async () => {
    mockedPrisma.project.findUnique.mockResolvedValue(projectRow({ deployments: [{ id: 9 }] }));

    await generateProjectPreview(1, 10);

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("returns early when the microlink request fails", async () => {
    mockedPrisma.project.findUnique.mockResolvedValue(projectRow());
    (globalThis.fetch as jest.Mock).mockResolvedValue(fetchResponse(false, {}));

    await generateProjectPreview(1, 10);

    expect(mockedPrisma.project.update).not.toHaveBeenCalled();
  });

  it("returns early when the response has no screenshot url", async () => {
    mockedPrisma.project.findUnique.mockResolvedValue(projectRow());
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      fetchResponse(true, { data: { screenshot: {} } }),
    );

    await generateProjectPreview(1, 10);

    expect(mockedPrisma.project.update).not.toHaveBeenCalled();
  });

  it("persists the screenshot url on success", async () => {
    mockedPrisma.project.findUnique.mockResolvedValue(projectRow());
    mockedPrisma.project.update.mockResolvedValue(projectRow({ previewUrl: "https://img/x.png" }));
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      fetchResponse(true, { data: { screenshot: { url: "https://img/x.png" } } }),
    );

    await generateProjectPreview(1, 10);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("api.microlink.io"),
    );
    expect(mockedPrisma.project.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { previewUrl: "https://img/x.png" },
    });
  });
});