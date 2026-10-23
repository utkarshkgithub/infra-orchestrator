import { Request, Response } from "express";
import { CommitAuthorSchema} from "./githubApp.types.js";
import {  createMultipleDeployments, getProjectsFromGithubProjectId } from "./githubApp.services.js";
import { ProjectListSchema } from "../projects/projects.types.js";
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
    // Acknowledge receipt to GitHub immediately — GitHub redelivers if it
    // doesn't get a 200 within ~10s, which creates duplicate deployments.
    res.status(200).json();
    const authorData = req.body.head_commit?.author;
    const repoData = req.body.repository;
    const githubProjectId = repoData.id;
    const commitHash = req.body.after;
    const commitMessage = req.body.head_commit?.message;
    const dbProjects = await getProjectsFromGithubProjectId(githubProjectId);
    const projects = ProjectListSchema.parse(dbProjects);
    const author = CommitAuthorSchema.parse(authorData);

    // Process deployment after acknowledging; errors are logged, not re-sent
    createMultipleDeployments(
      projects,
      commitHash,
      author,
      commitMessage,
      req.body.installation?.id
    ).catch((err) => {
      logger.error({ err, commitHash }, "Webhook deployment processing failed");
    });
}
