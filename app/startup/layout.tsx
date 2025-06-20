import type React from "react"
import { StartupLayout } from "@/components/layout/startup-layout"

export default function StartupRootLayout({ children }: { children: React.ReactNode }) {
  return <StartupLayout>{children}</StartupLayout>
}
