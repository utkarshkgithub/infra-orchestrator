import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";

export const callbackBackend = async (
  logs: String[],
  keyDir: string | null,
  deploymentId: number,
  status: string,
) => {
  try {
    return await fetch(`${env.BACKEND_URL}/api/build/${deploymentId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AWS_SECRET_ACCESS_KEY}`, //TODO: check for auth to restrict public access
      },
      body: JSON.stringify({
        status,
        keyDir,
        logs: logs.join("\n"),
      }),
    });
  } catch (err) {
    logger.fatal(err, "Upating status to backend Failed");
    throw err;
  }
};
