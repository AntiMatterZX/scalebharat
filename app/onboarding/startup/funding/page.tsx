"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { useAuth } from "@/components/providers"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, DollarSign, Percent, CalendarDays, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const FUNDING_STAGES = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Series D+",
  "Growth",
  "Bridge",
  "Other",
]
const USE_OF_FUNDS_OPTIONS = [
  "Product Development",
  "Marketing & Sales",
  "Team Expansion",
  "Operational Scaling",
  "Research & Development",
  "Market Expansion",
  "Other",
]

export default function StartupFundingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    current_funding_stage: "",
    total_raised_so_far: 0,
    current_valuation: 0,
    previous_investors: [] as string[], // Store as array of strings
    target_amount_to_raise: 0,
    equity_percentage_offered: 0,
    planned_use_of_funds: [] as string[],
    fundraising_timeline_months: 0,
    monthly_revenue: 0,
    monthly_burn_rate: 0,
  })
  const [previousInvestorInput, setPreviousInvestorInput] = useState("")

  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return
      try {
        const { data, error: fetchError } = await supabase
          .from("startups")
          .select(
            "current_round, total_raised, valuation, previous_investors, target_amount, equity_percentage_offered, planned_use_of_funds, fundraising_timeline_months, revenue, burn_rate",
          )
          .eq("user_id", user.id)
          .single()

        if (fetchError && fetchError.code !== "PGRST116") throw fetchError // PGRST116: no rows found
        if (data) {
          setFormData({
            current_funding_stage: data.current_round || "",
            total_raised_so_far: data.total_raised || 0,
            current_valuation: data.valuation || 0,
            previous_investors: data.previous_investors || [],
            target_amount_to_raise: data.target_amount || 0,
            equity_percentage_offered: data.equity_percentage_offered || 0,
            planned_use_of_funds: data.planned_use_of_funds || [],
            fundraising_timeline_months: data.fundraising_timeline_months || 0,
            monthly_revenue: data.revenue || 0,
            monthly_burn_rate: data.burn_rate || 0,
          })
        }
      } catch (err) {
        console.error("Error loading funding data:", err)
        setError("Failed to load existing funding information.")
      }
    }
    loadExistingData()
  }, [user])

  const handleAddPreviousInvestor = () => {
    if (previousInvestorInput.trim() && !formData.previous_investors.includes(previousInvestorInput.trim())) {
      setFormData({
        ...formData,
        previous_investors: [...formData.previous_investors, previousInvestorInput.trim()],
      })
      setPreviousInvestorInput("")
    }
  }
  const handleRemovePreviousInvestor = (investor: string) => {
    setFormData({
      ...formData,
      previous_investors: formData.previous_investors.filter((i) => i !== investor),
    })
  }

  const handleUseOfFundsChange = (value: string) => {
    const newUses = formData.planned_use_of_funds.includes(value)
      ? formData.planned_use_of_funds.filter((use) => use !== value)
      : [...formData.planned_use_of_funds, value]
    setFormData({ ...formData, planned_use_of_funds: newUses })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!user) {
      setError("You must be logged in.")
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase
        .from("startups")
        .update({
          current_round: formData.current_funding_stage,
          total_raised: formData.total_raised_so_far,
          valuation: formData.current_valuation,
          previous_investors: formData.previous_investors,
          target_amount: formData.target_amount_to_raise,
          equity_percentage_offered: formData.equity_percentage_offered,
          planned_use_of_funds: formData.planned_use_of_funds,
          fundraising_timeline_months: formData.fundraising_timeline_months,
          revenue: formData.monthly_revenue,
          burn_rate: formData.monthly_burn_rate,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (updateError) throw updateError

      toast({
        title: "Funding information saved",
        description: "Let's proceed to uploading documents.",
        variant: "success",
      })
      router.push("/onboarding/startup/documents") // Navigate to the new documents page
    } catch (err: any) {
      console.error("Error saving funding information:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const runwayMonths =
    formData.monthly_burn_rate > 0 ? (formData.total_raised_so_far / formData.monthly_burn_rate).toFixed(1) : "N/A"

  return (
    <OnboardingLayout type="startup">
      <TooltipProvider>
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4">Current Funding</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fields for current funding */}
              <div>
                <Label htmlFor="current_funding_stage">Current Funding Stage *</Label>
                <Select
                  value={formData.current_funding_stage}
                  onValueChange={(value) => setFormData({ ...formData, current_funding_stage: value })}
                  required
                >
                  <SelectTrigger id="current_funding_stage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNDING_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="total_raised_so_far">Total Raised So Far (USD) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="total_raised_so_far"
                    type="number"
                    value={formData.total_raised_so_far}
                    onChange={(e) => setFormData({ ...formData, total_raised_so_far: Number(e.target.value) })}
                    placeholder="e.g., 500000"
                    className="pl-8"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="current_valuation">Current Valuation (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current_valuation"
                    type="number"
                    value={formData.current_valuation}
                    onChange={(e) => setFormData({ ...formData, current_valuation: Number(e.target.value) })}
                    placeholder="e.g., 2000000"
                    className="pl-8"
                    min="0"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Previous Investors</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={previousInvestorInput}
                    onChange={(e) => setPreviousInvestorInput(e.target.value)}
                    placeholder="Add investor name or firm"
                  />
                  <Button type="button" variant="outline" onClick={handleAddPreviousInvestor}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.previous_investors.map((investor) => (
                    <Badge key={investor} variant="secondary">
                      {investor}
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={() => handleRemovePreviousInvestor(investor)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Funding Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fields for funding goals */}
              <div>
                <Label htmlFor="target_amount_to_raise">Target Amount to Raise (USD) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="target_amount_to_raise"
                    type="number"
                    value={formData.target_amount_to_raise}
                    onChange={(e) => setFormData({ ...formData, target_amount_to_raise: Number(e.target.value) })}
                    placeholder="e.g., 1000000"
                    className="pl-8"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="equity_percentage_offered">Equity Offered (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="equity_percentage_offered"
                    type="number"
                    value={formData.equity_percentage_offered}
                    onChange={(e) => setFormData({ ...formData, equity_percentage_offered: Number(e.target.value) })}
                    placeholder="e.g., 10"
                    className="pl-8"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Planned Use of Funds *</Label>
                <Select onValueChange={handleUseOfFundsChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select uses (multiple allowed)" />
                  </SelectTrigger>
                  <SelectContent>
                    {USE_OF_FUNDS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} disabled={formData.planned_use_of_funds.includes(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.planned_use_of_funds.map((use) => (
                    <Badge key={use} variant="secondary">
                      {use}
                      <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleUseOfFundsChange(use)} />
                    </Badge>
                  ))}
                </div>
                {formData.planned_use_of_funds.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Please select at least one use of funds.</p>
                )}
              </div>
              <div>
                <Label htmlFor="fundraising_timeline_months">Fundraising Timeline (Months)</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fundraising_timeline_months"
                    type="number"
                    value={formData.fundraising_timeline_months}
                    onChange={(e) => setFormData({ ...formData, fundraising_timeline_months: Number(e.target.value) })}
                    placeholder="e.g., 6"
                    className="pl-8"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Financial Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fields for financial metrics */}
              <div>
                <Label htmlFor="monthly_revenue">Monthly Revenue (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="monthly_revenue"
                    type="number"
                    value={formData.monthly_revenue}
                    onChange={(e) => setFormData({ ...formData, monthly_revenue: Number(e.target.value) })}
                    placeholder="e.g., 10000"
                    className="pl-8"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="monthly_burn_rate">Monthly Burn Rate (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="monthly_burn_rate"
                    type="number"
                    value={formData.monthly_burn_rate}
                    onChange={(e) => setFormData({ ...formData, monthly_burn_rate: Number(e.target.value) })}
                    placeholder="e.g., 5000"
                    className="pl-8"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <Label>
                  Runway (Months)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="inline ml-1 h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Estimated months until funds run out (Total Raised / Monthly Burn Rate)</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input value={runwayMonths} readOnly className="bg-gray-100 dark:bg-gray-700" />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={() => router.push("/onboarding/startup/team")}>
              Back
            </Button>
            <Button type="submit" disabled={loading || formData.planned_use_of_funds.length === 0}>
              {loading ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </form>
      </TooltipProvider>
    </OnboardingLayout>
  )
}
