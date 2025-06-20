import type { NextRequest, NextResponse } from "next/server"
import { AppError } from "./error-handling"

// Simple in-memory store for rate limiting
// In production, you'd use Redis or another distributed store
const ipRequests = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitOptions {
  limit: number // Maximum requests allowed
  windowMs: number // Time window in milliseconds
  message?: string // Custom message
}

// Default options
const defaultOptions: RateLimitOptions = {
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
  message: "Too many requests, please try again later.",
}

// Rate limiting middleware for API routes
export function rateLimit(options: Partial<RateLimitOptions> = {}) {
  const { limit, windowMs, message } = { ...defaultOptions, ...options }

  return async function rateLimitMiddleware(request: NextRequest, response: NextResponse) {
    const ip = request.ip || "unknown"
    const now = Date.now()

    // Get or initialize request data for this IP
    const requestData = ipRequests.get(ip) || { count: 0, resetTime: now + windowMs }

    // If the reset time has passed, reset the counter
    if (requestData.resetTime < now) {
      requestData.count = 0
      requestData.resetTime = now + windowMs
    }

    // Increment request count
    requestData.count++
    ipRequests.set(ip, requestData)

    // Set rate limit headers
    response.headers.set("X-RateLimit-Limit", limit.toString())
    response.headers.set("X-RateLimit-Remaining", Math.max(0, limit - requestData.count).toString())
    response.headers.set("X-RateLimit-Reset", Math.ceil(requestData.resetTime / 1000).toString())

    // If rate limit exceeded
    if (requestData.count > limit) {
      throw AppError.rateLimit(message)
    }

    return response
  }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of ipRequests.entries()) {
    if (data.resetTime < now) {
      ipRequests.delete(ip)
    }
  }
}, 60 * 1000) // Run every minute
