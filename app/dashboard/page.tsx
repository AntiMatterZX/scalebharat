"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser } from "@/lib/hooks/useUser"
import { supabase } from "@/lib/supabase"
import { AlertCircle, ArrowRight, Building2, Users } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import type { Database } from "@/types/database" // Ensure this path is correct

export default function DashboardPage() {
  const { user, session, isLoading: userLoading } = useUser()
  const router = useRouter()
  const [profileType, setProfileType] = useState<string | null>(null)
  const [profileStatus, setProfileStatus] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const [redirectAttempted, setRedirectAttempted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startupData, setStartupData] = useState<Database["public"]["Tables"]["startups"]["Row"] | null>(null)
  const [investorData, setInvestorData] = useState<Database["public"]["Tables"]["investors"]["Row"] | null>(null)

  const [profileCompletionSteps, setProfileCompletionSteps] = useState<
    { name: string; completed: boolean; url: string }[]
  >([])
  const [completionPercentage, setCompletionPercentage] = useState(0)

  useEffect(() => {
    if (userLoading) return

    if (!session) {
      router.push("/auth/login")
      return
    }

    const checkProfileStatus = async () => {
      if (!user) {
        // Added a check for user object
        setIsLoading(false)
        return
      }
      try {
        setIsLoading(true)
        setError(null) // Reset error on new fetch

        // Fetch full startup profile if it exists
        const { data: startup, error: startupError } = await supabase
          .from("startups")
          .select("*") // Fetch all columns
          .eq("user_id", user.id)
          .single()

        // Fetch full investor profile if it exists
        const { data: investor, error: investorError } = await supabase
          .from("investors")
          .select("*") // Fetch all columns
          .eq("user_id", user.id)
          .single()

        console.log("Fetched startup data:", startup)
        console.log("Fetched investor data:", investor)

        if ((!startup || startupError?.code === "PGRST116") && (!investor || investorError?.code === "PGRST116")) {
          // PGRST116: no rows returned
          console.log("No profile found, will redirect to onboarding")
          setProfileType(null)
          setProfileStatus(null)
          setIsComplete(false)
          setStartupData(null)
          setInvestorData(null)
          setIsLoading(false)
          return
        }

        if (startup) {
          setProfileType("startup")
          setProfileStatus(startup.status as string)
          // isComplete will be determined by the status field primarily,
          // but completion percentage will use detailed fields.
          setIsComplete(startup.status === "published" || startup.status === "active")
          setStartupData(startup)
          setInvestorData(null)
        } else if (investor) {
          setProfileType("investor")
          setProfileStatus(investor.status as string)
          setIsComplete(investor.status === "active")
          setInvestorData(investor)
          setStartupData(null)
        }
        setIsLoading(false)
      } catch (error) {
        console.error("Error checking profile status:", error)
        setError("Failed to load profile information. Please try again.")
        setIsLoading(false)
      }
    }

    checkProfileStatus()
  }, [user, session, userLoading, router])

  // Remove the old useEffect for profileCompletionSteps and completionPercentage.
  // Replace it with this new useEffect that depends on startupData and investorData.
  useEffect(() => {
    if (!profileType || (!startupData && !investorData)) {
      setProfileCompletionSteps([])
      setCompletionPercentage(0)
      return
    }

    let steps: { name: string; completed: boolean; url: string }[] = []
    let completedCount = 0

    if (profileType === "startup" && startupData) {
      const sData = startupData
      steps = [
        {
          name: "Basic Information",
          completed: !!(sData.company_name && sData.tagline && sData.description && sData.logo && sData.website),
          url: "/onboarding/startup",
        },
        {
          name: "Company Details",
          completed: !!(sData.founded_year && sData.stage && sData.industry?.length > 0 && sData.business_model),
          url: "/onboarding/startup/company",
        },
        // Assuming team members are checked by existence in a separate table, for now, let's mark it based on a placeholder or a specific field if you add one.
        // For simplicity, we'll assume it's completed if basic info is done, or you can add a specific check.
        // This part needs actual data from startup_team_members table to be accurate.
        // For now, let's make it dependent on company details.
        { name: "Team Members", completed: !!(sData.founded_year && sData.stage), url: "/onboarding/startup/team" }, // Placeholder logic
        {
          name: "Funding Information",
          completed: !!(
            sData.current_round &&
            sData.target_amount &&
            sData.total_raised !== null &&
            sData.valuation !== null
          ),
          url: "/onboarding/startup/funding",
        },
        // Similar to team members, document completion needs checking the startup_documents table.
        // For now, let's make it dependent on funding info.
        {
          name: "Upload Documents",
          completed: !!(sData.current_round && sData.target_amount),
          url: "/onboarding/startup/documents",
        }, // Placeholder logic
      ]
    } else if (profileType === "investor" && investorData) {
      const iData = investorData
      steps = [
        {
          name: "Basic Information",
          completed: !!(iData.type && iData.firm_name && iData.bio && iData.website),
          url: "/onboarding/investor",
        },
        {
          name: "Investment Preferences",
          completed: !!(
            iData.investment_stages?.length > 0 &&
            iData.investment_industries?.length > 0 &&
            iData.check_size_min !== null &&
            iData.check_size_max !== null
          ),
          url: "/onboarding/investor/preferences",
        },
        // Portfolio and Verification would also need specific checks, potentially against other tables or specific fields.
        {
          name: "Portfolio",
          completed: !!(iData.investment_stages?.length > 0),
          url: "/onboarding/investor/portfolio",
        }, // Placeholder logic
        { name: "Verification", completed: false, url: "/onboarding/investor/verification" }, // Placeholder logic, verification is often a manual or document-based step
      ]
    }

    steps.forEach((step) => {
      if (step.completed) {
        completedCount++
      }
    })

    setProfileCompletionSteps(steps)
    if (steps.length > 0) {
      setCompletionPercentage(Math.round((completedCount / steps.length) * 100))
    } else {
      setCompletionPercentage(0)
    }
  }, [profileType, startupData, investorData])

  // The rest of the component (redirect logic, rendering) remains largely the same.
  // Ensure the redirect logic correctly uses `isComplete` which is now set based on profile `status`.
  // The UI for incomplete profiles will now use the dynamically calculated `completionPercentage` and `profileCompletionSteps`.

  // In the redirect useEffect, ensure `isComplete` is used for redirection to specific dashboards
  useEffect(() => {
    if (isLoading || redirectAttempted || !profileType) return // Added !profileType check

    // If profile is complete (status is 'active' or 'published'), redirect to the appropriate dashboard
    if (isComplete) {
      console.log(`Profile is complete, redirecting to /${profileType}/dashboard`)
      router.push(`/${profileType}/dashboard`)
      setRedirectAttempted(true)
      return
    }

    // If profile status indicates onboarding is not finished (e.g. 'draft', 'pending')
    // and it's not yet complete, keep them on this page or redirect to specific onboarding step.
    // The current logic already shows the completion UI if !isComplete.
    // If no profileType, it means it's still loading or user needs to go to /onboarding.
    if (!profileType && !isLoading) {
      console.log("No profile type after loading, redirecting to /onboarding")
      router.push("/onboarding")
      setRedirectAttempted(true)
      return
    }
  }, [profileType, profileStatus, isLoading, router, redirectAttempted, isComplete])

  // Loading state
  if (userLoading || isLoading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-5">Dashboard</h1>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-5">Dashboard</h1>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <p className="text-red-500">{error}</p>
            </div>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not logged in
  if (!session) {
    return null
  }

  // No profile yet
  if (!profileType) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-5">Welcome to StartupConnect</h1>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create Your Profile</CardTitle>
            <CardDescription>
              To get started, please create your profile as either a startup or an investor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 hover:border-primary cursor-pointer transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Building2 className="h-12 w-12 mb-4 text-primary" />
                    <h3 className="text-lg font-medium mb-2">I'm a Startup</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a profile for your startup to connect with potential investors.
                    </p>
                    <Link href="/onboarding/startup">
                      <Button>Create Startup Profile</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary cursor-pointer transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Users className="h-12 w-12 mb-4 text-primary" />
                    <h3 className="text-lg font-medium mb-2">I'm an Investor</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create an investor profile to discover promising startups.
                    </p>
                    <Link href="/onboarding/investor">
                      <Button>Create Investor Profile</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If profile is not complete, show profile completion guidance
  if (!isComplete) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-5">Complete Your Profile</h1>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start space-x-4">
              <AlertCircle className="h-6 w-6 text-amber-500 mt-1" />
              <div>
                <CardTitle>Your profile is incomplete</CardTitle>
                <CardDescription>
                  Complete your profile to access your dashboard and get matched with{" "}
                  {profileType === "startup" ? "investors" : "startups"}.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Profile Completion</span>
                <span className="text-sm font-medium">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Next steps to complete your profile:</h3>
              <div className="space-y-2">
                {profileCompletionSteps.map((step, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${step.completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}
                      >
                        {step.completed ? "✓" : index + 1}
                      </div>
                      <span>{step.name}</span>
                    </div>
                    <Link href={step.url}>
                      <Button variant={step.completed ? "outline" : "default"} size="sm">
                        {step.completed ? "Edit" : "Complete"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <Link href={profileType === "startup" ? "/onboarding/startup" : "/onboarding/investor"}>
                <Button className="w-full">Continue Profile Setup</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Why complete your profile?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Get Matched</h3>
                <p className="text-sm text-muted-foreground">
                  Our algorithm matches{" "}
                  {profileType === "startup" ? "startups with investors" : "investors with startups"} based on your
                  profile information.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Build Credibility</h3>
                <p className="text-sm text-muted-foreground">
                  A complete profile builds trust and credibility with potential{" "}
                  {profileType === "startup" ? "investors" : "startups"}.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Access All Features</h3>
                <p className="text-sm text-muted-foreground">
                  Unlock all platform features including messaging, analytics, and more.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fallback dashboard view (should not reach here due to redirects)
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-5">Dashboard</h1>
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-10">
            <p className="text-lg mb-4">If you're seeing this page, please click below to go to your dashboard:</p>
            <div className="flex justify-center space-x-4">
              <Link href={`/${profileType}/dashboard`}>
                <Button>Go to {profileType} Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
