import React from 'react'
import { ArrowRight, Building2, TrendingUp, Users, Zap } from 'lucide-react';
import Link from 'next/link';


const Footer = () => {
  return (
      <footer className="bg-muted/30 border-t border-border py-12 px-4 shadow-inner transition-all duration-300">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">ScaleBharat</span>
              </div>
              <p className="text-muted-foreground">
                Connecting innovation with investment opportunities worldwide.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Platform</h3>
              <ul className="space-y-2 text-muted-foreground">
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
              <h3 className="font-semibold mb-4 text-foreground">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
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
              <h3 className="font-semibold mb-4 text-foreground">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
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
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 ScaleBharat. All rights reserved.</p>
          </div>
        </div>
      </footer>
  )
}

export default Footer