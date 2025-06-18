"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  FunnelChart,
  Funnel
} from "recharts"
import { 
  Users, 
  Calendar, 
  Heart, 
  DollarSign, 
  Eye, 
  Target, 
  Activity, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  AlertTriangle,
  Info,
  Lightbulb,
  BarChart3
} from "lucide-react"
import { useAnalytics } from "@/lib/hooks/useAnalytics"
import { useToast } from "@/components/ui/use-toast"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"]

export default function StartupAnalyticsPage() {
  const { toast } = useToast()
  const [startupId, setStartupId] = useState<string | null>(null)
  
  // Get startup ID from user profile
  useEffect(() => {
    const getStartupId = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const profile = await response.json()
          if (profile.type === 'startup' && profile.startupId) {
            setStartupId(profile.startupId)
          } else {
            console.error('User is not a startup or has no startup profile:', profile)
            toast({
              title: "Profile Error",
              description: "Startup profile not found. Please complete your startup profile first.",
              variant: "destructive",
            })
          }
        } else {
          console.error('Failed to fetch user profile:', response.status)
          toast({
            title: "Error",
            description: "Failed to load user profile",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error getting startup ID:', error)
        toast({
          title: "Error",
          description: "Failed to load startup profile",
          variant: "destructive",
        })
      }
    }
    getStartupId()
  }, [toast])

  // Use the enhanced analytics hook
  const {
    metrics,
    conversionFunnel,
    timeSeriesData,
    realTimeMetrics,
    loading,
    error,
    refreshing,
    refresh,
    getMetric,
    getMetricsByCategory,
    getOverallConversionRate,
    getTrend,
    lastUpdated
  } = useAnalytics({
    entityType: 'startup',
    entityId: startupId || undefined,
    refreshInterval: 30000,
    autoRefresh: true
  })

  // Show error if analytics hook fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Analytics Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  if (loading && !startupId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading startup profile...</p>
        </div>
      </div>
    )
  }

  if (!startupId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Startup Profile Required</h2>
          <p className="text-muted-foreground mb-4">
            You need to complete your startup profile to view analytics.
          </p>
          <Button onClick={() => window.location.href = '/startup/profile'}>
            Complete Profile
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  // Get key metrics using the helper functions
  const profileViews = getMetric('engagement', 'profile_views')
  const uniqueViewers = getMetric('engagement', 'unique_viewers')
  const totalMatches = getMetric('matching', 'total_matches')
  const interestedMatches = getMetric('matching', 'interested_matches')
  const totalMeetings = getMetric('meetings', 'total_meetings')
  const completedMeetings = getMetric('meetings', 'completed_meetings')
  const totalUpvotes = getMetric('social', 'total_upvotes')
  const overallConversion = getOverallConversionRate()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Startup Analytics</h1>
            <p className="text-muted-foreground">Real-time insights into your startup's performance</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Activity className="h-3 w-3 mr-1" />
              Live: {realTimeMetrics?.active_users_5min || 0} users
            </Badge>
            <Button onClick={refresh} disabled={refreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Show error alert if there's an issue */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Analytics Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-muted-foreground" />
                {profileViews?.trend_direction === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {profileViews?.trend_direction === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                {profileViews?.trend_direction === 'stable' && <Minus className="h-3 w-3 text-gray-500" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profileViews?.metric_value || 0}</div>
              <p className="text-xs text-muted-foreground">
                {profileViews?.trend_direction !== 'stable' && profileViews?.metric_percentage && (
                  <span className={profileViews?.trend_direction === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {profileViews?.trend_direction === 'up' ? '+' : ''}{profileViews?.metric_percentage.toFixed(1)}%
                  </span>
                )} vs last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-muted-foreground" />
                {totalMatches?.trend_direction === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {totalMatches?.trend_direction === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                {totalMatches?.trend_direction === 'stable' && <Minus className="h-3 w-3 text-gray-500" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMatches?.metric_value || 0}</div>
              <p className="text-xs text-muted-foreground">{interestedMatches?.metric_value || 0} interested</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meetings</CardTitle>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {totalMeetings?.trend_direction === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {totalMeetings?.trend_direction === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                {totalMeetings?.trend_direction === 'stable' && <Minus className="h-3 w-3 text-gray-500" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMeetings?.metric_value || 0}</div>
              <p className="text-xs text-muted-foreground">{completedMeetings?.metric_value || 0} completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upvotes</CardTitle>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-muted-foreground" />
                {totalUpvotes?.trend_direction === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {totalUpvotes?.trend_direction === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                {totalUpvotes?.trend_direction === 'stable' && <Minus className="h-3 w-3 text-gray-500" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUpvotes?.metric_value || 0}</div>
              <p className="text-xs text-muted-foreground">Community support</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conversion Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>Track how visitors convert to interested investors</CardDescription>
                </CardHeader>
                <CardContent>
                  {conversionFunnel && conversionFunnel.length > 0 ? (
                    <div className="space-y-4">
                      {conversionFunnel.map((step, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{step.stage}</span>
                            <span>{step.count} ({step.percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={step.percentage} className="h-2" />
                          {step.drop_off_rate > 0 && (
                            <p className="text-xs text-red-600">
                              {step.drop_off_rate.toFixed(1)}% drop-off from previous stage
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No conversion data available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Real-time Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Activity</CardTitle>
                  <CardDescription>Current activity on your profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active users (5 min)</span>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {realTimeMetrics?.active_users_5min || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active users (1 hour)</span>
                      <Badge variant="outline">
                        {realTimeMetrics?.active_users_1hour || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Last updated</span>
                      <span className="text-xs text-muted-foreground">
                        {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Engagement Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Overview</CardTitle>
                  <CardDescription>How investors are engaging with your profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getMetricsByCategory('engagement').map((metric) => (
                      <div key={metric.metric_name} className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">
                          {metric.metric_name.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{metric.metric_value}</span>
                          {metric.trend_direction === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                          {metric.trend_direction === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Time Series Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Views Trend</CardTitle>
                  <CardDescription>Profile views over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {timeSeriesData && timeSeriesData.profileViews && timeSeriesData.profileViews.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timeSeriesData.profileViews}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No trend data available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Overall Conversion Rate</CardTitle>
                  <CardDescription>From profile view to interested match</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {overallConversion ? `${overallConversion.toFixed(1)}%` : '0%'}
                    </div>
                    <p className="text-muted-foreground">Overall conversion rate</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversion Insights</CardTitle>
                  <CardDescription>Tips to improve your conversion rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Complete your profile</p>
                        <p className="text-xs text-muted-foreground">
                          Complete profiles get 3x more investor interest
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Upload a pitch deck</p>
                        <p className="text-xs text-muted-foreground">
                          Startups with pitch decks see 2x more meetings
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Stay active</p>
                        <p className="text-xs text-muted-foreground">
                          Regular updates increase visibility by 40%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Track your startup's growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                {timeSeriesData && timeSeriesData.profileViews && timeSeriesData.profileViews.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={timeSeriesData.profileViews}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="profile_views" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="total_matches" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                      <Area type="monotone" dataKey="total_meetings" stackId="3" stroke="#ffc658" fill="#ffc658" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No trend data available yet</p>
                    <p className="text-sm">Data will appear as you gain more activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
