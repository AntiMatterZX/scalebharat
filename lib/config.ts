import { z } from "zod"

// Define schema for environment variables
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),

  // Email (SMTP)
  SMTP_HOST: z.string().min(1, "SMTP host is required"),
  SMTP_PORT: z
    .string()
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().int().positive()),
  SMTP_USER: z.string().min(1, "SMTP user is required"),
  SMTP_PASSWORD: z.string().min(1, "SMTP password is required"),
  EMAIL_FROM: z.string().email("Invalid from email address"),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url("Invalid app URL"),

  // Optional variables
  SENTRY_DSN: z.string().optional(),
  ANALYTICS_ID: z.string().optional(),
})

// Parse and validate environment variables
export function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`)

      console.error("\n❌ Invalid environment variables:")
      missingVars.forEach((msg) => console.error(`  - ${msg}`))
      console.error("\n📝 Please check your .env file and ensure all required variables are set correctly.\n")

      // In development, we can continue with warnings
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Continuing in development mode with invalid environment variables\n")
        return process.env
      }

      // In production, exit the process
      process.exit(1)
    }

    throw error
  }
}

// Export validated environment variables
export const env = validateEnv()

// Call validation on import in production
if (process.env.NODE_ENV === "production") {
  validateEnv()
}
