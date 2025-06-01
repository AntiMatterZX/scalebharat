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
import { CalendarIcon, Video, Phone, MapPin, Plus, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
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
}

interface MeetingFormData {
  title: string
  description: string
  date: string
  time: string
  duration: string
  type: "video" | "phone" | "in-person"
  matchId?: string
  attendeeId?: string
}

export default function StartupMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
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
  })
  const { toast } = useToast()

  useEffect(() => {
    loadMeetings()
  }, [])

  const loadMeetings = async () => {
    try {
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch("/api/meetings", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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

  const handleCreateMeeting = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const scheduledAt = new Date(`${formData.date}T${formData.time}`)

      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          scheduledAt: scheduledAt.toISOString(),
          durationMinutes: Number.parseInt(formData.duration),
          type: formData.type,
          matchId: formData.matchId,
          attendeeId: formData.attendeeId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
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
      })
      loadMeetings()
    } catch (error) {
      console.error("Error creating meeting:", error)
      toast({
        title: "Error",
        description: "Failed to create meeting",
        variant: "destructive",
      })
    }
  }

  const handleUpdateMeeting = async () => {
    if (!selectedMeeting) return

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const scheduledAt = new Date(`${formData.date}T${formData.time}`)

      const response = await fetch(`/api/meetings/${selectedMeeting.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
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
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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
    setFormData({
      title: event.title,
      description: event.description || "",
      date: moment(event.start).format("YYYY-MM-DD"),
      time: moment(event.start).format("HH:mm"),
      duration: Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60)).toString(),
      type: event.type as "video" | "phone" | "in-person",
    })
    setShowEditDialog(true)
  }

  const eventStyleGetter = (event: Meeting) => {
    let backgroundColor = "#3174ad"

    switch (event.status) {
      case "confirmed":
        backgroundColor = "#10b981"
        break
      case "pending":
        backgroundColor = "#f59e0b"
        break
      case "cancelled":
        backgroundColor = "#ef4444"
        break
      case "completed":
        backgroundColor = "#6b7280"
        break
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Meetings</h1>
            <p className="text-gray-600">Manage your investor meetings and schedule new ones</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Meeting</DialogTitle>
                <DialogDescription>Create a new meeting with an investor</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
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
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Meeting Calendar
            </CardTitle>
            <CardDescription>Click on a meeting to view details or reschedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: "600px" }}>
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
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                popup
                tooltipAccessor={(event) => `${event.title} with ${event.attendee}`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Meetings</CardTitle>
            <CardDescription>Your next scheduled meetings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {meetings
                .filter((meeting) => meeting.start > new Date())
                .sort((a, b) => a.start.getTime() - b.start.getTime())
                .slice(0, 5)
                .map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                        {getTypeIcon(meeting.type)}
                      </div>
                      <div>
                        <h3 className="font-medium">{meeting.title}</h3>
                        <p className="text-sm text-gray-500">
                          with {meeting.attendee} • {moment(meeting.start).format("MMM DD, YYYY at h:mm A")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(meeting.status)}
                      <Button variant="outline" size="sm" onClick={() => handleSelectEvent(meeting)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteMeeting(meeting.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              {meetings.filter((meeting) => meeting.start > new Date()).length === 0 && (
                <div className="text-center py-8 text-gray-500">No upcoming meetings scheduled</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Meeting Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Meeting</DialogTitle>
              <DialogDescription>Update meeting details or reschedule</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
