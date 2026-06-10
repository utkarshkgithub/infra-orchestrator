import { z } from "zod"

export const JobSchema = z.object({
    deploymentId:z.int(),
    id: z.string().min(1), // project id
    repoUrl: z.url(),
    rootDir: z.string(),
    installCmd: z.string(),
    buildCmd : z.string(),
    framework : z.string().nullable(),
    envVars : z.record(z.string(),z.string()).optional(),
    outputDir: z.string(),
})

export type Job = z.infer<typeof JobSchema>