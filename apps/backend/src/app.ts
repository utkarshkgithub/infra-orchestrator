import express from "express";
import { errorMiddleware } from "./middleware/error.middleware.js";
import cookieParser from "cookie-parser";
import authrouter from "./modules/auth/auth.routes.js";
import projectRouter from "./modules/projects/projects.routes.js";
import { authMiddlewareJWT } from "./middleware/auth.middleware.js";
import deploymentRouter from "./modules/deployments/deployments.routes.js";
import {
  updateDeploymentWorker,
} from "./modules/deployments/deployments.controller.js";
import githubAppRouter from "./modules/githubApp/githubApp.routes.js";

const app = express();

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(cookieParser());
// githubRepoId is int8 in the DB, so Prisma hands back BigInt. JSON.stringify
// cannot serialize BigInt (it throws), so convert at the response edge.
// shortcut: casting to number has the 2^53 ceiling — GitHub repo ids currently
// sit near 1e9, so this holds for decades; revisit only if ids ever pass 2^53.

// export const bigIntJsonReplacer = (
//   _key: string,
//   value: unknown,
// ): unknown => (typeof value === "bigint" ? Number(value) : value);

// app.set("json replacer", bigIntJsonReplacer);
app.use("/auth", authrouter);
app.use("/project", authMiddlewareJWT, projectRouter);
app.use("/deployment", authMiddlewareJWT, deploymentRouter);
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    version: "2",
  });
});

app.use("/githubApp",githubAppRouter);

app.post("/api/builds/:id/status", updateDeploymentWorker);

app.use(errorMiddleware);

export default app;
