import { Router, Request, Response } from "express"
import { createDeploymentWebhook, githubAppSetupPopupWindow, validateWebhook } from "./githubApp.controller.js";
import { env } from "../../lib/env.js";

const githubAppRouter = Router();

// shortcut: webhook deliveries are not deduped; a replayed x-github-delivery
// re-runs the whole webhook. Upgrade: persist the delivery id and skip when
// already seen, once duplicate processing becomes a real problem.
githubAppRouter.post("/webhook",validateWebhook,createDeploymentWebhook)

githubAppRouter.get("/setup", githubAppSetupPopupWindow);

export default githubAppRouter;
