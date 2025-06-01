"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { useAuth } from "@/components/providers"
import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase"

const STAGES = [
  { value: "idea", label: "Idea Stage" },
  { value: "prototype", label: "Prototype" },
  { value: "mvp", label: "MVP" },
  { value: "early-stage", label: "Early Stage" },
  { value: "growth", label: "Growth" },
  { value: "expansion", label: "Expansion" },
]

const BUSINESS_MODELS = [
  { value: "b2b", label: "B2B" },
  { value: "b2c", label: "B2C" },
  { value: "b2b2c", label: "B2B2C" },
  { value: "marketplace", label: "Marketplace" },
  { value: "saas", label: "SaaS" },
  { value: "other", label: "Other" },
]

export default function StartupCompanyDetailsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [industries, setIndustries] = useState<string[]>([])
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([])
  const [formData, setFormData] = useState({
    foundedYear: new Date().getFullYear(),
    stage: "",
    industry: [] as string[],
    businessModel: "",
    revenue: 0,
    usersCount: 0,
    growthRate: 0,
  })

  useEffect(() => {
    // Load available industries from system config
    loadIndustries()

    // Load existing data if available
    if (user) {
      loadExistingData()
    }
  }, [user])

  const loadExistingData = async () => {
    try {
      // Try to load from session storage first
      const savedData = sessionStorage.getItem("startupOnboarding")

      // Then load from database
      const { data, error } = await supabase
        .from("startups")
        .select("founded_year, stage, industry, business_model, revenue, users_count, growth_rate")
        .eq("user_id", user!.id)
        .single()

      if (error) {
        console.error("Error loading startup data:", error)
        // If no data in database and no session data, redirect to first step
        if (!savedData) {
          router.push("/onboarding/startup")
          return
        }
      }

      if (data) {
        setFormData({
          foundedYear: data.founded_year || new Date().getFullYear(),
          stage: data.stage || "",
          industry: data.industry || [],
          businessModel: data.business_model || "",
          revenue: data.revenue || 0,
          usersCount: data.users_count || 0,
          growthRate: data.growth_rate || 0,
        })
      }
    } catch (error) {
      console.error("Error loading startup data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadIndustries = async () => {
    try {
      const { data } = await supabase.from("system_config").select("value").eq("key", "industries").single()

      if (data?.value) {
        setAvailableIndustries(data.value as string[])
      } else {
        // Fallback industries if system_config is not available
        setAvailableIndustries([
          "Technology",
          "Healthcare",
          "Finance",
          "Education",
          "E-commerce",
          "SaaS",
          "AI/ML",
          "Blockchain",
          "IoT",
          "Cybersecurity",
          "Fintech",
          "Edtech",
          "Healthtech",
          "Cleantech",
          "Foodtech",
        ])
      }
    } catch (error) {
      console.error("Error loading industries:", error)
      // Fallback industries
      setAvailableIndustries([
        "Technology",
        "Healthcare",
        "Finance",
        "Education",
        "E-commerce",
        "SaaS",
        "AI/ML",
        "Blockchain",
        "IoT",
        "Cybersecurity",
        "Fintech",
        "Edtech",
        "Healthtech",
        "Cleantech",
        "Foodtech",
      ])
    }
  }

  const addIndustry = (industry: string) => {
    if (!formData.industry.includes(industry)) {
      setFormData({
        ...formData,
        industry: [...formData.industry, industry],
      })
    }
  }

  const removeIndustry = (industry: string) => {
    setFormData({
      ...formData,
      industry: formData.industry.filter((i) => i !== industry),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!user) {
      setError("You must be logged in to create a startup profile")
      setLoading(false)
      return
    }

    if (formData.industry.length === 0) {
      setError("Please select at least one industry")
      setLoading(false)
      return
    }

    if (!formData.stage) {
      setError("Please select your startup stage")
      setLoading(false)
      return
    }

    if (!formData.businessModel) {
      setError("Please select your business model")
      setLoading(false)
      return
    }

    try {
      // Update startup profile
      const { error: updateError } = await supabase
        .from("startups")
        .update({
          founded_year: formData.foundedYear,
          stage: formData.stage,
          industry: formData.industry,
          business_model: formData.businessModel,
          revenue: formData.revenue,
          users_count: formData.usersCount,
          growth_rate: formData.growthRate,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (updateError) {
        throw updateError
      }

      // Get previous step data
      const savedData = sessionStorage.getItem("startupOnboarding")
      const previousData = savedData ? JSON.parse(savedData) : {}

      // Merge with current step data
      const mergedData = {
        ...previousData,
        foundedYear: formData.foundedYear,
        stage: formData.stage,
        industry: formData.industry,
        businessModel: formData.businessModel,
        revenue: formData.revenue,
        usersCount: formData.usersCount,
        growthRate: formData.growthRate,
      }

      // Save merged data
      sessionStorage.setItem("startupOnboarding", JSON.stringify(mergedData))

      // Show success toast
      toast({
        title: "Company details saved",
        description: "Let's continue with funding information",
        variant: "success",
      })

      // Navigate to next step - with a slight delay to ensure the toast is seen
      setTimeout(() => {
        router.push("/onboarding/startup/funding")
      }, 500)
    } catch (err) {
      console.error("Error saving company details:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <OnboardingLayout type="startup">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </OnboardingLayout>
    )
  }

  return (
    <OnboardingLayout type="startup">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="foundedYear" className="text-base">
              Founded Year *
            </Label>
            <Input
              id="foundedYear"
              type="number"
              value={formData.foundedYear}
              onChange={(e) => setFormData({ ...formData, foundedYear: Number.parseInt(e.target.value) })}
              min="1900"
              max={new Date().getFullYear()}
              className="h-11"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage" className="text-base">
              Stage *
            </Label>
            <Select
              value={formData.stage}
              onValueChange={(value) => setFormData({ ...formData, stage: value })}
              required
            >
              <SelectTrigger id="stage" className="h-11">
                <SelectValue placeholder="Select your current stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-base">Industries *</Label>
          <Select onValueChange={addIndustry}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select industries" />
            </SelectTrigger>
            <SelectContent>
              {availableIndustries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.industry.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.industry.map((industry) => (
                <Badge key={industry} variant="secondary" className="flex items-center gap-1 py-1.5">
                  {industry}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeIndustry(industry)} />
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">Select all industries that apply to your startup</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessModel" className="text-base">
            Business Model *
          </Label>
          <Select
            value={formData.businessModel}
            onValueChange={(value) => setFormData({ ...formData, businessModel: value })}
            required
          >
            <SelectTrigger id="businessModel" className="h-11">
              <SelectValue placeholder="Select your business model" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="revenue" className="text-base">
              Annual Revenue ($)
            </Label>
            <Input
              id="revenue"
              type="number"
              value={formData.revenue}
              onChange={(e) => setFormData({ ...formData, revenue: Number.parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="usersCount" className="text-base">
              Number of Users
            </Label>
            <Input
              id="usersCount"
              type="number"
              value={formData.usersCount}
              onChange={(e) => setFormData({ ...formData, usersCount: Number.parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="growthRate" className="text-base">
              Growth Rate (% per year)
            </Label>
            <Input
              id="growthRate"
              type="number"
              value={formData.growthRate}
              onChange={(e) => setFormData({ ...formData, growthRate: Number.parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
              max="1000"
              className="h-11"
            />
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={() => router.push("/onboarding/startup")}>
            Back
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  )
}
