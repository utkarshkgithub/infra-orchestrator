import { z } from "zod";
import "dotenv/config";

export const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  AWS_REGION: z.string().min(1),
  ACCESS_KEY: z.string().min(1),
  SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET_NAME: z.string().min(1),
  QUEUE_URL: z.url(),
  BACKEND_URL: z.url(),
});

export const env = EnvSchema.parse(process.env);
