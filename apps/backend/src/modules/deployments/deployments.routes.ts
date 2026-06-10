import { Router } from "express";
import {
  getDeploymentDetails,
  getAllDeployments,
  newDeployment,
  updateDeployment,
} from "./deployments.controller.js";
const deploymentRouter = Router();

deploymentRouter.get("/", getAllDeployments);
deploymentRouter.post("/create", newDeployment);
deploymentRouter.get("/:id", getDeploymentDetails);
deploymentRouter.post("/update",updateDeployment);

export default deploymentRouter;
