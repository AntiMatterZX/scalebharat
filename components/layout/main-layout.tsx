'use client'

import { Navbar } from './navbar'
import Footer from '@/components/elements/Footer'
import { usePathname } from 'next/navigation'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  
  // Don't show footer on dashboard pages
  const isDashboardPage = pathname?.startsWith('/startup/') ||
                          pathname?.startsWith('/investor/') ||
                          pathname?.startsWith('/admin/') ||
                          pathname?.startsWith('/superadmin/')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      {!isDashboardPage && <Footer />}
    </div>
  )
}