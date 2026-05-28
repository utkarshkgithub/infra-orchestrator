import { Router } from "express";
import {
  getDeploymentDetails,
  getAllDeployments,
  newDeployment,
} from "./deployments.controller.js";
const deploymentRouter = Router();

deploymentRouter.get("/", getAllDeployments);
deploymentRouter.post("/create", newDeployment);
deploymentRouter.get("/:id", getDeploymentDetails);

export default deploymentRouter;
