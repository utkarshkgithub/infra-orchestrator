import 'dotenv/config';
import strict from 'node:assert/strict';
import {number, string, z} from 'zod'
const EnvSchema = z.object({
    FRONTEND_URL: z.url().default("http://localhost:5173"),
    DATABASE_URL: z.string(),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    NODE_ENV: z.string().default('development')
})

export const env = EnvSchema.parse(process.env);