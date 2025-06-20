"use client"

import { Card } from "@/components/ui/card"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { useAuth } from "@/components/providers"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { PlusCircle, Trash2 } from "lucide-react"

interface TeamMember {
  id?: string // For existing members
  name: string
  role: string
  linkedin_url?: string
  bio?: string
}

export default function StartupTeamPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([{ name: "", role: "", linkedin_url: "", bio: "" }])

  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return
      try {
        const { data, error: fetchError } = await supabase
          .from("startup_team_members")
          .select("*")
          .eq("startup_id", (await supabase.from("startups").select("id").eq("user_id", user.id).single()).data?.id)

        if (fetchError) throw fetchError
        if (data && data.length > 0) {
          setTeamMembers(
            data.map((member) => ({
              id: member.id,
              name: member.name || "",
              role: member.role || "",
              linkedin_url: member.linkedin_url || "",
              bio: member.bio || "",
            })),
          )
        }
      } catch (err) {
        console.error("Error loading team data:", err)
      }
    }
    loadExistingData()
  }, [user])

  const handleAddMember = () => {
    setTeamMembers([...teamMembers, { name: "", role: "", linkedin_url: "", bio: "" }])
  }

  const handleRemoveMember = (index: number) => {
    const newMembers = teamMembers.filter((_, i) => i !== index)
    setTeamMembers(newMembers)
  }

  const handleChangeMember = (index: number, field: keyof TeamMember, value: string) => {
    const newMembers = [...teamMembers]
    newMembers[index] = { ...newMembers[index], [field]: value }
    setTeamMembers(newMembers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!user) {
      setError("You must be logged in.")
      setLoading(false)
      return
    }

    const { data: startupData, error: startupError } = await supabase
      .from("startups")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (startupError || !startupData) {
      setError("Startup profile not found.")
      setLoading(false)
      return
    }
    const startupId = startupData.id

    try {
      // Upsert team members
      const upsertPromises = teamMembers.map((member) => {
        const memberData = {
          startup_id: startupId,
          name: member.name,
          role: member.role,
          linkedin_url: member.linkedin_url,
          bio: member.bio,
        }
        if (member.id) {
          // Existing member
          return supabase.from("startup_team_members").update(memberData).eq("id", member.id)
        } else {
          // New member
          return supabase.from("startup_team_members").insert(memberData)
        }
      })

      const results = await Promise.all(upsertPromises)
      results.forEach((result) => {
        if (result.error) throw result.error
      })

      // Remove members not in the current list (if they existed before)
      const currentMemberIds = teamMembers.filter((m) => m.id).map((m) => m.id)
      const { data: existingMembers } = await supabase
        .from("startup_team_members")
        .select("id")
        .eq("startup_id", startupId)
      if (existingMembers) {
        const membersToRemove = existingMembers.filter((em) => !currentMemberIds.includes(em.id))
        if (membersToRemove.length > 0) {
          await supabase
            .from("startup_team_members")
            .delete()
            .in(
              "id",
              membersToRemove.map((m) => m.id),
            )
        }
      }

      toast({
        title: "Team information saved",
        description: "Let's continue with funding information.",
        variant: "success",
      })
      router.push("/onboarding/startup/funding")
    } catch (err: any) {
      console.error("Error saving team information:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <OnboardingLayout type="startup">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Team Members</h2>
          <Button type="button" variant="outline" size="sm" onClick={handleAddMember}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Member
          </Button>
        </div>

        {teamMembers.map((member, index) => (
          <Card key={index} className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Member {index + 1}</h3>
              {teamMembers.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveMember(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`memberName-${index}`}>Full Name *</Label>
                <Input
                  id={`memberName-${index}`}
                  value={member.name}
                  onChange={(e) => handleChangeMember(index, "name", e.target.value)}
                  placeholder="e.g., Jane Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor={`memberRole-${index}`}>Role/Title *</Label>
                <Input
                  id={`memberRole-${index}`}
                  value={member.role}
                  onChange={(e) => handleChangeMember(index, "role", e.target.value)}
                  placeholder="e.g., CEO, Co-founder"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`memberLinkedin-${index}`}>LinkedIn Profile URL</Label>
              <Input
                id={`memberLinkedin-${index}`}
                type="url"
                value={member.linkedin_url || ""}
                onChange={(e) => handleChangeMember(index, "linkedin_url", e.target.value)}
                placeholder="https://linkedin.com/in/janedoe"
              />
            </div>
            <div>
              <Label htmlFor={`memberBio-${index}`}>Short Bio (Optional)</Label>
              <Textarea
                id={`memberBio-${index}`}
                value={member.bio || ""}
                onChange={(e) => handleChangeMember(index, "bio", e.target.value)}
                placeholder="Briefly describe their experience and contribution."
                rows={3}
              />
            </div>
          </Card>
        ))}

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={() => router.push("/onboarding/startup/company")}>
            Back
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  )
}
