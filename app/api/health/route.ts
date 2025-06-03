import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/auth"
import { logger } from "@/lib/logging"

export async function GET() {
  try {
    // Check if environment variables are set
    const envCheck = {
      supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      smtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
      app: !!process.env.NEXT_PUBLIC_APP_URL,
    }

    // Check Supabase connection
    let dbStatus = false
    try {
      const supabase = createServerSupabaseClient()
      const { error } = await supabase.from("users").select("count").limit(1)
      dbStatus = !error
    } catch (error) {
      logger.error("Health check - Database connection failed", { error })
    }

    const status = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {
        environment: envCheck,
        database: dbStatus,
      },
    }

    // Determine overall health
    const isHealthy = Object.values(envCheck).every(Boolean) && dbStatus

    return NextResponse.json(status, {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    logger.error("Health check failed", { error })
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
