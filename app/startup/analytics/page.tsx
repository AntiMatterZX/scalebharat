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
          if (profile.userType === 'startup' && profile.startupProfile?.id) {
            setStartupId(profile.startupProfile.id)
          }
        }
      } catch (error) {
        console.error('Error getting startup ID:', error)
      }
    }
    getStartupId()
  }, [])

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

  if (!startupId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Startup profile not found</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
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
              Live: {realTimeMetrics.active_users_5min} users
            </Badge>
            <Button onClick={refresh} disabled={refreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

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
                {profileViews?.trend_direction !== 'stable' && (
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
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMeetings?.metric_value || 0}</div>
              <p className="text-xs text-muted-foreground">{overallConversion.toFixed(1)}% conversion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upvotes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUpvotes?.metric_value || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="engagement" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
          </TabsList>

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Views (30 days)</CardTitle>
                  <CardDescription>Daily profile view trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.charts.profileViews}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upvotes Over Time</CardTitle>
                  <CardDescription>Daily upvote trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.charts.upvotes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Match Status Distribution</CardTitle>
                  <CardDescription>Breakdown of match statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.charts.matches}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.charts.matches.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Meeting Status</CardTitle>
                  <CardDescription>Meeting outcomes and status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.charts.meetings}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="growth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
                <CardDescription>Revenue, users, and growth rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analytics.charts.growth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={2}
                      name="Revenue ($)"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="users"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Users"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="growth"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Growth Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>User journey from profile view to deal closure</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.charts.conversion} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Real-time Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Real-time Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.realtime.activeUsers}</div>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.realtime.liveViews}</div>
                <p className="text-sm text-gray-600">Live Profile Views</p>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">
                  Last Updated: {new Date(analytics.realtime.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
