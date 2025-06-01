import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "supabase", "user-type-schema.sql")
    const sql = fs.readFileSync(sqlPath, "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Error initializing database:", error)
      return NextResponse.json({ error: "Failed to initialize database" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in database initialization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
