import { Response, NextFunction, Request } from "express";
import {
  createProject,
  getProjectDetails,
  getProjects,
  updateProjectDetails,
} from "./projects.service.js";
import { ProjectSchema } from "./projects.types.js";
import type { ProjectInput } from "./projects.types.js";
import crypto from "crypto";
import { logger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.middleware.js";

// return the all user projects
export const userProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id!;
    const projects = await getProjects(userId);
    return res.status(200).json(projects);
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    logger.error(err, "Get ALL User Projects Failed");
    throw new AppError(500, "Projects Fetch failed");
  }
};

// return specific project details
export const projectDetails = async (req: Request, res: Response) => {
  try {
    const projectId = Number(req.params.id);
    const userId = req.user?.id!;
    logger.info(`${projectId} , ${userId}`);
    const details = await getProjectDetails(projectId, userId);
    return res.status(200).json(details);
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    logger.error(err, "Get project details Failed");
    throw new AppError(500, "Project details Fetch failed");
  }
};

// create new project
export const newProject = async (req: Request, res: Response) => {
  try {
    const parsedProject = ProjectSchema.parse({
      ...req.body,
      userId: req.user?.id,
    });
    const project = await createProject(parsedProject);
    return res.status(201).json(project);
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    logger.error(err, "Create project Issue");
    throw new AppError(500, "Create project Issue");
  }
};

//update existing project
export const updateProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id!;
    const parsedProject = ProjectSchema.parse({
      ...req.body,
      userId,
    });
    if (!parsedProject.id) {
      logger.error(parsedProject, "Project id is missing");
      throw new AppError(400, "Project id not provided");
    }
    const project = await updateProjectDetails(parsedProject, userId);
    return res.status(200).json(project);
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    logger.error(err, "update project Issue");
    throw new AppError(500, "update project Issue");
  }
};
