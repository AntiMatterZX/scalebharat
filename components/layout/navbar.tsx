'use client'

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Home, 
  Building2, 
  Users, 
  TrendingUp, 
  Calendar, 
  MessageSquare, 
  Settings, 
  Search, 
  BarChart3, 
  Heart, 
  Briefcase,
  PieChart,
  UserCheck,
  MailIcon,
  Menu,
  X
} from 'lucide-react';
import { NotificationCenter } from '@/components/ui/notifications';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { type: userType, isLoading: profileLoading } = useUserProfile();

  // Close mobile nav on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close mobile nav when screen becomes desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        router.push('/auth/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
    setIsOpen(false);
  };

  // Get dynamic navigation items based on user type
  const getNavigationItems = () => {
    if (!user || profileLoading) return [];

    const commonItems = [
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Account settings"
      }
    ];

    if (userType === "startup") {
      return [
        {
          name: "Startup Dashboard",
          href: "/startup/dashboard",
          icon: Home,
          description: "Your startup dashboard"
        },
        {
          name: "My Startup",
          href: "/startup/profile",
          icon: Building2,
          description: "Company profile"
        },
        {
          name: "Browse Investors",
          href: "/startup/investors",
          icon: Users,
          description: "Find investors"
        },
        {
          name: "Matches",
          href: "/startup/matches",
          icon: TrendingUp,
          description: "Investor matches"
        },
        {
          name: "Messages",
          href: "/startup/messages",
          icon: MessageSquare,
          description: "Chat with investors"
        },
        {
          name: "Meetings",
          href: "/startup/meetings",
          icon: Calendar,
          description: "Scheduled meetings"
        },
        {
          name: "Analytics",
          href: "/startup/analytics",
          icon: BarChart3,
          description: "Performance metrics"
        },
        ...commonItems
      ];
    } else if (userType === "investor") {
      return [
        {
          name: "Investor Dashboard",
          href: "/investor/dashboard",
          icon: Home,
          description: "Your investor dashboard"
        },
        {
          name: "My Profile",
          href: "/investor/profile",
          icon: UserCheck,
          description: "Investor profile"
        },
        {
          name: "Browse Startups",
          href: "/investor/startups",
          icon: Search,
          description: "Discover startups"
        },
        {
          name: "Matches",
          href: "/investor/matches",
          icon: TrendingUp,
          description: "Startup matches"
        },
        {
          name: "Messages",
          href: "/investor/messages",
          icon: MessageSquare,
          description: "Chat with startups"
        },
        {
          name: "Wishlist",
          href: "/investor/wishlist",
          icon: Heart,
          description: "Saved startups"
        },
        {
          name: "Portfolio",
          href: "/investor/portfolio",
          icon: Briefcase,
          description: "Investment portfolio"
        },
        {
          name: "Meetings",
          href: "/investor/meetings",
          icon: Calendar,
          description: "Scheduled meetings"
        },
        {
          name: "Analytics",
          href: "/investor/analytics",
          icon: PieChart,
          description: "Investment analytics"
        },
        ...commonItems
      ];
    } else if (userType === "admin") {
      return [
        {
          name: "Admin Dashboard",
          href: "/admin/dashboard",
          icon: Home,
          description: "Admin dashboard"
        },
        {
          name: "Users",
          href: "/admin/users",
          icon: Users,
          description: "Manage users"
        },
        {
          name: "Startups",
          href: "/admin/startups",
          icon: Building2,
          description: "Manage startups"
        },
        {
          name: "Investors",
          href: "/admin/investors",
          icon: TrendingUp,
          description: "Manage investors"
        },
        {
          name: "Analytics",
          href: "/admin/analytics",
          icon: BarChart3,
          description: "Platform analytics"
        },
        {
          name: "Messages",
          href: "/admin/messages",
          icon: MailIcon,
          description: "System messages"
        },
        ...commonItems
      ];
    }

    return commonItems;
  };

  return (
    <nav className="bg-white dark:bg-background border-b border-gray-200 dark:border-gray-800 relative sticky top-0 z-[100] transition-colors duration-300">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-16">
          <NavLeft setIsOpen={setIsOpen} pathname={pathname} userType={userType} isOpen={isOpen} />
          <NavRight 
            user={user} 
            userType={userType}
            profileLoading={profileLoading}
            navigationItems={getNavigationItems()}
            handleSignOut={handleSignOut} 
          />
        </div>
      </div>
      <NavMenu 
        isOpen={isOpen} 
        user={user} 
        userType={userType}
        profileLoading={profileLoading}
        navigationItems={getNavigationItems()}
        handleSignOut={handleSignOut} 
        pathname={pathname} 
        setIsOpen={setIsOpen} 
      />
    </nav>
  );
}

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <svg
        width="32"
        height="24"
        viewBox="0 0 50 39"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="fill-foreground transition-colors duration-300"
      >
        <path
          d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z"
          stopColor="currentColor"
        ></path>
        <path
          d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z"
          stopColor="currentColor"
        ></path>
      </svg>
      <span className="font-semibold text-lg text-foreground hidden sm:block">StartupConnect</span>
    </Link>
  );
};

interface NavLeftProps {
  setIsOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  pathname: string;
  userType: string | null;
  isOpen: boolean;
}

const NavLeft = ({ setIsOpen, pathname, userType, isOpen }: NavLeftProps) => {
  // Desktop navigation shows public routes for everyone
  const getPublicNavItems = () => {
    return [
      { text: "Home", href: "/" },
      { text: "Startups", href: "/startups" },
      { text: "Investors", href: "/investors" },
    ];
  };

  const navItems = getPublicNavItems();

  return (
    <div className="flex items-center gap-4 flex-1">
      <motion.button
        className="flex items-center justify-center h-10 w-10 lg:hidden rounded-lg bg-accent/50 hover:bg-accent/80 transition-all duration-200 relative z-10 border border-border/30"
        onClick={() => setIsOpen((pv) => !pv)}
        aria-label="Toggle mobile menu"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 180 }}
            transition={{ duration: 0.2 }}
          >
            <X className="h-5 w-5 text-foreground" />
          </motion.div>
        ) : (
          <motion.div 
            className="flex flex-col gap-1"
            initial={{ rotate: 0 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.span 
              className="block w-5 h-0.5 bg-foreground rounded-full"
              animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span 
              className="block w-5 h-0.5 bg-foreground rounded-full"
              animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span 
              className="block w-5 h-0.5 bg-foreground rounded-full"
              animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>
        )}
      </motion.button>
      <Logo />
      <div className="hidden lg:flex items-center gap-6 overflow-x-auto">
        {navItems.map((item) => (
          <NavLink 
            key={item.href} 
            text={item.text} 
            href={item.href} 
            pathname={pathname} 
          />
        ))}
      </div>
    </div>
  );
};

interface NavLinkProps {
  text: string;
  href: string;
  pathname: string;
}

const NavLink = ({ text, href, pathname }: NavLinkProps) => {
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      className="h-[30px] overflow-hidden font-medium"
    >
      <motion.div whileHover={{ y: -30 }}>
        <span className={`flex items-center h-[30px] transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
          {text}
        </span>
        <span className="flex items-center h-[30px] text-primary">
          {text}
        </span>
      </motion.div>
    </Link>
  );
};

interface NavRightProps {
  user: any;
  userType: string | null;
  profileLoading: boolean;
  navigationItems: any[];
  handleSignOut: () => void;
}

const NavRight = ({ user, userType, profileLoading, navigationItems, handleSignOut }: NavRightProps) => {
  return (
    <div className="flex items-center gap-3">
      {/* Theme Toggle */}
      <ThemeToggle className="scale-75" />
      
      {/* Notifications - only show for authenticated users */}
      {user && <NotificationCenter />}
      
      {/* Auth Section */}
      {user ? (
        <div className="hidden lg:flex items-center gap-3">
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-accent">
                <Avatar className="h-7 w-7 border border-border">
                  <AvatarImage src={user.user_metadata?.profile_picture} alt={user.user_metadata?.full_name || user.email} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">
                    {user.user_metadata?.full_name || 'User'}
                  </span>
                  {userType && !profileLoading && (
                    <span className="text-xs text-muted-foreground capitalize">
                      {userType}
                    </span>
                  )}
                </div>
                <Menu className="h-3 w-3 ml-1 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 mt-1" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center space-y-1">
                  <Avatar className="h-10 w-10 mr-3 border border-border">
                    <AvatarImage src={user.user_metadata?.profile_picture} alt={user.user_metadata?.full_name || user.email} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    {userType && !profileLoading && (
                      <p className="text-xs leading-none text-primary font-medium capitalize">
                        {userType}
                      </p>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Dynamic Navigation Items */}
              {navigationItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="flex items-center">
                    <item.icon className="mr-3 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{item.name}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      )}
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <FiArrowRight className="mr-3 h-4 w-4 rotate-180 text-muted-foreground" />
                <span className="text-foreground">Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="hidden md:flex items-center gap-2 sm:gap-3">
          <Link href="/auth/login">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 h-8 sm:h-9">
              Sign in
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 h-8 sm:h-9">
              Sign up
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

interface NavMenuProps {
  isOpen: boolean;
  user: any;
  userType: string | null;
  profileLoading: boolean;
  navigationItems: any[];
  handleSignOut: () => void;
  pathname: string;
  setIsOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
}

const NavMenu = ({ isOpen, user, userType, profileLoading, navigationItems, handleSignOut, pathname, setIsOpen }: NavMenuProps) => {
  // Public routes that everyone can see
  const publicRoutes = [
    { text: "Home", href: "/" },
    { text: "Startups", href: "/startups" },
    { text: "Investors", href: "/investors" },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay with blur effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998] lg:hidden"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modern mobile menu slide-in */}
      <motion.div
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "-100%", opacity: 0 }}
        transition={{ 
          type: "spring", 
          damping: 30, 
          stiffness: 400,
          mass: 0.8 
        }}
        className="fixed top-0 left-0 h-screen w-80 max-w-[90vw] bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-2xl z-[9999] lg:hidden overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 sm:p-4 border-b border-border/30 bg-accent/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-foreground">ScaleBharat</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-9 w-9 p-0 hover:bg-accent/80 rounded-full"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex flex-col h-full">
           {/* User Profile Section - Only for authenticated users */}
           {user && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1, duration: 0.3 }}
               className="p-2 sm:p-4 border-b border-border/30 flex-shrink-0"
             >
               <div className="flex items-center gap-3">
                 <Avatar className="h-10 w-10 border-2 border-primary/20">
                   <AvatarImage src={user.user_metadata?.profile_picture} alt={user.user_metadata?.full_name || user.email} />
                   <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                     {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
                   </AvatarFallback>
                 </Avatar>
                 <div className="flex-1 min-w-0">
                   <p className="font-medium text-foreground truncate text-sm">
                     {user.user_metadata?.full_name || 'User'}
                   </p>
                   <p className="text-xs text-muted-foreground truncate">
                     {user.email}
                   </p>
                   {userType && !profileLoading && (
                     <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
                       {userType.charAt(0).toUpperCase() + userType.slice(1)}
                     </span>
                   )}
                 </div>
               </div>
             </motion.div>
           )}
           
           {/* Scrollable Menu Content */}
           <div className="flex-1 overflow-y-auto py-3" style={{ paddingBottom: user ? '120px' : '180px' }}>
                         {/* Public Navigation */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: user ? 0.2 : 0.1, duration: 0.3 }}
               className="px-4 mb-6"
             >
               <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Explore</h3>
               <div className="space-y-1">
                {publicRoutes.map((route, index) => (
                  <motion.div
                    key={route.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (user ? 0.25 : 0.15) + (index * 0.05), duration: 0.3 }}
                  >
                    <Link href={route.href} onClick={() => setIsOpen(false)}>
                                              <div 
                         className={`group flex items-center px-2 py-2 sm:px-3 sm:py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                           route.href === pathname 
                             ? "bg-primary text-primary-foreground shadow-md" 
                             : "text-foreground hover:bg-accent/80 hover:text-accent-foreground"
                         }`}
                       >
                        <span>{route.text}</span>
                        {route.href === pathname && (
                          <div className="ml-auto w-2 h-2 bg-primary-foreground rounded-full" />
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>

                         {/* Dashboard Navigation - Only for authenticated users */}
             {user && navigationItems.length > 0 && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.3, duration: 0.3 }}
                 className="px-4 mb-6"
               >
                 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dashboard</h3>
                <div className="space-y-1">
                  {navigationItems.slice(0, 8).map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + (index * 0.05), duration: 0.3 }}
                    >
                      <Link href={item.href} onClick={() => setIsOpen(false)}>
                                                <div 
                           className={`group flex items-center gap-3 px-2 py-2 sm:px-3 sm:py-2.5 rounded-lg text-sm transition-all duration-200 ${
                             item.href === pathname 
                               ? "bg-primary text-primary-foreground shadow-md" 
                               : "text-foreground hover:bg-accent/80 hover:text-accent-foreground"
                           }`}
                         >
                          <item.icon className={`h-5 w-5 flex-shrink-0 ${
                            item.href === pathname ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium ${item.href === pathname ? 'text-primary-foreground' : 'text-foreground'}`}>
                              {item.name}
                            </div>
                            {item.description && (
                              <div className={`text-xs ${item.href === pathname ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {item.description}
                              </div>
                            )}
                          </div>
                          {item.href === pathname && (
                            <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
          
                     {/* Bottom Action Section - Fixed at bottom */}
           <div className="absolute bottom-0 left-0 right-0 border-t border-border/30 p-3 sm:p-4 bg-background/95 backdrop-blur-sm flex-shrink-0" style={{ paddingBottom: 'max(4rem, calc(env(safe-area-inset-bottom) + 2rem))' }}>
             {user ? (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4, duration: 0.3 }}
               >
                 <button
                   onClick={handleSignOut}
                   className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200 group border border-destructive/20 hover:border-destructive/40"
                 >
                   <FiArrowRight className="h-4 w-4 rotate-180 group-hover:scale-110 transition-transform" />
                   <span>Sign Out</span>
                 </button>
               </motion.div>
             ) : (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2, duration: 0.3 }}
                 className="flex flex-col gap-3 mb-4"
               >
                 <Link href="/auth/login" onClick={() => setIsOpen(false)} className="block">
                   <Button 
                     variant="outline" 
                     className="w-full h-11 text-sm font-medium hover:bg-accent/80 transition-all duration-200 border-border/60 mb-2"
                   >
                     Sign In
                   </Button>
                 </Link>
                 <Link href="/auth/register" onClick={() => setIsOpen(false)} className="block">
                   <Button 
                     className="w-full h-11 text-sm font-medium bg-emerald-500 text-black hover:bg-emerald-600 transition-all duration-200 shadow-md"
                   >
                     Get Started
                   </Button>
                 </Link>
               </motion.div>
             )}
           </div>
        </div>
      </motion.div>
    </>
  );
};