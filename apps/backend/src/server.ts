import { env } from "./lib/env.js";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { AppError } from "./middleware/error.middleware.js";

process.on("uncaughtException", (err: Error) => {
  logger.error({ err }, "Uncaught Exception! Shutting down...");
  if (err instanceof AppError && err.isOperational) {
    return;
  }
  process.exit(1);
});

process.on("unhandledRejection", (err: Error) => {
  logger.error({ err }, "Unhandled Promise Rejection! Shutting down...");
  process.exit(1);
});

app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
    },
    "backend started",
  );
});
