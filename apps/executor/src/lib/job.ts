import {z} from "zod"

export const JobSchema = z.object({
    deploymentId:z.string().min(1),
    userId:z.string().min(1),
    repoUrl:z.url(),
})