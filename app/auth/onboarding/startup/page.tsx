"use client"

import { useState, useEffect } from "react"
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
import { Building2, ArrowRight, ArrowLeft, User, Mail, Lock, X, Upload, Users, FileText, Rocket } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { createUniqueSlug } from '@/lib/slugify'
import { cn } from "@/lib/utils"

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

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education", "E-commerce", "SaaS", "AI/ML", 
  "Blockchain", "IoT", "Cybersecurity", "Fintech", "Edtech", "Healthtech", "Cleantech", "Foodtech"
]

const FUNDING_STAGES = [
  { value: "pre-seed", label: "Pre-seed" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b", label: "Series B" },
  { value: "series-c", label: "Series C" },
  { value: "growth", label: "Growth" },
]

export default function StartupOnboardingPage() {
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
  
  const [companyData, setCompanyData] = useState({
    companyName: "",
    tagline: "",
    description: "",
    website: "",
    foundedYear: new Date().getFullYear(),
    stage: "",
    industry: [] as string[],
    businessModel: "",
    logo: null as File | null,
    logoPreview: "",
  })
  
  const [businessData, setBusinessData] = useState({
    revenue: 0,
    usersCount: 0,
    growthRate: 0,
    problemStatement: "",
    solution: "",
    targetMarket: "",
    competitiveAdvantage: "",
  })
  
  const [fundingData, setFundingData] = useState({
    fundingStage: "",
    amountSeeking: 0,
    previousFunding: 0,
    useOfFunds: "",
    investorTypes: [] as string[],
  })
  
  const [teamData, setTeamData] = useState({
    members: [{ name: "", role: "", email: "", linkedin: "" }]
  })

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCompanyData({
        ...companyData,
        logo: file,
        logoPreview: URL.createObjectURL(file),
      })
    }
  }

  const addIndustry = (industry: string) => {
    if (!companyData.industry.includes(industry)) {
      setCompanyData({
        ...companyData,
        industry: [...companyData.industry, industry],
      })
    }
  }

  const removeIndustry = (industry: string) => {
    setCompanyData({
      ...companyData,
      industry: companyData.industry.filter((i) => i !== industry),
    })
  }

  const addTeamMember = () => {
    setTeamData({
      members: [...teamData.members, { name: "", role: "", email: "", linkedin: "" }]
    })
  }

  const removeTeamMember = (index: number) => {
    setTeamData({
      members: teamData.members.filter((_, i) => i !== index)
    })
  }

  const updateTeamMember = (index: number, field: string, value: string) => {
    const updatedMembers = teamData.members.map((member, i) => 
      i === index ? { ...member, [field]: value } : member
    )
    setTeamData({ members: updatedMembers })
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return accountData.email && accountData.password && accountData.firstName && accountData.lastName
      case 2:
        return companyData.companyName && companyData.stage && companyData.industry.length > 0 && companyData.businessModel
      case 3:
        return businessData.problemStatement && businessData.solution && businessData.targetMarket
      case 4:
        return fundingData.fundingStage && fundingData.amountSeeking > 0
      case 5:
        return teamData.members.every(member => member.name && member.role)
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
            user_type: "startup",
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

        // Upload logo if provided
        let logoUrl = ""
        if (companyData.logo) {
          const fileExt = companyData.logo.name.split('.').pop()
          const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`
          const filePath = `logos/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('logos')
            .upload(filePath, companyData.logo)
          
          if (!uploadError) {
            const { data } = supabase.storage.from('logos').getPublicUrl(filePath)
            logoUrl = data.publicUrl
          }
        }

        // Create startup profile with all data
        const slug = await createUniqueSlug(companyData.companyName)
        const { error: startupError } = await supabase.from("startups").insert({
          user_id: authData.user.id,
          company_name: companyData.companyName,
          tagline: companyData.tagline,
          description: companyData.description,
          website: companyData.website,
          founded_year: companyData.foundedYear,
          stage: companyData.stage,
          industry: companyData.industry,
          business_model: companyData.businessModel,
          logo: logoUrl,
          revenue: businessData.revenue,
          users_count: businessData.usersCount,
          growth_rate: businessData.growthRate,
          problem_statement: businessData.problemStatement,
          solution: businessData.solution,
          target_market: businessData.targetMarket,
          competitive_advantage: businessData.competitiveAdvantage,
          funding_stage: fundingData.fundingStage,
          amount_seeking: fundingData.amountSeeking,
          previous_funding: fundingData.previousFunding,
          use_of_funds: fundingData.useOfFunds,
          investor_types: fundingData.investorTypes,
          slug: slug,
          status: "pending_approval", // Immediately set to pending approval
        })

        if (startupError) {
          console.error("Error creating startup profile:", startupError)
          setError("Failed to create startup profile. Please try again.")
          setLoading(false)
          return
        }

        // Get the created startup to add team members
        const { data: startupData } = await supabase
          .from("startups")
          .select("id")
          .eq("user_id", authData.user.id)
          .single()

        if (startupData) {
          // Add team members
          const teamMembersToInsert = teamData.members
            .filter(member => member.name && member.role)
            .map(member => ({
              startup_id: startupData.id,
              name: member.name,
              role: member.role,
              email: member.email,
              linkedin: member.linkedin,
            }))

          if (teamMembersToInsert.length > 0) {
            await supabase.from("startup_team_members").insert(teamMembersToInsert)
          }
        }

        // Update user profile type
        await supabase.from("users").update({ profile_type: "startup" }).eq("id", authData.user.id)

        // Redirect to success page
        router.push("/auth/onboarding/success?type=startup")
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
              <User className="mx-auto h-12 w-12 text-blue-500 mb-4" />
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
                placeholder="john@company.com"
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
              <Building2 className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold">Company Information</h2>
              <p className="text-muted-foreground">Tell us about your startup</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={companyData.companyName}
                  onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                  placeholder="Your Company Name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={companyData.tagline}
                  onChange={(e) => setCompanyData({ ...companyData, tagline: e.target.value })}
                  placeholder="Brief description of what you do"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={companyData.description}
                  onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                  placeholder="Detailed description of your company and what you do"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={companyData.website}
                    onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                    placeholder="https://yourcompany.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="foundedYear">Founded Year</Label>
                  <Input
                    id="foundedYear"
                    type="number"
                    value={companyData.foundedYear}
                    onChange={(e) => setCompanyData({ ...companyData, foundedYear: parseInt(e.target.value) })}
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage *</Label>
                  <Select value={companyData.stage} onValueChange={(value) => setCompanyData({ ...companyData, stage: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
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
                
                <div className="space-y-2">
                  <Label htmlFor="businessModel">Business Model *</Label>
                  <Select value={companyData.businessModel} onValueChange={(value) => setCompanyData({ ...companyData, businessModel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
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
              </div>
              
              <div className="space-y-2">
                <Label>Industries *</Label>
                <Select onValueChange={addIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industries" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.filter(industry => !companyData.industry.includes(industry)).map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {companyData.industry.map((industry) => (
                    <Badge key={industry} variant="secondary" className="flex items-center gap-1">
                      {industry}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeIndustry(industry)} />
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo">Company Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                {companyData.logoPreview && (
                  <div className="mt-2">
                    <img src={companyData.logoPreview} alt="Logo preview" className="h-16 w-16 object-contain border rounded" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Rocket className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold">Business Details</h2>
              <p className="text-muted-foreground">Tell us about your business model and traction</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="problemStatement">Problem Statement *</Label>
                <Textarea
                  id="problemStatement"
                  value={businessData.problemStatement}
                  onChange={(e) => setBusinessData({ ...businessData, problemStatement: e.target.value })}
                  placeholder="What problem are you solving?"
                  rows={3}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="solution">Solution *</Label>
                <Textarea
                  id="solution"
                  value={businessData.solution}
                  onChange={(e) => setBusinessData({ ...businessData, solution: e.target.value })}
                  placeholder="How are you solving this problem?"
                  rows={3}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetMarket">Target Market *</Label>
                <Textarea
                  id="targetMarket"
                  value={businessData.targetMarket}
                  onChange={(e) => setBusinessData({ ...businessData, targetMarket: e.target.value })}
                  placeholder="Who are your customers?"
                  rows={3}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="competitiveAdvantage">Competitive Advantage</Label>
                <Textarea
                  id="competitiveAdvantage"
                  value={businessData.competitiveAdvantage}
                  onChange={(e) => setBusinessData({ ...businessData, competitiveAdvantage: e.target.value })}
                  placeholder="What makes you different from competitors?"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="revenue">Annual Revenue (USD)</Label>
                  <Input
                    id="revenue"
                    type="number"
                    value={businessData.revenue}
                    onChange={(e) => setBusinessData({ ...businessData, revenue: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="usersCount">User Count</Label>
                  <Input
                    id="usersCount"
                    type="number"
                    value={businessData.usersCount}
                    onChange={(e) => setBusinessData({ ...businessData, usersCount: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="growthRate">Monthly Growth Rate (%)</Label>
                  <Input
                    id="growthRate"
                    type="number"
                    value={businessData.growthRate}
                    onChange={(e) => setBusinessData({ ...businessData, growthRate: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <FileText className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold">Funding Information</h2>
              <p className="text-muted-foreground">Tell us about your funding needs</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fundingStage">Current Funding Stage *</Label>
                <Select value={fundingData.fundingStage} onValueChange={(value) => setFundingData({ ...fundingData, fundingStage: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select funding stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNDING_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amountSeeking">Amount Seeking (USD) *</Label>
                  <Input
                    id="amountSeeking"
                    type="number"
                    value={fundingData.amountSeeking}
                    onChange={(e) => setFundingData({ ...fundingData, amountSeeking: parseInt(e.target.value) || 0 })}
                    placeholder="500000"
                    min="0"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="previousFunding">Previous Funding (USD)</Label>
                  <Input
                    id="previousFunding"
                    type="number"
                    value={fundingData.previousFunding}
                    onChange={(e) => setFundingData({ ...fundingData, previousFunding: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="useOfFunds">Use of Funds</Label>
                <Textarea
                  id="useOfFunds"
                  value={fundingData.useOfFunds}
                  onChange={(e) => setFundingData({ ...fundingData, useOfFunds: e.target.value })}
                  placeholder="How will you use the funding?"
                  rows={4}
                />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Users className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold">Team Information</h2>
              <p className="text-muted-foreground">Tell us about your team members</p>
            </div>
            
            <div className="space-y-4">
              {teamData.members.map((member, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Team Member {index + 1}</h4>
                    {index > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTeamMember(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        value={member.name}
                        onChange={(e) => updateTeamMember(index, "name", e.target.value)}
                        placeholder="Full name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Role *</Label>
                      <Input
                        value={member.role}
                        onChange={(e) => updateTeamMember(index, "role", e.target.value)}
                        placeholder="CEO, CTO, etc."
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={member.email}
                        onChange={(e) => updateTeamMember(index, "email", e.target.value)}
                        placeholder="email@company.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>LinkedIn</Label>
                      <Input
                        value={member.linkedin}
                        onChange={(e) => updateTeamMember(index, "linkedin", e.target.value)}
                        placeholder="LinkedIn profile URL"
                      />
                    </div>
                  </div>
                </Card>
              ))}
              
              <Button variant="outline" onClick={addTeamMember}>
                Add Team Member
              </Button>
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
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary-foreground" />
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