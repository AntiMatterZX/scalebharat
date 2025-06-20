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
        return <Badge variant="secondary" className="text-xs">Pending Review</Badge>
      case "interested":
        return <Badge variant="default" className="text-xs">Interested</Badge>
      case "not-interested":
        return <Badge variant="outline" className="text-xs">Not Interested</Badge>
      case "meeting-scheduled":
        return <Badge className="bg-green-600 text-xs">Meeting Scheduled</Badge>
      case "deal-closed":
        return <Badge className="bg-purple-600 text-xs">Deal Closed</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
              <AvatarImage
                src={profile?.logo || profile?.users?.profile_picture || "/placeholder.svg"}
                alt={profile?.company_name || profile?.firm_name || "Profile"}
              />
              <AvatarFallback className="text-xs sm:text-sm">
                {(profile?.company_name || profile?.firm_name || "U")
                  .split(" ")
                  .map((word: string) => word[0])
                  .join("")
                  .substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-lg line-clamp-1">
                {userType === "startup"
                  ? profile?.firm_name || `${profile?.users?.first_name} ${profile?.users?.last_name}`
                  : profile?.company_name}
              </CardTitle>
              <CardDescription className="line-clamp-1 text-xs sm:text-sm">
                {userType === "startup" ? profile?.bio : profile?.tagline}
              </CardDescription>
              {profile?.is_verified && (
                <Badge variant="secondary" className="text-xs mt-1 w-fit">
                  <Star className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
            {getStatusBadge(match.status)}
            <div className="text-center sm:text-right">
              <span className={`text-xl sm:text-2xl font-bold ${getScoreColor(match.match_score)}`}>
                {match.match_score}%
              </span>
              <p className="text-xs text-muted-foreground">Match Score</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 flex-1">
        {/* Match Score Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium">Match Breakdown</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">Match Score Details</DialogTitle>
                  <DialogDescription className="text-sm">How this match score was calculated</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                                      {match.score_breakdown &&
                      Object.entries(match.score_breakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="capitalize text-sm">{key.replace(/([A-Z])/g, " $1")}</span>
                          <span className="font-medium text-sm">{String(value)}%</span>
                        </div>
                      ))}
                  {match.reasons && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2 text-sm">Match Reasons:</h4>
                      <ul className="text-sm space-y-1">
                        {match.reasons.map((reason: string, index: number) => (
                          <li key={index} className="flex items-center text-xs sm:text-sm">
                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 flex-shrink-0"></span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
          {userType === "startup" ? (
            <>
              <div>
                <span className="text-muted-foreground text-xs sm:text-sm">Type:</span>
                <p className="font-medium capitalize text-xs sm:text-sm">{profile?.type}</p>
              </div>
              {profile?.check_size_min && profile?.check_size_max && (
                <div>
                  <span className="text-muted-foreground text-xs sm:text-sm">Check Size:</span>
                  <p className="font-medium text-xs sm:text-sm">
                    ${profile.check_size_min}K - ${profile.check_size_max}K
                  </p>
                </div>
              )}
              {profile?.investment_stages && (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground text-xs sm:text-sm">Investment Stages:</span>
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
                <span className="text-muted-foreground text-xs sm:text-sm">Stage:</span>
                <p className="font-medium capitalize text-xs sm:text-sm">{profile?.stage?.replace("-", " ")}</p>
              </div>
              {profile?.target_amount && (
                <div>
                  <span className="text-muted-foreground text-xs sm:text-sm">Seeking:</span>
                  <p className="font-medium text-xs sm:text-sm">${(profile.target_amount / 1000).toFixed(0)}K</p>
                </div>
              )}
              {profile?.industry && (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground text-xs sm:text-sm">Industries:</span>
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
              <span className="text-xs sm:text-sm text-muted-foreground">Notes:</span>
              <p className="text-xs sm:text-sm mt-1 leading-relaxed">{match.notes}</p>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4">
        {isPending && (
          <>
            <Button 
              className="w-full sm:flex-1" 
              onClick={() => handleStatusUpdate("interested")} 
              disabled={loading}
              size="sm"
            >
              <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Interested
            </Button>
            <Button
              variant="outline"
              className="w-full sm:flex-1"
              onClick={() => handleStatusUpdate("not-interested")}
              disabled={loading}
              size="sm"
            >
              <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Pass
            </Button>
          </>
        )}

        {match.status === "interested" && (
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button 
              className="w-full sm:flex-1" 
              onClick={() => handleStatusUpdate("meeting-scheduled")} 
              disabled={loading}
              size="sm"
            >
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Schedule Meeting
            </Button>
            <Link href={`/messages?match=${match.id}`}>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-0" />
                <span className="sm:hidden">Message</span>
              </Button>
            </Link>
          </div>
        )}

        {match.status === "meeting-scheduled" && (
          <div className="flex gap-2 w-full">
            <Link href={`/messages?match=${match.id}`} className="flex-1">
              <Button className="w-full" size="sm">
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Message
              </Button>
            </Link>
            <Link
              href={
                userType === "startup"
                  ? `/investors/${profile?.slug || profile?.id}`
                  : `/startups/${profile?.slug || profile?.id}`
              }
            >
              <Button variant="outline" size="sm" className="px-3">
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </Link>
          </div>
        )}

        {!isPending && match.status !== "interested" && match.status !== "meeting-scheduled" && (
          <Link
            href={
              userType === "startup"
                ? `/investors/${profile?.slug || profile?.id}`
                : `/startups/${profile?.slug || profile?.id}`
            }
            className="w-full"
          >
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              View Profile
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}
