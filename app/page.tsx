'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Building2, TrendingUp, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { SetupGuide } from '@/components/setup-guide';
import Hero from '@/components/homepage/Hero';
import Features from '@/components/homepage/Features';
import Footer from '@/components/elements/Footer';
import HeroBanner from '@/components/homepage/Banner';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Hero Section */}
      <Hero />
      
      {/* Features Section */}
      <Features />
      
      {/* Enhanced Stats Section - Fully Responsive */}
    <HeroBanner />
    </div>
  );
}
