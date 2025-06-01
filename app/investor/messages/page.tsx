"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InvestorLayout } from "@/components/layout/investor-layout"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import { MessageSquare, Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSearchParams } from "next/navigation"

export default function InvestorMessagesPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const matchId = searchParams.get("match")

  const [loading, setLoading] = useState(true)
  const [investorProfile, setInvestorProfile] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversation, setActiveConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    if (user) {
      loadInvestorProfile()
    }
  }, [user])

  useEffect(() => {
    if (investorProfile) {
      loadConversations()
    }
  }, [investorProfile])

  useEffect(() => {
    if (matchId && conversations.length > 0) {
      const conversation = conversations.find((c) => c.match_id === matchId)
      if (conversation) {
        setActiveConversation(conversation)
      }
    }
  }, [matchId, conversations])

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.match_id)
    }
  }, [activeConversation])

  const loadInvestorProfile = async () => {
    try {
      const { data } = await supabase.from("investors").select("*").eq("user_id", user!.id).single()
      setInvestorProfile(data)
    } catch (error) {
      console.error("Error loading investor profile:", error)
    }
  }

  const loadConversations = async () => {
    try {
      // In a real app, you would fetch actual conversations
      // For demo purposes, we'll create mock conversations based on matches
      const { data: matchesData } = await supabase
        .from("matches")
        .select(
          `
          id,
          startup_id,
          status,
          startups (
            id,
            company_name,
            logo
          ),
          created_at
        `,
        )
        .eq("investor_id", investorProfile.id)
        .in("status", ["interested", "meeting-scheduled"])
        .order("created_at", { ascending: false })

      if (matchesData) {
        const mockConversations = matchesData.map((match) => ({
          id: match.id,
          match_id: match.id,
          startup_id: match.startup_id,
          startup_name: match.startups.company_name,
          startup_logo: match.startups.logo,
          last_message: "Hello, I'm interested in learning more about your startup.",
          unread_count: Math.floor(Math.random() * 3),
          updated_at: match.created_at,
        }))

        setConversations(mockConversations)

        // Set first conversation as active if none is selected
        if (!activeConversation && mockConversations.length > 0) {
          setActiveConversation(mockConversations[0])
        }
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (matchId: string) => {
    try {
      // In a real app, you would fetch actual messages
      // For demo purposes, we'll create mock messages
      const mockMessages = [
        {
          id: "1",
          match_id: matchId,
          sender_id: user!.id,
          content: "Hello, I'm interested in learning more about your startup.",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        },
        {
          id: "2",
          match_id: matchId,
          sender_id: "startup-user-id", // This would be the actual startup user ID in a real app
          content: "Hi there! Thanks for your interest. What would you like to know?",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(), // 23 hours ago
        },
        {
          id: "3",
          match_id: matchId,
          sender_id: user!.id,
          content: "I'd like to know more about your business model and current traction.",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(), // 22 hours ago
        },
        {
          id: "4",
          match_id: matchId,
          sender_id: "startup-user-id",
          content:
            "Of course! We operate on a SaaS model with monthly subscriptions. We currently have 500+ paying customers and growing at 15% MoM.",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 21).toISOString(), // 21 hours ago
        },
      ]

      setMessages(mockMessages)

      // Mark conversation as read
      setConversations(conversations.map((conv) => (conv.match_id === matchId ? { ...conv, unread_count: 0 } : conv)))
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return

    setSendingMessage(true)

    try {
      // In a real app, you would send the message to the backend
      // For demo purposes, we'll just add it to the local state
      const newMsg = {
        id: `temp-${Date.now()}`,
        match_id: activeConversation.match_id,
        sender_id: user!.id,
        content: newMessage,
        created_at: new Date().toISOString(),
      }

      setMessages([...messages, newMsg])
      setNewMessage("")

      // Update conversation last message
      setConversations(
        conversations.map((conv) =>
          conv.match_id === activeConversation.match_id
            ? { ...conv, last_message: newMessage, updated_at: new Date().toISOString() }
            : conv,
        ),
      )
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatConversationTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" })
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    }
  }

  if (loading && !conversations.length) {
    return (
      <InvestorLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </InvestorLayout>
    )
  }

  return (
    <InvestorLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Messages</h1>

        <div className="flex flex-1 overflow-hidden border rounded-lg">
          {/* Conversations List */}
          <div className="w-1/3 border-r">
            <div className="p-4 border-b">
              <Input type="search" placeholder="Search conversations..." className="w-full" />
            </div>
            <ScrollArea className="h-[calc(100vh-12rem)]">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No conversations yet</h3>
                  <p className="text-muted-foreground text-center mt-2">Connect with startups to start messaging</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      activeConversation?.id === conversation.id ? "bg-gray-50 dark:bg-gray-800" : ""
                    }`}
                    onClick={() => setActiveConversation(conversation)}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={conversation.startup_logo || "/placeholder.svg"}
                          alt={conversation.startup_name}
                        />
                        <AvatarFallback>
                          {conversation.startup_name
                            .split(" ")
                            .map((word: string) => word[0])
                            .join("")
                            .substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3 flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{conversation.startup_name}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatConversationTime(conversation.updated_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conversation.last_message}</p>
                      </div>
                      {conversation.unread_count > 0 && (
                        <div className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {conversation.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Messages */}
          <div className="w-2/3 flex flex-col">
            {activeConversation ? (
              <>
                <div className="p-4 border-b flex items-center">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={activeConversation.startup_logo || "/placeholder.svg"}
                      alt={activeConversation.startup_name}
                    />
                    <AvatarFallback>
                      {activeConversation.startup_name
                        .split(" ")
                        .map((word: string) => word[0])
                        .join("")
                        .substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <h4 className="font-medium">{activeConversation.startup_name}</h4>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user!.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender_id === user!.id ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800"
                          }`}
                        >
                          <p>{message.content}</p>
                          <p
                            className={`text-xs mt-1 text-right ${
                              message.sender_id === user!.id ? "text-blue-100" : "text-muted-foreground"
                            }`}
                          >
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      sendMessage()
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sendingMessage}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={sendingMessage || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium">Select a conversation</h3>
                <p className="text-muted-foreground text-center mt-2">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </InvestorLayout>
  )
}
