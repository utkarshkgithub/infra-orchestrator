// TODO: implement it in docker to avoid worker crash
import { startWorker } from "./services/worker";
import { logger } from "./lib/logger";

async function main() {
  logger.info("Starting worker...");
  await startWorker();
}

main().catch((err) => {
  logger.fatal(err);
  process.exit(1);
});