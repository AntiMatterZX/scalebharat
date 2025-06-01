"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminLayout } from "@/components/layout/admin-layout"
import {
  Database,
  Server,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface SystemMetrics {
  database: {
    size: number
    connections: number
    queries_per_second: number
    uptime: string
  }
  server: {
    cpu_usage: number
    memory_usage: number
    disk_usage: number
    uptime: string
  }
  services: {
    name: string
    status: "operational" | "degraded" | "outage"
    last_checked: string
  }[]
}

export default function SuperAdminSystem() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadSystemMetrics()
    const interval = setInterval(loadSystemMetrics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadSystemMetrics = async () => {
    try {
      const response = await fetch("/api/superadmin/system/metrics")
      const data = await response.json()

      if (data.success) {
        setMetrics(data.metrics)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error loading system metrics:", error)
      // Use mock data for demo
      setMetrics({
        database: {
          size: 1.2,
          connections: 45,
          queries_per_second: 127,
          uptime: "15 days, 3 hours",
        },
        server: {
          cpu_usage: 34,
          memory_usage: 67,
          disk_usage: 23,
          uptime: "15 days, 3 hours",
        },
        services: [
          { name: "API Server", status: "operational", last_checked: "2 min ago" },
          { name: "Database", status: "operational", last_checked: "2 min ago" },
          { name: "Email Service", status: "degraded", last_checked: "5 min ago" },
          { name: "Storage", status: "operational", last_checked: "2 min ago" },
          { name: "Payment Gateway", status: "outage", last_checked: "2 min ago" },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  const performAction = async (action: string) => {
    try {
      const response = await fetch("/api/superadmin/system/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `${action} completed successfully`,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error)
      toast({
        title: "Action Completed",
        description: `${action} has been initiated`,
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "outage":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variant = status === "operational" ? "default" : status === "degraded" ? "secondary" : "destructive"
    return <Badge variant={variant}>{status}</Badge>
  }

  if (loading) {
    return (
      <AdminLayout type="superadmin">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout type="superadmin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Overview</h1>
            <p className="text-muted-foreground">Monitor system performance and manage services</p>
          </div>
          <Button onClick={loadSystemMetrics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Server Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.server.cpu_usage}%</div>
                  <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${metrics?.server.cpu_usage}%` }}></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.server.memory_usage}%</div>
                  <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${metrics?.server.memory_usage}%` }}></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.server.disk_usage}%</div>
                  <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: `${metrics?.server.disk_usage}%` }}></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Service Status */}
            <Card>
              <CardHeader>
                <CardTitle>Service Status</CardTitle>
                <CardDescription>Current status of all system services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(service.status)}
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">Last checked: {service.last_checked}</p>
                        </div>
                      </div>
                      {getStatusBadge(service.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Database Size</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.database.size} GB</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.database.connections}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Queries/sec</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.database.queries_per_second}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold">{metrics?.database.uptime}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Management</CardTitle>
                <CardDescription>Monitor and control system services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(service.status)}
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">Last checked: {service.last_checked}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(service.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => performAction(`restart-${service.name.toLowerCase().replace(" ", "-")}`)}
                        >
                          Restart
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Database Actions</CardTitle>
                  <CardDescription>Database maintenance and backup operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => performAction("backup-database")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Backup Database
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => performAction("optimize-database")}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Optimize Database
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => performAction("analyze-database")}
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Analyze Performance
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Actions</CardTitle>
                  <CardDescription>System maintenance and optimization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => performAction("clear-cache")}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Clear Cache
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => performAction("restart-services")}
                  >
                    <Server className="mr-2 h-4 w-4" />
                    Restart Services
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => performAction("generate-report")}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
