import { describe, expect, it, jest } from "@jest/globals";

process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";

jest.unstable_mockModule("../src/lib/env.js", () => ({
  env: {
    DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    NODE_ENV: "test",
  },
}));

const { prisma } = await import("../src/lib/prisma.js");

describe("prisma client", () => {
  it("exports a PrismaClient instance configured with the pg adapter", () => {
    expect(prisma).toBeDefined();
    expect(typeof (prisma as { deployment?: unknown }).deployment).toBe("object");
    expect(typeof (prisma as { project?: unknown }).project).toBe("object");
  });
});