'use client'

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiMenu, FiArrowRight } from "react-icons/fi";
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

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

  return (
    <nav className="bg-white p-4 border-b-[1px] border-gray-200 flex items-center justify-between relative sticky top-0 z-40">
      <NavLeft setIsOpen={setIsOpen} pathname={pathname} />
      <NavRight user={user} handleSignOut={handleSignOut} />
      <NavMenu isOpen={isOpen} user={user} handleSignOut={handleSignOut} pathname={pathname} />
    </nav>
  );
}

const Logo = () => {
  return (
    <Link href="/" className="block">
      <svg
        width="50"
        height="39"
        viewBox="0 0 50 39"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="fill-gray-800"
      >
        <path
          d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z"
          stopColor="#000000"
        ></path>
        <path
          d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z"
          stopColor="#000000"
        ></path>
      </svg>
    </Link>
  );
};

interface NavLeftProps {
  setIsOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  pathname: string;
}

const NavLeft = ({ setIsOpen, pathname }: NavLeftProps) => {
  return (
    <div className="flex items-center gap-6">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="block lg:hidden text-gray-950 text-2xl"
        onClick={() => setIsOpen((pv) => !pv)}
      >
        <FiMenu />
      </motion.button>
      <Logo />
      <NavLink text="Home" href="/" pathname={pathname} />
      <NavLink text="Startups" href="/startups" pathname={pathname} />
      <NavLink text="Investors" href="/investors" pathname={pathname} />
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
      className="hidden lg:block h-[30px] overflow-hidden font-medium"
    >
      <motion.div whileHover={{ y: -30 }}>
        <span className={`flex items-center h-[30px] ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
          {text}
        </span>
        <span className="flex items-center h-[30px] text-indigo-600">
          {text}
        </span>
      </motion.div>
    </Link>
  );
};

interface NavRightProps {
  user: any;
  handleSignOut: () => void;
}

const NavRight = ({ user, handleSignOut }: NavRightProps) => {
  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden sm:block px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-md whitespace-nowrap"
          >
            Dashboard
          </motion.button>
        </Link>
        <div className="hidden sm:flex items-center gap-2">
          <Avatar className="h-8 w-8 border-2 border-indigo-600">
            <AvatarImage src={user.user_metadata?.profile_picture} alt={user.user_metadata?.full_name || user.email} />
            <AvatarFallback className="bg-indigo-600 text-white text-sm">
              {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent font-medium rounded-md whitespace-nowrap"
          >
            Logout
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/auth/login">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent font-medium rounded-md whitespace-nowrap"
        >
          Sign in
        </motion.button>
      </Link>
      <Link href="/auth/register">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-md whitespace-nowrap"
        >
          Sign up
        </motion.button>
      </Link>
    </div>
  );
};

interface NavMenuProps {
  isOpen: boolean;
  user: any;
  handleSignOut: () => void;
  pathname: string;
}

const NavMenu = ({ isOpen, user, handleSignOut, pathname }: NavMenuProps) => {
  return (
    <motion.div
      variants={menuVariants}
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      className="absolute p-4 bg-white shadow-lg left-0 right-0 top-full origin-top flex flex-col gap-4"
    >
      <MenuLink text="Home" href="/" pathname={pathname} />
      <MenuLink text="Startups" href="/startups" pathname={pathname} />
      <MenuLink text="Investors" href="/investors" pathname={pathname} />
      
      {/* Mobile Auth Section */}
      <div className="pt-4 border-t border-gray-200 space-y-3">
        {user ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10 border-2 border-indigo-600">
                <AvatarImage src={user.user_metadata?.profile_picture} alt={user.user_metadata?.full_name || user.email} />
                <AvatarFallback className="bg-indigo-600 text-white">
                  {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-md">
                Dashboard
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={handleSignOut} 
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                Sign in
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-md">
                Sign up
              </Button>
            </Link>
          </>
        )}
      </div>
    </motion.div>
  );
};

interface MenuLinkProps {
  text: string;
  href: string;
  pathname: string;
}

const MenuLink = ({ text, href, pathname }: MenuLinkProps) => {
  const isActive = pathname === href;
  
  return (
    <motion.div variants={menuLinkVariants}>
      <Link
        href={href}
        className="h-[30px] overflow-hidden font-medium text-lg flex items-start gap-2"
      >
        <motion.span variants={menuLinkArrowVariants}>
          <FiArrowRight className="h-[30px] text-gray-950" />
        </motion.span>
        <motion.div whileHover={{ y: -30 }}>
          <span className={`flex items-center h-[30px] ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
            {text}
          </span>
          <span className="flex items-center h-[30px] text-indigo-600">
            {text}
          </span>
        </motion.div>
      </Link>
    </motion.div>
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