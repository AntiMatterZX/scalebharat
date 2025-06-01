"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
import { Upload } from "lucide-react"
import { uploadFile } from "@/lib/storage"

interface FileUploadProps {
  onUpload: (url: string, path: string) => void
  accept?: string
  maxSize?: number
  bucket: string
  path: string
  label?: string
}

export function FileUpload({
  onUpload,
  accept = "*/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  bucket,
  path,
  label = "Upload File",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / 1024 / 1024}MB`)
      return
    }

    setUploading(true)
    setError("")

    try {
      const { url, path: filePath } = await uploadFile(file, bucket, path)
      onUpload(url, filePath)
    } catch (err) {
      setError("Failed to upload file")
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : label}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
