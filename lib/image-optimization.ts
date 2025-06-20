import { supabase } from "./supabase"
import { AppError, logError } from "./error-handling"
import sharp from "sharp"

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed image types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

// Image sizes for different purposes
export const IMAGE_SIZES = {
  avatar: { width: 150, height: 150 },
  logo: { width: 300, height: 300 },
  cover: { width: 1200, height: 630 },
  thumbnail: { width: 400, height: 300 },
}

export type ImageSize = keyof typeof IMAGE_SIZES

// Validate image file
export function validateImageFile(file: File): boolean {
  if (file.size > MAX_FILE_SIZE) {
    throw AppError.validation(`File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw AppError.validation(
      `File type ${file.type} is not supported. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    )
  }

  return true
}

// Process and optimize image
export async function optimizeImage(
  file: File | Blob | ArrayBuffer,
  size: ImageSize = "thumbnail",
  format: "jpeg" | "webp" | "png" = "webp",
): Promise<Buffer> {
  try {
    const buffer =
      file instanceof File || file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : Buffer.from(file)

    const { width, height } = IMAGE_SIZES[size]

    // Process with sharp
    const processedImage = sharp(buffer).resize(width, height, {
      fit: "inside",
      withoutEnlargement: true,
    })

    // Convert to specified format
    switch (format) {
      case "jpeg":
        return processedImage.jpeg({ quality: 80 }).toBuffer()
      case "png":
        return processedImage.png({ compressionLevel: 9 }).toBuffer()
      case "webp":
      default:
        return processedImage.webp({ quality: 80 }).toBuffer()
    }
  } catch (error) {
    logError(error as Error, { context: "image-optimization" })
    throw AppError.server("Failed to process image")
  }
}

// Upload image to storage
export async function uploadImage(
  file: File | Blob | ArrayBuffer,
  path: string,
  size: ImageSize = "thumbnail",
  format: "jpeg" | "webp" | "png" = "webp",
): Promise<string> {
  try {
    const optimizedImage = await optimizeImage(file, size, format)
    const fileExt = format === "jpeg" ? "jpg" : format
    const filePath = `${path}.${fileExt}`

    const { data, error } = await supabase.storage.from("images").upload(filePath, optimizedImage, {
      contentType: `image/${format}`,
      upsert: true,
    })

    if (error) {
      throw AppError.externalService("Failed to upload image", { supabaseError: error })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    if (error instanceof AppError) throw error
    logError(error as Error, { context: "image-upload" })
    throw AppError.server("Failed to upload image")
  }
}
