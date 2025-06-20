"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Building2, Users, TrendingUp, MessageSquare } from "lucide-react"

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      // This would be replaced with actual analytics queries
      const mockData = {
        overview: {
          totalUsers: 1250,
          totalStartups: 450,
          totalInvestors: 180,
          totalMatches: 320,
          successfulDeals: 45,
        },
        userGrowth: [
          { month: "Jan", users: 100 },
          { month: "Feb", users: 180 },
          { month: "Mar", users: 280 },
          { month: "Apr", users: 420 },
          { month: "May", users: 650 },
          { month: "Jun", users: 850 },
        ],
        matchingData: [
          { name: "Technology", matches: 120 },
          { name: "Healthcare", matches: 80 },
          { name: "Finance", matches: 60 },
          { name: "Education", matches: 40 },
          { name: "Other", matches: 20 },
        ],
        conversionRates: [
          { name: "Profile Views", value: 100 },
          { name: "Matches Created", value: 25 },
          { name: "Messages Sent", value: 15 },
          { name: "Meetings Scheduled", value: 8 },
          { name: "Deals Closed", value: 3 },
        ],
      }

      setAnalytics(mockData)
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into platform performance</p>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.overview.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Startups</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.overview.totalStartups}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investors</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.overview.totalInvestors}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.overview.totalMatches}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Deals</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.overview.successfulDeals}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="growth" className="space-y-6">
          <TabsList>
            <TabsTrigger value="growth">User Growth</TabsTrigger>
            <TabsTrigger value="matching">Matching Analytics</TabsTrigger>
            <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
          </TabsList>

          <TabsContent value="growth">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Over Time</CardTitle>
                <CardDescription>Monthly user registration trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analytics?.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matching">
            <Card>
              <CardHeader>
                <CardTitle>Matches by Industry</CardTitle>
                <CardDescription>Distribution of matches across different industries</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics?.matchingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="matches" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversion">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>User journey from profile view to deal closure</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics?.conversionRates} layout="horizontal">
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
      </div>
    </div>
  )
}
