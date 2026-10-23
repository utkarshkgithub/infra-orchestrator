import { Router } from "express"
import { createDeploymentWebhook, validateWebhook } from "./githubApp.controller.js";

const githubAppRouter = Router();

// shortcut: webhook deliveries are not deduped; a replayed x-github-delivery
// re-runs the whole webhook. Upgrade: persist the delivery id and skip when
// already seen, once duplicate processing becomes a real problem.
githubAppRouter.post("/webhook",validateWebhook,createDeploymentWebhook)

export default githubAppRouter;
