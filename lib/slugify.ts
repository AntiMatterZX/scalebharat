export async function createUniqueSlug(text: string): Promise<string> {
  // Simple slugify implementation: lowercase, replace spaces with dashes, remove non-alphanumeric
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  // In real implementation, check uniqueness in DB and append suffix if needed
  return slug
}
