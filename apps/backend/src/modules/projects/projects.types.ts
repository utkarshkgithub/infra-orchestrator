import { string, z } from "zod";

//This is what the job data looks like
export const ProjectSchema = z.object({
  id: z.int().min(0).optional(),
  publicId : z.string().optional(),
  name: z.string().min(1),
  userId: z.int().positive(),
  repoUrl: z.url().refine((url) => {
    try {
      return new URL(url).hostname === "github.com";
    } catch {
      return false;
    }
  }, "Repository must be from github.com"),
  rootDir: z.string().default(""),
  installCmd: z.string().min(1).default("npm install"),
  buildCmd: z.string().min(1).default("npm run build"),
  outputDir: z.string().default("dist"),
  framework: z.string().optional(),
  envVars: z.record(z.string(),z.string()).default({}),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;
