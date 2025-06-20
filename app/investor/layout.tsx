import type React from "react"
import { InvestorLayout } from "@/components/layout/investor-layout"

export default function InvestorRootLayout({ children }: { children: React.ReactNode }) {
  return <InvestorLayout>{children}</InvestorLayout>
}
