import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import localFont from "next/font/local"
import { Providers } from "@/components/providers"
import { MainLayout } from "@/components/layout/main-layout"
import { Toaster } from "@/components/ui/toaster"
import { PerformanceMonitor } from "@/components/performance-monitor"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const calSans = localFont({
  src: "../public/fonts/CalSans-SemiBold.woff2",
  variable: "--font-cal-sans",
  display: "swap",
  weight: "600",
})

export const metadata: Metadata = {
  title: "StartupConnect - Find Your Perfect Investment Match",
  description:
    "Connect innovative startups with the right investors. Find funding, discover opportunities, and build meaningful partnerships.",
  keywords: ["startup", "investor", "funding", "venture capital", "angel investor", "startup directory"],
  authors: [{ name: "StartupConnect Team" }],
  openGraph: {
    title: "StartupConnect - Find Your Perfect Investment Match",
    description: "Connect innovative startups with the right investors.",
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "StartupConnect",
  },
  twitter: {
    card: "summary_large_image",
    title: "StartupConnect - Find Your Perfect Investment Match",
    description: "Connect innovative startups with the right investors.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${calSans.variable} font-sans antialiased`}>
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
          <Toaster />
          <PerformanceMonitor />
        </Providers>
      </body>
    </html>
  )
}
