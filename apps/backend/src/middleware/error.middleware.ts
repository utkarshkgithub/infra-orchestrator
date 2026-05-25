// 3 error apperror custom error, zod error , unknown 500 server error
import { success, ZodError } from "zod";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: "Validation Failed",
      issues: err.flatten,
    });
  }
  logger.error({ err, path: req.path }, "Unhandled Error");
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
}
