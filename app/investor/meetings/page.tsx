"use client"

import { useEffect, useState } from "react"
import { Calendar, momentLocalizer, type View, Views } from "react-big-calendar"
import moment from "moment"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Video, Phone, MapPin, Plus, Edit, Trash2, Users, Building2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import "react-big-calendar/lib/css/react-big-calendar.css"

const localizer = momentLocalizer(moment)

interface Meeting {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
  type: string
  status: string
  isOrganizer: boolean
  attendee: string
  meetingLink?: string
  notes?: string
  matchId?: string
}

interface Match {
  id: string
  startup_id: string
  match_score: number
  status: string
  startups: {
    id: string
    company_name: string
    users: {
      first_name: string
      last_name: string
      profile_picture?: string
    }
  }
}

interface MeetingFormData {
  title: string
  description: string
  date: string
  time: string
  duration: string
  type: "video" | "phone" | "in-person"
  meetingType: "matched" | "standalone"
  matchId?: string
  attendeeEmail?: string
  attendeeName?: string
}

export default function InvestorMeetingsPage() {
  const [user, setUser] = useState<any>(null)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [formData, setFormData] = useState<MeetingFormData>({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "30",
    type: "video",
    meetingType: "matched",
  })
  const { toast } = useToast()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadMeetings()
      loadMatches()
    }
  }, [user])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error("Error checking user:", error)
    }
  }

  const loadMeetings = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log("No session found, user not authenticated")
        return
      }

      const response = await fetch("/api/meetings", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const formattedMeetings = data.meetings.map((meeting: any) => ({
        ...meeting,
        start: new Date(meeting.start),
        end: new Date(meeting.end),
      }))

      setMeetings(formattedMeetings)
    } catch (error) {
      console.error("Error loading meetings:", error)
      toast({
        title: "Error",
        description: "Failed to load meetings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMatches = async () => {
    try {
      const { data: investorData } = await supabase
        .from("investors")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (!investorData) return

      const { data: matchData } = await supabase
        .from("matches")
        .select(`
          id,
          startup_id,
          match_score,
          status,
          startup_status,
          investor_status,
          startups (
            id,
            company_name,
            users (
              first_name,
              last_name,
              profile_picture
            )
          )
        `)
        .eq("investor_id", investorData.id)
        .in("status", ["interested", "meeting_scheduled"])
        .or("startup_status.eq.interested,investor_status.eq.interested")

      if (matchData) {
        // Transform the data to match our interface
        const transformedMatches = matchData.map((match: any) => ({
          ...match,
          startups: Array.isArray(match.startups) ? match.startups[0] : match.startups
        }))
        setMatches(transformedMatches)
      }
    } catch (error) {
      console.error("Error loading matches:", error)
    }
  }

  const handleCreateMeeting = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to create meetings",
          variant: "destructive",
        })
        return
      }

      const scheduledAt = new Date(`${formData.date}T${formData.time}`)

      const requestBody: any = {
        title: formData.title,
        description: formData.description,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: Number.parseInt(formData.duration),
        type: formData.type,
        isStandalone: formData.meetingType === "standalone",
      }

      if (formData.meetingType === "matched" && formData.matchId) {
        requestBody.matchId = formData.matchId
      } else if (formData.meetingType === "standalone") {
        // For standalone meetings with external contacts
        if (!formData.attendeeEmail) {
          toast({
            title: "Error",
            description: "Attendee email is required for standalone meetings",
            variant: "destructive",
          })
          return
        }

        // Check if user is trying to schedule with themselves
        if (formData.attendeeEmail.toLowerCase() === user?.email?.toLowerCase()) {
          toast({
            title: "Error",
            description: "You cannot schedule a meeting with yourself",
            variant: "destructive",
          })
          return
        }

        // For standalone meetings, we allow external attendees
        requestBody.attendeeEmail = formData.attendeeEmail
        requestBody.attendeeName = formData.attendeeName || ""
      }

      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Success",
        description: "Meeting created successfully",
      })

      setShowCreateDialog(false)
      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        duration: "30",
        type: "video",
        meetingType: "matched",
      })
      loadMeetings()
    } catch (error) {
      console.error("Error creating meeting:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create meeting",
        variant: "destructive",
      })
    }
  }

  const handleUpdateMeeting = async () => {
    if (!selectedMeeting) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to update meetings",
          variant: "destructive",
        })
        return
      }

      const scheduledAt = new Date(`${formData.date}T${formData.time}`)

      const response = await fetch(`/api/meetings/${selectedMeeting.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: Number.parseInt(formData.duration),
          type: formData.type,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Success",
        description: "Meeting updated successfully",
      })

      setShowEditDialog(false)
      setSelectedMeeting(null)
      loadMeetings()
    } catch (error) {
      console.error("Error updating meeting:", error)
      toast({
        title: "Error",
        description: "Failed to update meeting",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to delete meetings",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Success",
        description: "Meeting deleted successfully",
      })

      loadMeetings()
    } catch (error) {
      console.error("Error deleting meeting:", error)
      toast({
        title: "Error",
        description: "Failed to delete meeting",
        variant: "destructive",
      })
    }
  }

  const handleSelectEvent = (event: Meeting) => {
    setSelectedMeeting(event)
    
    // Extract attendee info for standalone meetings from notes if needed
    let attendeeName = ""
    let attendeeEmail = ""
    
    if (!event.matchId && event.notes && event.notes.startsWith("External attendee:")) {
      const match = event.notes.match(/External attendee: (.+?) \((.+?)\)/)
      if (match) {
        attendeeName = match[1] || ""
        attendeeEmail = match[2] || ""
      }
    }
    
    setFormData({
      title: event.title,
      description: event.description || "",
      date: moment(event.start).format("YYYY-MM-DD"),
      time: moment(event.start).format("HH:mm"),
      duration: Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60)).toString(),
      type: event.type as "video" | "phone" | "in-person",
      meetingType: event.matchId ? "matched" : "standalone",
      matchId: event.matchId,
      attendeeName: attendeeName,
      attendeeEmail: attendeeEmail,
    })
    setShowEditDialog(true)
  }

  const eventStyleGetter = (event: Meeting) => {
    let backgroundColor = "#3174ad"
    let borderColor = "#2563eb"

    switch (event.status) {
      case "confirmed":
        backgroundColor = "#10b981"
        borderColor = "#059669"
        break
      case "pending":
        backgroundColor = "#f59e0b"
        borderColor = "#d97706"
        break
      case "cancelled":
        backgroundColor = "#ef4444"
        borderColor = "#dc2626"
        break
      case "completed":
        backgroundColor = "#6b7280"
        borderColor = "#4b5563"
        break
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: `2px solid ${borderColor}`,
        display: "block",
        cursor: "pointer",
        fontSize: "12px",
        padding: "2px 6px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        transition: "all 0.2s ease",
      },
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />
      case "phone":
        return <Phone className="h-4 w-4" />
      case "in-person":
        return <MapPin className="h-4 w-4" />
      default:
        return <CalendarIcon className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "outline",
      confirmed: "default",
      cancelled: "destructive",
      completed: "secondary",
    }

    return <Badge variant={variants[status] || "outline"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meetings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-green-900 bg-clip-text text-transparent mb-3">
              Investment Hub
            </h1>
            <p className="text-lg text-slate-600 font-medium">Connect with startups and schedule strategic meetings</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 text-base font-semibold">
                <Plus className="h-5 w-5 mr-2" />
                Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Meeting</DialogTitle>
                <DialogDescription>Create a meeting with a startup or external contact</DialogDescription>
              </DialogHeader>
              
              <Tabs value={formData.meetingType} onValueChange={(value) => 
                setFormData({ ...formData, meetingType: value as "matched" | "standalone" })
              }>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="matched" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Matched Startup
                  </TabsTrigger>
                  <TabsTrigger value="standalone" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    External Contact
                  </TabsTrigger>
                </TabsList>

                <div className="space-y-4 mt-6">
                  <TabsContent value="matched" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label htmlFor="startup">Select Startup</Label>
                      <Select
                        value={formData.matchId || ""}
                        onValueChange={(value) => setFormData({ ...formData, matchId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose from your matches" />
                        </SelectTrigger>
                        <SelectContent>
                          {matches.map((match) => (
                            <SelectItem key={match.id} value={match.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{match.startups.company_name}</span>
                                <Badge variant="outline" className="ml-2">
                                  {Math.round(match.match_score)}% match
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {matches.length === 0 && (
                        <p className="text-sm text-gray-500">
                          No matches available. Connect with startups first to schedule matched meetings.
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="standalone" className="space-y-4 mt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="attendeeName">Attendee Name</Label>
                        <Input
                          id="attendeeName"
                          value={formData.attendeeName || ""}
                          onChange={(e) => setFormData({ ...formData, attendeeName: e.target.value })}
                          placeholder="Contact's full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="attendeeEmail">Attendee Email</Label>
                        <Input
                          id="attendeeEmail"
                          type="email"
                          value={formData.attendeeEmail || ""}
                          onChange={(e) => setFormData({ ...formData, attendeeEmail: e.target.value })}
                          placeholder="contact@example.com"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Common fields for both types */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Meeting Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Investment Discussion"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Meeting agenda and topics"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Select
                        value={formData.duration}
                        onValueChange={(value) => setFormData({ ...formData, duration: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Meeting Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: "video" | "phone" | "in-person") =>
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video Call</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="in-person">In Person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleCreateMeeting} className="flex-1">
                      Schedule Meeting
                    </Button>
                  </div>
                </div>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-600/5 via-green-600/5 to-teal-600/5 border-b border-slate-200/50">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg shadow-md">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              Meeting Calendar
            </CardTitle>
            <CardDescription className="text-slate-600 font-medium">
              Click on a meeting to edit • Click on empty slots to create new meetings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div style={{ height: "600px" }}>
              <style dangerouslySetInnerHTML={{
                __html: `
                  /* General calendar hover reset */
                  .rbc-calendar * {
                    transition: all 0.2s ease;
                  }
                  
                  /* Month view day cells */
                  .rbc-day-bg:hover {
                    background-color: rgba(34, 197, 94, 0.1) !important;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                  }
                  
                  /* Month view date cells - all clickable areas */
                  .rbc-date-cell:hover,
                  .rbc-month-view .rbc-date-cell:hover {
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.06) 100%) !important;
                    border: 1px solid rgba(34, 197, 94, 0.25) !important;
                    transform: scale(1.01);
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15);
                    cursor: pointer;
                  }
                  
                  /* Week view - entire day columns */
                  .rbc-day-slot:hover {
                    background: linear-gradient(180deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.03) 100%) !important;
                    cursor: pointer;
                    transition: all 0.2s ease;
                  }
                  
                  /* Week and Day view time slots */
                  .rbc-time-slot:hover {
                    background-color: rgba(34, 197, 94, 0.1) !important;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border-left: 4px solid #22c55e !important;
                    transform: translateX(2px);
                    position: relative;
                  }
                  
                  /* Week view timeslot groups */
                  .rbc-timeslot-group:hover {
                    background-color: rgba(34, 197, 94, 0.05) !important;
                    cursor: pointer;
                  }
                  
                  /* Week view day headers hover */
                  .rbc-header:hover,
                  .rbc-time-view .rbc-header:hover {
                    background-color: rgba(34, 197, 94, 0.08) !important;
                    transition: background-color 0.2s ease;
                    cursor: pointer;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(34, 197, 94, 0.1);
                  }
                  
                  /* Enhanced week view day columns with better targeting */
                  .rbc-day-slot .rbc-time-slot:hover,
                  .rbc-time-view .rbc-day-slot .rbc-time-slot:hover {
                    background: linear-gradient(90deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.06) 100%) !important;
                    border-left: 4px solid #22c55e !important;
                    position: relative;
                    transform: translateX(3px);
                    box-shadow: inset 0 0 10px rgba(34, 197, 94, 0.1);
                  }
                  
                  /* Day view specific enhancements */
                  .rbc-day-view .rbc-time-slot:hover,
                  .rbc-day-view .rbc-day-slot .rbc-time-slot:hover {
                    background: linear-gradient(90deg, #22c55e 0%, rgba(34, 197, 94, 0.12) 4px, rgba(34, 197, 94, 0.06) 100%) !important;
                    transform: translateX(3px);
                    transition: all 0.2s ease;
                    box-shadow: inset 0 0 15px rgba(34, 197, 94, 0.15);
                  }
                  
                  /* Time gutter hover effect */
                  .rbc-time-view .rbc-time-gutter .rbc-time-slot:hover {
                    background-color: rgba(34, 197, 94, 0.06) !important;
                    cursor: pointer;
                  }
                  
                  /* All-day area in week/day view */
                  .rbc-allday-cell:hover {
                    background-color: rgba(34, 197, 94, 0.08) !important;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                  }
                  
                  /* Week view date header cells */
                  .rbc-date-cell.rbc-off-range:hover,
                  .rbc-date-cell.rbc-now:hover,
                  .rbc-date-cell:hover {
                    background: rgba(34, 197, 94, 0.1) !important;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                  }
                  
                  /* Current day highlighting */
                  .rbc-today:hover {
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.08) 100%) !important;
                    border: 2px solid rgba(34, 197, 94, 0.3) !important;
                    transform: scale(1.02);
                    cursor: pointer;
                  }
                  
                  /* Add enhanced tooltip for all hoverable areas */
                  .rbc-time-slot:hover::after,
                  .rbc-day-slot:hover::after,
                  .rbc-date-cell:hover::after {
                    content: 'Click to schedule meeting';
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(34, 197, 94, 0.95);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    opacity: 0;
                    animation: fadeInTooltip 0.3s ease forwards;
                    pointer-events: none;
                    z-index: 1000;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    white-space: nowrap;
                  }
                  
                  /* Tooltip for month view */
                  .rbc-month-view .rbc-date-cell:hover::after {
                    content: 'Click to schedule';
                    top: 10px;
                    right: 10px;
                    transform: none;
                  }
                  
                  @keyframes fadeInTooltip {
                    from {
                      opacity: 0;
                      transform: translateY(-50%) translateX(10px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(-50%) translateX(0);
                    }
                  }
                  
                  /* Enhanced glow effects */
                  .rbc-day-slot:hover::before,
                  .rbc-time-slot:hover::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(34, 197, 94, 0.04);
                    pointer-events: none;
                    transition: all 0.2s ease;
                    z-index: 1;
                  }
                  
                  /* Remove default focus styles that might interfere */
                  .rbc-calendar *:focus {
                    outline: none;
                  }
                  
                  /* Ensure all clickable areas are properly styled */
                  .rbc-calendar [role="gridcell"]:hover,
                  .rbc-calendar .rbc-button-link:hover {
                    background-color: rgba(34, 197, 94, 0.08) !important;
                    cursor: pointer;
                    transition: all 0.2s ease;
                  }
                  
                  /* Week view background areas */
                  .rbc-time-content:hover {
                    cursor: pointer;
                  }
                  
                  /* Make sure entire calendar is interactive */
                  .rbc-calendar {
                    user-select: none;
                  }
                `
              }} />
              <Calendar
                localizer={localizer}
                events={meetings}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                onSelectEvent={(event: any) => handleSelectEvent(event)}
                eventPropGetter={(event: any) => eventStyleGetter(event)}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                popup={true}
                tooltipAccessor={(event: any) => {
                  const statusText = event.status.charAt(0).toUpperCase() + event.status.slice(1)
                  return `${event.title} with ${event.attendee} • ${statusText} • Click to edit`
                }}
                {...({
                  selectable: true,
                  onSelectSlot: (slotInfo: any) => {
                    // Pre-fill form with selected date/time when clicking empty slot
                    const selectedDate = moment(slotInfo.start).format("YYYY-MM-DD")
                    const selectedTime = moment(slotInfo.start).format("HH:mm")
                    setFormData({
                      title: "",
                      description: "",
                      date: selectedDate,
                      time: selectedTime,
                      duration: "30",
                      type: "video",
                      meetingType: "matched",
                      matchId: "",
                      attendeeName: "",
                      attendeeEmail: "",
                    })
                    setShowCreateDialog(true)
                  }
                } as any)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-emerald-50/50 border-b border-slate-200/50">
            <CardTitle className="text-xl font-bold text-slate-800">Upcoming Meetings</CardTitle>
            <CardDescription className="text-slate-600 font-medium">Your next scheduled meetings</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {meetings
                .filter((meeting) => meeting.start > new Date())
                .sort((a, b) => a.start.getTime() - b.start.getTime())
                .slice(0, 5)
                .map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-5 border border-slate-200/70 rounded-xl bg-gradient-to-r from-white to-slate-50/50 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-md">
                        {getTypeIcon(meeting.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{meeting.title}</h3>
                        <p className="text-slate-600 font-medium">
                          with {meeting.attendee} • {moment(meeting.start).format("MMM DD, YYYY at h:mm A")}
                        </p>
                        {meeting.matchId && (
                          <Badge variant="outline" className="text-xs mt-2 bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold">
                            Matched Meeting
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(meeting.status)}
                      <Button variant="outline" size="sm" onClick={() => handleSelectEvent(meeting)} className="border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all font-semibold">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteMeeting(meeting.id)} className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all font-semibold">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              {meetings.filter((meeting) => meeting.start > new Date()).length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-lg font-medium">No upcoming meetings scheduled</p>
                  <p className="text-sm text-slate-400 mt-1">Click the calendar to schedule your first meeting</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Meeting Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Meeting</DialogTitle>
              <DialogDescription>Update meeting details or reschedule</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Show meeting type indicator */}
              <div className="flex items-center gap-2">
                {formData.meetingType === "matched" ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Matched Meeting
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    External Contact
                  </Badge>
                )}
                {selectedMeeting && (
                  <span className="text-sm text-gray-500">
                    with {selectedMeeting.attendee}
                  </span>
                )}
              </div>

              {/* Show attendee info for standalone meetings */}
              {formData.meetingType === "standalone" && (formData.attendeeName || formData.attendeeEmail) && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium">External Attendee</Label>
                  <div className="mt-1">
                    {formData.attendeeName && (
                      <p className="text-sm">{formData.attendeeName}</p>
                    )}
                    {formData.attendeeEmail && (
                      <p className="text-sm text-gray-600">{formData.attendeeEmail}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-title">Meeting Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time">Time</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Duration (minutes)</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => setFormData({ ...formData, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Meeting Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "video" | "phone" | "in-person") =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="in-person">In Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUpdateMeeting} className="flex-1">
                  Update Meeting
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
