import { logger } from "./logger.js";

/**
 * Lightweight structured metrics emitter for the worker. Each metric is a
 * structured JSON log line that CloudWatch can ingest via metric filters.
 */
export function emitMetric(
  name: string,
  value: number,
  dimensions: Record<string, string | number> = {},
): void {
  logger.info(
    {
      type: "metric",
      metric: name,
      value,
      dimensions,
    },
    `metric:${name}`,
  );
}