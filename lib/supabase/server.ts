import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { Database } from "@/types/database"

export function createSupabaseServerClient(cookieStore?: { get: (name: string) => string | undefined, set?: Function, remove?: Function }) {
  const currentCookies = cookieStore

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable for server client")
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable for server client")
  }

  try {
    new URL(supabaseUrl)
  } catch (error) {
    throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL for server client: ${supabaseUrl}`)
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return currentCookies?.get(name)
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          currentCookies?.set?.({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          currentCookies?.set?.({ name, value: "", ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Route handler client - for API routes
export async function createRouteHandlerClient() {
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Function to create a Supabase client with the service role key for admin operations
// Be very careful where you use this, as it bypasses RLS.
export function createSupabaseServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL for service role client")
  }
  if (!supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for service role client")
  }

  try {
    new URL(supabaseUrl)
  } catch (error) {
    throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL for service role client: ${supabaseUrl}`)
  }

  return createServerClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    cookies: {
      get() {
        return undefined
      },
      set() {
        // No-op for service role client
      },
      remove() {
        // No-op for service role client
      },
    },
  })
}
