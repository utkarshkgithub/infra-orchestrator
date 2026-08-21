import { describe, expect, it } from "@jest/globals";

const { sessionCookieOptions, oauthStateCookieOptions } = await import(
  "../src/utils/cookie.utils.js"
);
const { env } = await import("../src/lib/env.js");

describe("cookie options", () => {
  it("exposes httpOnly session cookies scoped to the environment", () => {
    expect(sessionCookieOptions.httpOnly).toBe(true);
    expect(sessionCookieOptions.sameSite).toBe("lax");
    expect(sessionCookieOptions.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    expect(sessionCookieOptions.secure).toBe(env.NODE_ENV === "production");
  });

  it("exposes a short-lived httpOnly oauth state cookie", () => {
    expect(oauthStateCookieOptions.httpOnly).toBe(true);
    expect(oauthStateCookieOptions.sameSite).toBe("lax");
    expect(oauthStateCookieOptions.maxAge).toBe(60 * 10 * 1000);
    expect(oauthStateCookieOptions.secure).toBe(env.NODE_ENV === "production");
  });
});