import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, Rocket, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-card/30 dark:bg-card/20 py-16 sm:py-20 lg:py-24 border-y border-border/40">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-emerald-500/10 blur-3xl opacity-40" />
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto mobile-minimal text-center relative">
        {/* Icon badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
          <Rocket className="h-4 w-4" />
          <span>Ready to Scale?</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
          Empower Your Startup
          <span className="block text-emerald-500">Journey</span>
        </h1>
        
        <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Join a trusted network of founders, investors, and innovators. Built for 
          bold ideas, designed for growth.
        </p>

        {/* CTA with supporting info */}
        <div className="flex flex-col items-center gap-6">
          <Button
            asChild
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-3 text-base rounded-lg transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            <Link href="/onboarding" className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Register Your Startup Now
            </Link>
          </Button>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="font-medium">500+ Startups</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <span className="font-medium">200+ Investors</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <span className="font-medium">$50M+ Funded</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
