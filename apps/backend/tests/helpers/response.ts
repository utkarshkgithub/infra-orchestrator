import { jest } from "@jest/globals";
import { Response } from "express";

export function createMockResponse() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status: jest.fn(function (this: unknown, code: number) {
      (this as Record<string, unknown>).statusCode = code;
      return this;
    }),
    json: jest.fn(function (this: unknown, body: unknown) {
      (this as Record<string, unknown>).body = body;
      return this;
    }),
    sendStatus: jest.fn(function (this: unknown, code: number) {
      (this as Record<string, unknown>).statusCode = code;
      return this;
    }),
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
    end: jest.fn(),
  } as unknown as Response & {
    statusCode: number;
    body: unknown;
    status: jest.Mock;
    json: jest.Mock;
    sendStatus: jest.Mock;
    cookie: jest.Mock;
    clearCookie: jest.Mock;
    redirect: jest.Mock;
  };
  return res;
}