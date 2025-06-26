"use client"

import * as React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Building2, Mail, Lock, User, ArrowRight, Github, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from '@/lib/utils'
import { ProfileValidationModal } from "@/components/ui/profile-validation-modal"

function RegisterSelection() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialType = searchParams.get("type") || null

  useEffect(() => {
    // If a type is specified, redirect to the new onboarding flow
    if (initialType) {
      router.push(`/auth/onboarding/${initialType}`)
    }
  }, [initialType, router])

  const handleSelection = (type: "startup" | "investor") => {
    router.push(`/auth/onboarding/${type}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/10 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-4xl">
        <Card className="shadow-lg border-border/40 bg-card">
          <CardHeader className="text-center pb-8 px-6 sm:px-8">
            {/* Logo and Brand */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-2xl md:text-3xl font-bold text-foreground">
                StartupConnect
              </span>
            </div>

            <CardTitle className="text-3xl md:text-4xl font-bold mb-4">
              Join the Future of Innovation
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Complete your profile setup and create your account in one seamless flow. 
              Your profile will be ready for approval immediately after signup.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Startup Card */}
              <button
                type="button"
                className={cn(
                  "w-full text-left",
                  "group relative overflow-hidden",
                  "border-2 rounded-xl p-6 bg-card transition-all duration-300",
                  "border-border hover:border-blue-300 dark:hover:border-blue-700",
                  "hover:shadow-lg hover:scale-[1.02]"
                )}
                onClick={() => handleSelection("startup")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">I'm a Startup</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete your company profile, team details, and funding information. 
                    Get matched with the right investors for your business.
                  </p>
                  
                  <div className="flex items-center text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                    <span className="text-sm font-medium">Complete Startup Profile</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </button>

              {/* Investor Card */}
              <button
                type="button"
                className={cn(
                  "w-full text-left",
                  "group relative overflow-hidden",
                  "border-2 rounded-xl p-6 bg-card transition-all duration-300",
                  "border-border hover:border-green-300 dark:hover:border-green-700",
                  "hover:shadow-lg hover:scale-[1.02]"
                )}
                onClick={() => handleSelection("investor")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">I'm an Investor</h3>
                  <p className="text-muted-foreground mb-4">
                    Set up your investment criteria, portfolio details, and preferences. 
                    Discover promising startups that match your investment thesis.
                  </p>
                  
                  <div className="flex items-center text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform">
                    <span className="text-sm font-medium">Complete Investor Profile</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <RegisterSelection />
    </Suspense>
  )
}
