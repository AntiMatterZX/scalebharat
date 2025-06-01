"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MessageSquare, ExternalLink, ThumbsUp, ThumbsDown, Calendar, Info, Star } from "lucide-react"
import Link from "next/link"

interface MatchCardProps {
  match: any
  userType: "startup" | "investor"
  onStatusUpdate: (matchId: string, status: string) => void
}

export function MatchCard({ match, userType, onStatusUpdate }: MatchCardProps) {
  const [loading, setLoading] = useState(false)

  const profile = userType === "startup" ? match.investors : match.startups
  const isMatched = match.status === "interested" || match.status === "meeting-scheduled"
  const isPending = match.status === "pending"

  const handleStatusUpdate = async (status: string) => {
    setLoading(true)
    try {
      await onStatusUpdate(match.id, status)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-amber-600"
    return "text-gray-600"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>
      case "interested":
        return <Badge variant="default">Interested</Badge>
      case "not-interested":
        return <Badge variant="outline">Not Interested</Badge>
      case "meeting-scheduled":
        return <Badge className="bg-green-600">Meeting Scheduled</Badge>
      case "deal-closed":
        return <Badge className="bg-purple-600">Deal Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={profile?.logo || profile?.users?.profile_picture || "/placeholder.svg"}
                alt={profile?.company_name || profile?.firm_name || "Profile"}
              />
              <AvatarFallback>
                {(profile?.company_name || profile?.firm_name || "U")
                  .split(" ")
                  .map((word: string) => word[0])
                  .join("")
                  .substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg">
                {userType === "startup"
                  ? profile?.firm_name || `${profile?.users?.first_name} ${profile?.users?.last_name}`
                  : profile?.company_name}
              </CardTitle>
              <CardDescription className="line-clamp-1">
                {userType === "startup" ? profile?.bio : profile?.tagline}
              </CardDescription>
              {profile?.is_verified && (
                <Badge variant="secondary" className="text-xs mt-1">
                  <Star className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(match.status)}
            <div className="mt-2">
              <span className={`text-2xl font-bold ${getScoreColor(match.match_score)}`}>{match.match_score}%</span>
              <p className="text-xs text-muted-foreground">Match Score</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Match Score Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Match Breakdown</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Match Score Details</DialogTitle>
                  <DialogDescription>How this match score was calculated</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  {match.score_breakdown &&
                    Object.entries(match.score_breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                        <span className="font-medium">{value}%</span>
                      </div>
                    ))}
                  {match.reasons && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Match Reasons:</h4>
                      <ul className="text-sm space-y-1">
                        {match.reasons.map((reason: string, index: number) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Progress value={match.match_score} className="h-2" />
        </div>

        <Separator />

        {/* Profile Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {userType === "startup" ? (
            <>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium capitalize">{profile?.type}</p>
              </div>
              {profile?.check_size_min && profile?.check_size_max && (
                <div>
                  <span className="text-muted-foreground">Check Size:</span>
                  <p className="font-medium">
                    ${profile.check_size_min}K - ${profile.check_size_max}K
                  </p>
                </div>
              )}
              {profile?.investment_stages && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Investment Stages:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.investment_stages.slice(0, 3).map((stage: string) => (
                      <Badge key={stage} variant="outline" className="text-xs">
                        {stage}
                      </Badge>
                    ))}
                    {profile.investment_stages.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.investment_stages.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <span className="text-muted-foreground">Stage:</span>
                <p className="font-medium capitalize">{profile?.stage?.replace("-", " ")}</p>
              </div>
              {profile?.target_amount && (
                <div>
                  <span className="text-muted-foreground">Seeking:</span>
                  <p className="font-medium">${(profile.target_amount / 1000).toFixed(0)}K</p>
                </div>
              )}
              {profile?.industry && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Industries:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.industry.slice(0, 3).map((industry: string) => (
                      <Badge key={industry} variant="outline" className="text-xs">
                        {industry}
                      </Badge>
                    ))}
                    {profile.industry.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.industry.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {match.notes && (
          <>
            <Separator />
            <div>
              <span className="text-sm text-muted-foreground">Notes:</span>
              <p className="text-sm mt-1">{match.notes}</p>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {isPending && (
          <>
            <Button className="flex-1" onClick={() => handleStatusUpdate("interested")} disabled={loading}>
              <ThumbsUp className="h-4 w-4 mr-2" />
              Interested
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleStatusUpdate("not-interested")}
              disabled={loading}
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              Pass
            </Button>
          </>
        )}

        {match.status === "interested" && (
          <>
            <Button className="flex-1" onClick={() => handleStatusUpdate("meeting-scheduled")} disabled={loading}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
            <Link href={`/messages?match=${match.id}`}>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </Link>
          </>
        )}

        {match.status === "meeting-scheduled" && (
          <Link href={`/messages?match=${match.id}`} className="flex-1">
            <Button className="w-full">
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
          </Link>
        )}

        <Link
          href={
            userType === "startup"
              ? `/investors/${profile?.slug || profile?.id}`
              : `/startups/${profile?.slug || profile?.id}`
          }
        >
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
