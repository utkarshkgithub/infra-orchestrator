// simple task push job received via /deployment/create to aws sqs
import {SQSClient} from "@aws-sdk/client-sqs"
import {SendMessageCommand} from "@aws-sdk/client-sqs"
import {env} from "../lib/env.js"
import { AppError } from "../middleware/error.middleware.js";
import { logger } from "../lib/logger.js";
import { Job } from "../modules/deployments/job.types.js";

// init
const sqs = new SQSClient({
    region: env.AWS_REGION,
})

export const pushDeploymentService = async (MessageBody : Job)=>{
    const command = new SendMessageCommand({
        QueueUrl: env.QUEUE_URL,
        MessageBody: JSON.stringify(MessageBody),
    })
    try{
        const res = await sqs.send(command)
        logger.info(res,"Message push response")
        logger.info(MessageBody,`Job pushed successfully`)
    } catch(err){
        logger.error(err,"Failed to push job");
        throw new AppError(500,"Failed to push job");
    }
}