import React from 'react'
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const Hero = () => {
  return (
    <section className="py-24 px-4 min-h-screen flex items-center bg-gradient-to-br from-blue-50 via-indigo-100 to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900 transition-all duration-300">
        <div className="container mx-auto text-center">
          {/* ===== MAIN HEADLINE ===== */}
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-gray-900 dark:text-white">
            Build in a weekend
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-600 dark:from-emerald-300 dark:to-blue-400">Scale to millions</span>
          </h1>

          {/* ===== HERO DESCRIPTION ===== */}
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
            ConnectVenture is an open source startup-investor platform alternative.<br />
            For Real-time connections, Analytics, and AI-powered recommendations.
          </p>

          {/* ===== CALL TO ACTION BUTTONS ===== */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/register?type=startup">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                Register StartUp!
              </Button>
            </Link>
            <Link href="/auth/register?type=investor">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-gray-300 text-gray-800 hover:bg-gray-200 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Investor
              </Button>
            </Link>
          </div>

          {/* ============================================
        ANIMATED LOGO MARQUEE SECTION
        ============================================ */}

          {/* ===== SCROLLING LOGO CONTAINER ===== */}
          <div className="mt-16 overflow-hidden">
            <div className="flex animate-marquee whitespace-nowrap">
              {/* First set of logos */}
              <div className="flex items-center justify-center mx-8 opacity-40">
                <span className="text-gray-500 text-lg font-medium">Meta</span>
              </div>
              <div className="flex items-center justify-center mx-8 opacity-40">
                <span className="text-gray-500 text-lg font-medium">Stripe</span>
              </div>
              <div className="flex items-center justify-center mx-8 opacity-40">
                <span className="text-gray-500 text-lg font-medium">LangChain</span>
              </div>
              <div className="flex items-center justify-center mx-8 opacity-40">
                <span className="text-gray-500 text-lg font-medium">Resend</span>
              </div>
              <div className="flex items-center justify-center mx-8 opacity-40">
                <span className="text-gray-500 text-lg font-medium">Loops</span>
              </div>
              <div className="flex items-center justify-center mx-8 opacity-40">
                <span className="text-gray-500 text-lg font-medium">Mercury</span>
              </div>

              {/* Duplicate set for seamless infinite loop */}
              <div className="flex items-center justify-center mx-8 opacity-40">
                <span className="text-gray-500 text-lg font-medium">Meta</span>
              </div>
              <div className="flex items-center justify-center mx-8 opacity-40">
                <span className="text-gray-500 text-lg font-medium">Stripe</span>
              </div>
              <div className="flex items-center justify-center mx-8 opacity-40">
                <span className="text-gray-500 text-lg font-medium">LangChain</span>
              </div>
              <div className="flex items-center justify-center mx-8 opacity-40">
                <span className="text-gray-500 text-lg font-medium">Resend</span>
              </div>
              <div className="flex items-center justify-center mx-8 opacity-40">
                <span className="text-gray-500 text-lg font-medium">Loops</span>
              </div>
              <div className="flex items-center justify-center mx-8 opacity-40">
                <span className="text-gray-500 text-lg font-medium">Mercury</span>
              </div>
            </div>
          </div>

          {/* ===== TRUST INDICATOR TEXT ===== */}
          <div className="mt-8">
            <p className="text-gray-500 text-sm">Trusted by fast-growing companies worldwide</p>
          </div>

          {/* ============================================
        CUSTOM ANIMATION STYLES
        ============================================ */}
          <style jsx>{`
            /* Marquee animation keyframes */
            @keyframes marquee {
              0% {
                transform: translateX(0%);
              }
              100% {
                transform: translateX(-50%);
              }
            }

            /* Apply animation to marquee class */
            .animate-marquee {
              animation: marquee 20s linear infinite;
            }
          `}</style>
        </div>
      </section>
  )
}

export default Hero