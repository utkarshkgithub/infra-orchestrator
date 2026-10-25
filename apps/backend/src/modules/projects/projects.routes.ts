import { Router } from "express";
import {
  getProject,
  createProject,
  listProjects,
  updateProject,
  deleteProject,
} from "./projects.controller.js";
import {
  listProjectDeployments,
  createDeploymentForProject,
} from "../deployments/deployments.controller.js";

const projectRouter = Router();

projectRouter.post("/create", createProject);
projectRouter.get("/", listProjects);
projectRouter.get("/:id", getProject);
projectRouter.patch("/:id", updateProject);
projectRouter.delete("/:id", deleteProject);
projectRouter.get("/:id/deployments", listProjectDeployments);
projectRouter.post("/:id/deployments", createDeploymentForProject);

export default projectRouter;
