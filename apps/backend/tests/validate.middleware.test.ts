import { describe, expect, it, jest } from "@jest/globals";
import { z } from "zod";

const { validate } = await import("../src/middleware/validate.middleware.js");

const schema = z.object({ name: z.string().min(1) });

function buildReq(body: unknown) {
  return { body } as any;
}

describe("validate middleware", () => {
  it("replaces req.body with the parsed value and calls next on valid input", () => {
    const req = buildReq({ name: "demo" });
    const next = jest.fn();

    validate(schema)(req, {} as any, next);

    expect(req.body).toEqual({ name: "demo" });
    expect(next).toHaveBeenCalled();
  });

  it("applies schema defaults to req.body", () => {
    const withDefault = z.object({ name: z.string(), count: z.number().default(3) });
    const req = buildReq({ name: "demo" });
    const next = jest.fn();

    validate(withDefault)(req, {} as any, next);

    expect(req.body).toEqual({ name: "demo", count: 3 });
  });

  it("throws a ZodError for invalid input and never calls next", () => {
    const req = buildReq({ name: "" });
    const next = jest.fn();

    expect(() => validate(schema)(req, {} as any, next)).toThrow();
    expect(next).not.toHaveBeenCalled();
  });
});