import { Request, Response } from "express";
import { CommitAuthorSchema} from "./githubApp.types.js";
import {  createMultipleDeployments, getProjectsFromGithubProjectId } from "./githubApp.services.js";
import { ProjectSchemaList } from "../projects/projects.types.js";
import crypto from "crypto"
import { env } from "../../lib/env.js";
import { logger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.middleware.js";
export const validateWebhook = async (req:Request, res:Response,next: Function)=>{
    const signature = req.headers["x-hub-signature-256"];

    if (!signature || typeof signature !== "string") {
        return res.status(401).json({ error: "Missing or invalid signature" });
    }

    const githubEvent = req.headers?.['x-github-event'];
    const payload = req.body;

    if (githubEvent !== 'push' || !payload || !req.rawBody) {
        throw new AppError(400,"Github Event is not Push");
    }

    const hmac = crypto.createHmac("sha256", env.GITHUB_APP_SECRET);
    const digest = "sha256=" + hmac.update(req.rawBody).digest("hex");

    const signatureBuffer = Buffer.from(signature);
    const digestBuffer = Buffer.from(digest);

    if (signatureBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(signatureBuffer, digestBuffer)) {
        return res.status(401).json({ error: "Invalid signature" });
    }

    next();
}

export const createDeploymentWebhook = async (req: Request, res: Response)=>{
    const authorData = req.body.head_commit?.author;
    const repoData= req.body.repository;
    const userId = repoData.owner.id;
    const repoName = repoData.full_name;
    const githubProjectId = repoData.id;
    const commitHash = req.body.after;
    const commitMessage = req.body.head_commit?.message;
    const dbProjects = await getProjectsFromGithubProjectId(githubProjectId);
    const projects = ProjectSchemaList.parse(dbProjects);
    //TODO: store author in db and display it in frontend 
    const author = CommitAuthorSchema.parse(authorData);
    
    const deployments = await createMultipleDeployments(projects,commitHash,author,commitMessage);
    res.status(200).json() //github Webhook response within 10 sec
    return;
}
