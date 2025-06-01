import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { logError } from "./error-handling"

export type UserRole = "user" | "startup" | "investor" | "admin" | "superadmin"

// Add this new client-safe function at the top
export async function getUserRolesClient(userId: string): Promise<UserRole[]> {
  try {
    const response = await fetch(`/api/user/roles?userId=${userId}`)
    if (!response.ok) {
      return ["user"]
    }
    const data = await response.json()
    return data.roles || ["user"]
  } catch (error) {
    console.error("Error fetching user roles:", error)
    return ["user"]
  }
}

export async function assignRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const supabase = createSupabaseServiceRoleClient()

    // For startup and investor roles, we don't use this function
    // Those are managed through their respective profile tables
    if (role === "startup" || role === "investor" || role === "user") {
      return false
    }

    // First try to insert, if it fails due to conflict, update instead
    const { error: insertError } = await supabase.from("user_roles").insert({ user_id: userId, role })

    if (insertError) {
      // If it's a conflict error, try to update instead
      if (insertError.code === "23505") {
        // unique_violation
        const { error: updateError } = await supabase
          .from("user_roles")
          .update({ role, updated_at: new Date().toISOString() })
          .eq("user_id", userId)

        if (updateError) {
          logError(updateError, { context: "assign-role-update", userId, role })
          return false
        }
      } else {
        logError(insertError, { context: "assign-role-insert", userId, role })
        return false
      }
    }

    return true
  } catch (error) {
    logError(error as Error, { context: "assign-role", userId, role })
    return false
  }
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const supabase = createSupabaseServiceRoleClient()

    // Check for admin/superadmin roles first
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single()

    if (!roleError && userRole) {
      return userRole.role as UserRole
    }

    // Check if user is a startup
    const { data: startup } = await supabase.from("startups").select("id").eq("user_id", userId).single()

    if (startup) return "startup"

    // Check if user is an investor
    const { data: investor } = await supabase.from("investors").select("id").eq("user_id", userId).single()

    if (investor) return "investor"

    // Default to user role
    return "user"
  } catch (error) {
    logError(error as Error, { context: "get-user-role", userId })
    return "user"
  }
}

export async function removeRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const supabase = createSupabaseServiceRoleClient()

    // For startup and investor roles, we don't use this function
    if (role === "startup" || role === "investor" || role === "user") {
      return false
    }

    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role)

    if (error) {
      logError(error, { context: "remove-role", userId, role })
      return false
    }

    return true
  } catch (error) {
    logError(error as Error, { context: "remove-role", userId, role })
    return false
  }
}

// Check if user has a specific role
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const userRole = await getUserRole(userId)
    return userRole === role
  } catch (error) {
    logError(error as Error, { context: "hasRole", userId, role })
    return false
  }
}

// Get all roles for a user
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const roles: UserRole[] = ["user"] // Everyone has the base user role

  try {
    const supabase = createSupabaseServiceRoleClient()

    // Check if user is a startup
    const { data: startup } = await supabase.from("startups").select("id").eq("user_id", userId).single()

    if (startup) roles.push("startup")

    // Check if user is an investor
    const { data: investor } = await supabase.from("investors").select("id").eq("user_id", userId).single()

    if (investor) roles.push("investor")

    // Check for admin/superadmin roles
    const { data: userRoles, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", userId)

    if (!roleError && userRoles) {
      userRoles.forEach((ur) => {
        if (ur.role === "admin" || ur.role === "superadmin") {
          roles.push(ur.role as UserRole)
        }
      })
    }

    return roles
  } catch (error) {
    logError(error as Error, { context: "getUserRoles", userId })
    return roles
  }
}
