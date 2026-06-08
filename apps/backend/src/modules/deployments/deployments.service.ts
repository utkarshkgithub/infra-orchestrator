import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { DeploymentStatus } from "@prisma/client";
import { DeploymentInput } from "./deployments.types.js";
import { pushDeploymentService } from "../../utils/sqs.js";
import { ProjectSchema } from "../projects/projects.types.js";
//TODO : fix the BOLA vulnerability and a patch endpoint

export const createDeployment = async (
  deployment: DeploymentInput,
  userId: number,
) => {
  const projectId = deployment.projectId;
  const rawProject = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });
  if (!rawProject || rawProject?.userId != userId) {
    throw new AppError(401, "Unauthorized or Project not found");
  }
  const newDeployment = await prisma.deployment.create({
    data: { projectId },
  });
  const project = ProjectSchema.parse({ ...rawProject ,
    projectId,
    deploymentId:newDeployment.id
  });
  pushDeploymentService(project);
  return newDeployment;
};

export const getDeployments = async (userId: number) => {
  return prisma.deployment.findMany({
    where: {
      project: {
        userId,
      },
    },
  });
};

export const getDetails = async (id: number, userId: number) => {
  return prisma.deployment.findUnique({
    where: {
      id,
      project: {
        userId,
      },
    },
  });
};

export const getDeploymentsByProjectId = async (
  projectId: string,
  userId: number,
) => {
  return prisma.deployment.findMany({
    where: {
      projectId,
      project: {
        userId,
      },
    },
  });
};

export const updateDeploymentStatus = async (
  id: number,
  status: DeploymentStatus,
  userId: number,
) => {
  const currentDeployment = await prisma.deployment.findUnique({
    where: {
      id,
      project: {
        userId,
      },
    },
  });
  if (!currentDeployment) {
    throw new AppError(401, "Unauthorized or Deployment not found");
  }

  return prisma.deployment.update({
    where: {
      id,
    },
    data: {
      status,
    },
  });
};
