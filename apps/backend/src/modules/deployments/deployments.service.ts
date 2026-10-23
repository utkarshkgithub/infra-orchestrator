import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { DeploymentStatus } from "@prisma/client";
import { DeploymentUpdateInput } from "./deployments.types.js";
import { enqueueDeployment } from "../../utils/sqs.js";
import { DeploymentSchema, JobSchema } from "./job.types.js";
import { getProjectDetails } from "../projects/projects.service.js";
import { buildCloneUrl, findRepoInstallationToken } from "../../lib/githubApp.js";

export const createDeployment = async (
  projectId: number,
  commitHash: string,
  userId: number,
) => {

  const _ = JobSchema.shape.commitHash.parse(commitHash)

  const rawProject = await getProjectDetails(projectId,userId)
  if(rawProject===null){
    throw new AppError(401,"Unauthorized");
  }

  //TODO: verify the commitHash is valid accessible in the project commit list

  // Every deployment clones through the GitHub App installation — commit-based
  // builds have no other credential source, so there is deliberately no
  // token-less fallback path for public repos.
  if (!rawProject.githubRepoId) {
    throw new AppError(400, "Project is not linked to a GitHub repository");
  }
  const cloneToken = await findRepoInstallationToken(
    Number(rawProject.githubRepoId)
  ).catch(() => null);
  if (!cloneToken) {
    throw new AppError(
      400,
      "The ShipWebsite GitHub App is not installed on this repository — install it before deploying"
    );
  }

  const newDeployment = await prisma.deployment.create({
    data: {
      projectId,
      commitHash
    },
  });
  const job = DeploymentSchema.parse({
    ...rawProject,
    repoUrl: buildCloneUrl(rawProject.repoUrl, cloneToken),
    deploymentId: newDeployment.id,
    commitHash
  });
  try {
    await enqueueDeployment(job);
  } catch (err) {
    // shortcut: compensating delete keeps DB consistent if enqueue fails; not
    // exactly-once (a retry could still enqueue twice) — upgrade to a real
    // transactional outbox table if duplicate jobs become a problem.
    await prisma.deployment.delete({ where: { id: newDeployment.id } });
    throw err;
  }
  return newDeployment;
};

export const getDeployments = async (
  userId: number,
  page = 1,
  limit = 20,
) => {
  return prisma.deployment.findMany({
    where: {
      project: {
        userId,
      },
    },
    skip: (page - 1) * limit,
    take: limit,
  });
};

export const getDeploymentsByProject = async (projectId: number, userId: number) => {
  return prisma.deployment.findMany({
    where: {
      projectId,
      project: { userId },
    },
  });
};

export const getDeploymentDetails = async (id: number, userId: number) => {
  return prisma.deployment.findUnique({
    where: {
      id,
      project: {
        userId,
      },
    },
  });
};

export const updateDeploymentById = async (
  deployment: DeploymentUpdateInput,
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
  deployment: DeploymentUpdateInput,
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
