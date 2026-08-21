import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

jest.unstable_mockModule("../src/lib/logger.js", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  },
}));

const { authMiddlewareJWT } = await import("../src/middleware/auth.middleware.js");
const { env } = await import("../src/lib/env.js");

function buildRequest(token?: string, method = "GET"): Request {
  return {
    method,
    cookies: token ? { token } : {},
    user: undefined,
  } as unknown as Request;
}

const nextMock = jest.fn();

beforeEach(() => {
  nextMock.mockReset();
});

describe("authMiddlewareJWT", () => {
  it("short-circuits OPTIONS requests with 204", () => {
    const req = buildRequest(undefined, "OPTIONS");
    const res = { sendStatus: jest.fn() } as unknown as Response;

    authMiddlewareJWT(req, res, nextMock);

    expect(res.sendStatus).toHaveBeenCalledWith(204);
    expect(nextMock).not.toHaveBeenCalled();
  });

  it("throws AppError 401 when no token is present", () => {
    const req = buildRequest(undefined);
    const res = {} as Response;

    expect(() => authMiddlewareJWT(req, res, nextMock)).toThrow(
      expect.objectContaining({ statusCode: 401, message: "No token provided" }),
    );
  });

  it("attaches the user and calls next for a valid token", () => {
    const token = jwt.sign({ userId: 42 }, env.JWT_SECRET, { expiresIn: "1h" });
    const req = buildRequest(token);
    const res = {} as Response;

    authMiddlewareJWT(req, res, nextMock);

    expect(nextMock).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 42 });
  });

  it("returns 401 for an expired token", () => {
    const token = jwt.sign({ userId: 42 }, env.JWT_SECRET, { expiresIn: "-1s" });
    const req = buildRequest(token);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    authMiddlewareJWT(req, res, nextMock);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token expired" });
    expect(nextMock).not.toHaveBeenCalled();
  });

  it("returns 403 for a malformed token", () => {
    const req = buildRequest("not-a-jwt");
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    authMiddlewareJWT(req, res, nextMock);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
  });

  it("returns 403 for a token signed with a different secret", () => {
    const token = jwt.sign({ userId: 42 }, "wrong-secret", { expiresIn: "1h" });
    const req = buildRequest(token);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    authMiddlewareJWT(req, res, nextMock);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});