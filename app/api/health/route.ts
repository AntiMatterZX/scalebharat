import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Check database connectivity
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single()

    const responseTime = Date.now() - startTime

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          checks: {
            database: 'failed',
            responseTime: `${responseTime}ms`
          },
          error: error.message
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        responseTime: `${responseTime}ms`
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'failed',
          responseTime: `${responseTime}ms`
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 })
}
