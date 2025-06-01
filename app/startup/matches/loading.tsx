import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export default function StartupMatchesLoading() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header>
        <Skeleton className="h-9 w-3/4 md:w-1/2 mb-2" />
        <Skeleton className="h-5 w-full md:w-3/4" />
      </header>
      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-28" />
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />

              <div className="space-y-1 pt-2">
                <Skeleton className="h-4 w-1/3 mb-1" />
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <Skeleton className="h-4 w-1/3 mb-1" />
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-24 mt-2" />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4 border-t">
              <Skeleton className="h-9 w-full sm:w-28" />
              <Skeleton className="h-9 w-full sm:w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
