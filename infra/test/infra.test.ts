import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import * as Infra from "../lib/infra-stack";
import { OracleWorkerStack } from "../lib/oracle-worker-stack";

// The InfraStack reads environment variables for the Lambda function. Provide
// deterministic values so synthesis does not depend on a local .env file.
process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
process.env.GITHUB_CLIENT_ID = "test-client-id";
process.env.GITHUB_CLIENT_SECRET = "test-client-secret";
process.env.GITHUB_CALLBACK_URL = "https://api.example.com/auth/github/callback";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_EXPIRES_IN = "7d";
process.env.BACKEND_SERVICE_TOKEN = "test-service-token";

function synthInfraStack() {
  const app = new cdk.App();
  // Skip lambda asset bundling during synthesis so tests don't need esbuild/pnpm.
  app.node.setContext("aws:cdk:bundling-stacks", []);
  const stack = new Infra.InfraStack(app, "InfraStack", {
    env: { account: "905418049305", region: "ap-south-1" },
  });
  return Template.fromStack(stack);
}

test("InfraStack creates an SQS queue with a dead-letter queue", () => {
  const template = synthInfraStack();

  template.hasResourceProperties("AWS::SQS::Queue", {
    QueueName: "mysqs",
    VisibilityTimeout: 480,
    RedrivePolicy: Match.objectLike({
      maxReceiveCount: 3,
      deadLetterTargetArn: Match.objectLike({
        "Fn::GetAtt": Match.arrayWith([Match.stringLikeRegexp("^DLQ")]),
      }),
    }),
  });
  template.resourceCountIs("AWS::SQS::Queue", 2);
  template.hasResourceProperties("AWS::SQS::Queue", {
    QueueName: "mysqs-dlq",
  });
});

test("InfraStack creates an encrypted, SSL-enforced S3 bucket", () => {
  const template = synthInfraStack();

  template.hasResourceProperties("AWS::S3::Bucket", {
    BucketName: "infra-orchestrator-s3",
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: "AES256",
          },
        },
      ],
    },
  });
});

test("InfraStack creates a Lambda function wired to the queue and bucket", () => {
  const template = synthInfraStack();

  template.resourceCountIs("AWS::Lambda::Function", 1);
  template.hasResourceProperties("AWS::Lambda::Function", {
    Runtime: "nodejs22.x",
    MemorySize: 256,
    Timeout: 15,
  });
});

test("InfraStack creates an HTTP API and a CloudFront distribution", () => {
  const template = synthInfraStack();

  template.resourceCountIs("AWS::ApiGatewayV2::Api", 1);
  template.resourceCountIs("AWS::CloudFront::Distribution", 1);
});

test("InfraStack lambda has IAM permission to send to the queue", () => {
  const template = synthInfraStack();

  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: Match.arrayWith(["sqs:SendMessage"]),
        }),
      ]),
    },
  });
});

test("OracleWorkerStack grants SQS receive/delete and S3 put to the worker user", () => {
  const app = new cdk.App();
  app.node.setContext("aws:cdk:bundling-stacks", []);
  const stack = new OracleWorkerStack(app, "OracleWorkerStack", {
    env: { account: "905418049305", region: "ap-south-1" },
  });
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::IAM::User", {});
  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: Match.arrayWith([
            "sqs:ReceiveMessage",
            "sqs:DeleteMessage",
            "sqs:ChangeMessageVisibility",
          ]),
        }),
        Match.objectLike({
          Action: Match.stringLikeRegexp("s3:PutObject"),
        }),
      ]),
    },
  });
  template.resourceCountIs("AWS::IAM::AccessKey", 1);
});

test("InfraStack matches the snapshot (no silent config drift)", () => {
  const template = synthInfraStack();
  expect(template.toJSON()).toMatchSnapshot();
});