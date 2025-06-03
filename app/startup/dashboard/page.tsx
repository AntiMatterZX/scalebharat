"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import {
  Eye,
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  ThumbsUp,
  MessageSquare,
  ArrowUpRight,
  Target,
  Zap,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Database } from "@/types/database"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { FileUpload } from "@/components/ui/file-upload"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { DashboardSkeleton, LoadingState } from "@/components/ui/loading"
import { ErrorState, EmptyState } from "@/components/ui/error-state"
import { cn } from "@/lib/utils"

type StartupProfile = Database["public"]["Tables"]["startups"]["Row"]
type StartupDashboardData = {
  startupData: StartupProfile
  stats: {
    profileViews: number
    totalMatches: number
    interestedInvestors: number
    meetingsScheduled: number
  }
  fundingStats: {
    goal: number
    raised: number
    percentage: number
  }
  upcomingMeetings: any[]
  recentActivity: any[]
}

export default function StartupDashboardPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<StartupDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const { register, watch, setValue } = useForm()

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
        const response = await fetch("/api/dashboard/startup", {
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

        const data: StartupDashboardData = await response.json()
        setDashboardData(data)
        setError(null)
      } catch (err: any) {
        console.error("Error fetching startup dashboard data:", err)
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

  const getStatusBadge = (status: StartupProfile["status"] | undefined) => {
    if (!status) return null
    switch (status) {
      case "published":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Published
          </Badge>
        )
      case "pending_approval":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            Pending Approval
          </Badge>
        )
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error || !dashboardData?.startupData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <ErrorState
          title="Dashboard Error"
          description={error || "Could not load startup profile."}
          action={{
            label: error?.includes("Startup profile not found") ? "Complete Profile" : "Try Again",
            onClick: () => {
              if (error?.includes("Startup profile not found")) {
                router.push("/onboarding/startup")
              } else if (error?.includes("User not authenticated")) {
                router.push("/auth/login")
              } else {
                window.location.reload()
              }
            }
          }}
          showHomeButton={true}
          showBackButton={false}
        />
      </div>
    )
  }

  const { startupData, stats, fundingStats, upcomingMeetings, recentActivity } = dashboardData

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
        {/* Enhanced Responsive Header */}
        <div className="flex flex-col space-y-4 sm:space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
                  {startupData.company_name || "Your Startup"}
                </h1>
                <div className="flex-shrink-0">
                  {getStatusBadge(startupData.status)}
                </div>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
                {startupData.tagline || "Welcome to your startup dashboard"}
              </p>
              <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  <span>{startupData.upvote_count || 0} Upvotes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  <span>{stats?.profileViews || 0} Views</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 sm:flex-shrink-0">
              <Button variant="outline" size="sm" asChild className="w-full xs:w-auto">
                <Link href="/startup/profile">
                  <Target className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Edit Profile</span>
                  <span className="xs:hidden">Edit</span>
                </Link>
              </Button>
              <Button size="sm" asChild className="w-full xs:w-auto">
                <Link href="/startup/matches">
                  <Zap className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">View Matches</span>
                  <span className="xs:hidden">Matches</span>
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Status Alerts - Responsive */}
          {startupData.status === "pending_approval" && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <Clock className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Your profile is currently pending approval by our team. Some features may be limited until approved. You can
                still{" "}
                <Link href={`/startup/profile/edit`} className="font-semibold underline">
                  edit your profile
                </Link>
                .
              </AlertDescription>
            </Alert>
          )}
          {startupData.status === "draft" && (
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Your profile is currently a draft and not visible to investors.
                <Link href="/onboarding/startup/review" className="font-semibold underline ml-1">
                  Review and submit for approval
                </Link>{" "}
                when you're ready.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Enhanced Responsive Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 animate-slide-up">
          {[
            {
              title: "Profile Views",
              value: stats?.profileViews || 0,
              subtitle: "This month",
              icon: Eye,
              color: "text-blue-600",
              bgColor: "bg-blue-100 dark:bg-blue-900/20"
            },
            {
              title: "Matches",
              value: stats?.totalMatches || 0,
              subtitle: "Total matches",
              icon: Users,
              color: "text-green-600",
              bgColor: "bg-green-100 dark:bg-green-900/20"
            },
            {
              title: "Interested Investors",
              value: stats?.interestedInvestors || 0,
              subtitle: "Showing interest",
              icon: TrendingUp,
              color: "text-purple-600",
              bgColor: "bg-purple-100 dark:bg-purple-900/20"
            },
            {
              title: "Meetings",
              value: stats?.meetingsScheduled || 0,
              subtitle: "Scheduled",
              icon: Calendar,
              color: "text-orange-600",
              bgColor: "bg-orange-100 dark:bg-orange-900/20"
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
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">{stat.value}</div>
                <p className="text-xs text-muted-foreground line-clamp-1">{stat.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced Responsive Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Funding Progress Card - Responsive */}
          <Card className="xl:col-span-2 card-elevated">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <span>Funding Progress</span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    {(fundingStats?.raised || 0).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    })}{" "}
                    raised of{" "}
                    {(fundingStats?.goal || 100000).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    })}{" "}
                    goal
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild className="flex-shrink-0">
                  <Link href="/startup/analytics">
                    <BarChart3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Analytics</span>
                    <span className="sm:hidden">Data</span>
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-medium">
                    Current Round: {startupData.current_round || "N/A"}
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-bold text-green-600">
                  {(fundingStats?.percentage || 0).toFixed(1)}%
                </span>
              </div>
              
              <div className="space-y-2">
                <Progress value={fundingStats?.percentage || 0} className="h-2 sm:h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-6 pt-2 sm:pt-4">
                <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Amount Raised</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600">
                    {(fundingStats?.raised || 0).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Funding Goal</p>
                  <p className="text-lg sm:text-xl font-bold">
                    {(fundingStats?.goal || 100000).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Meetings Card - Responsive */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <span className="truncate">Upcoming Meetings</span>
              </CardTitle>
              <CardDescription className="text-sm">Your scheduled investor meetings</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingMeetings && upcomingMeetings.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2 mb-2">
                        <p className="font-medium text-sm sm:text-base truncate">
                          {meeting.investor || "Investor"}
                        </p>
                        <Badge variant={meeting.status === "confirmed" ? "default" : "secondary"} className="text-xs flex-shrink-0">
                          {meeting.status === "confirmed" ? "Confirmed" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(meeting.date).toLocaleDateString()} at{" "}
                        {new Date(meeting.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-medium text-sm sm:text-base">No upcoming meetings</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Schedule meetings with interested investors</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/startup/meetings">
                      Schedule Meeting
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Responsive Tabs */}
        <Tabs defaultValue="activity" className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex mb-4 sm:mb-6">
              <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
              <TabsTrigger value="matches" className="text-xs sm:text-sm">Matches</TabsTrigger>
              <TabsTrigger value="messages" className="text-xs sm:text-sm">Messages</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Activity</CardTitle>
                <CardDescription className="text-sm sm:text-base">The latest activity on your profile</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={activity.id || index} className="flex items-start space-x-3 sm:space-x-4 border-b pb-3 sm:pb-4 last:border-0">
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
                            {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : "Recently"} at{" "}
                            {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Unknown time"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-3">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="font-medium text-sm sm:text-base">No recent activity</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Activity from investors viewing your profile will appear here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Your Matches</CardTitle>
                <CardDescription className="text-sm sm:text-base">Investors that match your startup profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 space-y-3">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-medium text-sm sm:text-base">No matches yet</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Complete your profile to get matched with relevant investors</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/startup/matches">
                      View All Matches
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Recent Messages</CardTitle>
                <CardDescription className="text-sm sm:text-base">Your conversations with investors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 space-y-3">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-medium text-sm sm:text-base">No messages yet</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Messages from interested investors will appear here</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/startup/messages">
                      View All Messages
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* File Upload Section - Hidden for now, keeping functionality intact */}
        <div className="hidden">
          {/* Banner Image Preview */}
          {watch('banner_image') && (
            <div className="mb-4">
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
          <FileUpload
            onUpload={(url) => setValue('banner_image', url)}
            accept="image/*"
            bucket="public-banners"
            path={`startup-banners/${user?.id}`}
            label="Upload Banner Image"
          />
          <Input {...register('banner_image')} placeholder="Banner Image URL (or upload above)" />
        </div>
      </div>
    </div>
  )
}
