export type UserRole = "user" | "startup" | "investor" | "admin" | "superadmin"

// Client-safe function to get user roles via API
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