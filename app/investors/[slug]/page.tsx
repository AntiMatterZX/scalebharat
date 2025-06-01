import { notFound, redirect } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Globe,
  Linkedin,
  Twitter,
  DollarSign,
  TrendingUp,
  Briefcase,
  Users,
  Star,
  MessageSquare,
  Heart,
} from "lucide-react"
import { generateInvestorSlug, ensureUniqueSlug } from "@/lib/slug-utils"

interface InvestorProfilePageProps {
  params: {
    slug: string
  }
}

// Helper function to check if string is UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export default async function InvestorProfilePage({ params }: InvestorProfilePageProps) {
  const { slug } = params
  let investor: any = null

  try {
    // Check if the parameter is a UUID (for backward compatibility)
    if (isUUID(slug)) {
      // Look up by ID first
      const { data: investorById } = await supabase
        .from("investors")
        .select(`
          *,
          users (
            first_name,
            last_name,
            profile_picture,
            email
          )
        `)
        .eq("id", slug)
        .single()

      if (investorById) {
        // Generate slug if missing
        if (!investorById.slug) {
          const baseSlug = generateInvestorSlug(
            investorById.firm_name,
            investorById.users.first_name,
            investorById.users.last_name,
          )

          const uniqueSlug = await ensureUniqueSlug(baseSlug, async (testSlug) => {
            const { data } = await supabase
              .from("investors")
              .select("id")
              .eq("slug", testSlug)
              .not("id", "eq", investorById.id)
              .maybeSingle()
            return !!data
          })

          // Update the investor with the new slug
          await supabase.from("investors").update({ slug: uniqueSlug }).eq("id", investorById.id)

          // Redirect to the slug-based URL
          redirect(`/investors/${uniqueSlug}`)
        } else {
          // Redirect to existing slug
          redirect(`/investors/${investorById.slug}`)
        }
      }
    } else {
      // Look up by slug
      const { data: investorBySlug } = await supabase
        .from("investors")
        .select(`
          *,
          users (
            first_name,
            last_name,
            profile_picture,
            email
          )
        `)
        .eq("slug", slug)
        .single()

      investor = investorBySlug
    }

    if (!investor) {
      notFound()
    }

    // Get investor's portfolio/investments (mock data for now)
    const portfolioCompanies = [
      { name: "TechStartup Inc", stage: "Series A", year: "2023" },
      { name: "AI Solutions", stage: "Seed", year: "2022" },
      { name: "GreenTech Co", stage: "Series B", year: "2021" },
    ]

    const formatCurrency = (amount: number | null) => {
      if (!amount) return "Not disclosed"
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(amount)
    }

    const formatArray = (arr: string[] | null) => {
      if (!arr || arr.length === 0) return "Not specified"
      return arr.join(", ")
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24 mx-auto md:mx-0">
                <AvatarImage
                  src={investor.users?.profile_picture || "/placeholder.svg"}
                  alt={investor.firm_name || `${investor.users?.first_name} ${investor.users?.last_name}`}
                />
                <AvatarFallback className="text-2xl">
                  {investor.firm_name
                    ? investor.firm_name
                        .split(" ")
                        .map((word: string) => word[0])
                        .join("")
                        .substring(0, 2)
                    : `${investor.users?.first_name?.[0] || ""}${investor.users?.last_name?.[0] || ""}`}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {investor.firm_name || `${investor.users?.first_name} ${investor.users?.last_name}`}
                  </h1>
                  {investor.is_verified && (
                    <Badge variant="default" className="w-fit mx-auto md:mx-0">
                      <Star className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {investor.is_featured && (
                    <Badge variant="secondary" className="w-fit mx-auto md:mx-0">
                      Featured
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                  <Badge variant="outline" className="capitalize">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {investor.type}
                  </Badge>
                  {investor.investment_stages && investor.investment_stages.length > 0 && (
                    <Badge variant="outline">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {investor.investment_stages[0]}
                      {investor.investment_stages.length > 1 && ` +${investor.investment_stages.length - 1}`}
                    </Badge>
                  )}
                </div>

                <p className="text-gray-600 mb-4 max-w-2xl">{investor.bio || "No bio available"}</p>

                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  {investor.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={investor.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Website
                      </a>
                    </Button>
                  )}
                  {investor.linkedin && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={investor.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {investor.twitter && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={investor.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4 mr-2" />
                        Twitter
                      </a>
                    </Button>
                  )}
                  <Button size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Investment Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Investment Criteria */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Investment Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Check Size</h4>
                    <p className="text-gray-600">
                      {formatCurrency(investor.check_size_min)} - {formatCurrency(investor.check_size_max)}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Investment Stages</h4>
                    <div className="flex flex-wrap gap-2">
                      {investor.investment_stages?.map((stage: string) => (
                        <Badge key={stage} variant="secondary">
                          {stage}
                        </Badge>
                      )) || <span className="text-gray-500">Not specified</span>}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Industries</h4>
                    <div className="flex flex-wrap gap-2">
                      {investor.investment_industries?.map((industry: string) => (
                        <Badge key={industry} variant="outline">
                          {industry}
                        </Badge>
                      )) || <span className="text-gray-500">Not specified</span>}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Geographies</h4>
                    <p className="text-gray-600">{formatArray(investor.investment_geographies)}</p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Business Models</h4>
                    <div className="flex flex-wrap gap-2">
                      {investor.business_models?.map((model: string) => (
                        <Badge key={model} variant="outline">
                          {model}
                        </Badge>
                      )) || <span className="text-gray-500">Not specified</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Portfolio Companies
                  </CardTitle>
                  <CardDescription>Recent investments and portfolio companies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {portfolioCompanies.map((company, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{company.name}</h4>
                          <p className="text-sm text-gray-500">
                            {company.stage} • {company.year}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Assets Under Management</p>
                    <p className="text-lg font-semibold">{formatCurrency(investor.aum)}</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-gray-500">Investor Type</p>
                    <p className="text-lg font-semibold capitalize">{investor.type}</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge variant={investor.status === "active" ? "default" : "secondary"}>{investor.status}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Heart className="h-4 w-4 mr-2" />
                    Add to Wishlist
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Request Introduction
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error loading investor profile:", error)
    notFound()
  }
}
