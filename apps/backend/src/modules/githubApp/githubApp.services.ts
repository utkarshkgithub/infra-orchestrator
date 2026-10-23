import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { enqueueDeployment } from "../../utils/sqs.js";
import { buildCloneUrl, createInstallationToken } from "../../lib/githubApp.js";
import { DeploymentSchema } from "../deployments/job.types.js";
import { UpdateProjectInput } from "../projects/projects.types.js";
import { CommitAuthorInput } from "./githubApp.types.js";

// GithubProjectId -> Our projects autoincremented one
export const getProjectsFromGithubProjectId = async (id: number) => {
  const projects = await prisma.project.findMany({
    where: {
      githubRepoId: id,
    },
    // ProjectListSchema requires the environments relation; without the
    // include every push webhook fails validation.
    include: {
      environments: true,
    },
  });
  // The column is int8, Prisma returns BigInt — the project schemas validate
  // plain integers, so convert here (repo ids stay far below the 2^53 ceiling).
  return projects.map((project) => ({
    ...project,
    githubRepoId: Number(project.githubRepoId),
  }));
};

export const createMultipleDeployments = async (
  projects: UpdateProjectInput[],
  commitHash: string,
  author: CommitAuthorInput,
  commitMessage: string,
  installationId: number
) => {
    // There is one clone path for every deployment: through the GitHub App
    // installation. A payload without installation.id or a failed token mint
    // aborts the webhook so GitHub retries it.
    if (!installationId) {
      throw new AppError(400, "Webhook payload is missing installation id");
    }
    const { token: cloneToken } =
      await createInstallationToken(installationId);
    const deployments = Promise.allSettled(
        projects.map(project=>createDeploymentFromJob(project,commitHash,author,commitMessage,cloneToken))
    );
    return deployments;
};

export const createDeploymentFromJob = async (
  project: UpdateProjectInput,
  commitHash: string,
  author: CommitAuthorInput,
  commitMessage: string,
  cloneToken: string
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
      repoUrl: buildCloneUrl(project.repoUrl, cloneToken),
      deploymentId: newDeployment.id,
      commitHash
    });
    try {
      await enqueueDeployment(job);
    } catch (err) {
      // shortcut: compensating delete keeps DB consistent if enqueue fails; not
      // exactly-once — upgrade to a real transactional outbox table if needed.
      await prisma.deployment.delete({ where: { id: newDeployment.id } });
      throw err;
    }
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
