// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom"

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    }),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
      }),
    },
  },
}))

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
}

// Global setup
global.fetch = jest.fn()
