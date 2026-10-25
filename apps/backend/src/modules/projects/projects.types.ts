import { z } from "zod";

const CreateEnvironmentSchema = z.object({
  name: z.string().min(1),
  branch: z.string().min(1),
  isProduction: z.boolean(),
});

//This is what a new project looks like when created
export const CreateProjectSchema = z.object({
  githubRepoId: z.int().min(1),
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
  envVars: z.record(z.string(), z.string()).default({}),
  environments: z.array(CreateEnvironmentSchema)
});

export const UpdateProjectSchema = CreateProjectSchema.omit({environments:true})
.partial()
.required({ repoUrl: true })
.extend({
  id: z.int().min(0), //this is project id which is auto incremented by db
});

export const ProjectListSchema = z.array(UpdateProjectSchema);

export type CreateEnvironmentInput = z.infer<typeof CreateEnvironmentSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
