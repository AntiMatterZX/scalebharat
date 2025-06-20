import { z } from "zod"
import { AppError } from "./error-handling"

// Common validation schemas
export const emailSchema = z.string().email("Invalid email address")
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters")
export const nameSchema = z.string().min(2, "Name must be at least 2 characters")

// User validation schemas
export const userSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  password: passwordSchema,
  userType: z.enum(["startup", "investor"]),
})

// Startup validation schemas
export const startupSchema = z.object({
  company_name: z.string().min(2, "Company name must be at least 2 characters"),
  tagline: z.string().max(160, "Tagline must be less than 160 characters").optional(),
  description: z.string().max(2000, "Description must be less than 2000 characters"),
  website: z.string().url("Invalid website URL").optional(),
  founded_year: z.number().int().min(1900).max(new Date().getFullYear()),
  stage: z.enum(["idea", "prototype", "mvp", "early-stage", "growth", "expansion"]),
  industry: z.array(z.string()).min(1, "At least one industry must be selected"),
  business_model: z.enum(["b2b", "b2c", "b2b2c", "marketplace", "saas", "other"]),
  target_amount: z.number().int().min(0).optional(),
  team_size: z.number().int().min(1).optional(),
})

// Investor validation schemas
export const investorSchema = z.object({
  firm_name: z.string().min(2, "Firm name must be at least 2 characters").optional(),
  bio: z.string().max(2000, "Bio must be less than 2000 characters"),
  website: z.string().url("Invalid website URL").optional(),
  type: z.enum(["angel", "vc", "corporate", "accelerator", "family-office", "other"]),
  check_size_min: z.number().int().min(0).optional(),
  check_size_max: z.number().int().min(0).optional(),
  industries: z.array(z.string()).min(1, "At least one industry must be selected"),
  stages: z.array(z.string()).min(1, "At least one stage must be selected"),
})

// Message validation schema
export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message is too long"),
  match_id: z.string().uuid("Invalid match ID"),
})

// Validate data against a schema
export function validateData<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }))

      throw AppError.validation("Validation failed", { validationErrors })
    }
    throw error
  }
}
