"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, TrendingUp, ArrowRight, CheckCircle, Users, Target, Rocket } from "lucide-react"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "@/components/ui/loading"
import { ProfileValidationModal, ProfileCreationModal } from "@/components/ui/profile-validation-modal"

export default function OnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedType, setSelectedType] = useState<"startup" | "investor" | null>(null)
  const [existingProfile, setExistingProfile] = useState<{type: 'startup' | 'investor', data: any} | null>(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [showCreationModal, setShowCreationModal] = useState(false)
  const [attemptedType, setAttemptedType] = useState<"startup" | "investor" | null>(null)

  // Check for existing profiles when user is available
  useEffect(() => {
    const checkExistingProfiles = async () => {
      if (!user) return

      try {
        // Check for startup profile
        const { data: startupData } = await supabase
          .from("startups")
          .select("id, company_name, status")
          .eq("user_id", user.id)
          .single()

        if (startupData) {
          setExistingProfile({ type: 'startup', data: startupData })
          return
        }

        // Check for investor profile
        const { data: investorData } = await supabase
          .from("investors")
          .select("id, name, type, status")
          .eq("user_id", user.id)
          .single()

        if (investorData) {
          setExistingProfile({ type: 'investor', data: investorData })
          return
        }
      } catch (error) {
        console.error("Error checking existing profiles:", error)
      }
    }

    checkExistingProfiles()
  }, [user])

  const handleProfileSelection = async (type: "startup" | "investor") => {
    if (!user) {
      // Redirect to registration with the selected type
      router.push(`/auth/register?type=${type}`)
      return
    }

    // Check if user already has a profile of a different type
    if (existingProfile && existingProfile.type !== type) {
      setAttemptedType(type)
      setShowValidationModal(true)
      return
    }

    // If user already has the same profile type, redirect to appropriate onboarding
    if (existingProfile && existingProfile.type === type) {
      if (type === "startup") {
        router.push("/onboarding/startup")
      } else {
        router.push("/onboarding/investor")
      }
      return
    }

    // Show creation confirmation modal for new profiles
    setAttemptedType(type)
    setShowCreationModal(true)
  }

  const handleCreateProfile = async () => {
    if (!user || !attemptedType) return

    setLoading(true)
    setError("")

    try {
      if (attemptedType === "startup") {
        // Create startup profile with required fields
        const { error: startupError } = await supabase.from("startups").insert({
          user_id: user.id,
          company_name: "My Startup", // Default name
          stage: "idea", // Required field
          industry: ["Technology"], // Required field (array)
          business_model: "other", // Required field
          status: "draft", // Default status
        })

        if (startupError) {
          console.error("Error creating startup profile:", startupError)
          setError("Failed to create startup profile. Please try again.")
          return
        }

        setExistingProfile({ type: 'startup', data: { company_name: "My Startup" } })
        setShowCreationModal(false)
        router.push("/onboarding/startup")
      } else if (attemptedType === "investor") {
        // Create investor profile with required fields
        const { error: investorError } = await supabase.from("investors").insert({
          user_id: user.id,
          type: "angel", // Required field
          status: "active", // Default status
        })

        if (investorError) {
          console.error("Error creating investor profile:", investorError)
          setError("Failed to create investor profile. Please try again.")
          return
        }

        setExistingProfile({ type: 'investor', data: { type: "angel" } })
        setShowCreationModal(false)
        router.push("/onboarding/investor")
      }
    } catch (err) {
      console.error("Profile creation error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchToDashboard = () => {
    if (existingProfile?.type === 'startup') {
      router.push('/startup/dashboard')
    } else if (existingProfile?.type === 'investor') {
      router.push('/investor/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-emerald-50 dark:from-gray-900 dark:via-blue-950 dark:to-emerald-950 flex items-center justify-center p-4">
      <div className="container-fluid max-w-6xl">
        {/* Enhanced Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-700 mb-6">
            <Rocket className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Join the startup ecosystem
            </span>
          </div>
          
          <h1 className="heading-1 mb-4 text-gradient">
            Welcome to StartupConnect!
          </h1>
          <p className="body-large text-muted-foreground max-w-2xl mx-auto">
            Choose your path and join thousands of entrepreneurs and investors building the future together
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 max-w-2xl mx-auto animate-slide-up">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Profile Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Startup Card */}
          <button
            type="button"
            className={cn(
              "w-full text-left",
              "card-interactive group relative overflow-hidden",
              "border rounded-xl p-0 bg-card transition-all duration-300",
              selectedType === "startup"
                ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 shadow-xl"
                : "border-border hover:border-blue-300 dark:hover:border-blue-700"
            )}
            onClick={() => setSelectedType("startup")}
          >
            <Card className="border-0 bg-transparent shadow-none">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <CardHeader className="text-center relative z-10 pb-6">
              <div className={cn(
                "mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300",
                selectedType === "startup"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white"
              )}>
                <Building2 className="h-10 w-10" />
              </div>
              
              <CardTitle className="text-2xl mb-3">I'm a Startup Founder</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Create your startup profile to connect with investors, showcase your vision, and secure funding
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative z-10">
              {/* Benefits List */}
              <div className="space-y-3 mb-6">
                {[
                  "Connect with verified investors",
                  "AI-powered investor matching",
                  "Pitch deck management tools",
                  "Real-time funding analytics"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              
              <Button
                className={cn(
                  "w-full group/btn",
                  selectedType === "startup"
                    ? "button-gradient"
                    : "border-2 hover:border-blue-500"
                )}
                disabled={loading}
                onClick={() => handleProfileSelection("startup")}
                variant={selectedType === "startup" ? "default" : "outline"}
              >
                {loading && selectedType === "startup" ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Continue as Startup
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </CardContent>
            </Card>
          </button>

          {/* Investor Card */}
          <button
            type="button"
            className={cn(
              "w-full text-left",
              "card-interactive group relative overflow-hidden",
              "border rounded-xl p-0 bg-card transition-all duration-300",
              selectedType === "investor"
                ? "border-green-500 bg-green-50/80 dark:bg-green-950/50 shadow-xl"
                : "border-border hover:border-green-300 dark:hover:border-green-700"
            )}
            onClick={() => setSelectedType("investor")}
          >
            <Card className="border-0 bg-transparent shadow-none">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <CardHeader className="text-center relative z-10 pb-6">
              <div className={cn(
                "mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300",
                selectedType === "investor"
                  ? "bg-green-500 text-white shadow-lg"
                  : "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 group-hover:bg-green-500 group-hover:text-white"
              )}>
                <TrendingUp className="h-10 w-10" />
              </div>
              
              <CardTitle className="text-2xl mb-3">I'm an Investor</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Discover promising startups, manage your portfolio, and make strategic investments
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative z-10">
              {/* Benefits List */}
              <div className="space-y-3 mb-6">
                {[
                  "Curated startup opportunities",
                  "Advanced filtering & search",
                  "Portfolio management tools",
                  "Due diligence resources"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              
              <Button
                className={cn(
                  "w-full group/btn",
                  selectedType === "investor"
                    ? "button-gradient-success"
                    : "border-2 hover:border-green-500"
                )}
                disabled={loading}
                onClick={() => handleProfileSelection("investor")}
                variant={selectedType === "investor" ? "default" : "outline"}
              >
                {loading && selectedType === "investor" ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Continue as Investor
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </CardContent>
            </Card>
          </button>
        </div>

        {/* Additional Information */}
        <div className="text-center animate-slide-up">
          <p className="text-sm text-muted-foreground mb-4">
            You can always update your profile and preferences later
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span>✓ Free to join</span>
            <span>✓ Secure & private</span>
            <span>✓ No hidden fees</span>
          </div>
        </div>

        {/* Validation and Creation Modals */}
        {existingProfile && attemptedType && (
          <ProfileValidationModal
            isOpen={showValidationModal}
            onClose={() => setShowValidationModal(false)}
            existingProfileType={existingProfile.type}
            attemptedProfileType={attemptedType}
            onSwitchToDashboard={handleSwitchToDashboard}
          />
        )}

        {attemptedType && (
          <ProfileCreationModal
            isOpen={showCreationModal}
            onClose={() => setShowCreationModal(false)}
            profileType={attemptedType}
            isLoading={loading}
            onConfirm={handleCreateProfile}
          />
        )}
      </div>
    </div>
  )
}
