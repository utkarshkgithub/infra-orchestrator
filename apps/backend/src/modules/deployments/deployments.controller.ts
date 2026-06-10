/**
 * Deployment can be done in 3 ways :
 * 1) User creates a project automated deployment
 * 2) User pushed to github new Deployment
 * 3) User clicks create Deployment
 * TODO: implement option 1+2
 */

import {
  getDetails,
  getDeployments,
  createDeployment,
  updateDeploymentById,
  updateDeploymentByIdWorker,
} from "./deployments.service.js";
import { Request, Response } from "express";
import {
  DeploymentSchema,
  UpdateDeploymentSchema,
} from "./deployments.types.js";
import { env } from "../../lib/env.js";

export const getDeploymentDetails = async (req: Request, res: Response) => {
  const deploymentId = Number(req.params.projectId);
  const userId = req.user?.id!;
  const details = await getDetails(deploymentId, userId);
  res.status(200).json(details);
};

export const getAllDeployments = async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const deployments = await getDeployments(userId);
  res.status(200).json(deployments);
};

export const newDeployment = async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const deployment = DeploymentSchema.parse(req.body);
  const newDeployment = await createDeployment(deployment, userId);
  res.status(201).json(newDeployment);
};

export const updateDeployment = async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const id = req.params.id;
  const rawDepoyment = req.body;
  const parsedDeployment = UpdateDeploymentSchema.parse({
    ...rawDepoyment,
    id,
  }); //id here is deploymentId
  const deployment = await updateDeploymentById(parsedDeployment, userId);
  return res.status(200).json(deployment);
};

export const updateDeploymentWorker = async (req: Request, res: Response) => {
  const token = req.get("Authorization")?.replace("Bearer ", "");
  if (token != env.BACKEND_SERVICE_TOKEN) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const id = req.params.id;
  const rawDepoyment = req.body;
  const parsedDeployment = UpdateDeploymentSchema.parse({
    ...rawDepoyment,
    id,
  }); //id here is deploymentId
  const deployment = await updateDeploymentByIdWorker(parsedDeployment);
  return res.status(200).json(deployment);
};
