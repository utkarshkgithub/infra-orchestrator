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
  region: "us-east-1", //TODO: change to ap-south-1
});

export async function startWorker() {
  let deploymentId="-1";
  let logs=[""];
  while (true) {
    try {
      const command = new ReceiveMessageCommand({
        MaxNumberOfMessages: 1,
        QueueUrl: env.QUEUE_URL, //TODO: add QUEUE_URL
        WaitTimeSeconds: 20,
      });

      const { Messages } = await sqs.send(command);

      if (Messages && Messages.length > 0) {
        const job = Messages[0];
        const body = JobSchema.parse(job.Body);
        //TODO: Update the deployment status to building
        const logs = await executeProcess(job)
        deploymentId = body.deploymentId;
        const projectDir = path.join("/tmp/builds", deploymentId);
        
        await uploadDir(projectDir,body.userId)
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
