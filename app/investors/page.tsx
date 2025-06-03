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
import { Investor3DCard } from "@/components/ui/3d-card"

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [stageFilter, setStageFilter] = useState("all")
  const [industryFilter, setIndustryFilter] = useState("all")

  useEffect(() => {
    loadInvestors()
  }, [])

  const loadInvestors = async () => {
    try {
      const { data, error } = await supabase
        .from("investors")
        .select(`
          *,
          users (
            first_name,
            last_name,
            profile_picture
          )
        `)
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      setInvestors(data || [])
    } catch (error) {
      console.error("Error loading investors:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvestors = investors.filter((investor) => {
    const matchesSearch =
      !searchTerm ||
      investor.firm_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${investor.users?.first_name} ${investor.users?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.bio?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || investor.type === typeFilter

    const matchesStage = stageFilter === "all" || investor.investment_stages?.includes(stageFilter)

    const matchesIndustry = industryFilter === "all" || investor.investment_industries?.includes(industryFilter)

    return matchesSearch && matchesType && matchesStage && matchesIndustry
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Browse Investors
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover investors and venture capital firms looking for startups like yours. Find your perfect funding partner.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-green-600" />
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
                    placeholder="Search investors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 dark:bg-slate-700/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Investor Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="angel">Angel Investor</SelectItem>
                    <SelectItem value="vc">Venture Capital</SelectItem>
                    <SelectItem value="corporate">Corporate VC</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="accelerator">Accelerator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Investment Stage</label>
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
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-8 flex items-center justify-between">
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            {filteredInvestors.length} investor{filteredInvestors.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Investors Grid */}
        <div className="grid gap-8 md:gap-10 lg:gap-12 md:grid-cols-2 xl:grid-cols-3">
          {filteredInvestors.map((investor) => (
            <Investor3DCard key={investor.id} investor={investor} />
          ))}
        </div>

        {filteredInvestors.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 max-w-md mx-auto border-0">
              <Building2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No investors found</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Try adjusting your filters or search terms to find more investors. The perfect funding partner is out there!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
