import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`)
}

// Export the supabase client directly for backward compatibility
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Also export a function to create a new client (for future refactoring)
export function createSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}
