"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { useAuth } from "@/components/providers"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Loader2, CheckCircle, FileText } from "lucide-react"

// Helper to display data nicely
const DataDisplayItem = ({ label, value }: { label: string; value: any }) => {
  if (value === null || value === undefined || (Array.isArray(value) && value.length === 0) || value === "") {
    return null
  }
  return (
    <div className="mb-2">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-gray-800 dark:text-gray-200">{Array.isArray(value) ? value.join(", ") : String(value)}</p>
    </div>
  )
}

export default function StartupReviewPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [startupProfile, setStartupProfile] = useState<any>(null)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        const { data: profile, error: profileError } = await supabase
          .from("startups")
          .select("*")
          .eq("user_id", user.id)
          .single()
        if (profileError) throw profileError
        setStartupProfile(profile)

        if (profile) {
          const { data: team, error: teamError } = await supabase
            .from("startup_team_members")
            .select("*")
            .eq("startup_id", profile.id)
          if (teamError) throw teamError
          setTeamMembers(team || [])

          const { data: docs, error: docsError } = await supabase
            .from("startup_documents")
            .select("*")
            .eq("startup_id", profile.id)
          if (docsError) throw docsError
          setDocuments(docs || [])
        }
      } catch (err: any) {
        console.error("Error loading profile data for review:", err)
        setError(err.message || "Failed to load profile data.")
      } finally {
        setLoading(false)
      }
    }
    loadProfileData()
  }, [user])

  const handleSubmitProfile = async () => {
    setSubmitting(true)
    setError("")
    if (!user || !startupProfile) {
      setError("Profile data not found.")
      setSubmitting(false)
      return
    }

    try {
      const { error: updateError } = await supabase
        .from("startups")
        .update({ status: "pending_approval", updated_at: new Date().toISOString() }) // Changed status
        .eq("id", startupProfile.id)

      if (updateError) throw updateError

      // Also update the user's profile_type if it's not set
      await supabase.from("users").update({ profile_type: "startup" }).eq("id", user.id)

      toast({
        title: "Profile Submitted for Review!", // Updated toast message
        description: "Your startup profile has been submitted and is pending approval by our team.",
        variant: "success",
        duration: 5000,
      })
      // Redirect to a page indicating pending approval or back to a generic dashboard
      // For now, let's redirect to the startup dashboard, which should ideally show a "pending approval" state.
      router.push("/startup/dashboard")
    } catch (err: any) {
      console.error("Error submitting profile:", err)
      setError(err.message || "Failed to submit profile.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <OnboardingLayout type="startup">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </OnboardingLayout>
    )
  }

  if (error) {
    return (
      <OnboardingLayout type="startup">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </OnboardingLayout>
    )
  }

  if (!startupProfile) {
    return (
      <OnboardingLayout type="startup">
        <Alert variant="destructive">
          <AlertDescription>
            Could not load startup profile data. Please go back and ensure all steps are completed.
          </AlertDescription>
          <Button onClick={() => router.push("/onboarding/startup")} className="mt-2">
            Go to First Step
          </Button>
        </Alert>
      </OnboardingLayout>
    )
  }

  return (
    <OnboardingLayout type="startup">
      <div className="space-y-8">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
          <h2 className="text-2xl font-semibold">Review Your Startup Profile</h2>
          <p className="text-muted-foreground">
            Please review all the information carefully before submitting for approval.
          </p>
        </div>

        {/* ... (rest of the DataDisplayItem cards remain the same) ... */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push("/onboarding/startup")}>
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <DataDisplayItem label="Company Name" value={startupProfile.company_name} />
            <DataDisplayItem label="Tagline" value={startupProfile.tagline} />
            <DataDisplayItem label="Description" value={startupProfile.description} />
            <DataDisplayItem label="Website" value={startupProfile.website} />
            {startupProfile.logo && (
              <DataDisplayItem
                label="Logo"
                value={
                  <img
                    src={startupProfile.logo || "/placeholder.svg"}
                    alt="logo"
                    className="h-16 w-16 object-contain border rounded mt-1"
                  />
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push("/onboarding/startup/company")}>
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <DataDisplayItem label="Founded Year" value={startupProfile.founded_year} />
            <DataDisplayItem label="Stage" value={startupProfile.stage} />
            <DataDisplayItem label="Industries" value={startupProfile.industry} />
            <DataDisplayItem label="Business Model" value={startupProfile.business_model} />
            <DataDisplayItem label="Annual Revenue (USD)" value={startupProfile.revenue?.toLocaleString()} />
            <DataDisplayItem label="Number of Users" value={startupProfile.users_count?.toLocaleString()} />
            <DataDisplayItem label="Growth Rate (%)" value={startupProfile.growth_rate} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push("/onboarding/startup/team")}>
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            {teamMembers.length > 0 ? (
              teamMembers.map((member, idx) => (
                <div key={idx} className="mb-3 pb-3 border-b last:border-b-0 last:pb-0 last:mb-0">
                  <p className="font-semibold">
                    {member.name} - <span className="font-normal text-sm">{member.role}</span>
                  </p>
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      LinkedIn
                    </a>
                  )}
                  {member.bio && <p className="text-xs text-muted-foreground mt-1">{member.bio}</p>}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No team members added.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funding Information</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push("/onboarding/startup/funding")}>
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <DataDisplayItem label="Current Funding Stage" value={startupProfile.current_round} />
            <DataDisplayItem label="Total Raised (USD)" value={startupProfile.total_raised?.toLocaleString()} />
            <DataDisplayItem label="Current Valuation (USD)" value={startupProfile.valuation?.toLocaleString()} />
            <DataDisplayItem label="Previous Investors" value={startupProfile.previous_investors} />
            <DataDisplayItem label="Target Raise (USD)" value={startupProfile.target_amount?.toLocaleString()} />
            <DataDisplayItem label="Equity Offered (%)" value={startupProfile.equity_percentage_offered} />
            <DataDisplayItem label="Use of Funds" value={startupProfile.planned_use_of_funds} />
            <DataDisplayItem label="Fundraising Timeline (Months)" value={startupProfile.fundraising_timeline_months} />
            <DataDisplayItem label="Monthly Revenue (USD)" value={startupProfile.revenue?.toLocaleString()} />{" "}
            {/* Assuming 'revenue' is monthly for this display */}
            <DataDisplayItem label="Monthly Burn Rate (USD)" value={startupProfile.burn_rate?.toLocaleString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push("/onboarding/startup/documents")}>
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            {documents.length > 0 ? (
              documents.map((doc, idx) => (
                <div key={idx} className="mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {doc.file_name}
                  </a>
                  <span className="ml-2 text-xs text-muted-foreground">({doc.document_type.replace("_", " ")})</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No documents uploaded.</p>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end pt-6">
          <Button size="lg" onClick={handleSubmitProfile} disabled={submitting || loading}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit for Approval
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  )
}
