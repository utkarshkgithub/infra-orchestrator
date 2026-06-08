import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { logger } from "../lib/logger";
import { executeProcess } from "./build";
import {uploadDir} from "./s3-push"
import path from "path";
import { JobSchema } from "../lib/job";
import { env } from "../lib/env";
import { callbackBackend } from "./callback";
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
        logs = await executeProcess(body)
        const projectDir = path.join("/tmp/builds", String(deploymentId));
        const keyDir = path.posix.join(body.projectId, String(deploymentId));
        await uploadDir(projectDir,keyDir)
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
