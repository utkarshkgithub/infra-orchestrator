// 3 error apperror custom error, zod error , unknown 500 server error
import { ZodError, z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";
import { Prisma } from "@prisma/client";

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
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }
  if (err instanceof ZodError) {
    logger.error(err,"Validation Error")
    res.status(400).json({
      success: false,
      error: "Validation Failed",
      issues: z.prettifyError(err),
    });
    return;
  }

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  ) {
    res.status(404).json({
      success: false,
      error: "Resource not found",
    });
    return;
  }


  logger.error({ err, path: req.path }, "Unhandled Error");
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
}
