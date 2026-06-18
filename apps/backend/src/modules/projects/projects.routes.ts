import { Router } from "express";
import {
  projectDetails,
  newProject,
  userProjects,
  updateProject,
} from "./projects.controller.js";

const projectRouter = Router();

projectRouter.post("/create", newProject);
projectRouter.get("/", userProjects);
projectRouter.get("/:id", projectDetails);
projectRouter.patch("/update", updateProject);

export default projectRouter;
