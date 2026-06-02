# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

Idea is simple in dev to avoid changing the key i prefered to use two stacks one for IAM policy and another for the main resources required for the build which is sqs , lambda , api gateway .

## Deployment cmds

* `cdk deploy OracleWorkerStack` First Time Setup (Deploy IAM keys once)
* `cdk deploy InfraStack` Start Coding Session (Spin up backend)
* `cdk destroy InfraStack` End Coding Session (Delete backend, save money!)