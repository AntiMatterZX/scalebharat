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
      <div className="container-fluid py-10">
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
    <div className="container-fluid py-6 space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 animate-fade-in">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="heading-3">{startupData.company_name || "Your Startup"}</h1>
            {getStatusBadge(startupData.status)}
          </div>
          <p className="body-medium text-muted-foreground">
            {startupData.tagline || "Welcome to your startup dashboard"}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4 text-primary" />
              <span>{startupData.upvote_count || 0} Upvotes</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4 text-primary" />
              <span>{stats.profileViews} Views</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" asChild>
            <Link href="/startup/profile">
              <Target className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
          <Button asChild>
            <Link href="/startup/matches">
              <Zap className="mr-2 h-4 w-4" />
              View Matches
              <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>

      {startupData.status === "pending_approval" && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <Clock className="h-4 w-4" />
          <AlertDescription>
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
        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your profile is currently a draft and not visible to investors.
            <Link href="/onboarding/startup/review" className="font-semibold underline ml-1">
              Review and submit for approval
            </Link>{" "}
            when you're ready.
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
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
            title: "Interested Investors",
            value: stats.interestedInvestors,
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
          }
        ].map((stat, index) => (
          <Card key={stat.title} className="card-elevated hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {/* Funding Progress Card */}
        <Card className="lg:col-span-2 card-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  Funding Progress
                </CardTitle>
                <CardDescription className="mt-2">
                  {fundingStats.raised.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}{" "}
                  raised of{" "}
                  {fundingStats.goal.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}{" "}
                  goal
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/startup/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Current Round: {startupData.current_round || "N/A"}</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{fundingStats.percentage.toFixed(1)}%</span>
            </div>
            
            <div className="space-y-2">
              <Progress value={fundingStats.percentage} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Amount Raised</p>
                <p className="text-xl font-bold text-green-600">
                  {fundingStats.raised.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Funding Goal</p>
                <p className="text-xl font-bold">
                  {fundingStats.goal.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Meetings Card */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              Upcoming Meetings
            </CardTitle>
            <CardDescription>Your scheduled investor meetings</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium">{meeting.investor || "Investor"}</p>
                      <Badge variant={meeting.status === "confirmed" ? "default" : "secondary"}>
                        {meeting.status === "confirmed" ? "Confirmed" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(meeting.date).toLocaleDateString()} at{" "}
                      {new Date(meeting.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No upcoming meetings"
                description="Schedule meetings with interested investors"
                action={{
                  label: "Schedule Meeting",
                  href: "/startup/meetings"
                }}
                icon={<Calendar className="h-8 w-8 text-muted-foreground" />}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity">
        <TabsList className="mb-4">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>The latest activity on your profile</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
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
              <CardDescription>Investors that match your startup profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-muted-foreground">Your matches will appear here</p>
                <Link href="/startup/matches">
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
              <CardDescription>Your conversations with investors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-muted-foreground">Your messages will appear here</p>
                <Link href="/startup/messages">
                  <Button variant="outline" className="mt-2">
                    View All Messages
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
      <FileUpload
        onUpload={(url) => setValue('banner_image', url)}
        accept="image/*"
        bucket="public-banners"
        path={`startup-banners/${user?.id}`}
        label="Upload Banner Image"
      />
      <Input {...register('banner_image')} placeholder="Banner Image URL (or upload above)" />
    </div>
  )
}
