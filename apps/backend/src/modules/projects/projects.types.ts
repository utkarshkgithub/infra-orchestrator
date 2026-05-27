import {z} from 'zod';

export const ProjectSchema = z.object({
    name: z.string(),
    userId : z.int().positive(),
    repoUrl : z.url(),
    rootDir : z.string(),
    buildCmd : z.string(),
})

export type ProjectInput = z.infer<typeof ProjectSchema>