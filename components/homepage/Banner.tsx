import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HeroBanner() {
  return (
    <section className="relative isolate overflow-hidden bg-background dark:bg-[#0d0d0d] py-24 sm:py-32 lg:py-40 border-b border-border">
      {/* Background shapes */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full bg-gradient-to-br from-purple-500/30 via-indigo-500/30 to-blue-500/30 blur-3xl opacity-30" />
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 sm:px-10 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground drop-shadow-md">
          Empower Your Startup Journey
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Join a trusted network of founders, investors, and innovators. Built for bold ideas, designed for growth.
        </p>

        <div className="mt-10 flex justify-center">
          <Button
            asChild
            size="lg"
            className="px-8 py-4 text-base sm:text-lg bg-gradient-to-tr from-primary to-indigo-500 text-background shadow-xl hover:scale-105 transition-transform rounded-xl"
          >
            <Link href="/onboarding">🚀 Register Your Startup Now</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
