import 'dotenv/config';
import {z} from 'zod'
const EnvSchema = z.object({
    FRONTEND_URL: z.url().default("http://localhost:5173"),
    DATABASE_URL: z.url(),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    JWT_SECRET: z.string().min(6),
    JWT_EXPIRES_IN : z.string().default("7d"),
    AWS_REGION : z.string().min(1).default("ap-south-1"),
    QUEUE_URL : z.url().default("https://sqs.us-east-1.amazonaws.com/000000000000/mysqs"),
    BACKEND_SERVICE_TOKEN : z.string(),
    
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GITHUB_CALLBACK_URL: z.url(),

    GITHUB_APP_ID: z.string(),
    GITHUB_WEBHOOK_SECRET: z.string(),
    GITHUB_APP_CLIENT_ID: z.string(),
    GITHUB_APP_PRIVATE_KEY: z.string(),
    GITHUB_APP_INSTALL_URL: z.string(),
    GITHUB_APP_SETUP_URL: z.string(),
})
// REMEMBER: Whenever new token needs to be added also add in infraStack
export const env = EnvSchema.parse(process.env);