import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().default('super-secret-key-change-me'),
  DB_PATH: z.string().default('forensica.db'),
  MODEL_SERVICE_URL: z.string().url().optional(),
  MODEL_SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
});

export const env = envSchema.parse(process.env);
