import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { AppError, logError } from "./error-handling"

// Create authenticated Supabase client (for server components)
export function createServerSupabaseClient() {
  const cookieStore = cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set(name, value, options)
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set(name, "", { ...options, maxAge: 0 })
        } catch (error) {
          // The `remove` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Middleware to check authentication
export async function requireAuth(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw AppError.auth("Authentication required")
    }

    // Add user to request for downstream handlers
    return session
  } catch (error) {
    if (error instanceof AppError) throw error
    logError(error as Error, { context: "auth-middleware" })
    throw AppError.auth("Authentication failed")
  }
}

// Check if user has admin role
export async function requireAdmin(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const supabase = createServerSupabaseClient()

    // Check if user has admin role
    const { data, error } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    if (error || data?.role !== "admin") {
      throw AppError.auth("Admin access required", { userId: session.user.id })
    }

    return session
  } catch (error) {
    if (error instanceof AppError) throw error
    logError(error as Error, { context: "admin-middleware" })
    throw AppError.auth("Admin authentication failed")
  }
}
