"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, ArrowRight, ArrowLeft, User, Building2, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

const INVESTOR_TYPES = [
  { value: "angel", label: "Angel Investor" },
  { value: "vc", label: "Venture Capital" },
  { value: "corporate", label: "Corporate Investor" },
  { value: "government", label: "Government Fund" },
  { value: "accelerator", label: "Accelerator/Incubator" },
]

const INVESTMENT_STAGES = ["Pre-seed", "Seed", "Series A", "Series B", "Series C", "Series D+", "Growth", "Late Stage"]

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education", "E-commerce", "SaaS", "AI/ML", 
  "Blockchain", "IoT", "Cybersecurity", "Fintech", "Edtech", "Healthtech", "Cleantech", "Foodtech"
]

const GEOGRAPHIES = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East", "Africa", "Global"]

const BUSINESS_MODELS = [
  "B2B", "B2C", "B2B2C", "Marketplace", "SaaS", "E-commerce", "Subscription", "Freemium", "Other"
]

export default function InvestorOnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [accountData, setAccountData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  })
  
  const [profileData, setProfileData] = useState({
    type: "",
    firmName: "",
    bio: "",
    website: "",
    linkedin: "",
    twitter: "",
  })
  
  const [investmentData, setInvestmentData] = useState({
    aum: 0,
    investmentStages: [] as string[],
    investmentIndustries: [] as string[],
    investmentGeographies: [] as string[],
    checkSizeMin: 0,
    checkSizeMax: 0,
    businessModels: [] as string[],
  })

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  const addToArray = (array: string[], item: string, setter: (arr: string[]) => void) => {
    if (!array.includes(item)) {
      setter([...array, item])
    }
  }

  const removeFromArray = (array: string[], item: string, setter: (arr: string[]) => void) => {
    setter(array.filter(i => i !== item))
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return accountData.email && accountData.password && accountData.firstName && accountData.lastName
      case 2:
        return profileData.type && profileData.firmName
      case 3:
        return investmentData.investmentIndustries.length > 0 && investmentData.checkSizeMax > 0
      default:
        return true
    }
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      setError("Please fill in all required fields")
      return
    }
    setError("")
    setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    setError("")
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Create account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: accountData.email,
        password: accountData.password,
        options: {
          data: {
            first_name: accountData.firstName,
            last_name: accountData.lastName,
            user_type: "investor",
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (authData.user) {
        // Wait for user record to be created
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Create investor profile with all data
        const { error: investorError } = await supabase.from("investors").insert({
          user_id: authData.user.id,
          type: profileData.type as any,
          firm_name: profileData.firmName,
          bio: profileData.bio,
          website: profileData.website,
          linkedin: profileData.linkedin,
          twitter: profileData.twitter,
          aum: investmentData.aum,
          investment_stages: investmentData.investmentStages,
          investment_industries: investmentData.investmentIndustries,
          investment_geographies: investmentData.investmentGeographies,
          check_size_min: investmentData.checkSizeMin,
          check_size_max: investmentData.checkSizeMax,
          business_models: investmentData.businessModels,
          status: "active", // Investors are active immediately
        })

        if (investorError) {
          console.error("Error creating investor profile:", investorError)
          setError("Failed to create investor profile. Please try again.")
          setLoading(false)
          return
        }

        // Update user profile type
        await supabase.from("users").update({ profile_type: "investor" }).eq("id", authData.user.id)

        // Redirect to success page
        router.push("/auth/onboarding/success?type=investor")
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold">Create Your Account</h2>
              <p className="text-muted-foreground">Let's start with your personal information</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={accountData.firstName}
                  onChange={(e) => setAccountData({ ...accountData, firstName: e.target.value })}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={accountData.lastName}
                  onChange={(e) => setAccountData({ ...accountData, lastName: e.target.value })}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={accountData.email}
                onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                placeholder="john@fund.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={accountData.password}
                onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                placeholder="Create a strong password"
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Must be at least 6 characters long</p>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Building2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold">Investor Profile</h2>
              <p className="text-muted-foreground">Tell us about your investment background</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Investor Type *</Label>
                <Select value={profileData.type} onValueChange={(value) => setProfileData({ ...profileData, type: value })}>
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
                <Label htmlFor="firmName">Firm/Organization Name *</Label>
                <Input
                  id="firmName"
                  value={profileData.firmName}
                  onChange={(e) => setProfileData({ ...profileData, firmName: e.target.value })}
                  placeholder="Your Fund or Company Name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Tell us about your investment background and experience"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profileData.website}
                  onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                  placeholder="https://yourfund.com"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={profileData.linkedin}
                    onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                    placeholder="LinkedIn profile URL"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={profileData.twitter}
                    onChange={(e) => setProfileData({ ...profileData, twitter: e.target.value })}
                    placeholder="Twitter handle"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Users className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold">Investment Criteria</h2>
              <p className="text-muted-foreground">Define your investment preferences</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aum">Assets Under Management (USD)</Label>
                <Input
                  id="aum"
                  type="number"
                  value={investmentData.aum}
                  onChange={(e) => setInvestmentData({ ...investmentData, aum: parseInt(e.target.value) || 0 })}
                  placeholder="10000000"
                  min="0"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkSizeMin">Min Check Size (USD)</Label>
                  <Input
                    id="checkSizeMin"
                    type="number"
                    value={investmentData.checkSizeMin}
                    onChange={(e) => setInvestmentData({ ...investmentData, checkSizeMin: parseInt(e.target.value) || 0 })}
                    placeholder="25000"
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="checkSizeMax">Max Check Size (USD) *</Label>
                  <Input
                    id="checkSizeMax"
                    type="number"
                    value={investmentData.checkSizeMax}
                    onChange={(e) => setInvestmentData({ ...investmentData, checkSizeMax: parseInt(e.target.value) || 0 })}
                    placeholder="500000"
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Investment Stages</Label>
                <Select onValueChange={(value) => addToArray(investmentData.investmentStages, value, (arr) => setInvestmentData({ ...investmentData, investmentStages: arr }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select investment stages" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_STAGES.filter(stage => !investmentData.investmentStages.includes(stage)).map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {investmentData.investmentStages.map((stage) => (
                    <Badge key={stage} variant="secondary" className="flex items-center gap-1">
                      {stage}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray(investmentData.investmentStages, stage, (arr) => setInvestmentData({ ...investmentData, investmentStages: arr }))} />
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Industries *</Label>
                <Select onValueChange={(value) => addToArray(investmentData.investmentIndustries, value, (arr) => setInvestmentData({ ...investmentData, investmentIndustries: arr }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industries" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.filter(industry => !investmentData.investmentIndustries.includes(industry)).map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {investmentData.investmentIndustries.map((industry) => (
                    <Badge key={industry} variant="secondary" className="flex items-center gap-1">
                      {industry}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray(investmentData.investmentIndustries, industry, (arr) => setInvestmentData({ ...investmentData, investmentIndustries: arr }))} />
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Geographies</Label>
                <Select onValueChange={(value) => addToArray(investmentData.investmentGeographies, value, (arr) => setInvestmentData({ ...investmentData, investmentGeographies: arr }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select geographies" />
                  </SelectTrigger>
                  <SelectContent>
                    {GEOGRAPHIES.filter(geo => !investmentData.investmentGeographies.includes(geo)).map((geo) => (
                      <SelectItem key={geo} value={geo}>
                        {geo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {investmentData.investmentGeographies.map((geo) => (
                    <Badge key={geo} variant="secondary" className="flex items-center gap-1">
                      {geo}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray(investmentData.investmentGeographies, geo, (arr) => setInvestmentData({ ...investmentData, investmentGeographies: arr }))} />
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Business Models</Label>
                <Select onValueChange={(value) => addToArray(investmentData.businessModels, value, (arr) => setInvestmentData({ ...investmentData, businessModels: arr }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business models" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_MODELS.filter(model => !investmentData.businessModels.includes(model)).map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {investmentData.businessModels.map((model) => (
                    <Badge key={model} variant="secondary" className="flex items-center gap-1">
                      {model}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray(investmentData.businessModels, model, (arr) => setInvestmentData({ ...investmentData, businessModels: arr }))} />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-lg border-border/40 bg-card">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">StartupConnect</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {renderStep()}
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1 || loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep < totalSteps ? (
                <Button onClick={handleNext} disabled={loading}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 