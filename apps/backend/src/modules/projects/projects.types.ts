import { string, z } from "zod";

export const ProjectSchema = z.object({
  id: z.string().min(1),
  deploymentId : z.int().positive(),
  name: z.string().min(1),
  userId: z.int().positive(),
  repoUrl: z.url().refine((url) => {
    try {
      return new URL(url).hostname === "github.com";
    } catch {
      return false;
    }
  }, "Repository must be from github.com"),
  rootDir: z.string().min(1).default("/"),
  installCmd: z.string().min(1).default("npm install"),
  buildCmd: z.string().min(1).default("npm run build"),
  outputDir: z.string().default("dist"),
  framework: z.string().nullable(),
  envVars: z.record(z.string(),z.string()).default({}),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;
