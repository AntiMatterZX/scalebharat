"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InvestorLayout } from "@/components/layout/investor-layout"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import { Heart, HeartOff } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function InvestorWishlistPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [wishlist, setWishlist] = useState<any[]>([])
  const [investorProfile, setInvestorProfile] = useState<any>(null)

  useEffect(() => {
    if (user) {
      loadInvestorProfile()
    }
  }, [user])

  useEffect(() => {
    if (investorProfile) {
      loadWishlist()
    }
  }, [investorProfile])

  const loadInvestorProfile = async () => {
    try {
      const { data } = await supabase.from("investors").select("*").eq("user_id", user!.id).single()
      setInvestorProfile(data)
    } catch (error) {
      console.error("Error loading investor profile:", error)
    }
  }

  const loadWishlist = async () => {
    try {
      if (!investorProfile) return

      const { data, error } = await supabase
        .from("investor_wishlists")
        .select(
          `
          *,
          startups (
            id,
            company_name,
            tagline,
            logo,
            stage,
            industry,
            business_model,
            total_raised,
            valuation,
            website,
            slug
          )
        `,
        )
        .eq("investor_id", investorProfile.id)

      if (error) {
        console.error("Error loading wishlist:", error)
      } else {
        setWishlist(data || [])
      }
    } catch (error) {
      console.error("Error loading wishlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (startupId: string) => {
    try {
      if (!investorProfile) return

      const { error } = await supabase
        .from("investor_wishlists")
        .delete()
        .eq("investor_id", investorProfile.id)
        .eq("startup_id", startupId)

      if (error) {
        console.error("Error removing from wishlist:", error)
      } else {
        // Update local state
        setWishlist(wishlist.filter((item) => item.startup_id !== startupId))
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    }
    return `$${amount}`
  }

  if (loading) {
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Wishlist</h1>
          <p className="text-muted-foreground">Startups you've saved for later</p>
        </div>

        {wishlist.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Heart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No startups in your wishlist</h3>
              <p className="text-muted-foreground text-center mt-2">
                Browse startups and add them to your wishlist to keep track of promising opportunities
              </p>
              <Link href="/investor/startups">
                <Button className="mt-4">Browse Startups</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {wishlist.map((item) => {
              const startup = item.startups
              return (
                <Card key={item.id}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 p-6 bg-gray-50 dark:bg-gray-800 flex flex-col">
                        <div className="flex items-center mb-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={startup.logo || "/placeholder.svg"} alt={startup.company_name} />
                            <AvatarFallback>
                              {startup.company_name
                                .split(" ")
                                .map((word: string) => word[0])
                                .join("")
                                .substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <h3 className="font-bold text-lg">{startup.company_name}</h3>
                            <div className="flex items-center mt-1">
                              <Badge variant="outline" className="capitalize">
                                {startup.stage.replace("-", " ")}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 flex-1">
                          <div>
                            <p className="text-sm font-medium">Founded</p>
                            <p className="text-sm">{startup.founded_year || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Total Raised</p>
                            <p className="text-sm">{formatCurrency(startup.total_raised || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Valuation</p>
                            <p className="text-sm">{startup.valuation ? formatCurrency(startup.valuation) : "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Business Model</p>
                            <p className="text-sm capitalize">{startup.business_model}</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Button variant="outline" className="w-full" onClick={() => removeFromWishlist(startup.id)}>
                            <HeartOff className="mr-2 h-4 w-4" />
                            Remove from Wishlist
                          </Button>
                        </div>
                      </div>

                      <div className="md:w-3/4 p-6">
                        <div className="mb-4">
                          <h4 className="font-medium text-lg">About</h4>
                          <p className="text-muted-foreground mt-1">{startup.tagline}</p>
                        </div>
                        <Link href={`/startups/${startup.slug}`}>
                          <Button variant="link">View Full Profile</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </InvestorLayout>
  )
}
