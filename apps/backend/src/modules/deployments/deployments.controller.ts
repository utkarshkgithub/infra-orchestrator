/**
 * Deployment can be done in 3 ways :
 * 1) User creates a project automated deployment
 * 2) User pushed to github new Deployment (handled by /githubApp/webhook)
 * 3) User clicks create Deployment
 */

import * as deploymentsService from "./deployments.service.js";
import { Request, Response } from "express";
import {
  UpdateDeploymentSchema,
} from "./deployments.types.js";
import { env } from "../../lib/env.js";
import { generateProjectPreview } from "../../utils/preview.service.js";
import { AppError } from "../../middleware/error.middleware.js";

export const getDeploymentDetails = async (req: Request, res: Response) => {
  const deploymentId = Number(req.params.id);
  const userId = req.user?.id!;
  const details = await deploymentsService.getDeploymentDetails(deploymentId, userId);
  res.status(200).json(details);
};

export const listDeployments = async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const deployments = await deploymentsService.getDeployments(userId, page, limit);
  res.status(200).json(deployments);
};

export const listProjectDeployments = async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const projectId = Number(req.params.id);
  const deployments = await deploymentsService.getDeploymentsByProject(projectId, userId);
  res.status(200).json(deployments);
};

export const createDeploymentForProject = async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const projectId = Number(req.params.id);
  const commitHash: string = req.body.commitHash;
  if (!projectId || !commitHash || !userId) {
    throw new AppError(400, "Bad Request");
  }
  const newDeployment = await deploymentsService.createDeployment(projectId, commitHash, userId);
  res.status(201).json(newDeployment);
};

export const patchDeployment = async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const id = Number(req.params.id);
  const rawDeployment = req.body;
  const parsedDeployment = UpdateDeploymentSchema.parse({ ...rawDeployment, id });
  const deployment = await deploymentsService.updateDeploymentById(parsedDeployment, userId);
  return res.status(200).json(deployment);
};

export const createDeployment = async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const projectId : number = req.body.projectId;
  const commitHash : string = req.body.commitHash;
  if(!projectId ||!commitHash || !userId){
    throw new AppError(400,"Bad Request")
  }
  const newDeployment = await deploymentsService.createDeployment(projectId,commitHash, userId);
  res.status(201).json(newDeployment);
};

export const updateDeployment = async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const id = req.body?.id;
  const rawDeployment = req.body;
  const parsedDeployment = UpdateDeploymentSchema.parse({
    ...rawDeployment,
    id,
  }); //id here is deploymentId
  const deployment = await deploymentsService.updateDeploymentById(parsedDeployment, userId);
  return res.status(200).json(deployment);
};

export const updateDeploymentWorker = async (req: Request, res: Response) => {
  const token = req.get("Authorization")?.replace("Bearer ", "");
  if (token != env.BACKEND_SERVICE_TOKEN) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const id = Number(req.params.id); //id here is deploymentId
  if(id<0){
    return res.status(500).json({
      status : "failed",
      message : "deployment not acknowledged",
      logs : req.body.logs
    })
  }
  const rawDeployment = req.body;
  const parsedDeployment = UpdateDeploymentSchema.parse({
    ...rawDeployment,
    id,
  });
  const deployment = await deploymentsService.updateDeploymentByIdWorker(parsedDeployment);
  if (parsedDeployment.status === "success") {
    void generateProjectPreview(deployment.projectId, deployment.id);
  }
  return res.status(200).json(deployment);
};