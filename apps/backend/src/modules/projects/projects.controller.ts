import { Response, NextFunction, Request } from "express";
import * as projectsService from "./projects.service.js";
import { CreateProjectSchema, UpdateProjectSchema } from "./projects.types.js";
import { logger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.middleware.js";

// return the all user projects
export const listProjects = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const includeLatestDeployment =
      req.query.includeLatestDeployment === "true";
    const projects = await projectsService.getProjects(
      userId,
      includeLatestDeployment,
    );
    return res.status(200).json(projects);
};

// return specific project details
export const getProject = async (req: Request, res: Response) => {
    const projectId = Number(req.params.id);
    const userId = req.user?.id!;
    if (!Number.isInteger(projectId) || projectId <= 0) {
      throw new AppError(400, "Invalid project ID");
    }
    logger.info(`${projectId} , ${userId}`);
    const details = await projectsService.getProjectDetails(projectId, userId);
    if(!details){
      throw new AppError(404, "Project Not Found");
    }
    return res.status(200).json(details);
};

// create new project
export const createProject = async (req: Request, res: Response) => {
    const parsedProject = CreateProjectSchema.parse({
      ...req.body,
    });
    const project = await projectsService.createProject(parsedProject,req.user!.id);
    return res.status(201).json(project);
};

//update existing project
export const updateProject = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const id = req.params.id ? Number(req.params.id) : req.body?.id;
    const parsedProject = UpdateProjectSchema.parse({
      ...req.body,
      id,
    });
    const project = await projectsService.updateProjectDetails(parsedProject, userId);
    return res.status(200).json(project);
};

export const deleteProject = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const id = Number(req.params.id);
    await projectsService.deleteProject(id, userId);
    return res.status(204).send();
};

//TODO: implement environment controller for patch and put