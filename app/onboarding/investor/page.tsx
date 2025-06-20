"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import { Building2, X, Loader2 } from "lucide-react"

const INVESTOR_TYPES = [
  { value: "angel", label: "Angel Investor" },
  { value: "vc", label: "Venture Capital" },
  { value: "corporate", label: "Corporate Investor" },
  { value: "government", label: "Government Fund" },
  { value: "accelerator", label: "Accelerator/Incubator" },
]

const INVESTMENT_STAGES = ["Pre-seed", "Seed", "Series A", "Series B", "Series C", "Series D+", "Growth", "Late Stage"]

const INDUSTRIES = [
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
  "Real Estate",
  "Manufacturing",
  "Retail",
  "Energy",
  "Transportation",
]

const GEOGRAPHIES = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East", "Africa", "Global"]

const BUSINESS_MODELS = [
  "B2B",
  "B2C",
  "B2B2C",
  "Marketplace",
  "SaaS",
  "E-commerce",
  "Subscription",
  "Freemium",
  "Other",
]

export default function InvestorOnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [existingProfile, setExistingProfile] = useState(false)
  const [formData, setFormData] = useState({
    type: "",
    firmName: "",
    bio: "",
    website: "",
    aum: 0,
    investmentStages: [] as string[],
    investmentIndustries: [] as string[],
    investmentGeographies: [] as string[],
    checkSizeMin: 0,
    checkSizeMax: 0,
    businessModels: [] as string[],
    linkedin: "",
    twitter: "",
  })

  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Check if user already has an investor profile
        const { data, error } = await supabase.from("investors").select("*").eq("user_id", user.id).single()

        if (data) {
          // User already has a profile, redirect to dashboard
          setExistingProfile(true)

          // Populate form with existing data for updates
          setFormData({
            type: data.type || "",
            firmName: data.firm_name || "",
            bio: data.bio || "",
            website: data.website || "",
            aum: data.aum || 0,
            investmentStages: data.investment_stages || [],
            investmentIndustries: data.investment_industries || [],
            investmentGeographies: data.investment_geographies || [],
            checkSizeMin: data.check_size_min || 0,
            checkSizeMax: data.check_size_max || 0,
            businessModels: data.business_models || [],
            linkedin: data.linkedin || "",
            twitter: data.twitter || "",
          })
        }
      } catch (err) {
        console.error("Error checking profile:", err)
      } finally {
        setLoading(false)
      }
    }

    checkExistingProfile()
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    if (!user) {
      setError("You must be logged in to create an investor profile")
      setSubmitting(false)
      return
    }

    if (formData.investmentIndustries.length === 0) {
      setError("Please select at least one industry")
      setSubmitting(false)
      return
    }

    if (formData.checkSizeMin > formData.checkSizeMax) {
      setError("Minimum check size cannot be greater than maximum check size")
      setSubmitting(false)
      return
    }

    try {
      const profileData = {
        user_id: user.id,
        type: formData.type as any,
        firm_name: formData.firmName,
        bio: formData.bio,
        website: formData.website,
        aum: formData.aum,
        investment_stages: formData.investmentStages,
        investment_industries: formData.investmentIndustries,
        investment_geographies: formData.investmentGeographies,
        check_size_min: formData.checkSizeMin,
        check_size_max: formData.checkSizeMax,
        business_models: formData.businessModels,
        linkedin: formData.linkedin,
        twitter: formData.twitter,
        status: "active",
      }

      let result

      if (existingProfile) {
        // Update existing profile
        result = await supabase.from("investors").update(profileData).eq("user_id", user.id)
      } else {
        // Create new profile
        result = await supabase.from("investors").insert(profileData)
      }

      if (result.error) {
        setError(result.error.message)
      } else {
        // Also update the user's profile_type if it's not set
        await supabase.from("users").update({ profile_type: "investor" }).eq("id", user.id)

        router.push("/investor/dashboard")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const addToArray = (array: string[], item: string, setter: (arr: string[]) => void) => {
    if (!array.includes(item)) {
      setter([...array, item])
    }
  }

  const removeFromArray = (array: string[], item: string, setter: (arr: string[]) => void) => {
    setter(array.filter((i) => i !== item))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold">StartupConnect</span>
            </div>
            <CardTitle>{existingProfile ? "Update" : "Create"} Your Investor Profile</CardTitle>
            <CardDescription>
              Tell us about your investment preferences to get matched with relevant startups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="type">Investor Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select investor type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTOR_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firmName">Firm/Organization Name</Label>
                <Input
                  id="firmName"
                  value={formData.firmName}
                  onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                  placeholder="Enter your firm or organization name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about your investment philosophy and experience"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://yourfirm.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aum">Assets Under Management ($M)</Label>
                  <Input
                    id="aum"
                    type="number"
                    value={formData.aum}
                    onChange={(e) => setFormData({ ...formData, aum: Number.parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Investment Stages *</Label>
                <Select
                  onValueChange={(value) =>
                    addToArray(formData.investmentStages, value, (arr) =>
                      setFormData({ ...formData, investmentStages: arr }),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select investment stages" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.investmentStages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.investmentStages.map((stage) => (
                      <Badge key={stage} variant="secondary" className="flex items-center gap-1">
                        {stage}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() =>
                            removeFromArray(formData.investmentStages, stage, (arr) =>
                              setFormData({ ...formData, investmentStages: arr }),
                            )
                          }
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Industries *</Label>
                <Select
                  onValueChange={(value) =>
                    addToArray(formData.investmentIndustries, value, (arr) =>
                      setFormData({ ...formData, investmentIndustries: arr }),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industries" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.investmentIndustries.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.investmentIndustries.map((industry) => (
                      <Badge key={industry} variant="secondary" className="flex items-center gap-1">
                        {industry}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() =>
                            removeFromArray(formData.investmentIndustries, industry, (arr) =>
                              setFormData({ ...formData, investmentIndustries: arr }),
                            )
                          }
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Geographies</Label>
                <Select
                  onValueChange={(value) =>
                    addToArray(formData.investmentGeographies, value, (arr) =>
                      setFormData({ ...formData, investmentGeographies: arr }),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select geographies" />
                  </SelectTrigger>
                  <SelectContent>
                    {GEOGRAPHIES.map((geo) => (
                      <SelectItem key={geo} value={geo}>
                        {geo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.investmentGeographies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.investmentGeographies.map((geo) => (
                      <Badge key={geo} variant="secondary" className="flex items-center gap-1">
                        {geo}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() =>
                            removeFromArray(formData.investmentGeographies, geo, (arr) =>
                              setFormData({ ...formData, investmentGeographies: arr }),
                            )
                          }
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkSizeMin">Min Check Size ($K)</Label>
                  <Input
                    id="checkSizeMin"
                    type="number"
                    value={formData.checkSizeMin}
                    onChange={(e) => setFormData({ ...formData, checkSizeMin: Number.parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkSizeMax">Max Check Size ($K)</Label>
                  <Input
                    id="checkSizeMax"
                    type="number"
                    value={formData.checkSizeMax}
                    onChange={(e) => setFormData({ ...formData, checkSizeMax: Number.parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Business Models</Label>
                <Select
                  onValueChange={(value) =>
                    addToArray(formData.businessModels, value, (arr) =>
                      setFormData({ ...formData, businessModels: arr }),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business models" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_MODELS.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.businessModels.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.businessModels.map((model) => (
                      <Badge key={model} variant="secondary" className="flex items-center gap-1">
                        {model}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() =>
                            removeFromArray(formData.businessModels, model, (arr) =>
                              setFormData({ ...formData, businessModels: arr }),
                            )
                          }
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={formData.twitter}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} className="flex-1">
                  Skip for Now
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {existingProfile ? "Updating..." : "Creating..."}
                    </>
                  ) : existingProfile ? (
                    "Update Profile"
                  ) : (
                    "Create Profile"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
