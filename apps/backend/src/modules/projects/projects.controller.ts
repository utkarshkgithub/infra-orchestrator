import { Response, NextFunction, Request } from "express";
import * as projectsService from "./projects.service.js";
import { CreateProjectSchema, UpdateProjectSchema } from "./projects.types.js";
import type { UpdateProjectInput } from "./projects.types.js";
import crypto from "crypto";
import { logger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.middleware.js";

// return the all user projects
export const listProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id!;
    const includeLatestDeployment =
      req.query.includeLatestDeployment === "true";
    const projects = await projectsService.getProjects(
      userId,
      includeLatestDeployment,
    );
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
export const getProject = async (req: Request, res: Response) => {
  try {
    const projectId = Number(req.params.id);
    const userId = req.user?.id!;
    logger.info(`${projectId} , ${userId}`);
    const details = await projectsService.getProjectDetails(projectId, userId);
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
export const createProject = async (req: Request, res: Response) => {
  try {
    const parsedProject = CreateProjectSchema.parse({
      ...req.body,
      userId: req.user?.id,
    });
    const project = await projectsService.createProject(parsedProject);
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
    const id = req.params.id ? Number(req.params.id) : req.body?.id;
    const parsedProject = UpdateProjectSchema.parse({
      ...req.body,
      id,
      userId,
    });
    if (!parsedProject.id) {
      logger.error(parsedProject, "Project id is missing");
      throw new AppError(400, "Project id not provided");
    }
    const project = await projectsService.updateProjectDetails(parsedProject, userId);
    return res.status(200).json(project);
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    logger.error(err, "update project Issue");
    throw new AppError(500, "update project Issue");
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id!;
    const id = Number(req.params.id);
    await projectsService.deleteProject(id, userId);
    return res.status(204).send();
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    logger.error(err, "Delete project Issue");
    throw new AppError(500, "Delete project Issue");
  }
};
