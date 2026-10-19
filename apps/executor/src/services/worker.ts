import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { logger } from "../lib/logger.js";
import { executeBuildProcess } from "./build.js";
import { uploadDir, validateOutputDir } from "./s3-push.js";
import path from "path";
import { JobSchema } from "../lib/job.js";
import { env } from "../lib/env.js";
import { callbackBackend } from "./callback.js";
import fs from "fs/promises";
import { BuildError } from "../lib/build.error.js";

// init
const sqs = new SQSClient({
  region: env.AWS_REGION,
});

export async function startWorker() {
  let deploymentId = -1;
  let logs: string[] = [];
  let projectDir: string | null = null;
  let OutputDir: string | null = null;
  let keyDir: string | null = null;
  while (true) {
    logs = [];
    deploymentId = -1;
    projectDir = null;
    OutputDir = null;
    keyDir = null;
    try {
      const command = new ReceiveMessageCommand({
        MaxNumberOfMessages: 1,
        QueueUrl: env.QUEUE_URL, //TODO: add QUEUE_URL
        WaitTimeSeconds: 20,
      });

      const { Messages } = await sqs.send(command);
      logger.info(Messages, "Message List");
      if (Messages && Messages.length > 0) {
        const job = Messages[0];
        const body = JobSchema.parse(JSON.parse(job.Body!));
        logger.info(body, "Job Body");
        // TODO: Update the deployment status to building
        deploymentId = body.deploymentId;
        projectDir = path.join("/tmp/builds", String(deploymentId)); // rn issue is when it fails midway next time dir exist so git clone will again fail endlessly

        logs = await executeBuildProcess(body);

        logger.info("Build Success (clone,install,build)");
        // Use path.resolve so the result is canonical (no residual ..) and
        // consistent with the validatePaths check inside executeBuildProcess.
        OutputDir = path.resolve(
          "/tmp/builds",
          String(deploymentId),
          body.rootDir,
          body.outputDir,
        );
        logger.info({ OutputDir }, "Output Directory");
        keyDir = body.publicId; // deployment unique uuid

        await validateOutputDir(OutputDir); // enforce size < 40 MB, files < 5k
        await uploadDir(OutputDir, keyDir); // local filesystem, s3 path

        const delCommand = new DeleteMessageCommand({
          QueueUrl: env.QUEUE_URL,
          ReceiptHandle: job.ReceiptHandle,
        });
        const res = await callbackBackend(
          logs,
          keyDir,
          deploymentId,
          "success",
        );
        if (res.ok) {
          await sqs.send(delCommand);
          logger.info(job, "Job completed");
        } else {
          logger.error("Callback to Backend failed");
          // TODO: devise mechanism to solve it
          let callBackSucceeded = false;
          for (let i = 0; i < 3; i++) {
            const res = await callbackBackend(
              logs,
              keyDir,
              deploymentId,
              "success",
            );
            if (res.ok) {
              callBackSucceeded = true;
              break;
            } else {
              await new Promise((resolve) => setTimeout(resolve, 3000));
            }
          }
          if (callBackSucceeded) {
            await sqs.send(delCommand);
            logger.info(job, "Job completed");
          } else {
            await sqs.send(delCommand); //TODO: move to dlq later
            logger.info(job, "Job Update Failed");
          }
        }
      }
    } catch (err) {
      if (err instanceof BuildError) {
        logger.error(err, "Failed to Build");
        logs = err.logs;
      } else logger.error(err, "Unhandled Worker Error");
      try {
        await callbackBackend(logs, keyDir, deploymentId, "failed");
      } catch (e) {
        logger.error(e, "Failed to report failure to backend");
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));
    } finally {
      if (projectDir)
        await fs.rm(projectDir, {
          recursive: true,
          force: true,
        });
    }
  }
}
