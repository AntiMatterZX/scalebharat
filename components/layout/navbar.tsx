'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Startups', href: '/startups' },
  { name: 'Investors', href: '/investors' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/auth/login')
      router.refresh()
    }
    setMobileMenuOpen(false)
  }

  return (
    <nav className="border-b bg-background sticky top-0 z-30 shadow-sm transition-all duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-xl font-bold tracking-tight text-primary">
                StartupConnect
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center border-b-2 px-1 pt-1 text-base font-semibold transition-all duration-200',
                    pathname === item.href
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:border-accent hover:text-accent-foreground'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <button
              aria-label="Toggle dark mode"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full p-2 transition-colors duration-200 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-400 transition-all duration-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700 transition-all duration-300" />
              )}
            </button>
            {user ? (
              <>
                <span className="text-base font-medium text-muted-foreground">
                  Hello, {user.user_metadata?.full_name || user.email}
                </span>
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
                <Button variant="ghost" onClick={handleSignOut}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-all duration-200"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-border bg-background shadow-md transition-all duration-200">
          <div className="space-y-1 px-2 pt-2 pb-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'block rounded-md px-3 py-2 text-base font-semibold transition-all duration-200',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Dashboard</Button>
                </Link>
                <button
                  className="block w-full rounded-md px-3 py-2 text-left text-base font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                  onClick={handleSignOut}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full text-left">
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}