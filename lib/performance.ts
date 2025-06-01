// Simple performance monitoring utility

// Store performance marks
const marks = new Map<string, number>()

// Start timing an operation
export function startTiming(name: string): void {
  marks.set(name, performance.now())
}

// End timing an operation and get the duration
export function endTiming(name: string): number | null {
  const startTime = marks.get(name)
  if (startTime === undefined) {
    console.warn(`No start time found for "${name}"`)
    return null
  }

  const duration = performance.now() - startTime
  marks.delete(name)

  // Log performance in development
  if (process.env.NODE_ENV === "development") {
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
  }

  return duration
}

// Measure the execution time of a function
export async function measureExecutionTime<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
  startTiming(name)

  try {
    const result = await fn()
    const duration = endTiming(name)

    // Report to monitoring service in production
    if (process.env.NODE_ENV === "production" && duration !== null) {
      // Example: report to monitoring service
      // reportPerformanceMetric(name, duration);
    }

    return result
  } catch (error) {
    endTiming(name) // Still record timing even if there's an error
    throw error
  }
}

// Decorator for measuring API route performance
export function withPerformanceMonitoring(handler: Function, routeName: string) {
  return async (...args: any[]) => {
    return measureExecutionTime(`api:${routeName}`, () => handler(...args))
  }
}
