import React from 'react'
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, TrendingUp, Users } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32 px-3 sm:px-4 lg:px-6 xl:px-8 min-h-[90vh] sm:min-h-screen flex items-center overflow-hidden">
      {/* Enhanced Background - Responsive */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-emerald-50 dark:from-gray-900 dark:via-blue-950 dark:to-emerald-950 transition-colors duration-500" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_40%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.08),transparent_40%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.15),transparent_40%)]" />
      
      {/* Floating Decorative Elements - Responsive */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 bg-primary/20 rounded-full animate-bounce-subtle" />
      <div className="absolute top-3/4 right-1/4 w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:w-6 bg-green-500/20 rounded-full animate-bounce-subtle" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-3/4 w-1 h-1 sm:w-2 sm:h-2 lg:w-3 lg:h-3 bg-purple-500/20 rounded-full animate-bounce-subtle" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto max-w-6xl relative z-10 w-full">
        <div className="text-center animate-fade-in">
          {/* Enhanced Trust Badge - Mobile Optimized */}
          <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8 lg:mb-12 hover:scale-105 transition-all duration-300 shadow-lg">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-yellow-500 animate-pulse" />
            <span className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300">
              Trusted by <span className="font-bold text-primary">500+</span> startups worldwide
            </span>
          </div>

          {/* Enhanced Headline - Fully Responsive */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 lg:mb-8 animate-slide-up leading-tight sm:leading-tight lg:leading-tight">
            Connect. Fund.
            <br />
            <span className="text-gradient animate-glow">Scale to Success</span>
          </h1>

          {/* Enhanced Description - Mobile First */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-10 lg:mb-12 max-w-4xl mx-auto animate-slide-up px-4 sm:px-6 leading-relaxed" style={{ animationDelay: '0.1s' }}>
            The <span className="font-semibold text-foreground">modern platform</span> connecting innovative startups with the right investors.
            <br className="hidden sm:block" />
            <span className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground/80 block mt-2 sm:mt-0 sm:inline">
            Real-time matching, AI-powered recommendations, and seamless funding workflows.
            </span>
          </p>

          {/* Enhanced CTA Buttons - Smaller Size */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 lg:mb-20 animate-slide-up max-w-xl mx-auto px-4" style={{ animationDelay: '0.2s' }}>
            <Link href="/onboarding" className="w-full sm:flex-1">
              <Button className="w-full button-gradient-success group py-2 sm:py-3 px-4 sm:px-6 text-sm sm:text-base font-medium hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg">
                <Users className="mr-2 h-4 w-4" />
                <span className="hidden xs:inline">Join as </span>Startup
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/onboarding" className="w-full sm:flex-1">
              <Button variant="outline" className="w-full group border-2 hover:border-primary bg-background/50 backdrop-blur-sm py-2 sm:py-3 px-4 sm:px-6 text-sm sm:text-base font-medium hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg">
                <TrendingUp className="mr-2 h-4 w-4" />
                <span className="hidden xs:inline">Invest </span>Today
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Enhanced Quick Stats - Mobile Optimized */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16 lg:mb-20 animate-slide-up px-4" style={{ animationDelay: '0.3s' }}>
            {[
              { number: "500+", label: "Active Startups" },
              { number: "200+", label: "Verified Investors" },
              { number: "$50M+", label: "Funding Raised" },
              { number: "95%", label: "Success Rate" }
            ].map((stat, index) => (
              <div key={stat.label} className="text-center group">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gradient mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.number}
            </div>
                <div className="text-xs sm:text-sm lg:text-base text-muted-foreground font-medium">
                  {stat.label}
            </div>
            </div>
            ))}
          </div>

          {/* Enhanced Logo Marquee - Responsive */}
          <div className="relative overflow-hidden animate-slide-up mb-8 sm:mb-12 lg:mb-16" style={{ animationDelay: '0.4s' }}>
            <div className="flex animate-marquee whitespace-nowrap">
              {/* Company logos with enhanced styling */}
              {['Meta', 'Stripe', 'OpenAI', 'Vercel', 'Supabase', 'Notion', 'Linear', 'Figma'].map((company, index) => (
                <React.Fragment key={company}>
                  <div className="flex items-center justify-center mx-4 sm:mx-6 lg:mx-8 opacity-50 hover:opacity-80 transition-all duration-300 group">
                    <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-semibold text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-all duration-300">
                      {company}
                    </span>
                  </div>
                </React.Fragment>
              ))}
              {/* Duplicate for seamless loop */}
              {['Meta', 'Stripe', 'OpenAI', 'Vercel', 'Supabase', 'Notion', 'Linear', 'Figma'].map((company, index) => (
                <React.Fragment key={`${company}-dup`}>
                  <div className="flex items-center justify-center mx-4 sm:mx-6 lg:mx-8 opacity-50 hover:opacity-80 transition-all duration-300 group">
                    <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-semibold text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-all duration-300">
                      {company}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>
            
            {/* Gradient Overlays for Smooth Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 lg:w-16 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 lg:w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          </div>

          {/* Enhanced Trust Indicator - Mobile Optimized */}
          <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground font-medium">
              Powering the next generation of <span className="text-gradient font-semibold">successful startups</span>
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Animation Styles */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        
        @media (max-width: 640px) {
          .animate-marquee {
            animation: marquee 25s linear infinite;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}

export default Hero