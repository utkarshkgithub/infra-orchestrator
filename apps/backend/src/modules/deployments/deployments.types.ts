import { z } from "zod";
import { DeploymentStatus } from "@prisma/client";

export const UpdateDeploymentSchema = z.object({
  id : z.coerce.number().int().min(0), // deploymentID
  status  : z.enum(DeploymentStatus),
  logs : z.string().optional(),
  cdnUrl : z.string().optional(),
  artifactPath : z.string().optional()
})

export type deploymentInput = z.infer<typeof UpdateDeploymentSchema >