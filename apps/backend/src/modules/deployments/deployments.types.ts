import { z } from "zod";
import { DeploymentStatus } from "@prisma/client";

export const DeploymentSchema = z.object({
  projectId: z.int(),
  // commithash: z.string().optional(), // TODO: add this later for advance functionality
});

export type projectIdInput = z.infer<typeof DeploymentSchema>;

export const UpdateDeploymentSchema = z.object({
  id : z.int().min(0), // deploymentID
  status  : z.enum(DeploymentStatus),
  logs : z.string().optional(),
  cdnUrl : z.string().optional(),
  artifactPath : z.string().optional()
})

export type deploymentInput = z.infer<typeof UpdateDeploymentSchema >