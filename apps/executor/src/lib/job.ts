import { z } from "zod";

export const JobSchema = z.object({
  deploymentId: z.int(),
  publicId: z.string(),
  id: z.int().min(0), // project id
  repoUrl: z.url(),
  rootDir: z.string(),
  installCmd: z.string(),
  buildCmd: z.string(),
  outputDir: z.string(),
  framework: z.string().nullable(),
  envVars: z.record(z.string(), z.string()).optional(),
});

export type Job = z.infer<typeof JobSchema>;
