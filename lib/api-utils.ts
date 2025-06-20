import { type NextRequest, NextResponse } from "next/server"
import type { ZodSchema } from "zod"
import { AppError, logError } from "./error-handling"
import { validateData } from "./validation"
import { rateLimit, type RateLimitOptions } from "./rate-limit"

type ApiHandlerOptions = {
  requireAuth?: boolean
  requireAdmin?: boolean
  validateBody?: ZodSchema<any>
  validateQuery?: ZodSchema<any>
  rateLimit?: Partial<RateLimitOptions> | false
}

type ApiHandler = (req: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse>

// Create a wrapper for API route handlers with common functionality
export function createApiHandler(handler: ApiHandler, options: ApiHandlerOptions = {}): ApiHandler {
  return async (req: NextRequest, context: { params: Record<string, string> }) => {
    try {
      // Apply rate limiting if enabled
      if (options.rateLimit !== false) {
        const rateLimitMiddleware = rateLimit(options.rateLimit || undefined)
        await rateLimitMiddleware(req, NextResponse.next())
      }

      // Validate request body if schema provided
      if (options.validateBody) {
        const body = await req.json()
        validateData(options.validateBody, body)
        // Reattach the validated body to the request
        ;(req as any).validatedBody = body
      }

      // Validate query parameters if schema provided
      if (options.validateQuery) {
        const query = Object.fromEntries(new URL(req.url).searchParams.entries())
        validateData(options.validateQuery, query)
        // Reattach the validated query to the request
        ;(req as any).validatedQuery = query
      }

      // Check authentication if required
      if (options.requireAuth || options.requireAdmin) {
        // Import dynamically to avoid circular dependencies
        const { requireAuth, requireAdmin } = await import("./auth")

        if (options.requireAdmin) {
          await requireAdmin(req)
        } else {
          await requireAuth(req)
        }
      }

      // Call the handler
      return await handler(req, context)
    } catch (error) {
      // Handle errors
      if (error instanceof AppError) {
        return NextResponse.json(
          {
            error: error.message,
            type: error.type,
            ...(error.context ? { details: error.context } : {}),
          },
          { status: error.statusCode },
        )
      }

      // Log unknown errors
      logError(error as Error, {
        url: req.url,
        method: req.method,
      })

      // Return generic error
      return NextResponse.json({ error: "An unexpected error occurred", type: "unknown" }, { status: 500 })
    }
  }
}
