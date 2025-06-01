type LogLevel = "debug" | "info" | "warn" | "error"

type LogEntry = {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
}

// Environment-aware logging
const isDevelopment = process.env.NODE_ENV === "development"

// Configure log levels to output based on environment
const enabledLevels: Record<string, boolean> = {
  debug: isDevelopment,
  info: true,
  warn: true,
  error: true,
}

// Format log entry for console output
function formatLogEntry(entry: LogEntry): string {
  const { level, message, timestamp, context } = entry

  let formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`

  if (context) {
    formattedMessage += `\nContext: ${JSON.stringify(context, null, 2)}`
  }

  return formattedMessage
}

// Log to console with color coding
function logToConsole(entry: LogEntry): void {
  const formattedEntry = formatLogEntry(entry)

  switch (entry.level) {
    case "debug":
      console.debug("\x1b[34m%s\x1b[0m", formattedEntry) // Blue
      break
    case "info":
      console.info("\x1b[32m%s\x1b[0m", formattedEntry) // Green
      break
    case "warn":
      console.warn("\x1b[33m%s\x1b[0m", formattedEntry) // Yellow
      break
    case "error":
      console.error("\x1b[31m%s\x1b[0m", formattedEntry) // Red
      break
  }
}

// Create a log entry
function createLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  }
}

// Main logging function
export function log(level: LogLevel, message: string, context?: Record<string, any>): void {
  // Skip if level is not enabled
  if (!enabledLevels[level]) return

  const entry = createLogEntry(level, message, context)

  // Log to console
  logToConsole(entry)

  // In production, you would send logs to a service like Datadog, Sentry, etc.
  if (process.env.NODE_ENV === "production") {
    // Example: send to external logging service
    // sendToLoggingService(entry);
  }
}

// Convenience methods
export const logger = {
  debug: (message: string, context?: Record<string, any>) => log("debug", message, context),
  info: (message: string, context?: Record<string, any>) => log("info", message, context),
  warn: (message: string, context?: Record<string, any>) => log("warn", message, context),
  error: (message: string, context?: Record<string, any>) => log("error", message, context),
}
