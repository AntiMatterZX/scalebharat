"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Building2, Lock, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from '@/lib/utils'

function OAuthCompleteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    userType: "",
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/register')
        return
      }
      
      setUser(user)
      
      // Get stored user type from localStorage or URL
      const storedType = localStorage.getItem('pending_user_type') || searchParams.get('type') || 'startup'
      setFormData(prev => ({ ...prev, userType: storedType }))
    }
    
    getUser()
  }, [router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      // Update the user's password and metadata
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.password,
        data: {
          user_type: formData.userType,
          oauth_complete: true
        }
      })

      if (passwordError) {
        setError(passwordError.message)
        setLoading(false)
        return
      }

      // Wait a moment for the trigger to create the user record
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Create the appropriate profile based on user type
      if (formData.userType === "startup") {
        const { error: startupError } = await supabase.from("startups").insert({
          user_id: user.id,
          company_name: "My Startup",
          stage: "idea",
          industry: ["Technology"],
          business_model: "other",
          status: "draft",
        })

        if (startupError) {
          console.error("Error creating startup profile:", startupError)
        }

        // Clear stored type and route to onboarding
        localStorage.removeItem('pending_user_type')
        router.push("/onboarding/startup")
      } else if (formData.userType === "investor") {
        const { error: investorError } = await supabase.from("investors").insert({
          user_id: user.id,
          type: "angel",
          status: "active",
        })

        if (investorError) {
          console.error("Error creating investor profile:", investorError)
        }

        // Clear stored type and route to onboarding
        localStorage.removeItem('pending_user_type')
        router.push("/onboarding/investor")
      }
    } catch (err) {
      console.error("OAuth completion error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/10 flex items-center justify-center p-3">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/10 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
        <Card className="shadow-lg border-border/40 bg-card">
          <CardHeader className="text-center pb-4 px-6 sm:px-8">
            {/* Logo and Brand */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                StartupConnect
              </span>
            </div>
            
            {/* Success Message */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-600 font-medium">OAuth Sign-in Successful</span>
            </div>
            
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 leading-tight">
              Complete Your Setup
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Welcome {user.user_metadata?.full_name || user.email}! Please set a password and confirm your account type.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0 pb-6 px-6 sm:px-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="text-sm">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* User Type Confirmation */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Confirm your role:</Label>
                <RadioGroup
                  value={formData.userType}
                  onValueChange={(value) => setFormData({ ...formData, userType: value })}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <label
                    htmlFor="startup"
                    className={cn(
                      "flex items-center justify-center cursor-pointer rounded-lg border px-4 py-3 font-medium text-sm transition-all duration-200",
                      formData.userType === "startup"
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-background text-foreground border-border hover:bg-muted/50 hover:border-primary/30"
                    )}
                    tabIndex={0}
                  >
                    <RadioGroupItem value="startup" id="startup" className="sr-only" />
                    <span>Startup Founder</span>
                  </label>
                  <label
                    htmlFor="investor"
                    className={cn(
                      "flex items-center justify-center cursor-pointer rounded-lg border px-4 py-3 font-medium text-sm transition-all duration-200",
                      formData.userType === "investor"
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-background text-foreground border-border hover:bg-muted/50 hover:border-primary/30"
                    )}
                    tabIndex={0}
                  >
                    <RadioGroupItem value="investor" id="investor" className="sr-only" />
                    <span>Investor</span>
                  </label>
                </RadioGroup>
              </div>

              {/* Password Fields */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Set Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !formData.password || !formData.confirmPassword || !formData.userType}
                className="w-full h-11 text-sm font-medium"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Setting up account...</span>
                  </div>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function OAuthCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/10 flex items-center justify-center p-3">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <OAuthCompleteContent />
    </Suspense>
  )
} 