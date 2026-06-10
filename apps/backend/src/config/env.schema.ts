import { z } from "zod";

const csvToArray = z
  .string()
  .transform((value: string) =>
    value
      .split(",")
      .map((v: string) => v.trim())
      .filter(Boolean)
  );

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  SWAGGER_PATH: z.string().trim().min(1).default("docs"),
  CORS_ORIGIN: z.union([z.literal("*"), csvToArray]).default("*"),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(604800),

  MINIO_ENDPOINT: z.string().trim().min(1),
  MINIO_PORT: z.coerce.number().int().min(1).max(65535).default(9000),
  MINIO_USE_SSL: z
    .union([z.boolean(), z.string()])
    .transform((value: string | boolean) => String(value).toLowerCase() === "true"),
  MINIO_ACCESS_KEY: z.string().trim().min(1),
  MINIO_SECRET_KEY: z.string().trim().min(1),
  MINIO_BUCKET: z.string().trim().min(1),

  ENCRYPTION_KEY: z.string().optional(),
  ENCRYPTION_SEARCH_KEY: z.string().optional(),
  BACKUP_ENCRYPTION_KEY: z.string().optional(),

  MAX_CONCURRENT_SESSIONS: z.coerce.number().int().positive().default(3),
  PROMETHEUS_METRICS_ENABLED: z
    .union([z.boolean(), z.string()])
    .transform((v) => String(v).toLowerCase() === "true")
    .default(true),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug", "verbose"]).default("info")
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue: { path: (string | number)[]; message: string }) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${formatted}`);
  }
  return parsed.data;
}
