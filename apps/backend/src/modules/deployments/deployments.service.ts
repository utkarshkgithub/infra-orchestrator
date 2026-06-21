import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { DeploymentStatus } from "@prisma/client";
import { deploymentInput, projectIdInput } from "./deployments.types.js";
import { pushDeploymentService } from "../../utils/sqs.js";
import { JobSchema } from "./job.types.js";
//TODO : fix the BOLA vulnerability and a patch endpoint

export const createDeployment = async (
  deployment: projectIdInput,
  userId: number,
) => {
  const projectId = deployment.projectId;
  const rawProject = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });
  if (!rawProject || rawProject?.userId != userId) {
    throw new AppError(401, "Unauthorized");
  }

  const newDeployment = await prisma.deployment.create({
    data: { projectId },
  });
  const job = JobSchema.parse({
    ...rawProject,
    deploymentId: newDeployment.id,
  });
  await pushDeploymentService(job); // TODO: use the transactional outbox pattern as it can happen that db is updated but this fails later
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
  projectId: number,
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

export const updateDeploymentById = async (
  deployment: deploymentInput,
  userId: number,
) => {
  const id = deployment.id;
  const currentDeployment = await prisma.deployment.findFirst({
    where: {
      id,
      project: {
        userId,
      },
    },
  });
  if (!currentDeployment) {
    throw new AppError(403, "Forbidden");
  }

  return prisma.deployment.update({
    where: {
      id,
    },
    data: {
      ...deployment,
    },
  });
};

export const updateDeploymentByIdWorker = async (
  deployment: deploymentInput,
) => {
  const id = deployment.id;
  return prisma.deployment.update({
    where: {
      id,
    },
    data: {
      ...deployment,
    },
  });
};
