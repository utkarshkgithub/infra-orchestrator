import { Router } from "express"
import { createDeploymentWebhook, validateWebhook } from "./githubApp.controller.js";

const githubAppRouter = Router();

// TODO: handle dedup later with req.headers["x-github-delivery"], this is unique
githubAppRouter.post("/webhook",validateWebhook,createDeploymentWebhook)

export default githubAppRouter;
