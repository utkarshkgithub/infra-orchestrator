import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { logger } from "../lib/logger.js";
import { executeBuildProcess } from "./build.js";
import {uploadDir} from "./s3-push.js"
import path from "path";
import { JobSchema } from "../lib/job.js";
import { env } from "../lib/env.js";
import { callbackBackend } from "./callback.js";
// init
const sqs = new SQSClient({
  region: env.AWS_REGION,
});

export async function startWorker() {
  let deploymentId=-1;
  let logs=[""];
  while (true) {
    try {
      const command = new ReceiveMessageCommand({
        MaxNumberOfMessages: 1,
        QueueUrl: env.QUEUE_URL, //TODO: add QUEUE_URL
        WaitTimeSeconds: 20,
      });

      const { Messages } = await sqs.send(command);
      logger.info(Messages,"Message List")
      if (Messages && Messages.length > 0) {
        const job = Messages[0];
        const body = JobSchema.parse(JSON.parse(job.Body!));
        logger.info(body,"Job Body")
        // TODO: Update the deployment status to building
        deploymentId = body.deploymentId;
        logs = await executeBuildProcess(body)
        logger.info("Build Success (clone,install,build)")
        const projectDir = path.join("/tmp/builds", String(deploymentId)); // rn issue is when it fails midway next time dir exist so git clone will again fail endlessly
        const keyDir = path.posix.join(body.projectId, String(deploymentId));
        await uploadDir(projectDir,keyDir) // local filesystem, s3 path
        const delCommand = new DeleteMessageCommand({
          QueueUrl: env.QUEUE_URL,
          ReceiptHandle: job.ReceiptHandle,
        });
        await sqs.send(delCommand);
        logger.info(job,"Job completed")
        await callbackBackend(logs,deploymentId,"success")
      }
    } catch (err) {
      logger.error(err,"Unhandled Error")
      await callbackBackend(logs,deploymentId,"failed")

      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
}
