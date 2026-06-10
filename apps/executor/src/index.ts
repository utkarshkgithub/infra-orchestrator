// TODO: implement it in docker to avoid worker crash
import { startWorker } from "./services/worker.js";
import { logger } from "./lib/logger.js";

async function main() {
  logger.info("Starting worker...");
  await startWorker();
}

main().catch((err) => {
  logger.fatal(err,"Unhandled Error");
  process.exit(1);
});