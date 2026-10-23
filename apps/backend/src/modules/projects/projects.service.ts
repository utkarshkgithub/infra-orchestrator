import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { CreateEnvironmentInput, CreateProjectInput, UpdateProjectInput } from "./projects.types.js";
import crypto from "crypto";

export const getProjects = async (userId: number, includeLatestDeployment = false) => {
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

export const createProject = async (project: CreateProjectInput) => {
  const publicId = crypto.randomBytes(6).toString("hex");
  const { environments, ...projectInput } = project;
  return await prisma.project.create({
    data: {
      ...projectInput,
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
  const id = project.id;
  const currentProject = await prisma.project.findFirst({
    where: {
      id,
      userId,
    },
  });
  if (!currentProject) {
    throw new AppError(403, "Forbidden");
  }
  const {environments, ...projectInput} = project;
  // shortcut: environments are created once on POST and silently ignored on
  // PATCH (this destructure) — revisit when the UI edits environments.
  return await prisma.project.update({
    where: {
      id,
    },
    data: {
      ...projectInput,
      publicId: currentProject.publicId,
    },
  });
};

export const createEnvironment = async (
  environment: CreateEnvironmentInput,
  projectId: number,
) => {
  return prisma.project.update({
    where: { id: projectId },
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
  environmentId: number
) => {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      environments: {
        deleteMany: {
          id:environmentId
        },
      },
    },
  });
};

export const deleteProject = async (id: number, userId: number) => {
  const current = await prisma.project.findFirst({ where: { id, userId } });
  if (!current) {
    throw new AppError(403, "Forbidden");
  }
  return prisma.project.delete({ where: { id } });
};



