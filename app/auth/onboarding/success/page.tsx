"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Building2, Users, ArrowRight, Clock, Mail } from "lucide-react"
import Link from "next/link"

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userType = searchParams.get("type") as "startup" | "investor"
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Countdown timer for automatic redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (userType === "startup") {
            router.push("/startup/dashboard")
          } else {
            router.push("/investor/dashboard")
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, userType])

  const handleRedirect = () => {
    if (userType === "startup") {
      router.push("/startup/dashboard")
    } else {
      router.push("/investor/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-lg border-border/40 bg-card text-center">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                {userType === "startup" ? (
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                ) : (
                  <Users className="h-5 w-5 text-primary-foreground" />
                )}
              </div>
              <span className="text-2xl font-bold text-foreground">StartupConnect</span>
            </div>
            
            <div className="space-y-4">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <CardTitle className="text-2xl font-bold text-green-600">
                Welcome to StartupConnect!
              </CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {userType === "startup" ? (
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                      Profile Under Review
                    </h3>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Your startup profile has been submitted for approval. Our team will review your application and get back to you within 24-48 hours.
                  </p>
                </div>
                
                <div className="text-left space-y-3">
                  <h4 className="font-semibold">What happens next?</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Our team will review your startup profile and verify the information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>You'll receive an email notification once your profile is approved</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Once approved, investors will be able to discover and connect with your startup</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>You can start browsing and connecting with investors immediately</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800 dark:text-green-200">
                      Profile Active
                    </h3>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your investor profile is now active! You can immediately start discovering and connecting with startups.
                  </p>
                </div>
                
                <div className="text-left space-y-3">
                  <h4 className="font-semibold">What you can do now:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Browse startups that match your investment criteria</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Save interesting startups to your wishlist</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Connect directly with startup founders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>View detailed analytics on your investment pipeline</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  Check Your Email
                </h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                We've sent a verification email to your inbox. Please verify your email address to ensure you receive important updates.
              </p>
            </div>
            
            <div className="space-y-4">
              <Button onClick={handleRedirect} className="w-full" size="lg">
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Redirecting automatically in {countdown} seconds...
              </p>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Need help? <Link href="/support" className="text-primary hover:underline">Contact our support team</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function OnboardingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
} 