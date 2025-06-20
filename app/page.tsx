'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Building2, TrendingUp, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { SetupGuide } from '@/components/setup-guide';
import Hero from '@/components/homepage/Hero';
import Features from '@/components/homepage/Features';
import Footer from '@/components/elements/Footer';

// Check if environment variables are properly configured
function isConfigured() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== 'your-project-id.supabase.co' &&
    supabaseKey !== 'your-anon-key-here' &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl.includes('.supabase.co')
  );
}

export default function HomePage() {
  // Show setup guide if not configured
  if (!isConfigured()) {
    return <SetupGuide />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* Hero Section */}

      <Hero />
      <Features />
      <section className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
            <div className="p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">500+</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600">Active Startups</div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 mb-1 sm:mb-2">200+</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600">Verified Investors</div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-600 mb-1 sm:mb-2">$50M+</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600">Funding Facilitated</div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-600 mb-1 sm:mb-2">95%</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600">Match Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 px-4 bg-blue-600">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">Ready to Get Started?</h2>
          <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of startups and investors who are already building the future together on
            StartupConnect.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Create Your Profile Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
