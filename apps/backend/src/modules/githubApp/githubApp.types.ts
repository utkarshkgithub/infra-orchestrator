import { z } from "zod";

export const CommitAuthorSchema = z.object({
  username: z.string().nullish(),
  name: z.string().nullish(),
  email: z.email().nullish(),
});

// export const CallbackSchema = CommitAuthorSchema.extend({
//   userId: z.number(),
//   repoName: z.string(),
//   projectId: z.string(),
//   commitHash: z.string(),
//   commitMessage: z.string(),
// });

// export type CallbackSchemaInput = z.infer<typeof CallbackSchema>;
export type CommitAuthorInput = z.infer<typeof CommitAuthorSchema>;
