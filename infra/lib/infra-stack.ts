import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import path from "path";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../apps/backend/.env") });
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";

const cors: apigwv2.CorsPreflightOptions = {
  allowCredentials: true,
  allowOrigins: ["http://localhost:5173"], //TODO: change to production frontendURL
  allowMethods: [
    apigwv2.CorsHttpMethod.GET,
    apigwv2.CorsHttpMethod.DELETE,
    apigwv2.CorsHttpMethod.POST,
    apigwv2.CorsHttpMethod.PATCH,
  ],
  allowHeaders: ["Content-Type", "Authorization"],
};

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, "myqueue", {
      queueName: "mysqs.fifo",
      fifo: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, //TODO: change to retain in production
      contentBasedDeduplication: true,
    });

    const bucket = new s3.Bucket(this, "mybucket", {
      bucketName: "infra-orchestrator-s3",
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, //TODO: change to retain in production
    });

    const server = new NodejsFunction(this, "mylambdafunc", {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../../apps/backend/src/lambda.ts"),
      handler: "handler",
      environment: {
        DATABASE_URL: process.env.DATABASE_URL!,
        FRONTEND_URL: process.env.FRONTEND_URL!,
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID!,
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET!,
        GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL!,
        JWT_SECRET: process.env.JWT_SECRET!,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,
        S3_BUCKET_NAME: bucket.bucketName,
        QUEUE_URL: queue.queueUrl,
        NODE_ENV: process.env.NODE_ENV!,
      },
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      bundling: {
        format: OutputFormat.CJS,
        target: "es2022",
      },
    });

    // grant permission to server
    queue.grantSendMessages(server);
    bucket.grantReadWrite(server);

    const api = new apigwv2.HttpApi(this, "Myapi", {
      corsPreflight: cors,
      createDefaultStage: true,
    });

    api.addRoutes({
      path: "/{proxy+}",
      integration: new HttpLambdaIntegration("Deployment", server),
    });

    new cdk.CfnOutput(this, "ApiGatewayEndpoint", {
      value: api.apiEndpoint,
      description: "The default endpoint for the HTTP API",
    });

    new cdk.CfnOutput(this, "SqsQueueUrl", {
      value: queue.queueUrl,
      description: "The URL of the SQS FIFO queue",
    });

    new cdk.CfnOutput(this, "SqsQueueName", {
      value: queue.queueName,
      description: "The name of the SQS FIFO queue",
    });

    new cdk.CfnOutput(this, "S3BucketName", {
      value: bucket.bucketName,
      description: "The name of the S3 bucket",
    });

    new cdk.CfnOutput(this, "LambdaFunctionName", {
      value: server.functionName,
      description: "The name of the Lambda Function",
    });
  }
}

/**
 * TODO: Add these prop
 * defaultDomainMapping, disableExecuteApiEndpoint, defaultAuthorizer: jwtAuthorizer
 */
