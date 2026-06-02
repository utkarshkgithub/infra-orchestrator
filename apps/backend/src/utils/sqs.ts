// simple task push job received via /deployment/create to aws sqs
import {SQSClient} from "@aws-sdk/client-sqs"
import {SendMessageCommand} from "@aws-sdk/client-sqs"
import {env} from "../lib/env.js"
import { DeploymentInput } from "../modules/deployments/deployments.types.js";
import { AppError } from "../middleware/error.middleware.js";
import { logger } from "../lib/logger.js";

// init
const sqs = new SQSClient({
    region: env.AWS_REGION,
})

const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/000000000000/mysqs.fifo"; //TODO : change it

export const pushDeploymentService = async (MessageBody : DeploymentInput)=>{
    const command = new SendMessageCommand({
        QueueUrl:QUEUE_URL,
        MessageBody: JSON.stringify(MessageBody),
        MessageGroupId: "project-frontend-build"
    })
    try{
        const res = await sqs.send(command)
        logger.info(MessageBody,`Job pushed successfully`)
    } catch(err){
        logger.error(err,"Failed to push job");
        throw new AppError(500,"Failed to push job");
    }
}