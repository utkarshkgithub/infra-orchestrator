import { logger } from "./logger.js";

/**
 * Lightweight structured metrics emitter.
 *
 * Emits a single structured JSON log line per metric so CloudWatch can be
 * configured to ingest them (CloudWatch Logs -> metric filters) without any
 * extra SDK dependencies. `name`/`value` are the metric; `dimensions` are
 * labels that can be used to slice the metric in dashboards.
 *
 * Example:
 *   emitMetric("deployment.success", 1, { deploymentId: 10 })
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