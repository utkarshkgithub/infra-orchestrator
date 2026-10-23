import { Router } from "express";
import {
  getDeploymentDetails,
  listDeployments,
  createDeployment,
  updateDeployment,
  patchDeployment,
} from "./deployments.controller.js";
const deploymentRouter = Router();

deploymentRouter.get("/", listDeployments);
deploymentRouter.post("/create", createDeployment);
deploymentRouter.get("/:id", getDeploymentDetails);
deploymentRouter.post("/update", updateDeployment);
deploymentRouter.patch("/:id", patchDeployment);

export default deploymentRouter;
