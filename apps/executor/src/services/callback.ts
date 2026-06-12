import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";

export const callbackBackend = async (
  logs: String[],
  keyDir: string | null,
  deploymentId: number,
  status: string,
) => {
  try {
    const res = await fetch(
      `${env.BACKEND_URL}/api/builds/${deploymentId}/status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.BACKEND_SERVICE_TOKEN}`, //TODO: check for auth to restrict public access
        },
        body: JSON.stringify({
          status,
          keyDir,
          logs: logs.join("\n"),
        }),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      logger.error({ status: res.status, text }, "Callback failed");
    }
    return res;
  } catch (err) {
    logger.fatal(err, "Upating status to backend Failed");
    throw err;
  }
};
