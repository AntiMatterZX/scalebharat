'use client'

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiMenu, FiArrowRight, FiX } from "react-icons/fi";
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
  MailIcon
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
    <nav className="bg-background border-b border-border relative sticky top-0 z-[100] transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLeft setIsOpen={setIsOpen} pathname={pathname} userType={userType} />
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
}

const NavLeft = ({ setIsOpen, pathname, userType }: NavLeftProps) => {
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center h-10 w-10 lg:hidden text-foreground text-2xl transition-colors duration-300 rounded-md hover:bg-accent"
        onClick={() => setIsOpen((pv) => !pv)}
      >
        <FiMenu />
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
      <ThemeToggle variant="ghost" size="sm" />
      
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
                <FiMenu className="h-3 w-3 ml-1" />
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
                    <item.icon className="mr-3 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm">{item.name}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      )}
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <FiArrowRight className="mr-3 h-4 w-4 rotate-180" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              Sign in
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
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
      {/* Backdrop overlay */}
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] lg:hidden"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Mobile menu drawer */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 300,
          mass: 0.8 
        }}
        className="fixed top-16 left-0 right-0 bg-background border-b border-border shadow-xl z-[9999] lg:hidden"
        style={{ 
          height: 'calc(100vh - 4rem)',
          maxHeight: 'calc(100vh - 4rem)'
        }}
      >
        {/* Menu Header with Close Button */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex items-center justify-between p-4 border-b border-border bg-accent/30"
        >
          <div className="flex items-center gap-2">
            <svg
              width="24"
              height="18"
              viewBox="0 0 50 39"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="fill-foreground"
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
            <span className="font-semibold text-lg text-foreground">Menu</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 hover:bg-accent"
          >
            <FiX className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </motion.div>

        <div className="flex flex-col" style={{ height: 'calc(100% - 73px)' }}>
          {/* Scrollable content area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4"
            style={{ 
              height: '100%',
              paddingBottom: 'max(env(safe-area-inset-bottom), 2rem)',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent',
              WebkitOverflowScrolling: 'touch'
            }}
          >
          {/* Public Navigation - Always visible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Navigation</h3>
            <div className="space-y-1">
              {publicRoutes.map((route, index) => (
                <motion.div
                  key={route.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (index * 0.05), duration: 0.3 }}
                >
                  <Link href={route.href} onClick={() => setIsOpen(false)}>
                    <div 
                      className={`w-full p-3 rounded-lg border transition-colors touch-manipulation min-h-[2.5rem] flex items-center ${
                        route.href === pathname 
                          ? "bg-primary text-primary-foreground border-primary shadow-md" 
                          : "bg-background hover:bg-accent border-border active:bg-accent/80"
                      }`}
                    >
                      <span className="text-sm font-medium">{route.text}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Mobile Profile Section */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="flex items-center gap-2.5 p-2.5 bg-accent/50 rounded-lg"
            >
              <Avatar className="h-8 w-8 border-2 border-primary">
                        <AvatarImage src={user.user_metadata?.profile_picture} alt={user.user_metadata?.full_name || user.email} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                          {user.user_metadata?.full_name || 'User'}
                        </p>
                <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                {userType && !profileLoading && (
                  <p className="text-xs text-primary font-medium capitalize">
                    {userType}
                  </p>
                )}
              </div>
            </motion.div> 
          )}
          
          {/* Auth-based Navigation - Only for authenticated users */}
          {user && navigationItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.3 }}
            >
              <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">My Dashboard</h3>
              <div className="space-y-1">
                {navigationItems.slice(0, 6).map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (index * 0.05), duration: 0.3 }}
                  >
                    <Link href={item.href} onClick={() => setIsOpen(false)}>
                      <div 
                        className={`w-full p-2.5 rounded-md border transition-colors flex items-center gap-2.5 min-h-[2.5rem] ${
                          item.href === pathname 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-background hover:bg-accent border-border"
                        }`}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-xs opacity-70">{item.description}</div>
                          )}
                        </div>
                      </div>
                      </Link>
                  </motion.div>
                ))}
                    </div>
            </motion.div>
          )}
          
          {/* Mobile Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="border-t border-border pt-3"
          >
            {user ? (
              <div 
                        onClick={handleSignOut} 
                className="w-full p-2.5 rounded-md border border-border bg-background hover:bg-accent transition-colors flex items-center gap-2.5 cursor-pointer min-h-[2.5rem]"
              >
                <FiArrowRight className="h-4 w-4 flex-shrink-0 rotate-180" />
                <div>
                  <div className="text-sm font-medium">Sign out</div>
                  <div className="text-xs text-muted-foreground">Log out of your account</div>
                </div>
                    </div>
            ) : (
              <div className="space-y-2">
                <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                  <div className="w-full p-3 rounded-md border border-border bg-background hover:bg-accent transition-colors">
                    <div className="text-sm font-medium">Sign in</div>
                    <div className="text-xs text-muted-foreground">Access your account</div>
                  </div>
                      </Link>
                <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                  <div className="w-full p-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <div className="text-sm font-medium">Sign up</div>
                    <div className="text-xs opacity-70">Create a new account</div>
                    </div>
                      </Link>
              </div>
            )}
          </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

// Animation variants
const menuVariants = {
  open: {
    scaleY: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  closed: {
    scaleY: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.1,
    },
  },
};

const menuLinkVariants = {
  open: {
    y: 0,
    opacity: 1,
  },
  closed: {
    y: -10,
    opacity: 0,
  },
};

const menuLinkArrowVariants = {
  open: {
    x: 0,
  },
  closed: {
    x: -4,
  },
};