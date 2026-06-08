import {json, z} from "zod"

export const JobSchema = z.object({
    deploymentId:z.int(),
    projectId: z.string().min(1),
    repoUrl: z.url(),
    rootDir: z.string(),
    installCmd: z.string(),
    buildCmd : z.string(),
    framework : z.string().nullable(),
    envVars : z.record(z.string(),z.string()).optional(),
})

export type Job = z.infer<typeof JobSchema>