/**
 * Generates a URL-friendly slug from a string
 * @param text The text to convert to a slug
 * @param maxLength Optional maximum length of the slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string, maxLength = 100): string {
  if (!text) return ""

  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .substring(0, maxLength) // Limit length
}

/**
 * Generates a slug for an investor based on firm name or personal name
 * @param firmName The firm name (preferred)
 * @param firstName The investor's first name
 * @param lastName The investor's last name
 * @returns A URL-friendly slug
 */
export function generateInvestorSlug(firmName?: string | null, firstName?: string, lastName?: string): string {
  // Prefer firm name, fallback to personal name
  const name = firmName || `${firstName || ""} ${lastName || ""}`.trim() || "investor"
  return generateSlug(name)
}

/**
 * Ensures a slug is unique by appending a number if necessary
 * @param slug The base slug
 * @param checkExistingFn Function to check if a slug already exists
 * @returns A unique slug
 */
export async function ensureUniqueSlug(
  slug: string,
  checkExistingFn: (slug: string) => Promise<boolean>,
): Promise<string> {
  let uniqueSlug = slug
  let counter = 1

  // Keep checking until we find a unique slug
  while (await checkExistingFn(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`
    counter++
  }

  return uniqueSlug
}
