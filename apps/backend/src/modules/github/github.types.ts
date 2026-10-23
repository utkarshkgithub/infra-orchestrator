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