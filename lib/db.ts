import { supabase } from "./supabase"
import { AppError, logError } from "./error-handling"
import { cachedQuery } from "./cache"

// Type for query options
export type QueryOptions = {
  cache?: boolean
  cacheTime?: number
  retries?: number
  retryDelay?: number
}

// Default options
const defaultOptions: QueryOptions = {
  cache: false,
  cacheTime: 60, // 1 minute
  retries: 3,
  retryDelay: 300, // 300ms
}

// Execute a database query with retries and optional caching
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  errorMessage: string,
  options?: Partial<QueryOptions>,
): Promise<T> {
  const opts = { ...defaultOptions, ...options }

  // Function to execute the query with retries
  const executeWithRetries = async (): Promise<T> => {
    let lastError: any = null

    for (let attempt = 0; attempt < (opts.retries || 1); attempt++) {
      try {
        const { data, error } = await queryFn()

        if (error) {
          lastError = error
          // Wait before retrying
          if (attempt < (opts.retries || 1) - 1) {
            await new Promise((resolve) => setTimeout(resolve, opts.retryDelay! * Math.pow(2, attempt)))
            continue
          }
          throw AppError.database(errorMessage, { supabaseError: error })
        }

        if (data === null) {
          throw AppError.notFound("Resource not found")
        }

        return data
      } catch (error) {
        lastError = error
        if (error instanceof AppError) throw error

        // Only retry on certain errors
        if (attempt < (opts.retries || 1) - 1) {
          await new Promise((resolve) => setTimeout(resolve, opts.retryDelay! * Math.pow(2, attempt)))
          continue
        }

        logError(error as Error, { context: "database-query" })
        throw AppError.database(errorMessage)
      }
    }

    // This should never be reached due to the throw in the loop
    throw lastError
  }

  // Use caching if enabled
  if (opts.cache) {
    const cacheKey = `db:${JSON.stringify(queryFn.toString())}`
    return cachedQuery(cacheKey, executeWithRetries, opts.cacheTime)
  }

  return executeWithRetries()
}

// Helper for SELECT queries
export function select<T>(
  table: string,
  query: any,
  errorMessage = `Failed to select from ${table}`,
  options?: Partial<QueryOptions>,
): Promise<T> {
  return executeQuery<T>(() => supabase.from(table).select(query), errorMessage, options)
}

// Helper for INSERT queries
export function insert<T>(
  table: string,
  data: any,
  returning = "*",
  errorMessage = `Failed to insert into ${table}`,
  options?: Partial<QueryOptions>,
): Promise<T> {
  return executeQuery<T>(() => supabase.from(table).insert(data).select(returning), errorMessage, options)
}

// Helper for UPDATE queries
export function update<T>(
  table: string,
  match: Record<string, any>,
  data: any,
  returning = "*",
  errorMessage = `Failed to update ${table}`,
  options?: Partial<QueryOptions>,
): Promise<T> {
  let query = supabase.from(table).update(data)

  // Apply all match conditions
  Object.entries(match).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  return executeQuery<T>(() => query.select(returning), errorMessage, options)
}

// Helper for DELETE queries
export function remove<T>(
  table: string,
  match: Record<string, any>,
  returning = "*",
  errorMessage = `Failed to delete from ${table}`,
  options?: Partial<QueryOptions>,
): Promise<T> {
  let query = supabase.from(table).delete()

  // Apply all match conditions
  Object.entries(match).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  return executeQuery<T>(() => query.select(returning), errorMessage, options)
}
