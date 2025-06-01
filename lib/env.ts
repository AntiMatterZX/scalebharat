// Environment variable validation utility
export function validateEnv() {
  const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}\n` +
        "Please check your .env.local file and ensure all required variables are set.",
    )
  }

  // Validate URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL format: ${supabaseUrl}\n` +
        "Expected format: https://your-project-id.supabase.co",
    )
  }
}

// Call this in development to validate env vars
if (process.env.NODE_ENV === "development") {
  try {
    validateEnv()
  } catch (error) {
    console.error("❌ Environment validation failed:")
    console.error(error.message)
    console.error("\n📝 To fix this:")
    console.error("1. Copy .env.example to .env.local")
    console.error("2. Fill in your Supabase project details")
    console.error("3. Restart the development server")
  }
}
