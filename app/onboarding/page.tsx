"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, TrendingUp } from "lucide-react"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export default function OnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedType, setSelectedType] = useState<"startup" | "investor" | null>(null)

  const handleProfileSelection = async (type: "startup" | "investor") => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Check if profile already exists
      if (type === "startup") {
        const { data: existingStartup } = await supabase.from("startups").select("id").eq("user_id", user.id).single()

        if (existingStartup) {
          router.push("/onboarding/startup")
          return
        }

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
          console.error("Startup creation error:", startupError)
          setError(`Failed to create startup profile: ${startupError.message}`)
          return
        }

        router.push("/onboarding/startup")
      } else {
        const { data: existingInvestor } = await supabase.from("investors").select("id").eq("user_id", user.id).single()

        if (existingInvestor) {
          router.push("/onboarding/investor")
          return
        }

        // Create investor profile with required fields
        const { error: investorError } = await supabase.from("investors").insert({
          user_id: user.id,
          type: "angel", // Required field
          status: "active", // Default status
        })

        if (investorError) {
          console.error("Investor creation error:", investorError)
          setError(`Failed to create investor profile: ${investorError.message}`)
          return
        }

        router.push("/onboarding/investor")
      }
    } catch (err) {
      console.error("Profile creation error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to StartupConnect!</h1>
          <p className="text-lg text-gray-600">Please select your profile type to continue</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className={cn(
              "hover:shadow-lg transition-shadow cursor-pointer border-2",
              selectedType === "startup"
                ? "border-blue-600 bg-blue-50/60"
                : "border-transparent bg-white/10"
            )}
            onClick={() => setSelectedType("startup")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>I'm a Startup Founder</CardTitle>
              <CardDescription>
                Create a startup profile to connect with investors and grow your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                disabled={loading || selectedType !== "startup"}
                onClick={() => handleProfileSelection("startup")}
                variant={selectedType === "startup" ? "default" : "outline"}
              >
                {loading && selectedType === "startup"
                  ? "Creating Profile..."
                  : "Continue as Startup"}
              </Button>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "hover:shadow-lg transition-shadow cursor-pointer border-2",
              selectedType === "investor"
                ? "border-green-600 bg-green-50/60"
                : "border-transparent bg-white/10"
            )}
            onClick={() => setSelectedType("investor")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>I'm an Investor</CardTitle>
              <CardDescription>Create an investor profile to discover and invest in promising startups</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant={selectedType === "investor" ? "default" : "outline"}
                disabled={loading || selectedType !== "investor"}
                onClick={() => handleProfileSelection("investor")}
              >
                {loading && selectedType === "investor"
                  ? "Creating Profile..."
                  : "Continue as Investor"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
