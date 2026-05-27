import { prisma } from "../../lib/prisma.js";
import { ProjectInput } from "./projects.types.js";

export const getProjects = async (userId: number) => {
  return await prisma.project.findMany({
    where: {
      userId,
    },
  });
};

export const createProject = async (project: ProjectInput) => {
  return await prisma.project.create({
    data: project,
  });
};

export const getProjectDetails = async (id: string, userId : number) => {
  return await prisma.project.findUnique({
    where: {
      id,
      userId,
    },
  });
  
};

// TODO : Delete Project