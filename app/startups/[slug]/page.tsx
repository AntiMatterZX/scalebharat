import type React from "react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Briefcase, 
  ExternalLink, 
  MapPin, 
  Users, 
  DollarSign, 
  FileText, 
  Clock, 
  TrendingUp,
  Target,
  ChartPie,
  Calendar,
  ArrowLeft,
  Building2,
  Eye,
  TrendingDown,
  LineChart,
  Store,
  Download,
  Youtube,
  Globe,
  Linkedin,
  Twitter,
  FileSpreadsheet,
  Presentation,
  FileSignature,
} from "lucide-react"
import Link from "next/link"
import type { Database } from "@/types/database"
import { generateSlug } from "@/lib/slug-utils"
import { Fragment } from "react"

type Startup = Database["public"]["Tables"]["startups"]["Row"]
type StartupTeamMember = Database["public"]["Tables"]["startup_team_members"]["Row"]
type StartupDocument = Omit<Database["public"]["Tables"]["startup_documents"]["Row"], "document_type"> & {
  document_type: "pitch_deck" | "financial_model" | "business_plan" | "legal_docs" | "other" | string
}

export const dynamic = "force-dynamic"

export default async function StartupProfilePage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const supabase = createServerComponentClient<Database>({ cookies })

  // Check if the slug is actually a UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)

  let startup: any = null
  let startupError: any = null

  if (isUuid) {
    // If it's a UUID, look up by ID first
    const { data, error } = await supabase
      .from("startups")
      .select(`
        *,
        users (id, first_name, last_name, profile_picture)
      `)
      .eq("id", slug)
      .eq("status", "published")
      .single()

    if (data) {
      // If startup exists but doesn't have a slug, generate one
      if (!data.slug) {
        const generatedSlug = generateSlug(data.company_name || "startup")

        // Update the startup with the generated slug
        const { data: updatedStartup, error: updateError } = await supabase
          .from("startups")
          .update({ slug: generatedSlug })
          .eq("id", data.id)
          .select()
          .single()

        if (!updateError && updatedStartup) {
          // Redirect to the slug URL
          redirect(`/startups/${generatedSlug}`)
        }
      } else {
        // Redirect to the slug URL
        redirect(`/startups/${data.slug}`)
      }
    }

    startup = data
    startupError = error
  } else {
    // Look up by slug
    const { data, error } = await supabase
      .from("startups")
      .select(`
        *,
        users (id, first_name, last_name, profile_picture)
      `)
      .eq("slug", slug)
      .eq("status", "published")
      .single()

    startup = data
    startupError = error
  }

  if (startupError || !startup) {
    console.error("Error fetching startup:", startupError)
    notFound()
  }

  // Fetch team members
  const { data: teamMembers } = await supabase.from("startup_team_members").select("*").eq("startup_id", startup.id)

  // Fetch documents from API endpoint with visibility filtering
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const res = await fetch(`${baseUrl}/api/startups/${slug}/documents?visibility=public`, {
    headers: {
      cookie: cookies().toString(),
    },
  })
  const json = await res.json()
  const documents = json.documents || []

  // Get current user for upvote status
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id

  // Check if user has upvoted this startup
  let hasUpvoted = false
  if (userId) {
    const { data: upvote } = await supabase
      .from("startup_upvotes")
      .select("id")
      .eq("startup_id", startup.id)
      .eq("user_id", userId)
      .maybeSingle()

    hasUpvoted = !!upvote
  }

  // Helper to detect YouTube links
  const isYouTube = (url: string) => /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/))([\w-]{11})/.test(url)
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/))([\w-]{11})/)
    return match ? match[1] : null
  }

  // Helper to detect website/social links
  const isWebsite = (url: string) => /^https?:\/\//.test(url) && !isYouTube(url)
  const isLinkedIn = (url: string) => url.includes("linkedin.com")
  const isTwitter = (url: string) => url.includes("twitter.com")

  // Helper to format file size
  const formatSize = (size?: number) => size ? `${(size/1024/1024).toFixed(2)} MB` : "-"

  // Helper to group documents by type
  const groupDocsByType = (docs: StartupDocument[]) => {
    const groups: { [key: string]: StartupDocument[] } = {}
    docs.forEach((doc) => {
      const type = doc.document_type || "other"
      if (!groups[type]) groups[type] = []
      groups[type].push(doc)
    })
    return groups
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner Section */}
      <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-background z-10"></div>
        <img
          src={startup.banner_image || "/placeholder-banner.jpg"}
          alt={`${startup.company_name} banner`}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-background">
          <div className="container mx-auto">
            <div className="flex items-end gap-6">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage
                  src={startup.logo || "/placeholder.svg?width=128&height=128&query=startup+logo"}
                  alt={startup.company_name}
                />
                <AvatarFallback>{startup.company_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{startup.company_name}</h1>
                <p className="text-xl text-white/90">{startup.tagline}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatBadge icon={<Eye />} label="Views" value={startup.view_count || 0} />
          <StatBadge icon={<TrendingUp />} label="Upvotes" value={startup.upvote_count || 0} />
          <StatBadge
            icon={<DollarSign />}
            label="Total Raised"
            value={startup.total_raised ? `$${startup.total_raised.toLocaleString()}` : "$0"}
          />
          <StatBadge icon={<Users />} label="Team Size" value={startup.team_size || 0} />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">About {startup.company_name}</CardTitle>
        </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg leading-relaxed whitespace-pre-line">
              {startup.description || "No description provided."}
            </p>
                <div className="flex flex-wrap gap-2">
                  {startup.industry?.map((ind: string) => (
                    <Badge key={ind} variant="secondary">
                      {ind}
                    </Badge>
                  ))}
          </div>
              </CardContent>
            </Card>

            {/* Business Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Business Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MetricCard
                  icon={<Store className="text-indigo-600" />}
                  title="Business Model"
                  value={startup.business_model?.toUpperCase() || "N/A"}
                  subtitle="Go-to-market strategy"
                />
                <MetricCard
                  icon={<DollarSign className="text-green-600" />}
                  title="Revenue"
                  value={startup.revenue ? `$${startup.revenue.toLocaleString()}` : "N/A"}
                  subtitle="Current revenue"
            />
                <MetricCard
                  icon={<Users className="text-blue-600" />}
                  title="User Base"
                  value={startup.users_count?.toLocaleString() || "N/A"}
                  subtitle="Active users"
            />
                <MetricCard
                  icon={<LineChart className="text-purple-600" />}
                  title="Growth Rate"
                  value={startup.growth_rate ? `${startup.growth_rate}%` : "N/A"}
                  subtitle="Month-over-month"
                />
        </CardContent>
      </Card>

            {/* Team Section */}
      {startup.users && (
              <Card className="bg-gradient-to-br from-background to-muted/30">
          <CardHeader>
                  <CardTitle className="text-2xl">Leadership & Team</CardTitle>
                  <CardDescription>The people behind {startup.company_name}</CardDescription>
          </CardHeader>
                <CardContent className="space-y-8">
                  {/* Founder Card */}
                  <div className="p-6 rounded-lg bg-background/50 backdrop-blur-sm border border-border">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage
                          src={startup.users.profile_picture || "/placeholder.svg?width=96&height=96&query=user+avatar"}
                alt={`${startup.users.first_name} ${startup.users.last_name}`}
              />
              <AvatarFallback>
                {startup.users.first_name?.charAt(0)}
                {startup.users.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
                        <h3 className="text-2xl font-semibold">
                {startup.users.first_name} {startup.users.last_name}
                        </h3>
                        <p className="text-primary text-lg">Founder & CEO</p>
                        <p className="text-muted-foreground mt-2">
                          Leading {startup.company_name} since {startup.founded_year}
              </p>
            </div>
                    </div>
                  </div>

                  {/* Team Members */}
      {teamMembers && teamMembers.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                    <AvatarImage
                                src={member.profile_picture_url || "/placeholder.svg?width=64&height=64&query=team+member"}
                      alt={member.name}
                    />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                            <div>
                              <h4 className="font-semibold text-lg">{member.name}</h4>
                              <p className="text-primary">{member.role}</p>
                  {member.linkedin_url && (
                                <Button variant="link" size="sm" className="px-0 mt-1" asChild>
                      <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer">
                                    LinkedIn Profile
                      </a>
                    </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" asChild>
                  <a href={startup.website} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Visit Website
                  </a>
                </Button>
                <form action={`/api/startups/${startup.slug || startup.id}/upvote`} method="POST">
                  <Button type="submit" variant="outline" className="w-full">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    {hasUpvoted ? "Upvoted" : "Upvote"} ({startup.upvote_count || 0})
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Fundraising Details */}
            <Card>
              <CardHeader>
                <CardTitle>Fundraising</CardTitle>
                <CardDescription>Current round details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <MetricCard
                  icon={<DollarSign className="text-green-600" />}
                  title="Seeking"
                  value={startup.target_amount ? `$${startup.target_amount.toLocaleString()}` : "N/A"}
                  subtitle="Target raise"
                />
                <MetricCard
                  icon={<ChartPie className="text-blue-600" />}
                  title="Equity Offered"
                  value={startup.equity_percentage_offered ? `${startup.equity_percentage_offered}%` : "N/A"}
                  subtitle="Ownership stake"
                />
                <MetricCard
                  icon={<Clock className="text-orange-600" />}
                  title="Timeline"
                  value={startup.fundraising_timeline_months ? `${startup.fundraising_timeline_months} months` : "N/A"}
                  subtitle="Fundraising period"
                />
                <MetricCard
                  icon={<Target className="text-purple-600" />}
                  title="Use of Funds"
                  value={startup.planned_use_of_funds || "N/A"}
                  subtitle="Primary allocation"
                />
          </CardContent>
        </Card>

            {/* Documents */}
      {documents && documents.length > 0 && (
              <Card>
          <CardHeader>
                  <CardTitle>Key Documents & Media</CardTitle>
                  <CardDescription>All files, links, and media uploaded for this startup</CardDescription>
          </CardHeader>
                <CardContent>
              {Object.entries(groupDocsByType(documents)).map(([type, docs]) => (
                <Fragment key={type}>
                  <h3 className="text-lg font-semibold mt-6 mb-2 capitalize flex items-center gap-2">
                    {type === "pitch_deck" && <Presentation className="text-orange-500" />}
                    {type === "financial_model" && <FileSpreadsheet className="text-green-600" />}
                    {type === "business_plan" && <FileSignature className="text-purple-600" />}
                    {type === "legal_docs" && <FileSignature className="text-purple-600" />}
                    {type === "other" && <FileText className="text-primary" />}
                    {type.replace("_", " ")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {docs.map((doc) => {
                      // YouTube video
                      if (isYouTube(doc.file_url)) {
                        const vid = getYouTubeId(doc.file_url)
                        return (
                          <div key={doc.id} className="rounded-lg bg-muted/20 p-4 flex flex-col gap-2">
                            <div className="aspect-video rounded overflow-hidden mb-2">
                              <iframe
                                src={`https://www.youtube.com/embed/${vid}`}
                                title={doc.file_name}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Youtube className="text-red-600" />
                              <span className="font-medium">{doc.file_name}</span>
                              <Badge variant="secondary">YouTube Video</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</span>
                              {doc.updated_at && <span>Updated: {new Date(doc.updated_at).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        )
                      }
                      // Website/social links
                      if (isWebsite(doc.file_url)) {
                        let icon = <Globe className="text-blue-600" />
                        let label = "Website"
                        if (isLinkedIn(doc.file_url)) { icon = <Linkedin className="text-blue-700" />; label = "LinkedIn" }
                        if (isTwitter(doc.file_url)) { icon = <Twitter className="text-sky-400" />; label = "Twitter" }
                        return (
                          <div key={doc.id} className="rounded-lg bg-muted/20 p-4 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              {icon}
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                                {doc.file_name || label}
                              </a>
                              <Badge variant="secondary">{label}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</span>
                              {doc.updated_at && <span>Updated: {new Date(doc.updated_at).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        )
                      }
                      // File types
                      let fileIcon = <FileText className="text-primary" />
                      if (doc.file_name?.endsWith(".pdf")) fileIcon = <FileText className="text-red-600" />
                      if (doc.file_name?.endsWith(".ppt") || doc.file_name?.endsWith(".pptx")) fileIcon = <Presentation className="text-orange-500" />
                      if (doc.file_name?.endsWith(".xls") || doc.file_name?.endsWith(".xlsx") || doc.file_name?.endsWith(".csv")) fileIcon = <FileSpreadsheet className="text-green-600" />
                      if (doc.document_type === "legal_docs") fileIcon = <FileSignature className="text-purple-600" />
                      return (
                        <div key={doc.id} className="rounded-lg bg-muted/20 p-4 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            {fileIcon}
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                              {doc.file_name}
                            </a>
                            <Badge variant="secondary">{doc.document_type.replace("_", " ")}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</span>
                            {doc.updated_at && <span>Updated: {new Date(doc.updated_at).toLocaleDateString()}</span>}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <Button asChild variant="outline" size="sm">
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download>
                                <Download className="mr-1 h-4 w-4" /> Download
                              </a>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="mr-1 h-4 w-4" /> View
                              </a>
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground break-all">ID: {doc.id}</div>
                          {/* Optionally show file_path for admins */}
                          {/* <div className="text-xs text-muted-foreground">Path: {doc.file_path}</div> */}
                        </div>
                      )
                    })}
                  </div>
                </Fragment>
              ))}
          </CardContent>
        </Card>
      )}
          </div>
        </div>

      <div className="text-center mt-12">
          <Button size="lg" variant="outline" asChild>
            <Link href="/startups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Startups
            </Link>
        </Button>
        </div>
      </div>
    </div>
  )
}

// Stat Badge Component
const StatBadge = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20">
    <div className="p-2 rounded-full bg-primary/10">{icon}</div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  </div>
)

// Enhanced MetricCard component
const MetricCard = ({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  value: string | number | undefined | null
  subtitle: string
}) => (
  <div className="bg-background/50 backdrop-blur-sm p-6 rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-full bg-primary/10">{icon}</div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    <p className="text-2xl font-semibold text-foreground">{value || "N/A"}</p>
  </div>
)
