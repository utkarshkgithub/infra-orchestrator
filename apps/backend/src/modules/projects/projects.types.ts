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
  rootDir: z.string().min(1).default("/"),
  buildCmd: z.string().min(1),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;
