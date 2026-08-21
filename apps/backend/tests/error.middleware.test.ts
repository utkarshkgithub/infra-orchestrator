import { describe, expect, it, jest } from "@jest/globals";
import { ZodError, z } from "zod";
import { Request, Response } from "express";

jest.unstable_mockModule("../src/lib/logger.js", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  },
}));

const { AppError, errorMiddleware } = await import(
  "../src/middleware/error.middleware.js"
);
const { logger } = await import("../src/lib/logger.js");

const mockedLogger = logger as unknown as { error: jest.Mock; info: jest.Mock };

function buildRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function buildReq(path = "/") {
  return { path } as unknown as Request;
}

describe("errorMiddleware", () => {
  it("returns the AppError statusCode and message", () => {
    const res = buildRes();
    const err = new AppError(403, "Forbidden");

    errorMiddleware(err, buildReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Forbidden",
    });
  });

  it("returns 400 with prettified issues for a ZodError", () => {
    const res = buildRes();
    const err = z
      .object({ projectId: z.number().int() })
      .safeParse({ projectId: "x" }).error as ZodError;

    errorMiddleware(err, buildReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.error).toBe("Validation Failed");
    expect(payload.issues).toBeDefined();
  });

  it("returns 500 for an unknown error and logs it", () => {
    const res = buildRes();
    const err = new Error("boom");

    errorMiddleware(err, buildReq("/api/x"), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Internal server error",
    });
    expect(mockedLogger.error).toHaveBeenCalled();
  });
});