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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">StartupConnect</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {type === "startup" ? "Create Your Startup Profile" : "Create Your Investor Profile"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {currentStep?.title || "Complete your profile to get matched"}
            </p>
            <div className="mt-4">
              <Progress value={currentStep?.progress || 0} className="h-2" />
              <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                {steps.map((step, index) => (
                  <div key={index} className="text-center flex-1">
                    <div
                      className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                        index === currentStepIndex
                          ? "bg-primary"
                          : index < currentStepIndex
                            ? "bg-primary-300" // Completed step
                            : "bg-gray-300 dark:bg-gray-600" // Future step
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
