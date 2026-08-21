import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { mockPrisma } from "./helpers/prisma.js";
import { createMockResponse } from "./helpers/response.js";

process.env.NODE_ENV = "development";

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
const { devLogin } = await import("../src/modules/auth/auth.controller.js");

const mockedPrisma = prisma as unknown as ReturnType<typeof mockPrisma>;

const devUser = {
  id: 1,
  name: "dev",
  email: "dev@example.com",
  login: "dev",
  avatarUrl: "https://avatars.github.com/u/1",
};

beforeEach(() => {
  mockedPrisma.user.findUnique.mockReset();
});

describe("devLogin", () => {
  it("issues a session cookie for the dev user", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(devUser);

    const res = createMockResponse();
    await devLogin({} as any, res);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledWith(
      "token",
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.body).toEqual({ success: true });
  });

  it("returns 404 when the dev user does not exist", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const res = createMockResponse();
    await devLogin({} as any, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body).toEqual({ error: "Dev user not found" });
  });
});