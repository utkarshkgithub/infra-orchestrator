import { prisma } from "../../lib/prisma.js";

export const createDeployment = async (projectId: string) => {
  return await prisma.deployment.create({
    data: { projectId },
  });
};

export const getDeployments = async () => {
  return prisma.deployment.findMany();
};

export const getDetails = async (id: number) => {
  return prisma.deployment.findUnique({
    where: {
      id,
    },
  });
};
