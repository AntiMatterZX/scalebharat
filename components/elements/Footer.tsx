import React from 'react'
import { ArrowRight, Building2, TrendingUp, Users, Zap } from 'lucide-react';
import Link from 'next/link';


const Footer = () => {
  return (
      <footer className="bg-gray-900 dark:bg-gray-950 text-white dark:text-zinc-200 py-12 px-4 border-t border-gray-800 dark:border-gray-800 shadow-inner transition-all duration-300">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-6 w-6" />
                <span className="text-lg font-bold">StartupConnect</span>
              </div>
              <p className="text-gray-400 dark:text-gray-400">
                Connecting innovation with investment opportunities worldwide.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400 dark:text-gray-400">
                <li>
                  <Link href="/startups" className="hover:text-primary transition-colors duration-200">Browse Startups</Link>
                </li>
                <li>
                  <Link href="/investors" className="hover:text-primary transition-colors duration-200">Find Investors</Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="hover:text-primary transition-colors duration-200">How It Works</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400 dark:text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-primary transition-colors duration-200">Help Center</Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary transition-colors duration-200">Contact Us</Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary transition-colors duration-200">Privacy Policy</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 dark:text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-primary transition-colors duration-200">About Us</Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-primary transition-colors duration-200">Careers</Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-primary transition-colors duration-200">Blog</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 dark:border-gray-800 mt-8 pt-8 text-center text-gray-400 dark:text-gray-500">
            <p>&copy; 2024 StartupConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
  )
}

export default Footer