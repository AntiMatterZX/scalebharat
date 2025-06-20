"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { useAuth } from "@/components/providers"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { UploadCloud, FileText, Trash2, Loader2 } from "lucide-react"
import { useDropzone } from "react-dropzone"

interface UploadedFile {
  id?: string
  name: string
  url: string
  type: "pitch_deck" | "financials" | "other"
  file_path?: string // Store the path for deletion
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "text/csv": [".csv"],
}

export default function StartupDocumentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [documents, setDocuments] = useState<UploadedFile[]>([])

  const pitchDeckDropzone = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, "pitch_deck"),
    multiple: false,
    accept: ALLOWED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
  })

  const financialsDropzone = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, "financials"),
    multiple: false,
    accept: ALLOWED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
  })

  const otherDropzone = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, "other"),
    multiple: false,
    accept: ALLOWED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
  })

  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return
      try {
        const { data: startupData } = await supabase.from("startups").select("id").eq("user_id", user.id).single()
        if (!startupData) return

        const { data, error: fetchError } = await supabase
          .from("startup_documents")
          .select("*")
          .eq("startup_id", startupData.id)

        if (fetchError) throw fetchError
        if (data) {
          setDocuments(
            data.map((doc) => ({
              id: doc.id,
              name: doc.file_name,
              url: doc.file_url,
              type: doc.document_type as UploadedFile["type"],
              file_path: doc.file_path,
            })),
          )
        }
      } catch (err) {
        console.error("Error loading documents:", err)
      }
    }
    loadExistingData()
  }, [user])

  const onDrop = useCallback(
    async (acceptedFiles: File[], documentType: UploadedFile["type"]) => {
      if (!user) return
      setUploading(true)
      setError("")

      const file = acceptedFiles[0]
      if (!file) {
        setUploading(false)
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`File is too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`)
        setUploading(false)
        return
      }

      // Basic type check based on extension, more robust check can be added
      const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`
      const allowedExtensions = Object.values(ALLOWED_FILE_TYPES).flat()
      if (!allowedExtensions.includes(fileExt)) {
        setError(`Invalid file type. Allowed types: ${allowedExtensions.join(", ")}`)
        setUploading(false)
        return
      }

      try {
        const { data: startupData } = await supabase.from("startups").select("id").eq("user_id", user.id).single()
        if (!startupData) throw new Error("Startup profile not found.")

        const fileName = `${user.id}-${documentType}-${Date.now()}-${file.name}`
        const filePath = `documents/${startupData.id}/${fileName}`

        const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file)
        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(filePath)
        if (!publicUrlData.publicUrl) throw new Error("Failed to get public URL for uploaded file.")

        const newDocument: Omit<UploadedFile, "id"> = {
          name: file.name,
          url: publicUrlData.publicUrl,
          type: documentType,
          file_path: filePath,
        }

        const { data: insertedDoc, error: insertError } = await supabase
          .from("startup_documents")
          .insert({
            startup_id: startupData.id,
            document_type: newDocument.type,
            file_name: newDocument.name,
            file_url: newDocument.url,
            file_path: newDocument.file_path,
            visibility: "investors_only", // Set default visibility for uploaded documents
            is_public: false
          })
          .select()
          .single()

        if (insertError) throw insertError

        setDocuments((prev) => [...prev, { ...newDocument, id: insertedDoc.id }])
        toast({ title: "Document uploaded successfully!", variant: "success" })
      } catch (err: any) {
        console.error("Error uploading document:", err)
        setError(err.message || "Failed to upload document.")
      } finally {
        setUploading(false)
      }
    },
    [user, toast],
  )

  const handleDeleteDocument = async (docId: string | undefined, filePath: string | undefined) => {
    if (!docId || !filePath) return
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage.from("documents").remove([filePath])
      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase.from("startup_documents").delete().eq("id", docId)
      if (dbError) throw dbError

      // Update local state to remove deleted document without navigation
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId))
      toast({ title: "Document deleted successfully.", variant: "success" })
    } catch (err: any) {
      console.error("Error deleting document:", err)
      setError(err.message || "Failed to delete document.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // No data to save directly on this page, documents are saved on upload
    // Just navigate to the next step
    toast({
      title: "Documents section completed",
      description: "Let's review your profile.",
      variant: "success",
    })
    router.push("/onboarding/startup/review")
    setLoading(false)
  }

  const renderDropzone = (type: UploadedFile["type"], label: string) => {
    let dz
    if (type === "pitch_deck") {
      dz = pitchDeckDropzone
    } else if (type === "financials") {
      dz = financialsDropzone
    } else {
      dz = otherDropzone
    }
    const currentDoc = documents.find((d) => d.type === type)
    return (
      <div>
        <Label className="text-base">{label}</Label>
        {currentDoc ? (
          <div className="mt-2 p-3 border rounded-md flex items-center justify-between bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              <a href={currentDoc.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {currentDoc.name}
              </a>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(currentDoc.id, currentDoc.file_path)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : (
          <div
            {...dz.getRootProps()}
            className={`mt-2 p-6 border-2 border-dashed rounded-md cursor-pointer text-center
                        ${dz.isDragActive ? "border-primary bg-primary-foreground" : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"}`}
          >
            <input {...dz.getInputProps()} />
            <UploadCloud className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            {dz.isDragActive ? <p>Drop the file here ...</p> : <p>Drag 'n' drop file here, or click to select</p>}
            <p className="text-xs text-muted-foreground mt-1">PDF, PPT, XLSX, CSV (Max 5MB)</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <OnboardingLayout type="startup">
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {uploading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Uploading document...</span>
          </div>
        )}

        <h2 className="text-xl font-semibold">Upload Documents</h2>
        <p className="text-sm text-muted-foreground">
          Share key documents with potential investors. We recommend uploading a pitch deck and financial projections.
        </p>

        <div className="space-y-6">
          {renderDropzone("pitch_deck", "Pitch Deck *")}
          {renderDropzone("financials", "Financial Projections/Statements")}
          {renderDropzone("other", "Other Supporting Document")}
        </div>

        <div className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={() => router.push("/onboarding/startup/funding")}>
            Back
          </Button>
          <Button type="submit" disabled={loading || uploading}>
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  )
}
