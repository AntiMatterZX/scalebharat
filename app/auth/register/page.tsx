"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Building2, Mail, Lock, User, ArrowRight, Github } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from '@/lib/utils'
import { ProfileValidationModal } from "@/components/ui/profile-validation-modal"

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get("type") || "startup"

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    userType: initialType,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [existingProfile, setExistingProfile] = useState<{type: 'startup' | 'investor', data: any} | null>(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const router = useRouter()

  // Check for existing profiles when user tries to register
  const checkExistingProfiles = async (email: string) => {
    try {
      // First check if user exists
      const { data: userData } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'dummy' // This will fail but we just want to check if user exists
      })
    } catch (error: any) {
      if (error.message?.includes('Invalid login credentials')) {
        // User doesn't exist, safe to proceed
        return null
      }
    }

    // If we get here, user might exist, let's check profiles
    try {
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (users) {
        // Check for startup profile
        const { data: startupData } = await supabase
          .from("startups")
          .select("id, company_name, status")
          .eq("user_id", users.id)
          .single()

        if (startupData) {
          return { type: 'startup' as const, data: startupData }
        }

        // Check for investor profile
        const { data: investorData } = await supabase
          .from("investors")
          .select("id, name, type, status")
          .eq("user_id", users.id)
          .single()

        if (investorData) {
          return { type: 'investor' as const, data: investorData }
        }
      }
    } catch (error) {
      console.error("Error checking existing profiles:", error)
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Check for existing profiles with different type
      const existingProfileCheck = await checkExistingProfiles(formData.email)
      if (existingProfileCheck && existingProfileCheck.type !== formData.userType) {
        setExistingProfile(existingProfileCheck)
        setShowValidationModal(true)
        setLoading(false)
        return
      }

      // Sign up the user with metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            user_type: formData.userType,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.user) {
        // Wait a moment for the trigger to create the user record
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Create the appropriate profile based on user type
        if (formData.userType === "startup") {
          const { error: startupError } = await supabase.from("startups").insert({
            user_id: data.user.id,
            company_name: "My Startup", // Default name
            stage: "idea", // Required field
            industry: ["Technology"], // Required field (array)
            business_model: "other", // Required field
            status: "draft", // Default status
          })

          if (startupError) {
            console.error("Error creating startup profile:", startupError)
            // Continue anyway - user can complete profile later
          }

          // Route to startup onboarding
          router.push("/onboarding/startup")
        } else if (formData.userType === "investor") {
          const { error: investorError } = await supabase.from("investors").insert({
            user_id: data.user.id,
            type: "angel", // Required field
            status: "active", // Default status
          })

          if (investorError) {
            console.error("Error creating investor profile:", investorError)
            // Continue anyway - user can complete profile later
          }

          // Route to investor onboarding
          router.push("/onboarding/investor")
        } else {
          // Default to dashboard if no specific type
          router.push("/dashboard")
        }
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("An unexpected error occurred during registration")
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignUp = async (provider: 'google' | 'github') => {
    try {
      // Store user type in localStorage before OAuth redirect
      localStorage.setItem('pending_user_type', formData.userType)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?type=${formData.userType}&oauth=true`,
        },
      })
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError(`Failed to sign up with ${provider === 'google' ? 'Google' : 'GitHub'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/10 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
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
            
            {/* Headlines */}
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 leading-tight">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Join the platform connecting startups with investors
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

              {/* User Type Selection - Mobile Optimized */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">I am a:</Label>
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

              {/* Name Fields - Mobile Optimized */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </Label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="pl-10 h-11 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="h-11 text-sm"
                  required
                />
              </div>
            </div>

              {/* Email Field */}
            <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
              <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-11 text-sm"
                  required
                />
              </div>
            </div>

              {/* Password Field */}
            <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
              <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 h-11 text-sm"
                  required
                  minLength={6}
                />
              </div>
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters long
                </p>
            </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-11 text-sm font-medium" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
            </Button>
          </form>

            {/* Divider */}
            <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">
                    Or sign up with
                  </span>
                </div>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <Button 
                variant="outline" 
                className="h-11 text-sm font-medium" 
                onClick={() => handleOAuthSignUp('google')}
              >
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
                  <span className="hidden sm:inline">Google</span>
                  <span className="sm:hidden">Google</span>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="h-11 text-sm font-medium" 
                onClick={() => handleOAuthSignUp('github')}
              >
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  <span className="hidden sm:inline">GitHub</span>
                  <span className="sm:hidden">GitHub</span>
                </div>
            </Button>
          </div>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link 
                  href="/auth/login" 
                  className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 font-medium"
                >
                  Sign in here
            </Link>
              </p>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Profile Validation Modal */}
      {existingProfile && (
        <ProfileValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          existingProfileType={existingProfile.type}
          attemptedProfileType={formData.userType as 'startup' | 'investor'}
          onSwitchToDashboard={() => {
            if (existingProfile.type === 'startup') {
              router.push('/startup/dashboard')
            } else {
              router.push('/investor/dashboard')
            }
          }}
        />
      )}
    </div>
  )
}
