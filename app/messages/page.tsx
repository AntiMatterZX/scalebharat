"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import { Building2, MessageSquare, Send, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUserProfile } from "@/lib/hooks/useUserProfile"

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  match_id: string
  content: string
  type: string
  is_read: boolean
  created_at: string
}

interface Conversation {
  match_id: string
  other_user: {
    id: string
    first_name: string
    last_name: string
    profile_picture?: string
  }
  startup?: {
    company_name: string
  }
  investor?: {
    firm_name: string
  }
  last_message: Message
  unread_count: number
}

export default function MessagesPage() {
  const router = useRouter()
  const { type: userType, loading: profileLoading } = useUserProfile()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!profileLoading && userType) {
      // Redirect to role-specific messages page
      if (userType === "startup") {
        router.replace("/startup/messages")
      } else if (userType === "investor") {
        router.replace("/investor/messages")
      } else {
        // Admin or unknown role, redirect to dashboard
        router.replace("/dashboard")
      }
    }
  }, [userType, profileLoading, router])

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
      markMessagesAsRead(selectedConversation)
    }
  }, [selectedConversation])

  const loadConversations = async () => {
    try {
      // Get all matches for the user
      const { data: userProfile } = await supabase.from("users").select("*").eq("id", user!.id).single()

      // Check if user is startup or investor
      const { data: startupProfile } = await supabase.from("startups").select("id").eq("user_id", user!.id).single()

      const { data: investorProfile } = await supabase.from("investors").select("id").eq("user_id", user!.id).single()

      let matches = []
      if (startupProfile) {
        const { data } = await supabase
          .from("matches")
          .select(`
            *,
            investors (
              *,
              users (*)
            )
          `)
          .eq("startup_id", startupProfile.id)
          .eq("status", "interested")
        matches = data || []
      } else if (investorProfile) {
        const { data } = await supabase
          .from("matches")
          .select(`
            *,
            startups (
              *,
              users (*)
            )
          `)
          .eq("investor_id", investorProfile.id)
          .eq("status", "interested")
        matches = data || []
      }

      // Get conversations with last messages
      const conversationsData = await Promise.all(
        matches.map(async (match) => {
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("*")
            .eq("match_id", match.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          const { data: unreadMessages } = await supabase
            .from("messages")
            .select("id")
            .eq("match_id", match.id)
            .eq("receiver_id", user!.id)
            .eq("is_read", false)

          const otherUser = startupProfile ? match.investors.users : match.startups.users

          return {
            match_id: match.id,
            other_user: otherUser,
            startup: startupProfile ? null : match.startups,
            investor: startupProfile ? match.investors : null,
            last_message: lastMessage,
            unread_count: unreadMessages?.length || 0,
          }
        }),
      )

      setConversations(conversationsData.filter((conv) => conv.last_message))
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (matchId: string) => {
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true })

      setMessages(data || [])
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const markMessagesAsRead = async (matchId: string) => {
    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("match_id", matchId)
        .eq("receiver_id", user!.id)
        .eq("is_read", false)

      // Update conversations state
      setConversations((prev) => prev.map((conv) => (conv.match_id === matchId ? { ...conv, unread_count: 0 } : conv)))
    } catch (error) {
      console.error("Error marking messages as read:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const conversation = conversations.find((conv) => conv.match_id === selectedConversation)
      if (!conversation) return

      const { error } = await supabase.from("messages").insert({
        sender_id: user!.id,
        receiver_id: conversation.other_user.id,
        match_id: selectedConversation,
        content: newMessage.trim(),
        type: "text",
      })

      if (!error) {
        setNewMessage("")
        loadMessages(selectedConversation)
        loadConversations()
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">StartupConnect</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Connect with matches to start messaging</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.match_id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation.match_id ? "bg-blue-50 border-blue-200" : ""
                      }`}
                      onClick={() => setSelectedConversation(conversation.match_id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {conversation.other_user.profile_picture ? (
                            <img
                              src={conversation.other_user.profile_picture || "/placeholder.svg"}
                              alt="Profile"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-sm truncate">
                              {conversation.startup?.company_name ||
                                conversation.investor?.firm_name ||
                                `${conversation.other_user.first_name} ${conversation.other_user.last_name}`}
                            </h3>
                            {conversation.unread_count > 0 && (
                              <Badge variant="default" className="text-xs">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{conversation.last_message?.content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {conversation.last_message &&
                              formatDistanceToNow(new Date(conversation.last_message.created_at), {
                                addSuffix: true,
                              })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="lg:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">
                    {(() => {
                      const conversation = conversations.find((conv) => conv.match_id === selectedConversation)
                      return (
                        conversation?.startup?.company_name ||
                        conversation?.investor?.firm_name ||
                        `${conversation?.other_user.first_name} ${conversation?.other_user.last_name}`
                      )
                    })()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col h-full p-0">
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user!.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === user!.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender_id === user!.id ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1"
                      />
                      <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
