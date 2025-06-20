// Error types for better error handling
export type AppErrorType =
  | "auth"
  | "database"
  | "validation"
  | "not-found"
  | "server"
  | "external-service"
  | "rate-limit"
  | "unknown"

export class AppError extends Error {
  type: AppErrorType
  statusCode: number
  context?: Record<string, any>

  constructor(message: string, type: AppErrorType = "unknown", statusCode = 500, context?: Record<string, any>) {
    super(message)
    this.name = "AppError"
    this.type = type
    this.statusCode = statusCode
    this.context = context

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor)
  }

  static auth(message = "Authentication error", context?: Record<string, any>) {
    return new AppError(message, "auth", 401, context)
  }

  static database(message = "Database error", context?: Record<string, any>) {
    return new AppError(message, "database", 500, context)
  }

  static validation(message = "Validation error", context?: Record<string, any>) {
    return new AppError(message, "validation", 400, context)
  }

  static notFound(message = "Resource not found", context?: Record<string, any>) {
    return new AppError(message, "not-found", 404, context)
  }

  static server(message = "Server error", context?: Record<string, any>) {
    return new AppError(message, "server", 500, context)
  }

  static externalService(message = "External service error", context?: Record<string, any>) {
    return new AppError(message, "external-service", 502, context)
  }

  static rateLimit(message = "Rate limit exceeded", context?: Record<string, any>) {
    return new AppError(message, "rate-limit", 429, context)
  }
}

// Error logger
export function logError(error: Error | AppError, additionalContext?: Record<string, any>) {
  const errorObj: Record<string, any> = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...additionalContext,
  }

  if (error instanceof AppError) {
    errorObj.type = error.type
    errorObj.statusCode = error.statusCode
    errorObj.context = error.context
  }

  // In production, you might want to send this to a logging service
  console.error("ERROR:", JSON.stringify(errorObj, null, 2))

  // Return the error for chaining
  return error
}

// Safe data fetcher with error handling
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  errorMessage = "Failed to fetch data",
  errorType: AppErrorType = "database",
): Promise<T> {
  try {
    return await queryFn()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    const appError = new AppError(errorMessage, errorType, errorType === "database" ? 500 : 400, {
      originalError: error instanceof Error ? error.message : String(error),
    })

    logError(appError)
    throw appError
  }
}
