import { z } from "zod";

export const DeploymentSchema = z.object({
  projectId: z.uuid(),
});
