import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { mockPrisma } from "./helpers/prisma.js";

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  prisma: mockPrisma(),
}));

const { prisma } = await import("../src/lib/prisma.js");
const { createUser } = await import("../src/modules/auth/auth.service.js");

const mockedPrisma = prisma as unknown as ReturnType<typeof mockPrisma>;

const githubUser = {
  id: 123,
  login: "utkarsh",
  avatar_url: "https://avatars.github.com/u/123",
  email: "utkarsh@example.com",
  accessToken: "gh_token",
};

beforeEach(() => {
  mockedPrisma.user.upsert.mockReset();
});

describe("createUser", () => {
  it("throws 400 when accessToken is missing", async () => {
    await expect(
      createUser({ ...githubUser, accessToken: "" }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throws 400 when email is missing", async () => {
    await expect(
      createUser({ ...githubUser, email: null as unknown as string }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("upserts the user and returns the record", async () => {
    mockedPrisma.user.upsert.mockResolvedValue({ id: 123 });

    const result = await createUser(githubUser);

    expect(result).toEqual({ id: 123 });
    expect(mockedPrisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 123 },
        update: expect.objectContaining({ accessToken: "gh_token" }),
        create: expect.objectContaining({
          id: 123,
          email: "utkarsh@example.com",
        }),
      }),
    );
  });

  it("propagates a database error", async () => {
    mockedPrisma.user.upsert.mockRejectedValue(new Error("db down"));

    await expect(createUser(githubUser)).rejects.toThrow("db down");
  });
});