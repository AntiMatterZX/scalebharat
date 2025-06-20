"use client"

import { Badge } from "@/components/ui/badge"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUser } from "@/lib/hooks/useUser"
import { supabase } from "@/lib/supabase"
import { Loader2, Edit3, Building2, Users, FileText, DollarSign, Info, AlertCircle, ExternalLink, Calendar, TrendingUp, Globe, Lock } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/types/database"
import PendingEditsBanner from "@/components/startup/pending-edits-banner"
import { usePendingEdits } from "@/lib/hooks/usePendingEdits"

type StartupProfile = Database["public"]["Tables"]["startups"]["Row"]
type StartupTeamMember = Database["public"]["Tables"]["startup_team_members"]["Row"]
type StartupDocument = Database["public"]["Tables"]["startup_documents"]["Row"]

// Enhanced helper to display data nicely with better theming
const DataDisplayItem = ({ label, value, className }: { label: string; value: any; className?: string }) => {
  if (
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0) ||
    String(value).trim() === ""
  ) {
    return (
      <div className={`mb-3 sm:mb-4 lg:mb-5 ${className}`}>
        <p className="text-sm font-medium text-muted-foreground mb-1.5">{label}</p>
        <p className="text-sm text-muted-foreground/70 italic">Not provided</p>
      </div>
    )
  }
  return (
    <div className={`mb-3 sm:mb-4 lg:mb-5 ${className}`}>
      <p className="text-sm font-medium text-muted-foreground mb-1.5">{label}</p>
      <p className="text-foreground whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
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
  const { hasPendingEdits } = usePendingEdits(startupProfile?.id)

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
      <div className="flex justify-center items-center h-48 sm:h-64 lg:h-80">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16 animate-spin text-primary mx-auto" />
          <p className="text-sm sm:text-base text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Alert variant="destructive" className="mt-4 sm:mt-8">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span>{error}</span>
            {error.includes("not found") && (
              <Button asChild size="sm" className="w-fit">
                <Link href="/onboarding/startup">Complete Profile</Link>
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!startupProfile) {
    return (
      <div className="text-center py-8 sm:py-12 lg:py-16">
        <Info className="mx-auto h-8 w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-muted-foreground mb-4" />
        <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-4">Startup profile not available.</p>
        <Button asChild size="lg">
          <Link href="/onboarding/startup">Setup Your Profile</Link>
        </Button>
      </div>
    )
  }

  const editSectionPath = (section: string) => `/onboarding/startup/${section}`

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10">
      {/* Enhanced Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 lg:gap-8">
        <div className="space-y-2 lg:space-y-3 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground">My Startup Profile</h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            Manage and review your startup information that investors will see
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:flex-shrink-0">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href={`/startups/${startupProfile?.slug || startupProfile?.id}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              <span className="sm:hidden">View Public</span>
              <span className="hidden sm:inline">View Public Profile</span>
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/startup/analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              <span className="sm:hidden">Analytics</span>
              <span className="hidden sm:inline">View Analytics</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Pending Edits Banner */}
      {startupProfile?.id && (
        <PendingEditsBanner startupId={startupProfile.id} />
      )}

      {/* Enhanced Banner Image */}
      {startupProfile?.banner_image && (
        <div className="w-full h-32 sm:h-48 lg:h-64 xl:h-80 rounded-lg lg:rounded-xl overflow-hidden shadow-lg">
          <img
            src={startupProfile.banner_image}
            alt="Company Banner"
            className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      {/* Enhanced Cards Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {/* Main Content - Left Column */}
        <div className="xl:col-span-2 space-y-6 sm:space-y-8">
          {/* Enhanced Basic Information Card */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4 sm:pb-6 lg:pb-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 lg:gap-4">
                <div className="space-y-1.5 lg:space-y-2">
                  <CardTitle className="flex items-center text-lg sm:text-xl lg:text-2xl">
                    <Building2 className="mr-2 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6 text-primary flex-shrink-0" />
                    Basic Information
                  </CardTitle>
                  <CardDescription className="text-sm lg:text-base text-muted-foreground">
                    Core details about your company that define your startup.
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild={!hasPendingEdits} 
                  disabled={hasPendingEdits}
                  className="w-full sm:w-auto flex-shrink-0"
                >
                  {hasPendingEdits ? (
                    <>
                      <Lock className="mr-1.5 h-3 w-3 lg:h-4 lg:w-4" />
                      Pending Review
                    </>
                  ) : (
                    <Link href={editSectionPath("")}>
                      <Edit3 className="mr-1.5 h-3 w-3 lg:h-4 lg:w-4" />
                      Edit
                    </Link>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 lg:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 lg:gap-x-8 gap-y-4 lg:gap-y-6">
                <DataDisplayItem label="Company Name" value={startupProfile?.company_name} />
                <DataDisplayItem label="Founded Year" value={startupProfile?.founded_year} />
                <DataDisplayItem label="Tagline" value={startupProfile?.tagline} className="lg:col-span-2" />
                <DataDisplayItem label="Website" value={startupProfile?.website} />
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Public visibility</span>
                </div>
              </div>
              <DataDisplayItem label="Description" value={startupProfile?.description} className="border-t pt-6" />
              {startupProfile?.logo && (
                <div className="border-t pt-6">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Company Logo</p>
                                      <div className="flex items-center gap-4">
                      <img
                        src={startupProfile?.logo || "/placeholder.svg"}
                        alt={`${startupProfile?.company_name} logo`}
                        className="h-16 sm:h-20 lg:h-24 w-auto rounded-lg border border-border p-2 bg-muted shadow-sm"
                      />
                    <div className="text-sm text-muted-foreground">
                      <p>Logo displayed on your public profile</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Company Details Card */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4 sm:pb-6 lg:pb-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 lg:gap-4">
                <div className="space-y-1.5 lg:space-y-2">
                  <CardTitle className="flex items-center text-lg sm:text-xl lg:text-2xl">
                    <Info className="mr-2 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6 text-primary flex-shrink-0" />
                    Company Details
                  </CardTitle>
                  <CardDescription className="text-sm lg:text-base text-muted-foreground">
                    Operational metrics and market positioning information.
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild={!hasPendingEdits} 
                  disabled={hasPendingEdits}
                  className="w-full sm:w-auto flex-shrink-0"
                >
                  {hasPendingEdits ? (
                    <>
                      <Lock className="mr-1.5 h-3 w-3 lg:h-4 lg:w-4" />
                      Pending Review
                    </>
                  ) : (
                    <Link href={editSectionPath("company")}>
                      <Edit3 className="mr-1.5 h-3 w-3 lg:h-4 lg:w-4" />
                      Edit
                    </Link>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 lg:gap-x-8 gap-y-4 lg:gap-y-6">
              <DataDisplayItem label="Stage" value={startupProfile.stage} />
              <DataDisplayItem label="Industries" value={startupProfile.industry} />
              <DataDisplayItem label="Business Model" value={startupProfile.business_model} />
              <DataDisplayItem label="Growth Rate (%)" value={startupProfile.growth_rate} />
              <DataDisplayItem label="Annual Revenue (USD)" value={startupProfile.revenue?.toLocaleString()} />
              <DataDisplayItem label="Number of Users/Customers" value={startupProfile.users_count?.toLocaleString()} />
            </CardContent>
          </Card>

          {/* Enhanced Funding Information Card */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4 sm:pb-6 lg:pb-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 lg:gap-4">
                <div className="space-y-1.5 lg:space-y-2">
                  <CardTitle className="flex items-center text-lg sm:text-xl lg:text-2xl">
                    <DollarSign className="mr-2 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6 text-primary flex-shrink-0" />
                    Funding Information
                  </CardTitle>
                  <CardDescription className="text-sm lg:text-base text-muted-foreground">
                    Investment status, goals, and financial projections.
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild={!hasPendingEdits} 
                  disabled={hasPendingEdits}
                  className="w-full sm:w-auto flex-shrink-0"
                >
                  {hasPendingEdits ? (
                    <>
                      <Lock className="mr-1.5 h-3 w-3 lg:h-4 lg:w-4" />
                      Pending Review
                    </>
                  ) : (
                    <Link href={editSectionPath("funding")}>
                      <Edit3 className="mr-1.5 h-3 w-3 lg:h-4 lg:w-4" />
                      Edit
                    </Link>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 lg:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 lg:gap-x-8 gap-y-4 lg:gap-y-6">
                <DataDisplayItem label="Current Funding Round" value={startupProfile.current_round} />
                <DataDisplayItem label="Fundraising Timeline (Months)" value={startupProfile.fundraising_timeline_months} />
                <DataDisplayItem label="Total Raised (USD)" value={startupProfile.total_raised?.toLocaleString()} />
                <DataDisplayItem label="Target Amount (USD)" value={startupProfile.target_amount?.toLocaleString()} />
                <DataDisplayItem label="Valuation (USD)" value={startupProfile.valuation?.toLocaleString()} />
                <DataDisplayItem label="Equity Offered (%)" value={startupProfile.equity_percentage_offered} />
                <DataDisplayItem label="Monthly Burn Rate (USD)" value={startupProfile.burn_rate?.toLocaleString()} />
                <DataDisplayItem label="Previous Investors" value={startupProfile.previous_investors} />
              </div>
              <div className="border-t pt-6">
                <DataDisplayItem
                  label="Planned Use of Funds"
                  value={startupProfile.planned_use_of_funds}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Column */}
        <div className="xl:col-span-1 space-y-6 sm:space-y-8">
          {/* Enhanced Team Members Card */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex flex-col gap-3">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Users className="mr-2 h-5 w-5 lg:h-6 lg:w-6 text-primary flex-shrink-0" />
                    Team Members
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Your core team information.
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild={!hasPendingEdits} 
                  disabled={hasPendingEdits}
                  className="w-full"
                >
                  {hasPendingEdits ? (
                    <>
                      <Lock className="mr-1.5 h-3 w-3" />
                      Pending Review
                    </>
                  ) : (
                    <Link href={editSectionPath("team")}>
                      <Edit3 className="mr-1.5 h-3 w-3" />
                      Edit Team
                    </Link>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {teamMembers.length > 0 ? (
                <div className="space-y-4 lg:space-y-6">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="pb-4 lg:pb-6 border-b border-border/50 last:border-b-0 last:pb-0">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm sm:text-base text-foreground">
                          {member.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-primary font-medium">{member.role}</p>
                        {member.bio && (
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
                        )}
                        {member.linkedin_url && (
                          <a
                            href={member.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm text-primary hover:underline inline-flex items-center gap-1 mt-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                            LinkedIn Profile
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 lg:py-8">
                  <Users className="h-8 w-8 lg:h-10 lg:w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No team members added yet.</p>
                  <Button variant="outline" size="sm" asChild className="mt-3">
                    <Link href={editSectionPath("team")}>Add Team Members</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Documents Card */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex flex-col gap-3">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <FileText className="mr-2 h-5 w-5 lg:h-6 lg:w-6 text-primary flex-shrink-0" />
                    Documents
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Pitch deck, financials, and other materials.
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild={!hasPendingEdits} 
                  disabled={hasPendingEdits}
                  className="w-full"
                >
                  {hasPendingEdits ? (
                    <>
                      <Lock className="mr-1.5 h-3 w-3" />
                      Pending Review
                    </>
                  ) : (
                    <Link href={editSectionPath("documents")}>
                      <Edit3 className="mr-1.5 h-3 w-3" />
                      Manage Documents
                    </Link>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-3 lg:space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="group p-3 lg:p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border/50 transition-all duration-200">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="capitalize text-xs w-fit">
                            {doc.document_type.replace("_", " ")}
                          </Badge>
                        </div>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-2 group-hover:text-primary transition-colors"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{doc.file_name}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 lg:py-8">
                  <FileText className="h-8 w-8 lg:h-10 lg:w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No documents uploaded yet.</p>
                  <Button variant="outline" size="sm" asChild className="mt-3">
                    <Link href={editSectionPath("documents")}>Upload Documents</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl text-foreground">Quick Actions</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Common tasks for your startup profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" asChild className="w-full justify-start">
                <Link href="/startup/matches">
                  <Users className="mr-2 h-4 w-4" />
                  View Investor Matches
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <Link href="/startup/meetings">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Meetings
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <Link href="/startup/analytics">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
