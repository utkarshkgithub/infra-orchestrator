#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { InfraStack } from "../lib/infra-stack";
import { OracleWorkerStack } from "../lib/oracle-worker-stack";

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};
new InfraStack(app, "InfraStack", {
  env,
});
new OracleWorkerStack(app, "OracleWorkerStack", {
  env,
});
