import React from 'react'
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, TrendingUp, Users } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative py-24 px-4 min-h-screen flex items-center overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-emerald-50 dark:from-gray-900 dark:via-blue-950 dark:to-emerald-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.2),transparent_50%)]" />
      
      <div className="container-fluid relative z-10">
        <div className="text-center animate-fade-in">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-700 mb-8">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Trusted by 500+ startups worldwide
            </span>
          </div>

          {/* Enhanced Headline */}
          <h1 className="heading-1 mb-6 animate-slide-up">
            Connect. Fund.
            <br />
            <span className="text-gradient">Scale to Success</span>
          </h1>

          {/* Enhanced Description */}
          <p className="body-large text-muted-foreground mb-10 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            The modern platform connecting innovative startups with the right investors.
            <br className="hidden sm:block" />
            Real-time matching, AI-powered recommendations, and seamless funding workflows.
          </p>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/onboarding">
              <Button size="lg" className="button-gradient-success group">
                <Users className="mr-2 h-5 w-5" />
                Join as Startup
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button size="lg" variant="outline" className="group border-2 hover:border-primary">
                <TrendingUp className="mr-2 h-5 w-5" />
                Invest Today
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gradient mb-1">500+</div>
              <div className="text-sm text-muted-foreground">Active Startups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gradient mb-1">200+</div>
              <div className="text-sm text-muted-foreground">Verified Investors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gradient mb-1">$50M+</div>
              <div className="text-sm text-muted-foreground">Funding Raised</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gradient mb-1">95%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>

          {/* Enhanced Logo Marquee */}
          <div className="relative overflow-hidden animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex animate-marquee whitespace-nowrap">
              {/* Company logos with enhanced styling */}
              {['Meta', 'Stripe', 'OpenAI', 'Vercel', 'Supabase', 'Notion', 'Linear', 'Figma'].map((company, index) => (
                <React.Fragment key={company}>
                  <div className="flex items-center justify-center mx-8 opacity-60 hover:opacity-80 transition-opacity">
                    <span className="text-lg font-semibold text-muted-foreground">{company}</span>
                  </div>
                </React.Fragment>
              ))}
              {/* Duplicate for seamless loop */}
              {['Meta', 'Stripe', 'OpenAI', 'Vercel', 'Supabase', 'Notion', 'Linear', 'Figma'].map((company, index) => (
                <React.Fragment key={`${company}-dup`}>
                  <div className="flex items-center justify-center mx-8 opacity-60 hover:opacity-80 transition-opacity">
                    <span className="text-lg font-semibold text-muted-foreground">{company}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Trust Indicator */}
          <div className="mt-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <p className="text-sm text-muted-foreground">
              Powering the next generation of successful startups
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
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </section>
  )
}

export default Hero