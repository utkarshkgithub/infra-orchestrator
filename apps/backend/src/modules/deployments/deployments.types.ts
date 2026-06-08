import { z } from "zod";
import { DeploymentStatus } from "@prisma/client";

export const DeploymentSchema = z.object({
  projectId: z.uuid(),
  // commithash: z.string().optional(), // TODO: add this later for advance functionality
});

export type DeploymentInput = z.infer<typeof DeploymentSchema>;
