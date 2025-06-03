import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

// Cache user data for 5 minutes to reduce database calls
const userCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface UserProfile {
  startup?: { id: string; status: string } | null
  investor?: { id: string; status: string } | null
  user?: { role: string } | null
}

async function getUserProfile(supabase: any, userId: string): Promise<UserProfile> {
  const cacheKey = userId
  const cached = userCache.get(cacheKey)
  
  // Return cached data if it's still fresh
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    // Single optimized query to get all user data
    const [
      { data: startup, error: startupError },
      { data: investor, error: investorError },
      { data: user, error: userError }
    ] = await Promise.all([
      supabase.from("startups").select("id, status").eq("user_id", userId).single(),
      supabase.from("investors").select("id, status").eq("user_id", userId).single(),
      supabase.from("users").select("role").eq("id", userId).single()
    ])

    const profile = {
      startup: startupError ? null : startup,
      investor: investorError ? null : investor,
      user: userError ? null : user
    }

    // Cache the result
    userCache.set(cacheKey, { data: profile, timestamp: Date.now() })
    
    // Clean up old cache entries every 100 requests
    if (userCache.size > 100) {
      const cutoff = Date.now() - CACHE_TTL
      for (const [key, value] of Array.from(userCache.entries())) {
        if (value.timestamp < cutoff) {
          userCache.delete(key)
        }
      }
    }

    return profile
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return { startup: null, investor: null, user: null }
  }
}

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res: response })

    // Performance optimization: Skip middleware for static assets
    if (
      request.nextUrl.pathname.startsWith('/_next/static') ||
      request.nextUrl.pathname.startsWith('/_next/image') ||
      request.nextUrl.pathname.includes('.') ||
      request.nextUrl.pathname === '/favicon.ico' ||
      request.nextUrl.pathname === '/robots.txt' ||
      request.nextUrl.pathname === '/sitemap.xml'
    ) {
      return response
    }

    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    // Public paths that don't require authentication
    const publicPaths = [
      "/",
      "/auth/login",
      "/auth/register",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/callback",
      "/api/health",
      "/healthz"
    ]
    const isPublicPath = publicPaths.some((path) => 
      request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + "/")
    )

    // If not authenticated and trying to access protected route, redirect to login
    if (!session && !isPublicPath) {
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If authenticated, handle role-based routing
    if (session) {
      const userId = session.user.id
      const { startup, investor, user } = await getUserProfile(supabase, userId)
      
      const isAdmin = user?.role === "admin" || user?.role === "superadmin"

      // Route mapping for better performance
      const routeHandlers = {
        "/matches": () => {
          if (startup && !isAdmin) return "/startup/matches"
          if (investor && !isAdmin) return "/investor/matches"
          return "/dashboard"
        },
        "/messages": () => {
          if (startup && !isAdmin) return "/startup/messages"
          if (investor && !isAdmin) return "/investor/messages"
          return "/dashboard"
        },
        "/analytics": () => {
          if (startup && !isAdmin) return "/startup/analytics"
          if (investor && !isAdmin) return "/investor/analytics"
          return "/dashboard"
        }
      }

      // Handle generic routes with redirection
      const handler = routeHandlers[request.nextUrl.pathname as keyof typeof routeHandlers]
      if (handler) {
        const redirectPath = handler()
        if (redirectPath !== request.nextUrl.pathname) {
          return NextResponse.redirect(new URL(redirectPath, request.url))
        }
      }

      // Role-based access control
      const path = request.nextUrl.pathname

      // Startup-specific routes
      if (path.startsWith("/startup/") && !startup && !isAdmin) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }

      // Investor-specific routes
      if (path.startsWith("/investor/") && !investor && !isAdmin) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }

      // Admin-specific routes
      if (
        (path.startsWith("/admin/") || path.startsWith("/superadmin/")) &&
        !isAdmin
      ) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }

      // Onboarding flow optimization
      if (!startup && !investor && !isAdmin && !path.startsWith("/onboarding") && !isPublicPath) {
        return NextResponse.redirect(new URL("/onboarding", request.url))
      }

      // Handle pending profiles
      if (
        startup?.status === "pending" &&
        !path.startsWith("/onboarding/startup") &&
        !isPublicPath
      ) {
        return NextResponse.redirect(new URL("/onboarding/startup", request.url))
      }

      if (
        investor?.status === "pending" &&
        !path.startsWith("/onboarding/investor") &&
        !isPublicPath
      ) {
        return NextResponse.redirect(new URL("/onboarding/investor", request.url))
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // Graceful fallback - allow request to continue
    return NextResponse.next()
  }
}

// Optimized matcher for better performance
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - files with extensions (.js, .css, .png, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.|public).*)",
  ],
}
