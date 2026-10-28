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

    const hmac = crypto.createHmac("sha256", env.GITHUB_WEBHOOK_SECRET);
    const digest = "sha256=" + hmac.update(req.rawBody).digest("hex");

    const signatureBuffer = Buffer.from(signature);
    const digestBuffer = Buffer.from(digest);

    if (signatureBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(signatureBuffer, digestBuffer)) {
        return res.status(401).json({ error: "Invalid signature" });
    }

    next();
}

export const createDeploymentWebhook = async (req: Request, res: Response)=>{
    // Acknowledge receipt to GitHub immediately
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

// GitHub redirects the popup here after the user installs the app.
// We postMessage the result to the opener and close. Never loads the SPA.
export const githubAppSetupPopupWindow = (req: Request, res: Response) => {
  const installationId = req.query.installation_id ?? "";
  const setupAction = req.query.setup_action ?? "";
  const origin = env.FRONTEND_URL;

  // ponytail: one HTML string, no sanitisation lib — values are
  // JSON.stringify'd into the script so quotes/tags can't break out.
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html><head><title>ShipWebsite — Setup</title></head>
<body>
<p>Completing installation…</p>
<script>
(function() {
  var data = {
    type: "GITHUB_APP_SETUP_COMPLETE",
    installationId: ${JSON.stringify(String(installationId))},
    setupAction: ${JSON.stringify(String(setupAction))}
  };
  if (window.opener) {
    window.opener.postMessage(data, ${JSON.stringify(origin)});
  }
  window.close();
  // If popup blocker prevents close, show a message instead of a blank page.
  document.body.innerHTML = "<p>Installation complete — you can close this tab.</p>";
})();
</script>
</body></html>`);
}