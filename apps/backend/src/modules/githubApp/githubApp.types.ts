import { z } from "zod";

export const CommitAuthorSchema = z.object({
  username: z.string().nullish(),
  name: z.string().nullish(),
  email: z.email().nullish(),
});

export type CommitAuthorInput = z.infer<typeof CommitAuthorSchema>;
