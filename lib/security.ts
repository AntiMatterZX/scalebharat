import crypto from "crypto"
import { AppError } from "./error-handling"

// Generate a secure random token
export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

// Hash a password or sensitive data
export function hashData(data: string, salt?: string): { hash: string; salt: string } {
  // Generate a salt if not provided
  const useSalt = salt || crypto.randomBytes(16).toString("hex")

  // Create HMAC
  const hash = crypto.createHmac("sha256", useSalt).update(data).digest("hex")

  return { hash, salt: useSalt }
}

// Verify a hash
export function verifyHash(data: string, hash: string, salt: string): boolean {
  const { hash: computedHash } = hashData(data, salt)
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash))
}

// Encrypt sensitive data
export function encryptData(data: string, key: string): string {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv)

    let encrypted = cipher.update(data, "utf8", "hex")
    encrypted += cipher.final("hex")

    const authTag = cipher.getAuthTag().toString("hex")

    // Return IV + Auth Tag + Encrypted Data
    return iv.toString("hex") + authTag + encrypted
  } catch (error) {
    throw AppError.server("Encryption failed")
  }
}

// Decrypt sensitive data
export function decryptData(encryptedData: string, key: string): string {
  try {
    // Extract IV, Auth Tag, and Encrypted Data
    const iv = Buffer.from(encryptedData.slice(0, 32), "hex")
    const authTag = Buffer.from(encryptedData.slice(32, 64), "hex")
    const encrypted = encryptedData.slice(64)

    const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv)

    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    throw AppError.server("Decryption failed")
  }
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

// Generate a CSRF token
export function generateCsrfToken(): string {
  return generateSecureToken()
}

// Validate a CSRF token
export function validateCsrfToken(token: string, storedToken: string): boolean {
  return token === storedToken
}
