import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DollarSign, TrendingUp } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/types/database"

type Startup = Database["public"]["Tables"]["startups"]["Row"] & {
  users: {
    first_name: string | null
    last_name: string | null
    profile_picture: string | null
  } | null
}

export const dynamic = "force-dynamic"

export default async function StartupsPage() {
  const supabase = createServerComponentClient<Database>({ cookies })

  // Fetch published startups with user data
  const { data: startups, error } = await supabase
    .from("startups")
    .select(`
      *,
      users (first_name, last_name, profile_picture)
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching startups:", error)
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Error Loading Startups</h1>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    
    


    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Discover Startups</h1>
        <p className="text-xl text-muted-foreground">
          Explore innovative startups looking for investment and partnerships.
        </p>
      </div>

      {!startups || startups.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">No startups found</h2>
          <p className="text-muted-foreground mb-6">Be the first to register your startup!</p>
          <Button asChild>
            <Link href="/auth/register">Get Started</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {startups.map((startup) => (
            <StartupCard key={startup.id} startup={startup} />
          ))}
        </div>
      )}
    </div>
  )
}

function StartupCard({ startup }: { startup: Startup }) {
  // Use slug if available, fallback to ID
  const profileUrl = startup.slug ? `/startups/${startup.slug}` : `/startups/${startup.id}`

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={startup.logo || "/placeholder.svg?width=48&height=48&query=startup+logo"}
              alt={startup.company_name}
            />
            <AvatarFallback>{startup.company_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{startup.company_name}</CardTitle>
            <CardDescription className="text-sm truncate">{startup.tagline}</CardDescription>
          </div>
        </div>

        {startup.industry && startup.industry.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {startup.industry.slice(0, 2).map((industry) => (
              <Badge key={industry} variant="secondary" className="text-xs">
                {industry}
              </Badge>
            ))}
            {startup.industry.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{startup.industry.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {startup.description || "No description available."}
        </p>

        <div className="space-y-2 mb-4">
          {startup.stage && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{startup.stage}</span>
            </div>
          )}

          {startup.target_amount && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>Seeking ${startup.target_amount.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {startup.users && (
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={startup.users.profile_picture || "/placeholder.svg?width=24&height=24&query=user+avatar"}
                  alt={`${startup.users.first_name} ${startup.users.last_name}`}
                />
                <AvatarFallback className="text-xs">
                  {startup.users.first_name?.charAt(0)}
                  {startup.users.last_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="text-sm text-muted-foreground">
              {startup.users ? `${startup.users.first_name} ${startup.users.last_name}` : "Anonymous"}
            </span>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>👍</span>
            <span>{startup.upvote_count || 0}</span>
          </div>
        </div>

        <Button asChild className="w-full mt-4">
          <Link href={profileUrl}>View Profile</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
