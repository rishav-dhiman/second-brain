import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URL: z
    .string()
    .min(1, "MONGO_URL is required")
    .refine(
      (value) =>
        value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
      { message: "MONGO_URL must be a mongodb:// or mongodb+srv:// URI" }
    ),
  JWT_PASSWORD: z.string().min(1, "JWT_PASSWORD is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGINS: z
    .string()
    .default(
      "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"
    ),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  RATE_LIMIT_DISABLED: z
    .string()
    .default("false")
    .transform((value) => value === "true" || value === "1"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  // eslint-disable-next-line no-console
  console.error(
    `Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill in the required values.`
  );
  process.exit(1);
}

const env = parsed.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  port: env.PORT,
  mongoUrl: env.MONGO_URL,
  jwtPassword: env.JWT_PASSWORD,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  corsOrigins: env.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  logLevel: env.LOG_LEVEL,
  rateLimitDisabled: env.RATE_LIMIT_DISABLED,
} as const;

if (!config.isTest && config.jwtPassword.length < 32) {
  // eslint-disable-next-line no-console
  console.warn(
    "[config] WARNING: JWT_PASSWORD is shorter than 32 characters. Use a long random secret in production."
  );
}
