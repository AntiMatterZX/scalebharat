"use client"

import type React from "react"

import { useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Building2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/components/providers"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface OnboardingStep {
  title: string
  path: string
  progress: number
}

interface OnboardingLayoutProps {
  children: React.ReactNode
  type: "startup" | "investor"
}

export function OnboardingLayout({ children, type }: OnboardingLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const startupSteps = useMemo<OnboardingStep[]>(
    () => [
      { title: "Basic Info", path: "/onboarding/startup", progress: 16 },
      { title: "Company Details", path: "/onboarding/startup/company", progress: 32 },
      { title: "Team", path: "/onboarding/startup/team", progress: 48 },
      { title: "Funding", path: "/onboarding/startup/funding", progress: 64 },
      { title: "Documents", path: "/onboarding/startup/documents", progress: 80 },
      { title: "Review", path: "/onboarding/startup/review", progress: 100 },
    ],
    [],
  )

  const investorSteps = useMemo<OnboardingStep[]>(
    // Placeholder, will be updated later
    () => [
      { title: "Basic Info", path: "/onboarding/investor", progress: 20 },
      { title: "Preferences", path: "/onboarding/investor/preferences", progress: 40 },
      { title: "Portfolio", path: "/onboarding/investor/portfolio", progress: 60 },
      { title: "Verification", path: "/onboarding/investor/verification", progress: 80 },
      { title: "Review", path: "/onboarding/investor/review", progress: 100 },
    ],
    [],
  )

  const steps = useMemo(() => (type === "startup" ? startupSteps : investorSteps), [type, startupSteps, investorSteps])
  const currentStep = useMemo(() => {
    if (!pathname) return null
    return steps.find((step) => pathname === step.path) || null
  }, [pathname, steps])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  const currentStepIndex = pathname ? steps.findIndex((step) => step.path === pathname) : -1

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
      <header className="bg-card border-b border-border transition-colors duration-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold text-foreground">StartupConnect</span>
          </Link>
          <div className="flex items-center space-x-3">
            <ThemeToggle variant="ghost" size="sm" />
            
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {type === "startup" ? "Create Your Startup Profile" : "Create Your Investor Profile"}
            </h1>
            <p className="text-muted-foreground">
              {currentStep?.title || "Complete your profile to get matched"}
            </p>
            <div className="mt-4">
              <Progress value={currentStep?.progress || 0} className="h-2" />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                {steps.map((step, index) => (
                  <div key={index} className="text-center flex-1">
                    <div
                      className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                        index === currentStepIndex
                          ? "bg-primary"
                          : index < currentStepIndex
                            ? "bg-primary-300" // Completed step
                            : "bg-muted" // Future step
                      }`}
                    />
                    <span className="text-xs hidden sm:block">{step.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
