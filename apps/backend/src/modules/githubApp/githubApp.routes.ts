import { Router, Request, Response } from "express"
import { createDeploymentWebhook, validateWebhook } from "./githubApp.controller.js";
import { env } from "../../lib/env.js";

const githubAppRouter = Router();

// shortcut: webhook deliveries are not deduped; a replayed x-github-delivery
// re-runs the whole webhook. Upgrade: persist the delivery id and skip when
// already seen, once duplicate processing becomes a real problem.
githubAppRouter.post("/webhook",validateWebhook,createDeploymentWebhook)

// ponytail: inline HTML string — no template engine, no file, just a string.
// GitHub redirects the popup here after the user installs the app.
// We postMessage the result to the opener and close. Never loads the SPA.
githubAppRouter.get("/setup", (req: Request, res: Response) => {
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
});

export default githubAppRouter;
