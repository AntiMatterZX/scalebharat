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

export default function EnhancedStartupAnalyticsPage() {
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

  // Helper function to render trend icon
  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return <Minus className="h-3 w-3 text-gray-500" />
    }
  }

  // Helper function to render metric card
  const renderMetricCard = (
    title: string,
    icon: React.ReactNode,
    metric: any,
    subtitle?: string
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-1">
          {icon}
          {metric && renderTrendIcon(metric.trend_direction)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metric?.metric_value || 0}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {metric?.trend_direction !== 'stable' && (
          <p className="text-xs text-muted-foreground">
            <span className={metric?.trend_direction === 'up' ? 'text-green-600' : 'text-red-600'}>
              {metric?.trend_direction === 'up' ? '+' : ''}{metric?.metric_percentage.toFixed(1)}%
            </span> vs last period
          </p>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Enhanced Analytics</h1>
            <p className="text-muted-foreground">Real-time insights and comprehensive startup metrics</p>
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
          {renderMetricCard(
            "Profile Views",
            <Eye className="h-4 w-4 text-muted-foreground" />,
            profileViews,
            `${uniqueViewers?.metric_value || 0} unique viewers`
          )}
          
          {renderMetricCard(
            "Total Matches",
            <Target className="h-4 w-4 text-muted-foreground" />,
            totalMatches,
            `${interestedMatches?.metric_value || 0} interested`
          )}
          
          {renderMetricCard(
            "Meetings",
            <Calendar className="h-4 w-4 text-muted-foreground" />,
            totalMeetings,
            `${completedMeetings?.metric_value || 0} completed`
          )}
          
          {renderMetricCard(
            "Upvotes",
            <Heart className="h-4 w-4 text-muted-foreground" />,
            totalUpvotes
          )}
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overall Conversion Rate</CardTitle>
              <CardDescription>From views to deals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2">{overallConversion.toFixed(1)}%</div>
              <Progress value={overallConversion} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Engagement Rate</CardTitle>
              <CardDescription>Unique viewers vs total views</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2">
                {profileViews?.metric_value && uniqueViewers?.metric_value
                  ? ((uniqueViewers.metric_value / profileViews.metric_value) * 100).toFixed(1)
                  : 0}%
              </div>
              <Progress 
                value={profileViews?.metric_value && uniqueViewers?.metric_value
                  ? (uniqueViewers.metric_value / profileViews.metric_value) * 100
                  : 0} 
                className="h-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meeting Success Rate</CardTitle>
              <CardDescription>Completed vs scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2">
                {totalMeetings?.metric_value && completedMeetings?.metric_value
                  ? ((completedMeetings.metric_value / totalMeetings.metric_value) * 100).toFixed(1)
                  : 0}%
              </div>
              <Progress 
                value={totalMeetings?.metric_value && completedMeetings?.metric_value
                  ? (completedMeetings.metric_value / totalMeetings.metric_value) * 100
                  : 0} 
                className="h-2" 
              />
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <Tabs defaultValue="funnel" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="realtime">Real-time</TabsTrigger>
          </TabsList>

          <TabsContent value="funnel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Track your startup's journey from views to deals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversionFunnel.map((step, index) => (
                    <div key={step.step_name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {step.step_order}
                        </div>
                        <div>
                          <h3 className="font-medium">{step.step_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {step.count} {step.count === 1 ? 'occurrence' : 'occurrences'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{step.conversion_rate.toFixed(1)}%</div>
                        {step.drop_off_rate > 0 && (
                          <div className="text-sm text-red-600">
                            -{step.drop_off_rate.toFixed(1)}% drop-off
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Views Trend</CardTitle>
                  <CardDescription>Daily profile views over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timeSeriesData.profileViews}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date_label" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="metric_value"
                        stroke="#0088FE"
                        fill="#0088FE"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Matches Trend</CardTitle>
                  <CardDescription>Daily matches over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeSeriesData.matches}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date_label" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="metric_value"
                        stroke="#00C49F"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                  <CardDescription>Breakdown of user engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getMetricsByCategory('engagement').map((metric) => (
                      <div key={metric.metric_name} className="flex justify-between items-center">
                        <span className="capitalize">{metric.metric_name.replace('_', ' ')}</span>
                        <span className="font-bold">{metric.metric_value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Meeting Analytics</CardTitle>
                  <CardDescription>Meeting trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={timeSeriesData.meetings}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date_label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="metric_value" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Active Users (5min)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {realTimeMetrics.active_users_5min}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Active Users (1hr)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {realTimeMetrics.active_users_1hour}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Views Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {realTimeMetrics.profile_views_today}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Matches Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {realTimeMetrics.matches_today}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Real-time Activity</CardTitle>
                <CardDescription>Live platform metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Last updated: {new Date(realTimeMetrics.last_updated).toLocaleTimeString()}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold">{realTimeMetrics.messages_today}</div>
                    <div className="text-sm text-muted-foreground">Messages Today</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold">{realTimeMetrics.meetings_today}</div>
                    <div className="text-sm text-muted-foreground">Meetings Today</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold">{overallConversion.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 