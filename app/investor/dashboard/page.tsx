"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { Eye, Users, Calendar, TrendingUp, AlertCircle, Clock, Heart, Loader2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Database } from "@/types/database"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'

type InvestorProfile = Database["public"]["Tables"]["investors"]["Row"]
type InvestorDashboardData = {
  investorData: InvestorProfile
  stats: {
    profileViews: number
    totalMatches: number
    interestedStartups: number
    meetingsScheduled: number
    wishlistCount: number
  }
  upcomingMeetings: any[]
  recentActivity: any[]
}

export default function InvestorDashboardPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<InvestorDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const { register, handleSubmit, setValue, reset, watch } = useForm({})

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true)
      setError(null)

      try {
        // Get the current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          setError("Failed to get session. Please try logging in again.")
          setLoading(false)
          return
        }

        if (!session?.user) {
          setError("User not authenticated. Please log in.")
          setLoading(false)
          router.push("/auth/login")
          return
        }

        setUser(session.user)

        // Fetch dashboard data from API
        const response = await fetch("/api/dashboard/investor", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          credentials: "include",
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }

        const data: InvestorDashboardData = await response.json()
        setDashboardData(data)
        setError(null)
      } catch (err: any) {
        console.error("Error fetching investor dashboard data:", err)
        const errorMessage = err.message || "An unexpected error occurred."
        setError(errorMessage)
        toast({
          title: "Error Loading Dashboard",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [toast, router])

  // Fetch profile for the form
  useEffect(() => {
    if (!dashboardData?.investorData) return
    reset({
      ...dashboardData.investorData,
      investment_industries: (dashboardData.investorData.investment_industries || []).join(", "),
      investment_stages: (dashboardData.investorData.investment_stages || []).join(", "),
      investment_geographies: (dashboardData.investorData.investment_geographies || []).join(", "),
      business_models: (dashboardData.investorData.business_models || []).join(", ")
    })
  }, [dashboardData, reset])

  const onProfileSubmit = async (data: any) => {
    setProfileLoading(true)
    setProfileError(null)
    setProfileSuccess(null)
    try {
      // Convert comma-separated fields to arrays
      const payload = {
        ...data,
        investment_industries: data.investment_industries.split(',').map((s: string) => s.trim()).filter(Boolean),
        investment_stages: data.investment_stages.split(',').map((s: string) => s.trim()).filter(Boolean),
        investment_geographies: data.investment_geographies.split(',').map((s: string) => s.trim()).filter(Boolean),
        business_models: data.business_models.split(',').map((s: string) => s.trim()).filter(Boolean),
      }
      const res = await fetch('/api/investors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update profile')
      }
      setProfileSuccess('Profile updated successfully!')
      setTimeout(() => setProfileSuccess(null), 2000)
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const getStatusBadge = (status: InvestorProfile["status"] | undefined) => {
    if (!status) return null
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Active
          </Badge>
        )
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-60">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error || !dashboardData?.investorData) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Dashboard Error</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="mb-4 text-lg">{error || "Could not load investor profile."}</p>
            {error?.includes("Investor profile not found") && (
              <Link href="/onboarding/investor">
                <Button>Complete Your Profile</Button>
              </Link>
            )}
            {error?.includes("User not authenticated") && (
              <Link href="/auth/login">
                <Button>Log In</Button>
              </Link>
            )}
            {!error?.includes("Investor profile not found") && !error?.includes("User not authenticated") && (
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const { investorData, stats, upcomingMeetings, recentActivity } = dashboardData

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{investorData.firm_name || "Your Dashboard"}</h1>
          <p className="text-muted-foreground">Welcome to your investor dashboard</p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">{getStatusBadge(investorData.status)}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profileViews}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMatches}</div>
            <p className="text-xs text-muted-foreground">Total matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interested Startups</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interestedStartups}</div>
            <p className="text-xs text-muted-foreground">Showing interest</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.meetingsScheduled}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wishlist</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.wishlistCount}</div>
            <p className="text-xs text-muted-foreground">Saved startups</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Investment Focus</CardTitle>
            <CardDescription>Your current investment preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Industries</h3>
                <div className="flex flex-wrap gap-2">
                  {investorData.investment_industries && investorData.investment_industries.length > 0 ? (
                    investorData.investment_industries.map((industry: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {industry}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No industries specified</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Investment Stages</h3>
                <div className="flex flex-wrap gap-2">
                  {investorData.investment_stages && investorData.investment_stages.length > 0 ? (
                    investorData.investment_stages.map((stage: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {stage}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No investment stages specified</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Investment Range</h3>
                <p>
                  {investorData.check_size_min && investorData.check_size_max
                    ? `$${investorData.check_size_min.toLocaleString()} - $${investorData.check_size_max.toLocaleString()}`
                    : "Not specified"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Meetings</CardTitle>
            <CardDescription>Your scheduled startup meetings</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMeetings && upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{meeting.startup || "Startup"}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(meeting.date).toLocaleDateString()} at{" "}
                        {new Date(meeting.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          meeting.status === "confirmed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {meeting.status === "confirmed" ? "Confirmed" : "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No upcoming meetings</p>
                <Button variant="outline" className="mt-2" asChild>
                  <Link href="/investor/meetings">Schedule a Meeting</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity">
        <TabsList className="mb-4">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>The latest activity on your profile</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 border-b pb-4 last:border-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === "view"
                            ? "bg-blue-100 dark:bg-blue-900"
                            : activity.type === "match"
                              ? "bg-green-100 dark:bg-green-900"
                              : "bg-purple-100 dark:bg-purple-900"
                        }`}
                      >
                        {activity.type === "view" ? (
                          <Eye className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        ) : activity.type === "match" ? (
                          <Users className="h-5 w-5 text-green-600 dark:text-green-300" />
                        ) : (
                          <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                        )}
                      </div>
                      <div>
                        <p>{activity.message}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString()} at{" "}
                          {new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle>Your Matches</CardTitle>
              <CardDescription>Startups that match your investment criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-muted-foreground">Your matches will appear here</p>
                <Link href="/investor/matches">
                  <Button variant="outline" className="mt-2">
                    View All Matches
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Your conversations with startups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-muted-foreground">Your messages will appear here</p>
                <Link href="/investor/messages">
                  <Button variant="outline" className="mt-2">
                    View All Messages
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Edit Investor Profile</CardTitle>
              <CardDescription>Update your investor information below.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Banner Image Preview */}
              {watch('banner_image') && (
                <div className="mb-4">
                  <div className="w-full h-40 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    <img
                      src={watch('banner_image')}
                      alt="Banner Preview"
                      className="object-cover w-full h-full"
                      style={{ maxHeight: 180 }}
                    />
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium">Firm Name</label>
                    <Input {...register('firm_name')} placeholder="Firm Name" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Investor Type</label>
                    <Select {...register('type')} value={watch('type') || ''} onValueChange={v => setValue('type', v)}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="angel">Angel</SelectItem>
                        <SelectItem value="vc">VC</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="accelerator">Accelerator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-1 font-medium">Bio / Description</label>
                    <Textarea {...register('bio')} placeholder="Description" rows={3} />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Check Size Min</label>
                    <Input type="number" step="0.01" {...register('check_size_min')} placeholder="Minimum Check Size" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Check Size Max</label>
                    <Input type="number" step="0.01" {...register('check_size_max')} placeholder="Maximum Check Size" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Industries (comma separated)</label>
                    <Input {...register('investment_industries')} placeholder="e.g. technology, healthcare" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Stages (comma separated)</label>
                    <Input {...register('investment_stages')} placeholder="e.g. seed, series-a" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Geographies (comma separated)</label>
                    <Input {...register('investment_geographies')} placeholder="e.g. US, Europe" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Business Models (comma separated)</label>
                    <Input {...register('business_models')} placeholder="e.g. B2B, B2C" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">AUM (USD)</label>
                    <Input type="number" step="0.01" {...register('aum')} placeholder="Assets Under Management" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Fund Size (USD)</label>
                    <Input type="number" step="0.01" {...register('fund_size')} placeholder="Fund Size" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Logo URL</label>
                    <Input {...register('logo')} placeholder="Logo URL" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Website</label>
                    <Input {...register('website')} placeholder="Website" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">LinkedIn</label>
                    <Input {...register('linkedin')} placeholder="LinkedIn URL" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Twitter</label>
                    <Input {...register('twitter')} placeholder="Twitter URL" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Status</label>
                    <Select {...register('status')} value={watch('status') || ''} onValueChange={v => setValue('status', v)}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-1 font-medium">Banner Image URL</label>
                    <Input {...register('banner_image')} placeholder="Banner Image URL (e.g. from Unsplash or your uploads)" />
                  </div>
                </div>
                {profileError && <div className="text-destructive text-sm">{profileError}</div>}
                {profileSuccess && <div className="text-green-600 text-sm">{profileSuccess}</div>}
                <Button type="submit" disabled={profileLoading} className="mt-4">
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
