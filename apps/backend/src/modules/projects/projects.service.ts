import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import {
  CreateEnvironmentInput,
  CreateProjectInput,
  UpdateProjectInput,
} from "./projects.types.js";
import crypto from "crypto";

export const getProjects = async (
  userId: number,
  includeLatestDeployment = false,
) => {
  return await prisma.project.findMany({
    where: {
      userId,
    },
    ...(includeLatestDeployment
      ? {
          include: {
            deployments: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        }
      : {}),
  });
};

export const createProject = async (
  project: CreateProjectInput,
  userId: number,
) => {
  const publicId = crypto.randomBytes(6).toString("hex");
  const { environments, ...projectInput } = project;
  return await prisma.project.create({
    data: {
      ...projectInput,
      userId,
      publicId,
      environments: {
        create: environments,
      },
    },
  });
};

export const getProjectDetails = async (id: number, userId: number) => {
  return await prisma.project.findFirst({
    where: {
      id,
      userId,
    },
  });
};

export const updateProjectDetails = async (
  project: UpdateProjectInput,
  userId: number,
) => {
  const { id, ...projectInput } = project;
  // shortcut: environments are created once on POST and silently ignored on
  // PATCH (this destructure) — revisit when the UI edits environments.
  return await prisma.project.update({
    where: {
      id,
      userId
    },
    data: projectInput
  });
};

export const createEnvironment = async (
  environment: CreateEnvironmentInput,
  projectId: number,
  userId: number,
) => {
  return prisma.project.update({
    where: { id: projectId ,userId},
    data: {
      environments: {
        create: environment,
      },
    },
    include: { environments: true },
  });
};

export const deleteEnvironment = async (
  projectId: number,
  environmentId: number,
  userId: number,
) => {
  return prisma.project.update({
    where: { id: projectId ,userId},
    data: {
      environments: {
        deleteMany: {
          id: environmentId,
        },
      },
    },
  });
};

export const deleteProject = async (id: number, userId: number) => {
  return await prisma.project.delete({
    where: { id, userId },
  });
};
