type CacheItem<T> = {
  value: T
  expiry: number | null // null means no expiry
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map()

  // Set a value in the cache with optional expiry in seconds
  set<T>(key: string, value: T, expiryInSeconds?: number): void {
    const expiry = expiryInSeconds ? Date.now() + expiryInSeconds * 1000 : null
    this.cache.set(key, { value, expiry })
  }

  // Get a value from the cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    // If item doesn't exist or has expired
    if (!item || (item.expiry !== null && item.expiry < Date.now())) {
      if (item) this.delete(key) // Clean up expired item
      return null
    }

    return item.value as T
  }

  // Delete a value from the cache
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // Clear all values from the cache
  clear(): void {
    this.cache.clear()
  }

  // Get a value from the cache or compute it if not present
  async getOrSet<T>(key: string, computeFn: () => Promise<T>, expiryInSeconds?: number): Promise<T> {
    const cachedValue = this.get<T>(key)
    if (cachedValue !== null) return cachedValue

    const computedValue = await computeFn()
    this.set(key, computedValue, expiryInSeconds)
    return computedValue
  }
}

// Create a singleton instance
export const memoryCache = new MemoryCache()

// Helper function for caching database queries
export async function cachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  expiryInSeconds = 60, // Default 1 minute cache
): Promise<T> {
  return memoryCache.getOrSet(cacheKey, queryFn, expiryInSeconds)
}
