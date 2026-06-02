import { z } from "zod";

export const ProjectSchema = z.object({
  name: z.string().min(1),
  userId: z.int().positive(),
  repoUrl: z.url().refine((url) => {
    try {
      return new URL(url).hostname === "github.com";
    } catch {
      return false;
    }
  }, "Repository must be from github.com"),
  frontendUrl: z.url().optional(),
  rootDir: z.string().min(1).default("/"),
  installCmd: z.string().min(1).default("npm install"),
  buildCmd: z.string().min(1).default("npm run build"),
  framework: z.string().optional(),
  envVars: z.record(z.string(),z.string()).optional(),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;
