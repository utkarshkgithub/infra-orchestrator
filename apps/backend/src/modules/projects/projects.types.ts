import { string, z } from "zod";

//This is what the job data looks like
export const ProjectSchema = z.object({
  id: z.int().min(0), //this is project id
  userId: z.int().positive(),
  githubRepoId: z.int().min(1),
  publicId : z.string().optional(),
  name: z.string().min(1),
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
  framework: z.string().nullish(),
  envVars: z.record(z.string(),z.string()).default({}),
});

export const ProjectSchemaList = z.array(ProjectSchema);

export type ProjectInput = z.infer<typeof ProjectSchema>;
