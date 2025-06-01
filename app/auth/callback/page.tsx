"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userType = searchParams.get("type") || "startup"

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the user from the session
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Wait a moment for the trigger to create the user record
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Check if user already has a profile
          const { data: existingStartup } = await supabase.from("startups").select("id").eq("user_id", user.id).single()

          const { data: existingInvestor } = await supabase
            .from("investors")
            .select("id")
            .eq("user_id", user.id)
            .single()

          // If no profile exists, create one based on the selected type
          if (!existingStartup && !existingInvestor) {
            if (userType === "startup") {
              await supabase.from("startups").insert({
                user_id: user.id,
                company_name: "My Startup", // Default name
                stage: "idea", // Required field
                industry: ["Technology"], // Required field (array)
                business_model: "other", // Required field
                status: "draft", // Default status
              })
              router.push("/onboarding/startup")
            } else if (userType === "investor") {
              await supabase.from("investors").insert({
                user_id: user.id,
                type: "angel", // Required field
                status: "active", // Default status
              })
              router.push("/onboarding/investor")
            }
          } else {
            // User already has a profile, route to dashboard
            router.push("/dashboard")
          }
        } else {
          // No user found, redirect to login
          router.push("/auth/login")
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        router.push("/auth/login")
      }
    }

    handleCallback()
  }, [router, userType])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Setting up your account...</p>
        </CardContent>
      </Card>
    </div>
  )
}
