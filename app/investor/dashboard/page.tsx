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
import { cn } from "@/lib/utils"

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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex items-center justify-center h-60">
            <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !dashboardData?.investorData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive text-lg sm:text-xl">Dashboard Error</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 text-center">
              <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-destructive mx-auto mb-4" />
              <p className="mb-4 text-base sm:text-lg">{error || "Could not load investor profile."}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {error?.includes("Investor profile not found") && (
                  <Link href="/onboarding/investor">
                    <Button className="w-full sm:w-auto">Complete Your Profile</Button>
                  </Link>
                )}
                {error?.includes("User not authenticated") && (
                  <Link href="/auth/login">
                    <Button className="w-full sm:w-auto">Log In</Button>
                  </Link>
                )}
                {!error?.includes("Investor profile not found") && !error?.includes("User not authenticated") && (
                  <Button onClick={() => window.location.reload()} className="w-full sm:w-auto">Try Again</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const { investorData, stats, upcomingMeetings, recentActivity } = dashboardData

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
        {/* Enhanced Responsive Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6 animate-fade-in">
          <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
              {investorData.firm_name || "Your Dashboard"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">Welcome to your investor dashboard</p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2 sm:flex-shrink-0">
            {getStatusBadge(investorData.status)}
          </div>
        </div>

        {/* Enhanced Responsive Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 animate-slide-up">
          {[
            {
              title: "Profile Views",
              value: stats.profileViews,
              subtitle: "This month",
              icon: Eye,
              color: "text-blue-600",
              bgColor: "bg-blue-100 dark:bg-blue-900/20"
            },
            {
              title: "Matches",
              value: stats.totalMatches,
              subtitle: "Total matches",
              icon: Users,
              color: "text-green-600",
              bgColor: "bg-green-100 dark:bg-green-900/20"
            },
            {
              title: "Interested Startups",
              value: stats.interestedStartups,
              subtitle: "Showing interest",
              icon: TrendingUp,
              color: "text-purple-600",
              bgColor: "bg-purple-100 dark:bg-purple-900/20"
            },
            {
              title: "Meetings",
              value: stats.meetingsScheduled,
              subtitle: "Scheduled",
              icon: Calendar,
              color: "text-orange-600",
              bgColor: "bg-orange-100 dark:bg-orange-900/20"
            },
            {
              title: "Wishlist",
              value: stats.wishlistCount,
              subtitle: "Saved startups",
              icon: Heart,
              color: "text-red-600",
              bgColor: "bg-red-100 dark:bg-red-900/20"
            }
          ].map((stat, index) => (
            <Card key={stat.title} className="card-elevated hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                  {stat.title}
                </CardTitle>
                <div className={cn("p-1.5 sm:p-2 rounded-lg flex-shrink-0", stat.bgColor)}>
                  <stat.icon className={cn("h-3 w-3 sm:h-4 sm:w-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xl sm:text-2xl font-bold mb-1">{stat.value}</div>
                <p className="text-xs text-muted-foreground line-clamp-1">{stat.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced Responsive Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Investment Focus Card - Responsive */}
          <Card className="xl:col-span-2 card-elevated">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Investment Focus</CardTitle>
              <CardDescription className="text-sm sm:text-base">Your current investment preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="font-medium mb-2 text-sm sm:text-base">Industries</h3>
                  <div className="flex flex-wrap gap-2">
                    {investorData.investment_industries && investorData.investment_industries.length > 0 ? (
                      investorData.investment_industries.map((industry: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {industry}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground">No industries specified</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2 text-sm sm:text-base">Investment Stages</h3>
                  <div className="flex flex-wrap gap-2">
                    {investorData.investment_stages && investorData.investment_stages.length > 0 ? (
                      investorData.investment_stages.map((stage: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {stage}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground">No investment stages specified</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2 text-sm sm:text-base">Investment Range</h3>
                  <p className="text-sm sm:text-base">
                    {investorData.check_size_min && investorData.check_size_max
                      ? `$${investorData.check_size_min.toLocaleString()} - $${investorData.check_size_max.toLocaleString()}`
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Meetings Card - Responsive */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Upcoming Meetings</CardTitle>
              <CardDescription className="text-sm">Your scheduled startup meetings</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingMeetings && upcomingMeetings.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex flex-col xs:flex-row xs:justify-between xs:items-center border-b pb-3 last:border-0 gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{meeting.startup || "Startup"}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(meeting.date).toLocaleDateString()} at{" "}
                          {new Date(meeting.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge
                          variant={meeting.status === "confirmed" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {meeting.status === "confirmed" ? "Confirmed" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-muted-foreground text-sm sm:text-base mb-3 sm:mb-4">No upcoming meetings</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/investor/meetings">Schedule a Meeting</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Responsive Tabs */}
        <Tabs defaultValue="activity" className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex mb-4 sm:mb-6">
              <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
              <TabsTrigger value="matches" className="text-xs sm:text-sm">Matches</TabsTrigger>
              <TabsTrigger value="messages" className="text-xs sm:text-sm">Messages</TabsTrigger>
              <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
                <CardDescription className="text-sm sm:text-base">The latest activity on your profile</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 sm:space-x-4 border-b pb-3 sm:pb-4 last:border-0">
                        <div
                          className={cn(
                            "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0",
                            activity.type === "view"
                              ? "bg-blue-100 dark:bg-blue-900"
                              : activity.type === "match"
                                ? "bg-green-100 dark:bg-green-900"
                                : "bg-purple-100 dark:bg-purple-900"
                          )}
                        >
                          {activity.type === "view" ? (
                            <Eye className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-300" />
                          ) : activity.type === "match" ? (
                            <Users className="h-3 w-3 sm:h-5 sm:w-5 text-green-600 dark:text-green-300" />
                          ) : (
                            <MessageSquare className="h-3 w-3 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base">{activity.message}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()} at{" "}
                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <p className="text-muted-foreground text-sm sm:text-base">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Your Matches</CardTitle>
                <CardDescription className="text-sm sm:text-base">Startups that match your investment criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 sm:py-8">
                  <p className="text-muted-foreground text-sm sm:text-base mb-3 sm:mb-4">Your matches will appear here</p>
                  <Link href="/investor/matches">
                    <Button variant="outline" size="sm">
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
                <CardTitle className="text-lg sm:text-xl">Recent Messages</CardTitle>
                <CardDescription className="text-sm sm:text-base">Your conversations with startups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 sm:py-8">
                  <p className="text-muted-foreground text-sm sm:text-base mb-3 sm:mb-4">Your messages will appear here</p>
                  <Link href="/investor/messages">
                    <Button variant="outline" size="sm">
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
                <CardTitle className="text-lg sm:text-xl">Edit Investor Profile</CardTitle>
                <CardDescription className="text-sm sm:text-base">Update your investor information below.</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Banner Image Preview - Responsive */}
                {watch('banner_image') && (
                  <div className="mb-4 sm:mb-6">
                    <div className="w-full h-32 sm:h-40 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      <img
                        src={watch('banner_image')}
                        alt="Banner Preview"
                        className="object-cover w-full h-full"
                        style={{ maxHeight: 180 }}
                      />
                    </div>
                  </div>
                )}
                <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">Firm Name</label>
                      <Input {...register('firm_name')} placeholder="Firm Name" className="text-sm sm:text-base" />
                    </div>
                    <div>
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">Investor Type</label>
                      <Select {...register('type')} value={watch('type') || ''} onValueChange={v => setValue('type', v)}>
                        <SelectTrigger className="text-sm sm:text-base"><SelectValue placeholder="Select type" /></SelectTrigger>
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
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">Bio / Description</label>
                      <Textarea {...register('bio')} placeholder="Description" rows={3} className="text-sm sm:text-base" />
                    </div>
                    <div>
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">Check Size Min</label>
                      <Input type="number" step="0.01" {...register('check_size_min')} placeholder="Minimum Check Size" className="text-sm sm:text-base" />
                    </div>
                    <div>
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">Check Size Max</label>
                      <Input type="number" step="0.01" {...register('check_size_max')} placeholder="Maximum Check Size" className="text-sm sm:text-base" />
                    </div>
                    <div>
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">Industries (comma separated)</label>
                      <Input {...register('investment_industries')} placeholder="e.g. technology, healthcare" className="text-sm sm:text-base" />
                    </div>
                    <div>
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">Stages (comma separated)</label>
                      <Input {...register('investment_stages')} placeholder="e.g. seed, series-a" className="text-sm sm:text-base" />
                    </div>
                    <div>
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">Geographies (comma separated)</label>
                      <Input {...register('investment_geographies')} placeholder="e.g. US, Europe" className="text-sm sm:text-base" />
                    </div>
                    <div>
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">Business Models (comma separated)</label>
                      <Input {...register('business_models')} placeholder="e.g. B2B, B2C" className="text-sm sm:text-base" />
                    </div>
                    <div>
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">AUM (USD)</label>
                      <Input type="number" step="0.01" {...register('aum')} placeholder="Assets Under Management" className="text-sm sm:text-base" />
                    </div>
                    <div>
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">Fund Size (USD)</label>
                      <Input type="number" step="0.01" {...register('fund_size')} placeholder="Fund Size" className="text-sm sm:text-base" />
                    </div>
                    <div>
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">Logo URL</label>
                      <Input {...register('logo')} placeholder="Logo URL" className="text-sm sm:text-base" />
                    </div>
                    <div>
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">Website</label>
                      <Input {...register('website')} placeholder="Website" className="text-sm sm:text-base" />
                    </div>
                    <div>
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">LinkedIn</label>
                      <Input {...register('linkedin')} placeholder="LinkedIn URL" className="text-sm sm:text-base" />
                    </div>
                    <div>
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">Twitter</label>
                      <Input {...register('twitter')} placeholder="Twitter URL" className="text-sm sm:text-base" />
                    </div>
                    <div>
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">Status</label>
                      <Select {...register('status')} value={watch('status') || ''} onValueChange={v => setValue('status', v)}>
                        <SelectTrigger className="text-sm sm:text-base"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-1 sm:mb-2 font-medium text-sm sm:text-base">Banner Image URL</label>
                      <Input {...register('banner_image')} placeholder="Banner Image URL (e.g. from Unsplash or your uploads)" className="text-sm sm:text-base" />
                    </div>
                  </div>
                  {profileError && <div className="text-destructive text-sm">{profileError}</div>}
                  {profileSuccess && <div className="text-green-600 text-sm">{profileSuccess}</div>}
                  <Button type="submit" disabled={profileLoading} className="mt-4 w-full sm:w-auto">
                    {profileLoading ? 'Saving...' : 'Save Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
