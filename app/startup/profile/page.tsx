"use client"

import { Badge } from "@/components/ui/badge"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUser } from "@/lib/hooks/useUser"
import { supabase } from "@/lib/supabase"
import { Loader2, Edit3, Building2, Users, FileText, DollarSign, Info, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/types/database"

type StartupProfile = Database["public"]["Tables"]["startups"]["Row"]
type StartupTeamMember = Database["public"]["Tables"]["startup_team_members"]["Row"]
type StartupDocument = Database["public"]["Tables"]["startup_documents"]["Row"]

// Helper to display data nicely
const DataDisplayItem = ({ label, value, className }: { label: string; value: any; className?: string }) => {
  if (
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0) ||
    String(value).trim() === ""
  ) {
    return (
      <div className={`mb-3 ${className}`}>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">Not provided</p>
      </div>
    )
  }
  return (
    <div className={`mb-3 ${className}`}>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
        {Array.isArray(value) ? value.join(", ") : String(value)}
      </p>
    </div>
  )
}

export default function StartupProfilePage() {
  const { user, isLoading: userLoading } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [startupProfile, setStartupProfile] = useState<StartupProfile | null>(null)
  const [teamMembers, setTeamMembers] = useState<StartupTeamMember[]>([])
  const [documents, setDocuments] = useState<StartupDocument[]>([])

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) {
        if (!userLoading) setLoading(false)
        return
      }
      try {
        setLoading(true)
        const { data: profile, error: profileError } = await supabase
          .from("startups")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (profileError || !profile) {
          setError(profileError?.message || "Startup profile not found. Please complete onboarding.")
          setLoading(false)
          return
        }
        setStartupProfile(profile)

        const { data: team, error: teamError } = await supabase
          .from("startup_team_members")
          .select("*")
          .eq("startup_id", profile.id)
        if (teamError) console.warn("Error loading team members:", teamError.message)
        setTeamMembers(team || [])

        const { data: docs, error: docsError } = await supabase
          .from("startup_documents")
          .select("*")
          .eq("startup_id", profile.id)
        if (docsError) console.warn("Error loading documents:", docsError.message)
        setDocuments(docs || [])
      } catch (err: any) {
        console.error("Error loading profile data:", err)
        setError(err.message || "Failed to load profile data.")
      } finally {
        setLoading(false)
      }
    }
    if (!userLoading) loadProfileData()
  }, [user, userLoading])

  if (loading || userLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          {error.includes("not found") && (
            <Button asChild className="mt-2 ml-2">
              <Link href="/onboarding/startup">Complete Profile</Link>
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (!startupProfile) {
    return (
      <div className="text-center py-10">
        <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">Startup profile not available.</p>
        <Button asChild className="mt-4">
          <Link href="/onboarding/startup">Setup Your Profile</Link>
        </Button>
      </div>
    )
  }

  const editSectionPath = (section: string) => `/onboarding/startup/${section}`

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Startup Profile</h1>
        <Button variant="outline" asChild>
          <Link href={`/startups/${startupProfile.slug || startupProfile.id}`} target="_blank">
            View Public Profile
          </Link>
        </Button>
      </div>

      {startupProfile.banner_image && (
        <div className="w-full h-48 md:h-64 rounded-lg overflow-hidden mb-6">
          <img
            src={startupProfile.banner_image}
            alt="Banner"
            className="object-cover w-full h-full"
          />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
            <CardDescription>Core details about your company.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={editSectionPath("")}>
              <Edit3 className="mr-1 h-3 w-3" />
              Edit
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-x-6 gap-y-2">
          <DataDisplayItem label="Company Name" value={startupProfile.company_name} />
          <DataDisplayItem label="Tagline" value={startupProfile.tagline} />
          <DataDisplayItem label="Website" value={startupProfile.website} />
          <DataDisplayItem label="Founded Year" value={startupProfile.founded_year} />
          <DataDisplayItem label="Description" value={startupProfile.description} className="md:col-span-2" />
          {startupProfile.logo && (
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Logo</p>
              <img
                src={startupProfile.logo || "/placeholder.svg"}
                alt={`${startupProfile.company_name} logo`}
                className="h-20 w-auto rounded border p-1 bg-muted"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5 text-primary" />
              Company Details
            </CardTitle>
            <CardDescription>Operational and market information.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={editSectionPath("company")}>
              <Edit3 className="mr-1 h-3 w-3" />
              Edit
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-x-6 gap-y-2">
          <DataDisplayItem label="Stage" value={startupProfile.stage} />
          <DataDisplayItem label="Industries" value={startupProfile.industry} />
          <DataDisplayItem label="Business Model" value={startupProfile.business_model} />
          <DataDisplayItem label="Annual Revenue (USD)" value={startupProfile.revenue?.toLocaleString()} />
          <DataDisplayItem label="Number of Users/Customers" value={startupProfile.users_count?.toLocaleString()} />
          <DataDisplayItem label="Growth Rate (%)" value={startupProfile.growth_rate} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-primary" />
              Funding Information
            </CardTitle>
            <CardDescription>Details about your funding status and goals.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={editSectionPath("funding")}>
              <Edit3 className="mr-1 h-3 w-3" />
              Edit
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-x-6 gap-y-2">
          <DataDisplayItem label="Current Funding Round" value={startupProfile.current_round} />
          <DataDisplayItem label="Total Raised (USD)" value={startupProfile.total_raised?.toLocaleString()} />
          <DataDisplayItem label="Target Amount (USD)" value={startupProfile.target_amount?.toLocaleString()} />
          <DataDisplayItem label="Valuation (USD)" value={startupProfile.valuation?.toLocaleString()} />
          <DataDisplayItem label="Previous Investors" value={startupProfile.previous_investors} />
          <DataDisplayItem label="Equity Offered (%)" value={startupProfile.equity_percentage_offered} />
          <DataDisplayItem label="Fundraising Timeline (Months)" value={startupProfile.fundraising_timeline_months} />
          <DataDisplayItem label="Monthly Burn Rate (USD)" value={startupProfile.burn_rate?.toLocaleString()} />
          <DataDisplayItem
            label="Planned Use of Funds"
            value={startupProfile.planned_use_of_funds}
            className="md:col-span-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              Team Members
            </CardTitle>
            <CardDescription>Information about your core team.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={editSectionPath("team")}>
              <Edit3 className="mr-1 h-3 w-3" />
              Edit
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <div key={member.id} className="mb-4 pb-4 border-b last:border-b-0 last:pb-0">
                <h4 className="font-semibold">
                  {member.name} - <span className="text-sm font-normal text-muted-foreground">{member.role}</span>
                </h4>
                {member.bio && <p className="text-sm text-muted-foreground mt-1">{member.bio}</p>}
                {member.linkedin_url && (
                  <a
                    href={member.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    LinkedIn Profile
                  </a>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No team members added yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Documents
            </CardTitle>
            <CardDescription>Your uploaded pitch deck, financials, etc.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={editSectionPath("documents")}>
              <Edit3 className="mr-1 h-3 w-3" />
              Edit
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    {doc.file_name}
                  </a>
                  <Badge variant="secondary" className="capitalize">
                    {doc.document_type.replace("_", " ")}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No documents uploaded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
