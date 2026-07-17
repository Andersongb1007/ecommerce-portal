import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:8080'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3002'),
  NEXT_PUBLIC_ADMIN_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_CUSTOMER_APP_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_PORTAL_URL: z.string().url().default('http://localhost:3002'),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
  NEXT_PUBLIC_CUSTOMER_APP_URL: process.env.NEXT_PUBLIC_CUSTOMER_APP_URL,
  NEXT_PUBLIC_PORTAL_URL: process.env.NEXT_PUBLIC_PORTAL_URL,
});
