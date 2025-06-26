import React from 'react'
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users } from 'lucide-react';
import { HeroTabs } from '@/components/ui/supabase-tabs';

const Hero = () => {
  return (
    <section className="relative md:min-h-screen lg:min-h-screen bg-background text-foreground overflow-hidden flex items-center">
      {/* Main Container */}
      <div className="container mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 py-10 sm:py-8 lg:py-12">
        {/* Top Banner - Supabase-style Tabs */}
        <div className="flex justify-center mb-6 sm:mb-12 lg:mb-16">
          <HeroTabs />
        </div>

        {/* Main Content */}
        <div className="text-center max-w-5xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 lg:mb-8 leading-[1.1] tracking-tight">
            <span className="block">Connect. Fund.</span>
            <span className="block text-emerald-400">Scale to millions</span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 lg:mb-10 max-w-3xl mx-auto leading-relaxed">
            ScaleBharat is the modern platform connecting innovative startups with the right investors. 
            Real-time matching, AI-powered recommendations, and seamless funding workflows to help 
            your startup reach millions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-16 sm:mb-20 lg:mb-24 max-w-md mx-auto">
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-black font-semibold py-5 px-6 text-sm rounded-lg transition-all duration-300 hover:scale-[1.02]">
                Start your journey
              </Button>
            </Link>
            <Link href="/investors" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto font-semibold py-5 px-6 text-sm rounded-lg transition-all duration-300"
              >
                Browse investors
              </Button>
            </Link>
          </div>

          {/* Trust Indicator */}
          <p className="text-muted-foreground/70 text-sm mb-10 sm:mb-12">
            Trusted by fast-growing companies across India
          </p>

          {/* Company Logos */}
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 lg:gap-12 opacity-40">
            {['Razorpay', 'Zerodha', 'CRED', 'PhonePe', 'Swiggy', 'Ola'].map((company) => (
              <div key={company} className="text-muted-foreground font-medium text-sm sm:text-base hover:text-foreground transition-colors">
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subtle gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/30 to-transparent pointer-events-none" />
    </section>
  )
}

export default Hero