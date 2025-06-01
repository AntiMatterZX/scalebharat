import { supabase } from "./supabase"

export async function uploadFile(file: File, bucket: string, path: string) {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${path}/${fileName}`

    // First, try to upload the file
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      // If bucket doesn't exist, log the error but don't throw
      if (error.message.includes("Bucket not found")) {
        console.error(
          `Bucket "${bucket}" not found. Please create it in Supabase dashboard or run the create-storage-buckets.sql script.`,
        )
        throw new Error(`Storage bucket "${bucket}" not found. Please contact support.`)
      }
      throw error
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath)

    return { url: publicUrl, path: filePath }
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

export async function deleteFile(bucket: string, path: string) {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}

// Helper function to get the correct file path with user ID
export function getUserFilePath(userId: string, filename: string): string {
  return `${userId}/${filename}`
}
