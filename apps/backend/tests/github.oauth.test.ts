import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { OAuth2RequestError } from "arctic";

jest.unstable_mockModule("../src/lib/logger.js", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  },
}));

jest.unstable_mockModule("../src/modules/github/github.provider.js", () => ({
  githubProvider: {
    createAuthorizationURL: jest.fn(),
    validateAuthorizationCode: jest.fn(),
  },
}));

const { GithubOAuth } = await import("../src/modules/github/github.oauth.js");
const { githubProvider } = await import("../src/modules/github/github.provider.js");

const mockedProvider = githubProvider as unknown as {
  createAuthorizationURL: jest.Mock;
  validateAuthorizationCode: jest.Mock;
};

const tokens = { accessToken: () => "access-tok" };

const githubProfile = {
  id: 123,
  login: "utkarsh",
  email: null,
  avatar_url: "https://avatars.github.com/u/123",
};

const emailRow = { email: "utkarsh@example.com", primary: true, verified: true };

function fetchOk(body: unknown) {
  return { ok: true, json: async () => body } as unknown as Response;
}

function fetchFail() {
  return { ok: false, json: async () => ({}) } as unknown as Response;
}

const originalFetch = globalThis.fetch;

beforeEach(() => {
  mockedProvider.createAuthorizationURL.mockReset();
  mockedProvider.validateAuthorizationCode.mockReset();
  mockedProvider.createAuthorizationURL.mockReturnValue(
    new URL("https://github.com/login/oauth/authorize?state=xyz"),
  );
  globalThis.fetch = jest.fn() as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("GithubOAuth.createAuthUrl", () => {
  it("returns a state and authorization url", () => {
    const { state, url } = GithubOAuth.createAuthUrl();

    expect(state).toBeDefined();
    expect(url.toString()).toContain("github.com");
    expect(mockedProvider.createAuthorizationURL).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(["public_repo", "user:email", "read:user"]),
    );
  });
});

describe("GithubOAuth.handleCallbackURL", () => {
  it("returns the github user with a primary email on success", async () => {
    mockedProvider.validateAuthorizationCode.mockResolvedValue(tokens);
    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(fetchOk(githubProfile))
      .mockResolvedValueOnce(fetchOk([emailRow]));

    const user = await GithubOAuth.handleCallbackURL("valid-code");

    expect(user).toEqual({ ...githubProfile, email: "utkarsh@example.com", accessToken: "access-tok" });
  });

  it("throws AppError 400 for an invalid/expired authorization code", async () => {
    mockedProvider.validateAuthorizationCode.mockRejectedValue(
      new OAuth2RequestError("http://example.com/error", {}, {}),
    );

    await expect(GithubOAuth.handleCallbackURL("bad-code")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid or expired GitHub authorization code",
    });
  });

  it("throws AppError 502 when the user fetch fails", async () => {
    mockedProvider.validateAuthorizationCode.mockResolvedValue(tokens);
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(fetchFail());

    await expect(GithubOAuth.handleCallbackURL("code")).rejects.toMatchObject({
      statusCode: 502,
      message: "Failed to fetch GitHub user",
    });
  });

  it("throws a ZodError when the user payload is malformed", async () => {
    mockedProvider.validateAuthorizationCode.mockResolvedValue(tokens);
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(fetchOk({ nope: true }));

    await expect(GithubOAuth.handleCallbackURL("code")).rejects.toMatchObject({
      name: "ZodError",
    });
  });

  it("throws AppError 502 when the emails fetch fails", async () => {
    mockedProvider.validateAuthorizationCode.mockResolvedValue(tokens);
    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(fetchOk(githubProfile))
      .mockResolvedValueOnce(fetchFail());

    await expect(GithubOAuth.handleCallbackURL("code")).rejects.toMatchObject({
      statusCode: 502,
    });
  });

  it("throws AppError 400 when the account has no primary email", async () => {
    mockedProvider.validateAuthorizationCode.mockResolvedValue(tokens);
    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(fetchOk(githubProfile))
      .mockResolvedValueOnce(fetchOk([{ email: "x@y.com", primary: false, verified: true }]));

    await expect(GithubOAuth.handleCallbackURL("code")).rejects.toMatchObject({
      statusCode: 400,
      message: "GitHub account must have a primary email",
    });
  });

  it("wraps unexpected network errors into AppError 502", async () => {
    mockedProvider.validateAuthorizationCode.mockResolvedValue(tokens);
    (globalThis.fetch as jest.Mock).mockRejectedValue(new Error("network down"));

    await expect(GithubOAuth.handleCallbackURL("code")).rejects.toMatchObject({
      statusCode: 502,
    });
  });
});