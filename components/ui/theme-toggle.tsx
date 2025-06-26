"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { BsFillCloudyFill, BsStarFill } from "react-icons/bs"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  showLabel?: boolean
  align?: "start" | "center" | "end"
  className?: string
}

export function ThemeToggle({ 
  variant = "ghost", 
  size = "icon", 
  showLabel = false,
  align = "end",
  className 
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isTransitioning, setIsTransitioning] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn("w-16 h-8 rounded-full bg-muted animate-pulse", className)} />
    )
  }

  const toggleTheme = () => {
    setIsTransitioning(true)
    
    // Start theme transition animation
    setTimeout(() => {
      setTheme(theme === "dark" ? "light" : "dark")
    }, 300)
    
    // End transition animation
    setTimeout(() => {
      setIsTransitioning(false)
    }, 800)
  }

  const currentMode = theme === "dark" ? "dark" : "light"

  return (
    <>
      <button
        onClick={toggleTheme}
        className={cn(
          "p-1 w-16 h-8 rounded-full flex shadow-lg relative bg-gradient-to-b transition-all duration-300 focus:outline-none",
          currentMode === "light"
            ? "justify-end from-blue-500 to-sky-300"
            : "justify-start from-indigo-600 to-indigo-400",
          className
        )}
        aria-label="Toggle theme"
      >
        <Thumb mode={currentMode} />
        {currentMode === "light" && <Clouds />}
        {currentMode === "dark" && <Stars />}
      </button>

      {/* Subtle Theme Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0] }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.8,
              ease: "easeInOut",
              times: [0, 0.5, 1]
            }}
            className={cn(
              "fixed inset-0 z-[9999] pointer-events-none",
              theme === "dark" 
                ? "bg-yellow-200/20" 
                : "bg-gray-900/30"
            )}
          />
        )}
      </AnimatePresence>
    </>
  )
}

const Thumb = ({ mode }: { mode: string }) => {
  return (
    <motion.div
      layout
      transition={{
        duration: 0.5,
        type: "spring",
        stiffness: 200,
        damping: 25,
      }}
      className="h-6 w-6 rounded-full overflow-hidden shadow-lg relative"
    >
      <motion.div
        animate={{
          background: mode === "dark" 
            ? "linear-gradient(135deg, #f1f5f9, #e2e8f0)" 
            : "linear-gradient(135deg, #fbbf24, #f59e0b)"
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full"
      />
      {mode === "light" && <SunCenter />}
      {mode === "dark" && <MoonSpots />}
    </motion.div>
  )
}

const SunCenter = () => (
  <div className="absolute inset-1 rounded-full bg-amber-300" />
)

const MoonSpots = () => (
  <>
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.25, ease: "easeOut" }}
      className="w-1.5 h-1.5 rounded-full bg-slate-400 absolute right-1 bottom-0.5"
    />
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.25, ease: "easeOut" }}
      className="w-1.5 h-1.5 rounded-full bg-slate-400 absolute left-0.5 bottom-2"
    />
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.25, ease: "easeOut" }}
      className="w-1 h-1 rounded-full bg-slate-400 absolute right-1 top-1"
    />
  </>
)

const Stars = () => {
  return (
    <>
      <motion.span
        animate={{
          scale: [0.8, 1, 0.8],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: "easeInOut",
        }}
        className="text-slate-300 text-[8px] absolute right-6 top-0.5"
      >
        <BsStarFill />
      </motion.span>
      <motion.span
        animate={{
          scale: [1, 0.8, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: "easeInOut",
        }}
        style={{ rotate: "-45deg" }}
        className="text-slate-300 text-[10px] absolute right-2 top-1"
      >
        <BsStarFill />
      </motion.span>
      <motion.span
        animate={{
          scale: [1, 0.6, 1],
          opacity: [0.8, 0.4, 0.8],
        }}
        style={{ rotate: "45deg" }}
        transition={{
          repeat: Infinity,
          duration: 3.5,
          ease: "easeInOut",
        }}
        className="text-slate-300 text-[8px] absolute right-4 top-4"
      >
        <BsStarFill />
      </motion.span>
    </>
  )
}

const Clouds = () => {
  return (
    <>
      <motion.span
        animate={{ x: [-8, -6, -4, -2, 0], opacity: [0, 1, 0.75, 1, 0] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          delay: 0.25,
        }}
        className="text-white text-[8px] absolute left-6 top-0"
      >
        <BsFillCloudyFill />
      </motion.span>
      <motion.span
        animate={{ x: [-4, 0, 4, 8, 12], opacity: [0, 1, 0.75, 1, 0] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          delay: 0.5,
        }}
        className="text-white text-[10px] absolute left-2 top-2"
      >
        <BsFillCloudyFill />
      </motion.span>
      <motion.span
        animate={{ x: [-3, 0, 3, 6, 9], opacity: [0, 1, 0.75, 1, 0] }}
        transition={{
          duration: 12.5,
          repeat: Infinity,
        }}
        className="text-white text-[8px] absolute left-4 top-4"
      >
        <BsFillCloudyFill />
      </motion.span>
      <motion.span
        animate={{ x: [-6, 0, 6, 12, 18], opacity: [0, 1, 0.75, 1, 0] }}
        transition={{
          duration: 25,
          repeat: Infinity,
          delay: 0.75,
        }}
        className="text-white absolute text-[8px] left-8 top-2"
      >
        <BsFillCloudyFill />
      </motion.span>
    </>
  )
} 