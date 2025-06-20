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
import { CalendarIcon, Video, Phone, MapPin, Plus, Edit, Trash2, Users, Building2, Loader2, Clock } from "lucide-react"
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
  investor_id: string
  match_score: number
  status: string
  investors: {
    id: string
    firm_name: string
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

export default function StartupMeetingsPage() {
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
      const { data: startupData } = await supabase
        .from("startups")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (!startupData) return

      const { data: matchData } = await supabase
        .from("matches")
        .select(`
          id,
          investor_id,
          match_score,
          status,
          startup_status,
          investor_status,
          investors (
            id,
            firm_name,
            users (
              first_name,
              last_name,
              profile_picture
            )
          )
        `)
        .eq("startup_id", startupData.id)
        .in("status", ["interested", "meeting_scheduled"])
        .or("startup_status.eq.interested,investor_status.eq.interested")

      if (matchData) {
        // Transform the data to match our interface
        const transformedMatches = matchData.map((match: any) => ({
          ...match,
          investors: Array.isArray(match.investors) ? match.investors[0] : match.investors
        }))
        setMatches(transformedMatches)
      }
    } catch (error) {
      console.error("Error loading matches:", error)
    }
  }

  const handleCreateMeeting = async () => {
    try {
      if (!formData.title || !formData.date || !formData.time) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      if (formData.meetingType === "matched" && !formData.matchId) {
        toast({
          title: "Missing Match",
          description: "Please select an investor for matched meetings",
          variant: "destructive",
        })
        return
      }

      if (formData.meetingType === "standalone" && (!formData.attendeeName || !formData.attendeeEmail)) {
        toast({
          title: "Missing Attendee Info",
          description: "Please provide attendee name and email for external meetings",
          variant: "destructive",
        })
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "Please log in to create meetings",
          variant: "destructive",
        })
        return
      }

      const startDateTime = moment(`${formData.date} ${formData.time}`).toDate()
      const endDateTime = moment(startDateTime).add(parseInt(formData.duration), "minutes").toDate()

      const meetingData = {
        title: formData.title,
        description: formData.description,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        type: formData.type,
        status: "pending",
        matchId: formData.meetingType === "matched" ? formData.matchId : null,
        attendeeName: formData.meetingType === "standalone" ? formData.attendeeName : null,
        attendeeEmail: formData.meetingType === "standalone" ? formData.attendeeEmail : null,
      }

      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: "include",
        body: JSON.stringify(meetingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create meeting")
      }

      toast({
        title: "Meeting Scheduled",
        description: "Your meeting has been successfully scheduled",
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
    } catch (error: any) {
      console.error("Error creating meeting:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create meeting",
        variant: "destructive",
      })
    }
  }

  const handleUpdateMeeting = async () => {
    try {
      if (!selectedMeeting || !formData.title || !formData.date || !formData.time) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "Please log in to update meetings",
          variant: "destructive",
        })
        return
      }

      const startDateTime = moment(`${formData.date} ${formData.time}`).toDate()
      const endDateTime = moment(startDateTime).add(parseInt(formData.duration), "minutes").toDate()

      const meetingData = {
        title: formData.title,
        description: formData.description,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        type: formData.type,
      }

      const response = await fetch(`/api/meetings/${selectedMeeting.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: "include",
        body: JSON.stringify(meetingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update meeting")
      }

      toast({
        title: "Meeting Updated",
        description: "Your meeting has been successfully updated",
      })

      setShowEditDialog(false)
      setSelectedMeeting(null)
      loadMeetings()
    } catch (error: any) {
      console.error("Error updating meeting:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update meeting",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "Please log in to delete meetings",
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
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete meeting")
      }

      toast({
        title: "Meeting Cancelled",
        description: "The meeting has been successfully cancelled",
      })

      loadMeetings()
    } catch (error: any) {
      console.error("Error deleting meeting:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to cancel meeting",
        variant: "destructive",
      })
    }
  }

  const handleSelectEvent = (event: Meeting) => {
    setSelectedMeeting(event)
    setFormData({
      title: event.title,
      description: event.description || "",
      date: moment(event.start).format("YYYY-MM-DD"),
      time: moment(event.start).format("HH:mm"),
      duration: moment.duration(moment(event.end).diff(moment(event.start))).asMinutes().toString(),
      type: event.type as "video" | "phone" | "in-person",
      meetingType: event.matchId ? "matched" : "standalone",
      matchId: event.matchId || "",
      attendeeName: event.matchId ? "" : event.attendee.split(" ").slice(0, -1).join(" "),
      attendeeEmail: "",
    })
    setShowEditDialog(true)
  }

  const eventStyleGetter = (event: Meeting) => {
    let style = {
      backgroundColor: "",
      borderRadius: "6px",
      opacity: 0.8,
      color: "white",
      border: "0px",
      display: "block",
      fontSize: "12px",
      fontWeight: "500",
    }

    switch (event.status) {
      case "confirmed":
        style.backgroundColor = "hsl(var(--primary))"
        break
      case "pending":
        style.backgroundColor = "hsl(var(--muted-foreground))"
        break
      case "cancelled":
        style.backgroundColor = "hsl(var(--destructive))"
        break
      case "completed":
        style.backgroundColor = "hsl(var(--secondary))"
        style.color = "hsl(var(--secondary-foreground))"
        break
      default:
        style.backgroundColor = "hsl(var(--accent))"
        style.color = "hsl(var(--accent-foreground))"
    }

    return { style }
  }

  const getTypeIcon = (type: string) => {
    const iconClasses = "h-4 w-4 sm:h-5 sm:w-5 text-white"
    switch (type) {
      case "video":
        return <Video className={iconClasses} />
      case "phone":
        return <Phone className={iconClasses} />
      case "in-person":
        return <MapPin className={iconClasses} />
      default:
        return <CalendarIcon className={iconClasses} />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "outline",
      confirmed: "default",
      cancelled: "destructive",
      completed: "secondary",
    }

    return <Badge variant={variants[status] || "outline"} className="text-xs">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8 sm:py-12 lg:py-16">
        <div className="flex items-center justify-center h-48 sm:h-60">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary mx-auto" />
            <p className="text-sm sm:text-base text-muted-foreground">Loading meetings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10">
      {/* Enhanced Desktop Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 lg:gap-8">
        <div className="space-y-2 lg:space-y-3 flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground">
            Meeting Hub
          </h1>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground max-w-2xl">
            Connect with investors and schedule meaningful conversations to grow your startup
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Schedule Meeting</span>
              <span className="sm:hidden">Schedule</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Schedule New Meeting</DialogTitle>
              <DialogDescription className="text-sm">Create a meeting with an investor or external contact</DialogDescription>
            </DialogHeader>
            
            <Tabs value={formData.meetingType} onValueChange={(value) => 
              setFormData({ ...formData, meetingType: value as "matched" | "standalone" })
            }>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="matched" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Matched Investor</span>
                  <span className="sm:hidden">Matched</span>
                </TabsTrigger>
                <TabsTrigger value="standalone" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">External Contact</span>
                  <span className="sm:hidden">External</span>
                </TabsTrigger>
              </TabsList>

              <div className="space-y-4 mt-4 sm:mt-6">
                <TabsContent value="matched" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="investor" className="text-sm">Select Investor</Label>
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
                              <span className="text-sm">
                                {match.investors.firm_name || 
                                 `${match.investors.users.first_name} ${match.investors.users.last_name}`}
                              </span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {Math.round(match.match_score)}% match
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {matches.length === 0 && (
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        No matches available. Connect with investors first to schedule matched meetings.
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="standalone" className="space-y-4 mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="attendeeName" className="text-sm">Attendee Name</Label>
                      <Input
                        id="attendeeName"
                        value={formData.attendeeName || ""}
                        onChange={(e) => setFormData({ ...formData, attendeeName: e.target.value })}
                        placeholder="Contact's full name"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attendeeEmail" className="text-sm">Attendee Email</Label>
                      <Input
                        id="attendeeEmail"
                        type="email"
                        value={formData.attendeeEmail || ""}
                        onChange={(e) => setFormData({ ...formData, attendeeEmail: e.target.value })}
                        placeholder="contact@example.com"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Common fields for both types */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm">Meeting Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Investment Discussion"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Meeting agenda and topics"
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm">Duration (minutes)</Label>
                    <Select
                      value={formData.duration}
                      onValueChange={(value) => setFormData({ ...formData, duration: value })}
                    >
                      <SelectTrigger className="text-sm">
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
                    <Label htmlFor="type" className="text-sm">Meeting Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "video" | "phone" | "in-person") =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger className="text-sm">
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

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="w-full sm:flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateMeeting} className="w-full sm:flex-1">
                    Schedule Meeting
                  </Button>
                </div>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Calendar */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4 sm:pb-6 lg:pb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-primary rounded-lg lg:rounded-xl shadow-md">
                <CalendarIcon className="h-5 w-5 lg:h-6 lg:w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl text-foreground">Meeting Calendar</CardTitle>
                <CardDescription className="text-sm lg:text-base text-muted-foreground mt-1">
                  Interactive calendar for scheduling and managing meetings
                </CardDescription>
              </div>
            </div>
            <div className="text-xs sm:text-sm lg:text-base text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
              <span className="hidden lg:inline">💡 Pro tip: </span>Click meetings to edit • Click empty slots to create new meetings
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="h-[400px] sm:h-[500px] lg:h-[650px] xl:h-[700px]">
            <style dangerouslySetInnerHTML={{
              __html: `
                /* Theme-aware calendar styles */
                .rbc-calendar {
                  background-color: hsl(var(--background));
                  color: hsl(var(--foreground));
                }
                
                .rbc-header {
                  background-color: hsl(var(--muted));
                  color: hsl(var(--muted-foreground));
                  border-bottom: 1px solid hsl(var(--border));
                  padding: 8px;
                  font-weight: 500;
                }
                
                .rbc-day-bg:hover {
                  background-color: hsl(var(--accent)) !important;
                  cursor: pointer;
                  transition: background-color 0.2s ease;
                }
                
                .rbc-date-cell:hover {
                  background-color: hsl(var(--accent)) !important;
                  border: 1px solid hsl(var(--primary)) !important;
                  cursor: pointer;
                  transition: all 0.2s ease;
                }
                
                .rbc-time-slot:hover {
                  background-color: hsl(var(--accent)) !important;
                  cursor: pointer;
                  border-left: 4px solid hsl(var(--primary)) !important;
                }
                
                .rbc-today {
                  background-color: hsl(var(--accent));
                }
                
                .rbc-off-range-bg {
                  background-color: hsl(var(--muted));
                }
                
                .rbc-event {
                  border-radius: 6px;
                  padding: 2px 6px;
                  font-size: 12px;
                  font-weight: 500;
                }
                
                /* Mobile responsive adjustments */
                @media (max-width: 640px) {
                  .rbc-toolbar {
                    flex-direction: column;
                    gap: 8px;
                  }
                  
                  .rbc-toolbar button {
                    font-size: 12px;
                    padding: 4px 8px;
                  }
                  
                  .rbc-header {
                    padding: 4px;
                    font-size: 12px;
                  }
                  
                  .rbc-event {
                    font-size: 10px;
                    padding: 1px 4px;
                  }
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

      {/* Enhanced Upcoming Meetings */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4 sm:pb-6 lg:pb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-primary rounded-lg lg:rounded-xl shadow-md">
                <Clock className="h-5 w-5 lg:h-6 lg:w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl text-foreground">Upcoming Meetings</CardTitle>
                <CardDescription className="text-sm lg:text-base text-muted-foreground mt-1">
                  Your scheduled meetings and appointments
                </CardDescription>
              </div>
            </div>
            <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              {meetings.filter((meeting) => meeting.start > new Date()).length} meeting{meetings.filter((meeting) => meeting.start > new Date()).length !== 1 ? 's' : ''} scheduled
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {meetings
              .filter((meeting) => meeting.start > new Date())
              .sort((a, b) => a.start.getTime() - b.start.getTime())
              .slice(0, 5)
              .map((meeting) => (
                <div 
                  key={meeting.id} 
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6 p-4 sm:p-5 lg:p-6 border rounded-xl bg-card shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-4 lg:space-x-6 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 bg-primary rounded-xl shadow-md flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                      {getTypeIcon(meeting.type)}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1 lg:space-y-2">
                      <h3 className="font-bold text-foreground text-base lg:text-lg truncate group-hover:text-primary transition-colors">{meeting.title}</h3>
                      <p className="text-muted-foreground text-sm lg:text-base">
                        with {meeting.attendee}
                      </p>
                      <p className="text-muted-foreground text-sm lg:text-base font-medium">
                        {moment(meeting.start).format("MMM DD, YYYY at h:mm A")}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {meeting.matchId && (
                          <Badge variant="outline" className="text-xs bg-accent border-primary text-primary">
                            Matched Meeting
                          </Badge>
                        )}
                        {getStatusBadge(meeting.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 lg:space-x-4 flex-shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSelectEvent(meeting)}
                      className="text-sm lg:text-base hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Edit className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                      <span className="hidden sm:inline">Edit Meeting</span>
                      <span className="sm:hidden">Edit</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteMeeting(meeting.id)}
                      className="text-sm lg:text-base text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <Trash2 className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                      <span className="hidden sm:inline">Cancel Meeting</span>
                      <span className="sm:hidden">Cancel</span>
                    </Button>
                  </div>
                </div>
              ))}
            {meetings.filter((meeting) => meeting.start > new Date()).length === 0 && (
              <div className="text-center py-12 lg:py-16">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 lg:mb-8">
                  <CalendarIcon className="h-8 w-8 lg:h-10 lg:w-10 text-muted-foreground" />
                </div>
                <p className="text-lg lg:text-xl font-medium text-foreground mb-2">No upcoming meetings scheduled</p>
                <p className="text-sm lg:text-base text-muted-foreground mb-6">Click the calendar above to schedule your first meeting with investors</p>
                <Button onClick={() => setShowCreateDialog(true)} className="lg:text-base">
                  <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                  Schedule First Meeting
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Meeting Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Meeting</DialogTitle>
            <DialogDescription className="text-sm">Update meeting details or reschedule</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Show meeting type indicator */}
            <div className="flex items-center gap-2">
              {formData.meetingType === "matched" ? (
                <Badge variant="default" className="flex items-center gap-1 text-xs">
                  <Building2 className="h-3 w-3" />
                  Matched Meeting
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <Users className="h-3 w-3" />
                  External Contact
                </Badge>
              )}
              {selectedMeeting && (
                <span className="text-xs sm:text-sm text-muted-foreground">
                  with {selectedMeeting.attendee}
                </span>
              )}
            </div>

            {/* Show attendee info for standalone meetings */}
            {formData.meetingType === "standalone" && (formData.attendeeName || formData.attendeeEmail) && (
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-sm font-medium">External Attendee</Label>
                <div className="mt-1">
                  {formData.attendeeName && (
                    <p className="text-sm">{formData.attendeeName}</p>
                  )}
                  {formData.attendeeEmail && (
                    <p className="text-sm text-muted-foreground">{formData.attendeeEmail}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-sm">Meeting Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date" className="text-sm">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time" className="text-sm">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duration" className="text-sm">Duration (minutes)</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData({ ...formData, duration: value })}
                >
                  <SelectTrigger className="text-sm">
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
                <Label htmlFor="edit-type" className="text-sm">Meeting Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "video" | "phone" | "in-person") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger className="text-sm">
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

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="w-full sm:flex-1">
                Cancel
              </Button>
              <Button onClick={handleUpdateMeeting} className="w-full sm:flex-1">
                Update Meeting
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
