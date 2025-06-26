import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Public paths that don't require authentication
  const publicPaths = [
    "/",
    "/auth/login",
    "/auth/register",
    "/auth/onboarding",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/callback",
  ]
  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // If not authenticated and trying to access protected route, redirect to login
  if (!session && !isPublicPath) {
    const redirectUrl = new URL("/auth/login", request.url)
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated, check profile type for specific routes
  if (session) {
    // Get user profile type
    const userId = session.user.id

    // Check if user has a startup profile
    const { data: startup } = await supabase.from("startups").select("id, status").eq("user_id", userId).single()

    // Check if user has an investor profile
    const { data: investor } = await supabase.from("investors").select("id, status").eq("user_id", userId).single()

    // Check if user has admin role
    const { data: user } = await supabase.from("users").select("role").eq("id", userId).single()

    const isAdmin = user?.role === "admin" || user?.role === "superadmin"

    // Handle generic /matches route - redirect to role-specific route
    if (request.nextUrl.pathname === "/matches") {
      if (startup && !isAdmin) {
        return NextResponse.redirect(new URL("/startup/matches", request.url))
      } else if (investor && !isAdmin) {
        return NextResponse.redirect(new URL("/investor/matches", request.url))
      } else {
        // If no profile or admin, redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }

    // Handle generic /messages route - redirect to role-specific route
    if (request.nextUrl.pathname === "/messages") {
      if (startup && !isAdmin) {
        return NextResponse.redirect(new URL("/startup/messages", request.url))
      } else if (investor && !isAdmin) {
        return NextResponse.redirect(new URL("/investor/messages", request.url))
      } else {
        // If no profile or admin, redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }

    // Handle generic /analytics route - redirect to role-specific route
    if (request.nextUrl.pathname === "/analytics") {
      if (startup && !isAdmin) {
        return NextResponse.redirect(new URL("/startup/analytics", request.url))
      } else if (investor && !isAdmin) {
        return NextResponse.redirect(new URL("/investor/analytics", request.url))
      } else {
        // If no profile or admin, redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }

    // Startup-specific routes
    if (request.nextUrl.pathname.startsWith("/startup/") && !startup && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Investor-specific routes
    if (request.nextUrl.pathname.startsWith("/investor/") && !investor && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Admin-specific routes
    if (
      (request.nextUrl.pathname.startsWith("/admin/") || request.nextUrl.pathname.startsWith("/superadmin/")) &&
      !isAdmin
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // If user has no profile and is not on onboarding page, redirect to onboarding
    if (!startup && !investor && !isAdmin && !request.nextUrl.pathname.startsWith("/onboarding") && !request.nextUrl.pathname.startsWith("/auth/onboarding") && !isPublicPath) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }

    // If startup profile is pending and not on startup onboarding, redirect to startup onboarding
    if (
      startup &&
      startup.status === "pending" &&
      !request.nextUrl.pathname.startsWith("/onboarding/startup") &&
      !request.nextUrl.pathname.startsWith("/auth/onboarding") &&
      !isPublicPath
    ) {
      return NextResponse.redirect(new URL("/onboarding/startup", request.url))
    }

    // If investor profile is pending and not on investor onboarding, redirect to investor onboarding
    if (
      investor &&
      investor.status === "pending" &&
      !request.nextUrl.pathname.startsWith("/onboarding/investor") &&
      !request.nextUrl.pathname.startsWith("/auth/onboarding") &&
      !isPublicPath
    ) {
      return NextResponse.redirect(new URL("/onboarding/investor", request.url))
    }
  }

  return response
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
