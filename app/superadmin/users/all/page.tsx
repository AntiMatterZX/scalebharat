"use client"

import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function AllUsersPage() {
  useEffect(() => {
    redirect("/superadmin/users")
  }, [])

  return null
}
