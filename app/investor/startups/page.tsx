"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { InvestorLayout } from "@/components/layout/investor-layout"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import {
  Building2,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Heart,
  HeartOff,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

const STAGES = ["idea", "prototype", "mvp", "early-stage", "growth", "expansion"]
const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "E-commerce",
  "SaaS",
  "AI/ML",
  "Blockchain",
  "IoT",
  "Cybersecurity",
  "Fintech",
  "Edtech",
  "Healthtech",
  "Cleantech",
  "Foodtech",
]
const BUSINESS_MODELS = ["b2b", "b2c", "b2b2c", "marketplace", "saas", "other"]

export default function InvestorStartupsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [startups, setStartups] = useState<any[]>([])
  const [investorProfile, setInvestorProfile] = useState<any>(null)
  const [filters, setFilters] = useState({
    search: "",
    stages: [] as string[],
    industries: [] as string[],
    businessModels: [] as string[],
    minRaised: 0,
    maxRaised: 10000000,
    minValuation: 0,
    maxValuation: 50000000,
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState("match_score")
  const [sortOrder, setSortOrder] = useState("desc")
  const [wishlistedStartupIds, setWishlistedStartupIds] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      loadInvestorProfile()
    }
  }, [user])

  useEffect(() => {
    if (investorProfile) {
      loadStartups()
      loadWishlist()
    }
  }, [investorProfile, filters, sortBy, sortOrder])

  const loadInvestorProfile = async () => {
    try {
      const { data } = await supabase.from("investors").select("*").eq("user_id", user!.id).single()
      setInvestorProfile(data)

      // Initialize filters based on investor preferences
      if (data) {
        setFilters({
          ...filters,
          stages: data.investment_stages || [],
          industries: data.investment_industries || [],
          businessModels: data.business_models || [],
        })
      }
    } catch (error) {
      console.error("Error loading investor profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadStartups = async () => {
    try {
      setLoading(true)

      // In a real app, you would apply all filters to the query
      // For demo purposes, we'll fetch all startups and filter client-side
      const { data } = await supabase
        .from("startups")
        .select("*")
        .eq("status", "published")
        .order(sortBy, { ascending: sortOrder === "asc" })

      if (data) {
        // Apply client-side filtering
        const filteredStartups = data.filter((startup) => {
          // Search filter
          if (
            filters.search &&
            !startup.company_name.toLowerCase().includes(filters.search.toLowerCase()) &&
            !startup.tagline?.toLowerCase().includes(filters.search.toLowerCase()) &&
            !startup.description?.toLowerCase().includes(filters.search.toLowerCase())
          ) {
            return false
          }

          // Stage filter
          if (filters.stages.length > 0 && !filters.stages.includes(startup.stage)) {
            return false
          }

          // Industry filter (array intersection)
          if (
            filters.industries.length > 0 &&
            !startup.industry.some((ind: string) => filters.industries.includes(ind))
          ) {
            return false
          }

          // Business model filter
          if (filters.businessModels.length > 0 && !filters.businessModels.includes(startup.business_model)) {
            return false
          }

          // Raised amount filter
          if (
            (filters.minRaised > 0 && startup.total_raised < filters.minRaised) ||
            (filters.maxRaised < 10000000 && startup.total_raised > filters.maxRaised)
          ) {
            return false
          }

          // Valuation filter
          if (
            startup.valuation &&
            ((filters.minValuation > 0 && startup.valuation < filters.minValuation) ||
              (filters.maxValuation < 50000000 && startup.valuation > filters.maxValuation))
          ) {
            return false
          }

          return true
        })

        // Add mock match scores for demo purposes
        const startupsWithScores = filteredStartups.map((startup) => ({
          ...startup,
          match_score: Math.floor(Math.random() * 40) + 60, // Random score between 60-99
        }))

        // Sort by match score or other criteria
        startupsWithScores.sort((a, b) => {
          if (sortBy === "match_score") {
            return sortOrder === "desc" ? b.match_score - a.match_score : a.match_score - b.match_score
          } else if (sortBy === "total_raised") {
            return sortOrder === "desc" ? b.total_raised - a.total_raised : a.total_raised - b.total_raised
          } else if (sortBy === "valuation") {
            return sortOrder === "desc"
              ? (b.valuation || 0) - (a.valuation || 0)
              : (a.valuation || 0) - (b.valuation || 0)
          } else if (sortBy === "company_name") {
            return sortOrder === "desc"
              ? b.company_name.localeCompare(a.company_name)
              : a.company_name.localeCompare(b.company_name)
          }
          return 0
        })

        setStartups(startupsWithScores)
      }
    } catch (error) {
      console.error("Error loading startups:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadWishlist = async () => {
    try {
      if (!investorProfile) return
      const { data, error } = await supabase
        .from("investor_wishlists")
        .select("startup_id")
        .eq("investor_id", investorProfile.id)

      if (error) {
        console.error("Error loading wishlist:", error)
      } else {
        setWishlistedStartupIds(data?.map((item) => item.startup_id) || [])
      }
    } catch (error) {
      console.error("Error loading wishlist:", error)
    }
  }

  const toggleWishlist = async (startupId: string) => {
    try {
      if (!investorProfile) return

      const alreadyWishlisted = wishlistedStartupIds.includes(startupId)

      if (alreadyWishlisted) {
        // Remove from wishlist
        const { error } = await supabase
          .from("investor_wishlists")
          .delete()
          .eq("investor_id", investorProfile.id)
          .eq("startup_id", startupId)

        if (error) {
          console.error("Error removing from wishlist:", error)
          return
        }

        setWishlistedStartupIds(wishlistedStartupIds.filter((id) => id !== startupId))
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from("investor_wishlists")
          .insert([{ investor_id: investorProfile.id, startup_id: startupId }])

        if (error) {
          console.error("Error adding to wishlist:", error)
          return
        }

        setWishlistedStartupIds([...wishlistedStartupIds, startupId])
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
    }
  }

  const toggleStageFilter = (stage: string) => {
    setFilters({
      ...filters,
      stages: filters.stages.includes(stage) ? filters.stages.filter((s) => s !== stage) : [...filters.stages, stage],
    })
  }

  const toggleIndustryFilter = (industry: string) => {
    setFilters({
      ...filters,
      industries: filters.industries.includes(industry)
        ? filters.industries.filter((i) => i !== industry)
        : [...filters.industries, industry],
    })
  }

  const toggleBusinessModelFilter = (model: string) => {
    setFilters({
      ...filters,
      businessModels: filters.businessModels.includes(model)
        ? filters.businessModels.filter((m) => m !== model)
        : [...filters.businessModels, model],
    })
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      stages: [],
      industries: [],
      businessModels: [],
      minRaised: 0,
      maxRaised: 10000000,
      minValuation: 0,
      maxValuation: 50000000,
    })
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    }
    return `$${amount}`
  }

  const handleStartupAction = async (startupId: string, action: "interested" | "not-interested") => {
    try {
      // Check if a match already exists
      const { data: existingMatch } = await supabase
        .from("matches")
        .select("id, status")
        .eq("startup_id", startupId)
        .eq("investor_id", investorProfile.id)
        .single()

      if (existingMatch) {
        // Update existing match
        await supabase
          .from("matches")
          .update({
            status: action,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingMatch.id)
      } else {
        // Create new match
        await supabase.from("matches").insert({
          startup_id: startupId,
          investor_id: investorProfile.id,
          match_score: Math.floor(Math.random() * 40) + 60, // Random score for demo
          status: action,
          initiated_by: "investor",
        })
      }

      // Update local state
      setStartups(
        startups.map((startup) =>
          startup.id === startupId
            ? {
                ...startup,
                match_status: action,
              }
            : startup,
        ),
      )
    } catch (error) {
      console.error("Error updating match:", error)
    }
  }

  const requestMeeting = async (startupId: string) => {
    try {
      // Check if a match already exists
      const { data: existingMatch } = await supabase
        .from("matches")
        .select("id, status")
        .eq("startup_id", startupId)
        .eq("investor_id", investorProfile.id)
        .single()

      if (existingMatch) {
        // Update existing match
        await supabase
          .from("matches")
          .update({
            status: "meeting-scheduled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingMatch.id)
      } else {
        // Create new match
        await supabase.from("matches").insert({
          startup_id: startupId,
          investor_id: investorProfile.id,
          match_score: Math.floor(Math.random() * 40) + 60, // Random score for demo
          status: "meeting-scheduled",
          initiated_by: "investor",
        })
      }

      // Update local state
      setStartups(
        startups.map((startup) =>
          startup.id === startupId
            ? {
                ...startup,
                match_status: "meeting-scheduled",
              }
            : startup,
        ),
      )

      // In a real app, you would also create a meeting request or notification
    } catch (error) {
      console.error("Error requesting meeting:", error)
    }
  }

  if (loading && !startups.length) {
    return (
      <InvestorLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </InvestorLayout>
    )
  }

  return (
    <InvestorLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Browse Startups</h1>
            <p className="text-muted-foreground">Discover and connect with promising startups</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="md:w-auto w-full"
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="md:w-auto w-full">
                  Sort by: {sortBy === "match_score" ? "Match Score" : sortBy.replace("_", " ")}
                  {sortOrder === "desc" ? (
                    <ChevronDown className="ml-2 h-4 w-4" />
                  ) : (
                    <ChevronUp className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSortBy("match_score")
                    setSortOrder("desc")
                  }}
                >
                  Match Score (High to Low)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSortBy("match_score")
                    setSortOrder("asc")
                  }}
                >
                  Match Score (Low to High)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSortBy("total_raised")
                    setSortOrder("desc")
                  }}
                >
                  Total Raised (High to Low)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSortBy("total_raised")
                    setSortOrder("asc")
                  }}
                >
                  Total Raised (Low to High)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSortBy("valuation")
                    setSortOrder("desc")
                  }}
                >
                  Valuation (High to Low)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSortBy("valuation")
                    setSortOrder("asc")
                  }}
                >
                  Valuation (Low to High)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSortBy("company_name")
                    setSortOrder("asc")
                  }}
                >
                  Company Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSortBy("company_name")
                    setSortOrder("desc")
                  }}
                >
                  Company Name (Z-A)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search startups by name, description, or industry..."
              className="pl-8"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          {showFilters && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Filters</CardTitle>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                </div>
                <CardDescription>Refine your startup search</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Startup Stage</h3>
                    <ScrollArea className="h-[200px] pr-4">
                      <div className="space-y-2">
                        {STAGES.map((stage) => (
                          <div key={stage} className="flex items-center space-x-2">
                            <Checkbox
                              id={`stage-${stage}`}
                              checked={filters.stages.includes(stage)}
                              onCheckedChange={() => toggleStageFilter(stage)}
                            />
                            <Label htmlFor={`stage-${stage}`} className="capitalize">
                              {stage.replace("-", " ")}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Industry</h3>
                    <ScrollArea className="h-[200px] pr-4">
                      <div className="space-y-2">
                        {INDUSTRIES.map((industry) => (
                          <div key={industry} className="flex items-center space-x-2">
                            <Checkbox
                              id={`industry-${industry}`}
                              checked={filters.industries.includes(industry)}
                              onCheckedChange={() => toggleIndustryFilter(industry)}
                            />
                            <Label htmlFor={`industry-${industry}`}>{industry}</Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Business Model</h3>
                    <div className="space-y-2">
                      {BUSINESS_MODELS.map((model) => (
                        <div key={model} className="flex items-center space-x-2">
                          <Checkbox
                            id={`model-${model}`}
                            checked={filters.businessModels.includes(model)}
                            onCheckedChange={() => toggleBusinessModelFilter(model)}
                          />
                          <Label htmlFor={`model-${model}`} className="capitalize">
                            {model}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Total Raised</h3>
                      <div className="pt-4">
                        <Slider
                          defaultValue={[filters.minRaised, filters.maxRaised]}
                          max={10000000}
                          step={100000}
                          onValueChange={(value) =>
                            setFilters({ ...filters, minRaised: value[0], maxRaised: value[1] })
                          }
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs">{formatCurrency(filters.minRaised)}</span>
                          <span className="text-xs">{formatCurrency(filters.maxRaised)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Valuation</h3>
                      <div className="pt-4">
                        <Slider
                          defaultValue={[filters.minValuation, filters.maxValuation]}
                          max={50000000}
                          step={1000000}
                          onValueChange={(value) =>
                            setFilters({ ...filters, minValuation: value[0], maxValuation: value[1] })
                          }
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs">{formatCurrency(filters.minValuation)}</span>
                          <span className="text-xs">{formatCurrency(filters.maxValuation)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Applied Filters */}
          {(filters.stages.length > 0 ||
            filters.industries.length > 0 ||
            filters.businessModels.length > 0 ||
            filters.minRaised > 0 ||
            filters.maxRaised < 10000000 ||
            filters.minValuation > 0 ||
            filters.maxValuation < 50000000) && (
            <div className="flex flex-wrap gap-2">
              {filters.stages.map((stage) => (
                <Badge key={stage} variant="secondary" className="flex items-center gap-1">
                  Stage: {stage}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => toggleStageFilter(stage)} />
                </Badge>
              ))}
              {filters.industries.map((industry) => (
                <Badge key={industry} variant="secondary" className="flex items-center gap-1">
                  Industry: {industry}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => toggleIndustryFilter(industry)} />
                </Badge>
              ))}
              {filters.businessModels.map((model) => (
                <Badge key={model} variant="secondary" className="flex items-center gap-1">
                  Model: {model}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => toggleBusinessModelFilter(model)} />
                </Badge>
              ))}
              {(filters.minRaised > 0 || filters.maxRaised < 10000000) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Raised: {formatCurrency(filters.minRaised)} - {formatCurrency(filters.maxRaised)}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters({ ...filters, minRaised: 0, maxRaised: 10000000 })}
                  />
                </Badge>
              )}
              {(filters.minValuation > 0 || filters.maxValuation < 50000000) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Valuation: {formatCurrency(filters.minValuation)} - {formatCurrency(filters.maxValuation)}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters({ ...filters, minValuation: 0, maxValuation: 50000000 })}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Startups List */}
        <div className="space-y-4">
          {startups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No startups found</h3>
                <p className="text-muted-foreground text-center mt-2">Try adjusting your filters or search criteria</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            startups.map((startup) => (
              <Card key={startup.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4 p-6 bg-gray-50 dark:bg-gray-800 flex flex-col">
                      <div className="flex items-center mb-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={startup.logo || "/placeholder.svg"} alt={startup.company_name} />
                          <AvatarFallback>
                            {startup.company_name
                              .split(" ")
                              .map((word: string) => word[0])
                              .join("")
                              .substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <h3 className="font-bold text-lg">{startup.company_name}</h3>
                          <div className="flex items-center mt-1">
                            <Badge variant="outline" className="capitalize">
                              {startup.stage.replace("-", " ")}
                            </Badge>
                            <div className="ml-auto flex items-center">
                              <span className="text-xs font-medium">Match:</span>
                              <span
                                className={`ml-1 text-xs font-bold ${
                                  startup.match_score >= 80
                                    ? "text-green-600"
                                    : startup.match_score >= 60
                                      ? "text-amber-600"
                                      : "text-gray-600"
                                }`}
                              >
                                {startup.match_score}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 flex-1">
                        <div>
                          <p className="text-sm font-medium">Founded</p>
                          <p className="text-sm">{startup.founded_year || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Total Raised</p>
                          <p className="text-sm">{formatCurrency(startup.total_raised || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Valuation</p>
                          <p className="text-sm">{startup.valuation ? formatCurrency(startup.valuation) : "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Business Model</p>
                          <p className="text-sm capitalize">{startup.business_model}</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={() => handleStartupAction(startup.id, "interested")}
                        >
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Interested
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleStartupAction(startup.id, "not-interested")}
                        >
                          <ThumbsDown className="mr-2 h-4 w-4" />
                          Not Interested
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => requestMeeting(startup.id)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Request Meeting
                        </Button>
                        <Button
                          variant={wishlistedStartupIds.includes(startup.id) ? "default" : "outline"}
                          className="w-full"
                          onClick={() => toggleWishlist(startup.id)}
                        >
                          {wishlistedStartupIds.includes(startup.id) ? (
                            <>
                              <Heart className="mr-2 h-4 w-4" />
                              Wishlisted
                            </>
                          ) : (
                            <>
                              <HeartOff className="mr-2 h-4 w-4" />
                              Add to Wishlist
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="md:w-3/4 p-6">
                      <div className="mb-4">
                        <h4 className="font-medium text-lg">About</h4>
                        <p className="text-muted-foreground mt-1">{startup.tagline}</p>
                        <p className="mt-2">{startup.description || "No description available."}</p>
                      </div>

                      <Separator className="my-4" />

                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="details">
                          <AccordionTrigger>Company Details</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-sm font-medium">Industry</h5>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {startup.industry?.map((ind: string) => (
                                    <Badge key={ind} variant="outline">
                                      {ind}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium">Website</h5>
                                <p className="text-sm mt-1">
                                  {startup.website ? (
                                    <a
                                      href={startup.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline flex items-center"
                                    >
                                      {startup.website}
                                      <ExternalLink className="ml-1 h-3 w-3" />
                                    </a>
                                  ) : (
                                    "N/A"
                                  )}
                                </p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium">Current Round</h5>
                                <p className="text-sm mt-1">{startup.current_round || "N/A"}</p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium">Target Amount</h5>
                                <p className="text-sm mt-1">
                                  {startup.target_amount ? formatCurrency(startup.target_amount) : "N/A"}
                                </p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium">Revenue</h5>
                                <p className="text-sm mt-1">
                                  {startup.revenue ? formatCurrency(startup.revenue) : "N/A"}
                                </p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium">Users</h5>
                                <p className="text-sm mt-1">
                                  {startup.users_count ? startup.users_count.toLocaleString() : "N/A"}
                                </p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium">Growth Rate</h5>
                                <p className="text-sm mt-1">
                                  {startup.growth_rate ? `${startup.growth_rate}%` : "N/A"}
                                </p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium">Burn Rate</h5>
                                <p className="text-sm mt-1">
                                  {startup.burn_rate ? formatCurrency(startup.burn_rate) : "N/A"}
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="previous-investors">
                          <AccordionTrigger>Previous Investors</AccordionTrigger>
                          <AccordionContent>
                            {startup.previous_investors && startup.previous_investors.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {startup.previous_investors.map((investor: string) => (
                                  <Badge key={investor} variant="outline">
                                    {investor}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground">No previous investors listed</p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </InvestorLayout>
  )
}
