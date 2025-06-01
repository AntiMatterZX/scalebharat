"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "recharts"
import { TrendingUp, Building2, Calendar, Briefcase, Target, Activity, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface InvestorAnalyticsData {
  overview: {
    totalMatches: number
    interestedDeals: number
    closedDeals: number
    totalMeetings: number
    portfolioCompanies: number
    averageMatchScore: number
    conversionRate: number
    activeDeals: number
  }
  charts: {
    matches: Array<{ name: string; value: number }>
    meetings: Array<{ name: string; value: number }>
    dealFlow: Array<{ month: string; total: number; interested: number; closed: number }>
    industries: Array<{ name: string; value: number }>
    performance: Array<{ month: string; invested: number; returns: number; deals: number }>
    portfolio: Array<{ name: string; stage: string; revenue: number; users: number; industry: string }>
  }
  realtime: {
    lastUpdated: string
    newMatches: number
    activeStartups: number
  }
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"]

export default function InvestorAnalyticsPage() {
  const [analytics, setAnalytics] = useState<InvestorAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadAnalytics()

    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadAnalytics(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "Please log in to view analytics",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/analytics/investor", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error("Error loading analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Failed to load analytics data</p>
          <Button onClick={() => loadAnalytics()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Analytics</h1>
            <p className="text-gray-600">Real-time insights into your investment pipeline and portfolio</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Activity className="h-3 w-3 mr-1" />
              {analytics.realtime.activeStartups} active startups
            </Badge>
            <Button onClick={() => loadAnalytics(true)} disabled={refreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalMatches}</div>
              <p className="text-xs text-muted-foreground">Avg score: {analytics.overview.averageMatchScore}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interested Deals</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.interestedDeals}</div>
              <p className="text-xs text-muted-foreground">{analytics.overview.conversionRate}% conversion rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.portfolioCompanies}</div>
              <p className="text-xs text-muted-foreground">{analytics.overview.closedDeals} deals closed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.activeDeals}</div>
              <p className="text-xs text-muted-foreground">{analytics.overview.totalMeetings} total meetings</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pipeline">Deal Pipeline</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Deal Flow Over Time</CardTitle>
                  <CardDescription>Monthly deal pipeline trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.charts.dealFlow}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stackId="1"
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.6}
                        name="Total Deals"
                      />
                      <Area
                        type="monotone"
                        dataKey="interested"
                        stackId="2"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                        name="Interested"
                      />
                      <Area
                        type="monotone"
                        dataKey="closed"
                        stackId="3"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.6}
                        name="Closed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Match Status Distribution</CardTitle>
                  <CardDescription>Current pipeline breakdown</CardDescription>
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
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Industry Distribution</CardTitle>
                <CardDescription>Investment focus by industry</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.charts.industries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Companies</CardTitle>
                <CardDescription>Performance overview of your investments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.charts.portfolio.map((company, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{company.name}</h3>
                          <p className="text-sm text-gray-500">
                            {company.industry} • {company.stage}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${(company.revenue / 1000).toFixed(0)}K revenue</div>
                        <div className="text-sm text-gray-500">{(company.users / 1000).toFixed(1)}K users</div>
                      </div>
                    </div>
                  ))}
                  {analytics.charts.portfolio.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No portfolio companies yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Investment Performance</CardTitle>
                <CardDescription>Monthly investment activity and returns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analytics.charts.performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "deals" ? value : `$${((value as number) / 1000).toFixed(0)}K`,
                        name,
                      ]}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="invested"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Invested"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="returns"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Returns"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="deals"
                      stroke="#2563eb"
                      strokeWidth={2}
                      name="Deals"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Meeting Outcomes</CardTitle>
                  <CardDescription>Results from investor meetings</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.charts.meetings}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.charts.meetings.map((entry, index) => (
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
                  <CardTitle>Key Metrics</CardTitle>
                  <CardDescription>Important performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Match Score</span>
                    <Badge variant="secondary">{analytics.overview.averageMatchScore}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <Badge variant="secondary">{analytics.overview.conversionRate}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Pipeline</span>
                    <Badge variant="secondary">{analytics.overview.activeDeals} deals</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Portfolio Size</span>
                    <Badge variant="secondary">{analytics.overview.portfolioCompanies} companies</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Real-time Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Real-time Market Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.realtime.newMatches}</div>
                <p className="text-sm text-gray-600">New Matches Today</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.realtime.activeStartups}</div>
                <p className="text-sm text-gray-600">Active Startups</p>
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
