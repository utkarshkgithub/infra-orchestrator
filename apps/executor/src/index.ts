// TODO: implement it in docker to avoid worker crash
import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";

// init
const sqs = new SQSClient({
  region: "us-east-1", //TODO: change to ap-south-1
});

async function startWorker() {
  console.log(`Worker Started!!`);
  while (true) {
    try {
      const command = new ReceiveMessageCommand({
        MaxNumberOfMessages: 1,
        QueueUrl: "", //TODO: add QUEUE_URL
        WaitTimeSeconds: 20,
      });

      const { Messages } = await sqs.send(command);

      if (Messages && Messages.length > 0) {
        const job = Messages[0];
        //TODO : clone the repo ,install dependencies, build, push to s3
        const delCommand = new DeleteMessageCommand({
          QueueUrl: "", //TODO: add QUEUE_URL
          ReceiptHandle: job.ReceiptHandle,
        });
        await sqs.send(delCommand);
        console.log(`Job completed\n${job}`);
      }
    } catch (err) {
      console.error("Error Occured", err);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

startWorker();
