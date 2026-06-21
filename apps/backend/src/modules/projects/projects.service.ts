import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { ProjectInput } from "./projects.types.js";
import crypto from "crypto";

export const getProjects = async (userId: number) => {
  return await prisma.project.findMany({
    where: {
      userId,
    },
  });
};

export const createProject = async (project: ProjectInput) => {
  const publicId = crypto.randomBytes(6).toString("hex");
  return await prisma.project.create({
    data: { ...project, publicId },
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
  project: ProjectInput,
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
  return await prisma.project.update({
    where: {
      id,
    },
    data: {
      ...project,
      publicId: currentProject.publicId
    },
  });
};

// TODO : Delete Project
