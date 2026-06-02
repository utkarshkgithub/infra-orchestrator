import 'dotenv/config';
import {number, string, z} from 'zod'
const EnvSchema = z.object({
    FRONTEND_URL: z.url().default("http://localhost:5173"),
    DATABASE_URL: z.url(),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GITHUB_CALLBACK_URL: z.url(),
    JWT_SECRET: z.string().min(6),
    JWT_EXPIRES_IN : z.string().default("7d"),
    AWS_REGION : z.string().min(1).default("ap-south-1")
})

export const env = EnvSchema.parse(process.env);