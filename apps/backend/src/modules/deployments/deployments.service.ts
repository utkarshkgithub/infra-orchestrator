import { prisma } from "../../lib/prisma.js";
//TODO : fix the BOLA vulnerability and a patch endpoint

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

export const getDeploymentsByProjectId = async(projectId: string, userId:Number)=>{
return prisma.deployment.findMany({
    where: {
      projectId,
    },
  });
}