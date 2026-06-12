import { z } from "zod";

export const JobSchema = z.object({ // referenced in executor
  publicId: z.string(),
  deploymentId: z.int(),
  repoUrl: z.url(),
  rootDir: z.string(),
  installCmd: z.string(),
  buildCmd: z.string(),
  outputDir: z.string(),
  framework: z.string().nullable(),
  envVars: z.record(z.string(), z.string()).optional(),
});

export type Job = z.infer<typeof JobSchema>;
