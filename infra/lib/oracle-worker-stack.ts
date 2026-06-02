import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";

export class OracleWorkerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the persistent IAM User
    const workerUser = new iam.User(this, "OracleWorker");

    // Add permissions matching the exact names we will give the SQS/S3 resources
    workerUser.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:ChangeMessageVisibility",
        ],
        resources: [`arn:aws:sqs:${this.region}:${this.account}:mysqs.fifo`], // also referenced in infra-stack , must have same name
      })
    );

    workerUser.addToPolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject"],
        resources: ["arn:aws:s3:::frontendbucket-unique-dev-id/*"], // also referenced in infra-stack
      })
    );

    // Generate the static Access Key
    const key = new iam.AccessKey(this, "WorkerAccessKey", {
      user: workerUser,
    });

    // Output keys to terminal on deploy
    new cdk.CfnOutput(this, "OracleWorkerAccessKeyId", { value: key.accessKeyId });
    new cdk.CfnOutput(this, "OracleWorkerSecretAccessKey", { value: key.secretAccessKey.unsafeUnwrap() });
  }
}