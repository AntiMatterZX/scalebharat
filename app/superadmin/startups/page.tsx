"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AdminLayout } from "@/components/layout/admin-layout"
import {
  CheckCircle,
  XCircle,
  Pause,
  Search,
  MoreHorizontal,
  Eye,
  Mail,
  Calendar,
  Building2,
  Users,
  AlertTriangle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

interface Startup {
  id: string
  slug: string
  company_name: string
  tagline: string
  description: string
  logo: string
  stage: string
  industry: string[]
  status: "draft" | "pending_approval" | "published" | "suspended"
  is_verified: boolean
  created_at: string
  updated_at: string
  users: {
    id: string
    first_name: string
    last_name: string
    email: string
    profile_picture: string
  }
}

interface StartupStats {
  total: number
  pending: number
  approved: number
  rejected: number
  suspended: number
}

export default function SuperAdminStartupsPage() {
  const [startups, setStartups] = useState<Startup[]>([])
  const [stats, setStats] = useState<StartupStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedStartups, setSelectedStartups] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    action: "approve" | "reject" | "suspend" | null
    startup: Startup | null
    isBulk: boolean
  }>({
    open: false,
    action: null,
    startup: null,
    isBulk: false,
  })
  const [reason, setReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadStartups()
    loadStats()
  }, [currentPage, statusFilter])

  const loadStartups = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      })

      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/superadmin/startups?${params}`)
      const data = await response.json()

      if (response.ok) {
        setStartups(data.startups || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        console.error("API Error:", data.error)
        setStartups([])
        toast({
          title: "Error",
          description: data.error || "Failed to load startups",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading startups:", error)
      setStartups([])
      toast({
        title: "Error",
        description: "Failed to load startups",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch("/api/superadmin/startups?limit=1000")
      const data = await response.json()

      if (response.ok && data.startups) {
        const allStartups = data.startups
        setStats({
          total: allStartups.length,
          pending: allStartups.filter((s: Startup) => s.status === "pending_approval").length,
          approved: allStartups.filter((s: Startup) => s.status === "published" && s.is_verified).length,
          rejected: allStartups.filter((s: Startup) => s.status === "draft").length,
          suspended: allStartups.filter((s: Startup) => s.status === "suspended").length,
        })
      } else {
        console.error("Stats loading error:", data.error)
        setStats({
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          suspended: 0,
        })
      }
    } catch (error) {
      console.error("Error loading stats:", error)
      setStats({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        suspended: 0,
      })
    }
  }

  const handleSingleAction = async (startup: Startup, action: "approve" | "reject" | "suspend") => {
    setActionDialog({
      open: true,
      action,
      startup,
      isBulk: false,
    })
  }

  const handleBulkAction = async (action: "approve" | "reject" | "suspend") => {
    if (selectedStartups.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select startups to perform bulk action",
        variant: "destructive",
      })
      return
    }

    setActionDialog({
      open: true,
      action,
      startup: null,
      isBulk: true,
    })
  }

  const executeAction = async () => {
    if (!actionDialog.action) return

    try {
      setProcessing(true)

      if (actionDialog.isBulk) {
        // Bulk action - we'll need to update this to use slugs
        const response = await fetch("/api/superadmin/startups/bulk-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startupSlugs: selectedStartups, // Changed from startupIds to startupSlugs
            action: actionDialog.action,
            reason,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          toast({
            title: "Success",
            description: data.message,
          })
          setSelectedStartups([])
        } else {
          throw new Error(data.error)
        }
      } else {
        // Single action using slug
        const response = await fetch(`/api/superadmin/startups/${actionDialog.startup?.slug}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: actionDialog.action,
            reason,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          toast({
            title: "Success",
            description: data.message,
          })
        } else {
          throw new Error(data.error)
        }
      }

      // Refresh data
      await loadStartups()
      await loadStats()

      // Close dialog
      setActionDialog({ open: false, action: null, startup: null, isBulk: false })
      setReason("")
    } catch (error) {
      console.error("Error executing action:", error)
      toast({
        title: "Error",
        description: "Failed to execute action",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string, isVerified: boolean) => {
    switch (status) {
      case "pending_approval":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Pending Review
          </Badge>
        )
      case "published":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            {isVerified ? "Approved & Published" : "Published (Unverified)"}
          </Badge>
        )
      case "draft":
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            Draft/Rejected
          </Badge>
        )
      case "suspended":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            Suspended
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown ({status})</Badge>
    }
  }

  const filteredStartups = (startups || []).filter(
    (startup) =>
      startup.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      startup.users?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      startup.users?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      startup.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Startup Management</h1>
          <p className="text-muted-foreground">Review and manage startup applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Startups</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.rejected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <Pause className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search startups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending_approval">Pending</SelectItem>
                    <SelectItem value="published">Approved</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedStartups.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleBulkAction("approve")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve ({selectedStartups.length})
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("reject")}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject ({selectedStartups.length})
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("suspend")}>
                    <Pause className="h-4 w-4 mr-2" />
                    Suspend ({selectedStartups.length})
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredStartups.map((startup) => (
                <div key={startup.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedStartups.includes(startup.slug)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStartups([...selectedStartups, startup.slug])
                        } else {
                          setSelectedStartups(selectedStartups.filter((slug) => slug !== startup.slug))
                        }
                      }}
                    />

                    <Avatar className="h-12 w-12">
                      <AvatarImage src={startup.logo || "/placeholder.svg"} alt={startup.company_name} />
                      <AvatarFallback>{startup.company_name.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{startup.company_name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{startup.tagline}</p>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{startup.description}</p>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {startup.users.first_name} {startup.users.last_name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {startup.users.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(startup.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {getStatusBadge(startup.status, startup.is_verified)}
                          <Badge variant="outline">{startup.stage}</Badge>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/startups/${startup.slug}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {startup.status === "pending_approval" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleSingleAction(startup, "approve")}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleSingleAction(startup, "reject")}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {startup.status === "published" && (
                                <DropdownMenuItem
                                  onClick={() => handleSingleAction(startup, "suspend")}
                                  className="text-red-600"
                                >
                                  <Pause className="h-4 w-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredStartups.length === 0 && (
                <div className="text-center py-8 text-gray-500">No startups found matching your criteria.</div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.action === "approve" && "Approve Startup"}
                {actionDialog.action === "reject" && "Reject Startup"}
                {actionDialog.action === "suspend" && "Suspend Startup"}
                {actionDialog.isBulk && ` (${selectedStartups.length} startups)`}
              </DialogTitle>
              <DialogDescription>
                {actionDialog.action === "approve" &&
                  "This will make the startup visible to investors and enable matching."}
                {actionDialog.action === "reject" &&
                  "This will move the startup back to draft status. Please provide a reason."}
                {actionDialog.action === "suspend" &&
                  "This will hide the startup from investors. Please provide a reason."}
              </DialogDescription>
            </DialogHeader>

            {(actionDialog.action === "reject" || actionDialog.action === "suspend") && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason {actionDialog.action === "reject" ? "(required)" : "(optional)"}</Label>
                <Textarea
                  id="reason"
                  placeholder="Provide feedback or reason for this action..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required={actionDialog.action === "reject"}
                />
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActionDialog({ open: false, action: null, startup: null, isBulk: false })}
              >
                Cancel
              </Button>
              <Button
                onClick={executeAction}
                disabled={processing || (actionDialog.action === "reject" && !reason.trim())}
                className={
                  actionDialog.action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }
              >
                {processing ? "Processing..." : `Confirm ${actionDialog.action}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
