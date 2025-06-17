import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import {
  Zap,
  Target,
  Shield,
  BarChart3,
  Users,
  MessageSquare,
  Rocket,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Building2,
  DollarSign,
  Network,
  Brain
} from 'lucide-react'
import { FiArrowRight, FiGitPullRequest, FiArrowUpRight } from 'react-icons/fi'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const Features = () => {
  const features = [
    {
      icon: Target,
      title: "Smart Matching",
      description: "AI-powered algorithm matches startups with the most relevant investors based on industry, stage, and investment criteria.",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20"
    },
    {
      icon: Zap,
      title: "Real-time Analytics",
      description: "Track your profile performance, investor engagement, and funding progress with comprehensive analytics dashboard.",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20"
    },
    {
      icon: Shield,
      title: "Verified Network",
      description: "All investors are thoroughly vetted and verified to ensure you connect with legitimate funding sources.",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      icon: MessageSquare,
      title: "Seamless Communication",
      description: "Built-in messaging system with document sharing, meeting scheduling, and progress tracking.",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20"
    },
    {
      icon: BarChart3,
      title: "Portfolio Management",
      description: "Investors can manage their entire portfolio, track investments, and monitor startup progress in one place.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/20"
    },
    {
      icon: Rocket,
      title: "Growth Tools",
      description: "Access to pitch deck templates, financial modeling tools, and expert resources to accelerate your growth.",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20"
    }
  ]

  const benefits = [
    "Connect with 200+ verified investors",
    "AI-powered matching algorithm",
    "Secure document sharing",
    "Real-time funding analytics",
    "Expert mentorship network",
    "24/7 customer support"
  ]

  return (
    <section className="section-padding bg-white dark:bg-gray-900">
      <div className="container-fluid">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary/10 rounded-full mb-4 sm:mb-6">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">
              Powerful Features
            </span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 sm:mb-6">
            Everything you need to 
            <span className="text-gradient"> succeed</span>
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl leading-relaxed text-muted-foreground max-w-3xl mx-auto px-4">
            Our platform provides all the tools and resources you need to connect, 
            communicate, and close funding deals efficiently.
          </p>
        </div>

        {/* Enhanced Bento Grid Features - Fully Responsive */}
        <motion.div
          initial="initial"
          animate="animate"
          transition={{
            staggerChildren: 0.05,
          }}
          className="mx-auto max-w-7xl mb-16 md:mb-20 space-y-4 sm:space-y-6"
        >
          {/* Mobile Layout - Stack Everything */}
          <div className="block lg:hidden space-y-4">
            {/* Main 3D Feature Card - Mobile */}
            <BentoBlock className="min-h-[300px]">
            <ThreeDHoverCard />
          </BentoBlock>

            {/* Feature Cards Grid - Mobile to Tablet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Smart Matching */}
          <BentoBlock
                className="bg-gradient-to-br from-blue-500 to-purple-600 min-h-[200px]"
                whileHover={{ rotate: "1deg", scale: 1.02 }}
              >
                <div className="h-full flex flex-col justify-between text-white">
                  <Target className="h-6 w-6 sm:h-8 sm:w-8 mb-3 sm:mb-4" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Smart Matching</h3>
                    <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">AI-powered connections between startups and investors</p>
                  </div>
                </div>
              </BentoBlock>

              {/* Analytics Dashboard */}
              <BentoBlock
                className="bg-gradient-to-br from-green-500 to-emerald-600 min-h-[200px]"
                whileHover={{ rotate: "-1deg", scale: 1.02 }}
              >
                <div className="h-full flex flex-col justify-between text-white">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 mb-3 sm:mb-4" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Real-time Analytics</h3>
                    <p className="text-green-100 text-xs sm:text-sm leading-relaxed">Track performance and engagement metrics</p>
                  </div>
                </div>
              </BentoBlock>

              {/* Verified Network - Full Width on Tablet */}
              <BentoBlock
                className="bg-gradient-to-br from-orange-500 to-red-600 min-h-[200px] sm:col-span-2"
            whileHover={{ rotate: "1deg", scale: 1.02 }}
          >
            <div className="h-full flex flex-col justify-between text-white">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 mb-3 sm:mb-4" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Verified Network</h3>
                    <p className="text-orange-100 text-xs sm:text-sm leading-relaxed">Thoroughly vetted investors and startups</p>
                  </div>
                </div>
              </BentoBlock>
            </div>

            {/* Communication Tools - Mobile/Tablet */}
            <BentoBlock className="min-h-[120px] sm:min-h-[140px]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-full gap-4">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Seamless Communication</h3>
                    <p className="text-muted-foreground text-sm sm:text-base">Built-in messaging, document sharing, and meeting scheduling</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground flex-shrink-0 hidden sm:block" />
              </div>
            </BentoBlock>

            {/* Stats Grid - Mobile/Tablet */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <StatsBlock
                number="500+"
                label="Active Startups"
                color="from-blue-500 to-blue-600"
              />
              <StatsBlock
                number="200+"
                label="Verified Investors"
                color="from-green-500 to-green-600"
              />
              <StatsBlock
                number="$50M+"
                label="Funding Raised"
                color="from-purple-500 to-purple-600"
              />
              <StatsBlock
                number="95%"
                label="Success Rate"
                color="from-orange-500 to-orange-600"
              />
            </div>
          </div>

          {/* Desktop Layout - Complex Grid */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-6">
            {/* Main 3D Feature Card - Desktop */}
            <BentoBlock className="col-span-8 row-span-2 min-h-[400px]">
              <ThreeDHoverCard />
            </BentoBlock>

            {/* Smart Matching - Desktop */}
            <BentoBlock
              className="col-span-4 bg-gradient-to-br from-blue-500 to-purple-600 min-h-[200px]"
              whileHover={{ rotate: "1deg", scale: 1.02 }}
            >
              <div className="h-full flex flex-col justify-between text-white p-2">
              <Target className="h-8 w-8 mb-4" />
              <div>
                <h3 className="text-xl font-bold mb-2">Smart Matching</h3>
                <p className="text-blue-100 text-sm">AI-powered connections between startups and investors</p>
              </div>
            </div>
          </BentoBlock>

            {/* Analytics Dashboard - Desktop */}
          <BentoBlock
              className="col-span-4 bg-gradient-to-br from-green-500 to-emerald-600 min-h-[200px]"
            whileHover={{ rotate: "-1deg", scale: 1.02 }}
          >
            <div className="h-full flex flex-col justify-between text-white">
              <BarChart3 className="h-8 w-8 mb-4" />
              <div>
                <h3 className="text-xl font-bold mb-2">Real-time Analytics</h3>
                <p className="text-green-100 text-sm">Track performance and engagement metrics</p>
              </div>
            </div>
          </BentoBlock>

            {/* Verified Network - Desktop */}
          <BentoBlock
              className="col-span-4 bg-gradient-to-br from-orange-500 to-red-600 min-h-[200px]"
            whileHover={{ rotate: "1deg", scale: 1.02 }}
          >
            <div className="h-full flex flex-col justify-between text-white">
              <Shield className="h-8 w-8 mb-4" />
              <div>
                <h3 className="text-xl font-bold mb-2">Verified Network</h3>
                <p className="text-orange-100 text-sm">Thoroughly vetted investors and startups</p>
              </div>
            </div>
          </BentoBlock>

            {/* Communication Tools - Desktop */}
            <BentoBlock className="col-span-8 min-h-[140px]">
              <div className="flex items-center justify-between h-full gap-4">
              <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-3xl font-bold mb-2">Seamless Communication</h3>
                    <p className="text-muted-foreground text-lg">Built-in messaging, document sharing, and meeting scheduling</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />
            </div>
          </BentoBlock>

            {/* Stats Grid - Desktop */}
            <div className="col-span-12 grid grid-cols-4 gap-4">
              <StatsBlock
            number="500+"
            label="Active Startups"
            color="from-blue-500 to-blue-600"
          />
              <StatsBlock
            number="200+"
            label="Verified Investors"
            color="from-green-500 to-green-600"
          />
              <StatsBlock
            number="$50M+"
            label="Funding Raised"
            color="from-purple-500 to-purple-600"
          />
              <StatsBlock
            number="95%"
            label="Success Rate"
            color="from-orange-500 to-orange-600"
          />
            </div>
          </div>
        </motion.div>

        {/* Benefits Section - Enhanced Responsive */}
      </div>
    </section>
  )
}

// Enhanced Bento Block Component
const BentoBlock = ({ className, children, whileHover, ...rest }: any) => {
  return (
    <motion.div
      variants={{
        initial: {
          scale: 0.5,
          y: 50,
          opacity: 0,
        },
        animate: {
          scale: 1,
          y: 0,
          opacity: 1,
        },
      }}
      transition={{
        type: "spring",
        mass: 3,
        stiffness: 400,
        damping: 50,
      }}
      whileHover={whileHover}
      className={cn(
        "rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300",
        className
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

// 3D Hover Card Component - Full Animation Version
const ThreeDHoverCard = () => {
  return (
    <motion.div whileHover="hovered" className="cursor-pointer h-full">
      <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6 lg:gap-8 h-full">
        <div className="flex-1 w-full min-w-0">
          <ScreenMock />
        </div>
        <div className="flex-1 w-full min-w-0 flex items-center">
        <CardCopy />
        </div>
      </div>
    </motion.div>
  );
};

const ScreenMock = () => {
  return (
    <motion.div
      variants={{
        hovered: {
          rotateY: "15deg",
          rotateX: "2.5deg",
          x: -10,
        },
      }}
      style={{
        transformStyle: "preserve-3d",
      }}
      transition={{
        duration: 0.35,
      }}
      className="w-full h-60 sm:h-80 rounded-xl sm:rounded-2xl p-2 sm:p-4 bg-gradient-to-br from-violet-300 to-indigo-300 dark:from-violet-800 dark:to-indigo-800"
    >
      {/* Browser Screen */}
      <div
        style={{ transform: "translateZ(80px)", transformStyle: "preserve-3d" }}
        className="w-full h-full bg-slate-900 rounded-lg sm:rounded-xl shadow-lg p-1 sm:p-2 relative"
      >
        {/* Browser Buttons */}
        <div className="flex gap-1 mt-1 relative">
          <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"></span>
          <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-500"></span>
          <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"></span>
        </div>
        {/* Browser Mockup */}
        <div
          style={{
            transformStyle: "preserve-3d",
          }}
          className="p-1 sm:p-2 rounded-md absolute top-6 sm:top-8 bottom-1 sm:bottom-2 left-1 sm:left-2 right-1 sm:right-2 bg-slate-800 grid gap-2 sm:gap-4 grid-cols-6 grid-rows-6"
        >
          <div
            style={{ transform: "translateZ(40px)" }}
            className="rounded-md sm:rounded-lg w-full col-span-6 row-span-1 bg-slate-700"
          />
          <div
            style={{ transform: "translateZ(20px)" }}
            className="rounded-md sm:rounded-lg w-full col-span-1 row-span-5 bg-slate-700"
          />
          <div
            style={{ transform: "translateZ(80px)" }}
            className="rounded-md sm:rounded-lg w-full col-span-3 row-span-5 bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center"
          >
            <FiGitPullRequest className="text-2xl sm:text-4xl lg:text-7xl text-white" />
          </div>
          <div
            style={{ transform: "translateZ(120px)" }}
            className="rounded-md sm:rounded-lg w-full col-span-2 row-span-5 bg-gradient-to-br from-amber-600 to-red-600 flex items-center justify-center"
          >
            <FiArrowUpRight className="text-2xl sm:text-4xl lg:text-7xl text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CardCopy = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 lg:p-4">
      <div className="w-full max-w-xs mx-auto lg:max-w-none lg:mx-0 text-center lg:text-left">
        <motion.div
          variants={{
            hovered: {
              x: -10,
            },
          }}
          style={{
            x: 0,
          }}
          transition={{
            duration: 0.35,
          }}
          className="space-y-1.5 sm:space-y-2.5 lg:space-y-4"
        >
          {/* Mobile badge - similar to section header */}
          <div className="block sm:hidden mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
              <Brain className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium text-primary">Smart Platform</span>
            </div>
          </div>
          
          {/* Enhanced mobile headline */}
          <h4 className="text-2xl sm:text-3xl lg:text-xl xl:text-2xl font-bold text-foreground leading-tight">
            Connect Startups &<br />
            <span className="text-primary">Investors</span>
          </h4>
          
          {/* Enhanced mobile description */}
          <p className="text-sm sm:text-lg lg:text-sm xl:text-base text-muted-foreground leading-relaxed sm:px-0">
            Revolutionary platform that bridges the gap between innovative startups and strategic investors. Our AI-powered matching system creates meaningful connections that drive growth and success.
          </p>
          
          {/* Tablet+ additional text */}
          <p className="hidden sm:block text-sm lg:text-xs xl:text-sm text-muted-foreground/80 leading-relaxed">
            Join over 500 active startups and 200+ verified investors who have already raised $50M+ in funding through our smart matching algorithm and real-time analytics platform.
          </p>
          
          {/* Mobile CTA - desktop style */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-center gap-2 text-primary">
              <FiArrowRight className="text-base" />
              <span className="text-sm font-medium">Get Started Today</span>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          variants={{
            hovered: {
              x: 0,
              opacity: 1,
            },
          }}
          style={{
            x: -40,
            opacity: 0,
          }}
          transition={{
            duration: 0.35,
            delay: 0.1,
          }}
          className="hidden lg:flex items-center lg:justify-start mt-4"
        >
          <div className="flex items-center gap-2 text-primary">
            <FiArrowRight className="text-base" />
            <span className="text-sm font-medium">Explore Platform</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Stats Block Component - Mobile Optimized
const StatsBlock = ({ className, number, label, color }: any) => (
  <BentoBlock
    className={cn("text-center p-3 sm:p-4", className)}
    whileHover={{ scale: 1.05 }}
  >
    <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent mb-1 sm:mb-2`}>
      {number}
    </div>
    <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
  </BentoBlock>
);

export default Features