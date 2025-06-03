"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { Search, Filter, MapPin, DollarSign, TrendingUp, Star, Building2 } from "lucide-react"
import Link from "next/link"

export default function StartupsPage() {
  const [startups, setStartups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [stageFilter, setStageFilter] = useState("all")
  const [industryFilter, setIndustryFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")

  useEffect(() => {
    loadStartups()
  }, [])

  const loadStartups = async () => {
    try {
      const { data, error } = await supabase
        .from("startups")
        .select(`
          *,
          users (
            first_name,
            last_name,
            profile_picture
          )
        `)
        .eq("status", "published")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      setStartups(data || [])
    } catch (error) {
      console.error("Error loading startups:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStartups = startups.filter((startup) => {
    const matchesSearch =
      !searchTerm ||
      startup.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      startup.tagline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      startup.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${startup.users?.first_name} ${startup.users?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStage = stageFilter === "all" || startup.stage === stageFilter

    const matchesIndustry = industryFilter === "all" || startup.industry?.includes(industryFilter)

    const matchesLocation = locationFilter === "all" || startup.location === locationFilter

    return matchesSearch && matchesStage && matchesIndustry && matchesLocation
  })

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "Not disclosed"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Startups</h1>
          <p className="text-gray-600">Discover innovative startups looking for investment and partnerships</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search startups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Stage</label>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                    <SelectItem value="seed">Seed</SelectItem>
                    <SelectItem value="series-a">Series A</SelectItem>
                    <SelectItem value="series-b">Series B</SelectItem>
                    <SelectItem value="series-c">Series C+</SelectItem>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="mvp">MVP</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Industry</label>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="fintech">Fintech</SelectItem>
                    <SelectItem value="e-commerce">E-commerce</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="sustainability">Sustainability</SelectItem>
                    <SelectItem value="ai">AI/Machine Learning</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="biotech">Biotech</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="san-francisco">San Francisco</SelectItem>
                    <SelectItem value="new-york">New York</SelectItem>
                    <SelectItem value="boston">Boston</SelectItem>
                    <SelectItem value="austin">Austin</SelectItem>
                    <SelectItem value="seattle">Seattle</SelectItem>
                    <SelectItem value="london">London</SelectItem>
                    <SelectItem value="berlin">Berlin</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            {filteredStartups.length} startup{filteredStartups.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Startups Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStartups.map((startup) => (
            <Card key={startup.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={startup.logo || "/placeholder.svg"}
                      alt={startup.company_name}
                    />
                    <AvatarFallback>
                      {startup.company_name
                        ? startup.company_name
                            .split(" ")
                            .map((word: string) => word[0])
                            .join("")
                            .substring(0, 2)
                        : "ST"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">
                        {startup.company_name}
                      </h3>
                      {startup.is_verified && <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-2">{startup.tagline}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {startup.stage && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {startup.stage}
                        </Badge>
                      )}
                      {startup.is_featured && (
                        <Badge variant="secondary" className="text-xs">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{startup.description || "No description available"}</p>

                <div className="space-y-2 mb-4">
                  {startup.target_amount && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Seeking {formatCurrency(startup.target_amount)}
                      </span>
                    </div>
                  )}

                  {startup.industry && startup.industry.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {startup.industry.slice(0, 2).join(", ")}
                        {startup.industry.length > 2 && ` +${startup.industry.length - 2}`}
                      </span>
                    </div>
                  )}

                  {startup.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {startup.location}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link href={`/startups/${startup.slug || startup.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                  <Button size="sm">Connect</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStartups.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No startups found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms to find more startups.</p>
          </div>
        )}
      </div>
    </div>
  )
}
