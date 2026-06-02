import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { DeploymentStatus } from "../../../generated/prisma/enums.js";
//TODO : fix the BOLA vulnerability and a patch endpoint

export const createDeployment = async (projectId: string, userId: number) => {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });
  if (!project || project?.userId != userId) {
    throw new AppError(401, "Unauthorized or Project not found");
  }
  const deployment = await prisma.deployment.create({
    data: { projectId },
  });
  //TODO: use utils/sqs
  return deployment;
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
  if(!currentDeployment){
    throw new AppError(401,"Unauthorized or Deployment not found");
  }

  return prisma.deployment.update({
    where: {
      id,
    },
    data: {
      status
    }
  })
};
