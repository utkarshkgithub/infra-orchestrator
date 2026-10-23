import { z } from "zod";

export const JobSchema = z.object({ // referenced in Job push to sqs
  publicId: z.string().min(1),
  commitHash:  z.string().trim().regex(/^[0-9a-f]{7,40}$/i),
  repoUrl: z.url(),
  rootDir: z.string(),
  installCmd: z.string(),
  buildCmd: z.string(),
  outputDir: z.string(),
  framework: z.string().nullable(),
  envVars: z.record(z.string(), z.string()).optional(),
});

export const DeploymentSchema = JobSchema.extend({ // referenced in executor
  deploymentId: z.int(),
});

export const JobListSchema = z.array(JobSchema)

export type JobInput = z.infer<typeof JobSchema>;
export type DeploymentInput = z.infer<typeof DeploymentSchema>;
