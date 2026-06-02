import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  Runtime,
  FunctionUrlCorsOptions,
  HttpMethod,
} from "aws-cdk-lib/aws-lambda";
import path from "path";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";

import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

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

    const server = new NodejsFunction(this, "mylambdafunc", {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../../apps/backend/src/lambda.ts"),
      handler: "handler",
    });

    const api = new apigwv2.HttpApi(this, "Myapi", {
      corsPreflight: cors,
      createDefaultStage: true,
    });

    api.addRoutes({
      path: "/{proxy+}",
      integration: new HttpLambdaIntegration("Deployment", server),
    });

    const queue = new sqs.Queue(this, "myqueue", {
      queueName: "mysqs.fifo",
      fifo: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, //TODO: change to retain in production
      contentBasedDeduplication: true,
    });

    const bucket = new s3.Bucket(this, "mybucket", {
      bucketName: "frontendbucket-unique-dev",
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, //TODO: change to retain in production
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
  }
}

/**
 * TODO: Add these prop
 * defaultDomainMapping, disableExecuteApiEndpoint, defaultAuthorizer: jwtAuthorizer
 */
