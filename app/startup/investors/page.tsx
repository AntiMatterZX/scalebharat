"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export default function StartupBrowseInvestorsPage() {
  // Placeholder - In a real app, fetch and display investors
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Browse Investors</h1>
        <p className="text-muted-foreground">Discover potential investors for your startup.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input placeholder="Search by firm name, industry, etc." className="flex-1" />
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Investor Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <p>Investor listing will appear here.</p>
            <p className="text-sm">Functionality to browse and filter investors is under development.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
