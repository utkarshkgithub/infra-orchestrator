import { z } from "zod";
import { DeploymentStatus } from "../../../generated/prisma/enums.js";

export const DeploymentSchema = z.object({
  projectId: z.uuid(),
  id: z.int(),
  commithash: z.string(),
  repoUrl: z.url(),
});

export type DeploymentInput = z.infer<typeof DeploymentSchema>;
