import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { pushDeploymentService } from "../../utils/sqs.js";
import { DeploymentSchema, JobInput, JobSchema } from "../deployments/job.types.js";
import { ProjectInput } from "../projects/projects.types.js";
import { CommitAuthorInput } from "./githubApp.types.js";

// GithubProjectId -> Our projects autoincremented one
export const getProjectsFromGithubProjectId = async (id: number) => {
  const projects = await prisma.project.findMany({
    where: {
      githubRepoId: id,
    },
  });
  return projects;
};

export const createMultipleDeployments = async (
  projects: ProjectInput[],
  commitHash: string,
  author: CommitAuthorInput,
  commitMessage: string
) => {
    const deployments = Promise.allSettled(
        projects.map(project=>createDeploymentFromJob(project,commitHash,author,commitMessage))
    );
    return deployments;
};

export const createDeploymentFromJob = async (
  project: ProjectInput,
  commitHash: string,
  author: CommitAuthorInput,
  commitMessage: string
) => {
  try {
    const newDeployment = await prisma.deployment.create({
      data: {
        projectId: project.id,
        commitHash,
        commitAuthorName:author.name,
        commitAuthorUsername:author.username,
        commitAuthorEmail:author.email,
        commitMessage,
      },
    });
  
    const job = DeploymentSchema.parse({
      ...project,
      deploymentId: newDeployment.id,
      commitHash
    });
    await pushDeploymentService(job); // TODO: use the transactional outbox pattern as it can happen that db is updated but this fails later
    return newDeployment;
  }
  catch {
    logger.info({
      project,
      commitHash,
    },`Deployment Failed`)
    throw new AppError(409,"Deployment Failed via Webhook")
  }
};
