"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Alert, AlertDescription } from "./ui/alert"
import { ExternalLink, Copy, CheckCircle } from "lucide-react"
import { useState } from "react"

export function SetupGuide() {
  const [copiedStep, setCopiedStep] = useState<number | null>(null)

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(step)
    setTimeout(() => setCopiedStep(null), 2000)
  }

  const envTemplate = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000`

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Setup Required</CardTitle>
          <CardDescription>Let's get your StartupConnect platform configured with Supabase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              You need to set up your Supabase project and environment variables to continue.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  1
                </span>
                Create a Supabase Project
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Go to Supabase and create a new project if you haven't already.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Supabase Dashboard
                </a>
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  2
                </span>
                Get Your Project Credentials
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                In your Supabase project dashboard, go to Settings → API to find your credentials.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • <strong>Project URL:</strong> Found in "Project URL" section
                </li>
                <li>
                  • <strong>Anon Key:</strong> Found in "Project API keys" section
                </li>
                <li>
                  • <strong>Service Role Key:</strong> Found in "Project API keys" section (keep this secret!)
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  3
                </span>
                Create Environment File
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in your project root with:
              </p>
              <div className="relative">
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                  <code>{envTemplate}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(envTemplate, 3)}
                >
                  {copiedStep === 3 ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  4
                </span>
                Set Up Database Schema
              </h3>
              <p className="text-sm text-gray-600 mb-3">Run the database schema in your Supabase SQL editor.</p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open SQL Editor
                </a>
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  5
                </span>
                Restart Development Server
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                After setting up your environment variables, restart your development server:
              </p>
              <div className="relative">
                <pre className="bg-gray-100 p-3 rounded text-sm">
                  <code>npm run dev</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard("npm run dev", 5)}
                >
                  {copiedStep === 5 ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Need help?</strong> Check the README.md file for detailed setup instructions or visit the{" "}
              <a
                href="https://supabase.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Supabase documentation
              </a>
              .
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
