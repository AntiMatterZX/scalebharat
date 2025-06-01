"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { useAuth } from "@/components/providers"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Building2, Upload, Loader2 } from "lucide-react"
import { createUniqueSlug } from "@/lib/slugify" // Import the slug utility

export default function StartupBasicInfoPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isExistingProfile, setIsExistingProfile] = useState(false)
  const [startupId, setStartupId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    companyName: "",
    tagline: "",
    description: "",
    logo: null as File | null,
    logoPreview: "",
    website: "",
  })

  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return
      setLoading(true)
      try {
        const { data, error: fetchError } = await supabase
          .from("startups")
          .select("id, company_name, tagline, description, logo, website, slug")
          .eq("user_id", user.id)
          .single()

        if (fetchError && fetchError.code !== "PGRST116") {
          // PGRST116 means no row found, which is fine for new profiles
          console.error("Error loading startup data:", fetchError)
          setError("Failed to load existing profile data.")
          setLoading(false)
          return
        }

        if (data) {
          setIsExistingProfile(true)
          setStartupId(data.id)
          setFormData({
            companyName: data.company_name || "",
            tagline: data.tagline || "",
            description: data.description || "",
            logo: null,
            logoPreview: data.logo || "",
            website: data.website || "",
          })
        } else {
          setIsExistingProfile(false)
        }
      } catch (err) {
        console.error("Error in loadExistingData:", err)
        setError("An unexpected error occurred while loading data.")
      } finally {
        setLoading(false)
      }
    }
    loadExistingData()
  }, [user])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({
        ...formData,
        logo: file,
        logoPreview: URL.createObjectURL(file),
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!user) {
      setError("You must be logged in.")
      setLoading(false)
      return
    }

    if (!formData.companyName.trim()) {
      setError("Company name is required.")
      setLoading(false)
      return
    }

    try {
      let logoUrl = formData.logoPreview
      if (formData.logo) {
        const fileExt = formData.logo.name.split(".").pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `logos/${fileName}`

        // Ensure bucket exists (idempotent)
        const { error: bucketError } = await supabase.storage.createBucket("logos", { public: true })
        if (bucketError && bucketError.message !== 'The bucket "logos" already exists') {
          console.warn("Error creating logos bucket (might already exist):", bucketError.message)
        }

        const { error: uploadError } = await supabase.storage.from("logos").upload(filePath, formData.logo)
        if (uploadError) {
          console.error("Error uploading logo:", uploadError)
          toast({ title: "Logo Upload Failed", description: uploadError.message, variant: "destructive" })
          // Decide if you want to proceed without logo or stop
        } else {
          const { data } = supabase.storage.from("logos").getPublicUrl(filePath)
          logoUrl = data.publicUrl
        }
      }

      const startupDataToSave = {
        user_id: user.id,
        company_name: formData.companyName,
        tagline: formData.tagline,
        description: formData.description,
        logo: logoUrl,
        website: formData.website,
        updated_at: new Date().toISOString(),
      }

      if (isExistingProfile && startupId) {
        // Update existing profile
        // Only generate new slug if company name changed
        const { data: currentProfile } = await supabase
          .from("startups")
          .select("company_name, slug")
          .eq("id", startupId)
          .single()
        let slugToSave = currentProfile?.slug

        if (currentProfile && currentProfile.company_name !== formData.companyName) {
          slugToSave = await createUniqueSlug(formData.companyName)
        }

        const { error: updateError } = await supabase
          .from("startups")
          .update({ ...startupDataToSave, slug: slugToSave })
          .eq("id", startupId)

        if (updateError) throw updateError
        toast({ title: "Information Updated", description: "Basic info saved.", variant: "success" })
      } else {
        // Create new profile
        const slug = await createUniqueSlug(formData.companyName)
        const { data: newStartup, error: insertError } = await supabase
          .from("startups")
          .insert([{ ...startupDataToSave, slug: slug, status: "draft" }]) // New profiles start as draft
          .select("id")
          .single()

        if (insertError) throw insertError
        if (newStartup) setStartupId(newStartup.id) // Store new ID for subsequent steps
        setIsExistingProfile(true) // Now it's an existing profile
        toast({ title: "Information Saved", description: "Let's continue with company details.", variant: "success" })
      }

      sessionStorage.setItem(
        "startupOnboarding",
        JSON.stringify({
          companyName: formData.companyName,
          tagline: formData.tagline,
          description: formData.description,
          website: formData.website,
          logo: logoUrl,
        }),
      )

      router.push("/onboarding/startup/company")
    } catch (err: any) {
      console.error("Error saving startup information:", err)
      setError(err.message || "An unexpected error occurred.")
      toast({
        title: "Error",
        description: err.message || "Could not save startup information.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <OnboardingLayout type="startup" currentStep="basic">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-base">
            Company Name *
          </Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="Enter your company name"
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline" className="text-base">
            Tagline
          </Label>
          <Input
            id="tagline"
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            placeholder="A brief description of what you do"
            className="h-11"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            A short, catchy phrase that describes your startup (max 100 characters)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-base">
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your startup, mission, and vision"
            rows={4}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Provide a comprehensive description of your startup, including your mission, vision, and what problem you're
            solving
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo" className="text-base">
            Company Logo
          </Label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden bg-muted">
              {formData.logoPreview ? (
                <img
                  src={formData.logoPreview || "/placeholder.svg"}
                  alt="Logo preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="h-10 w-10 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <label
                htmlFor="logo-upload"
                className="flex items-center justify-center w-full h-11 px-4 transition bg-background dark:bg-gray-800 border border-input dark:border-gray-600 rounded-md cursor-pointer hover:bg-accent dark:hover:bg-gray-700"
              >
                <Upload className="w-5 h-5 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload logo</span>
                <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Recommended: Square image, PNG or JPG, at least 300x300px
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="text-base">
            Website
          </Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://yourcompany.com"
            className="h-11"
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Saving..." : "Save and Continue"}
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  )
}
