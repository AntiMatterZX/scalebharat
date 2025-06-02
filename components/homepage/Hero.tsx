import React from 'react'
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const Hero = () => {
  return (
    <section className="py-20 px-4 bg-black min-h-screen flex items-center">
        <div className="container mx-auto text-center">
          {/* ===== MAIN HEADLINE ===== */}
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Build in a weekend
            <br />
            <span className="text-emerald-400">Scale to millions</span>
          </h1>

          {/* ===== HERO DESCRIPTION ===== */}
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            ConnectVenture is an open source startup-investor platform alternative.
            <br />
            For Real-time connections, Analytics, and AI-powered recommendations.
          </p>

          {/* ===== CALL TO ACTION BUTTONS ===== */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/register?type=startup">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Register StartUp!
              </Button>
            </Link>
            <Link href="/auth/register?type=investor">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-gray-600 text-gray-800 hover:bg-gray-300"
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