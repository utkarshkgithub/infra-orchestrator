import { z } from "zod";

export const GitHubProfileSchema = z.object({
  id: z.number(),
  login: z.string(),
  email: z.string().nullable(),
  avatar_url: z.url(),
});

export type GitHubProfile = z.infer<typeof GitHubProfileSchema>;

export const GitHubUserSchema = GitHubProfileSchema.extend({
  accessToken: z.string().min(1),
});

export type GitHubUser = z.infer<typeof GitHubUserSchema>;

export const GitHubEmailSchema = z.object({
  email: z.email(),
  primary: z.boolean(),
  verified: z.boolean(),
});

export type GitHubEmail = z.infer<typeof GitHubEmailSchema>;

export const GitHubEmailsSchema = z.array(GitHubEmailSchema)

export const RepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  html_url: z.url(),
  clone_url: z.url(),
  default_branch: z.string(),
  updated_at: z.string(),
});

export const ReposSchema = z.array(RepoSchema);