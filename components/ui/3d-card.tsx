import { motion } from "framer-motion";
import { FiArrowRight, FiDollarSign, FiMapPin, FiTrendingUp } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Building2, Users, Target, Zap, Building } from "lucide-react";
import Link from "next/link";

interface Startup3DCardProps {
  startup: {
    id: string;
    slug?: string;
    company_name: string;
    tagline?: string;
    description?: string;
    logo?: string;
    stage?: string;
    industry?: string[];
    location?: string;
    target_amount?: number;
    is_featured?: boolean;
    is_verified?: boolean;
    users?: {
      first_name: string;
      last_name: string;
      profile_picture?: string;
    };
  };
}

interface Investor3DCardProps {
  investor: {
    id: string;
    slug?: string;
    firm_name?: string;
    bio?: string;
    type: string;
    check_size_min?: number;
    check_size_max?: number;
    investment_stages?: string[];
    investment_industries?: string[];
    investment_geographies?: string[];
    is_featured?: boolean;
    is_verified?: boolean;
    users?: {
      first_name: string;
      last_name: string;
      profile_picture?: string;
    };
  };
}

export const Startup3DCard = ({ startup }: Startup3DCardProps) => {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return "Not disclosed"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount)
  }

  return (
    <motion.div 
      className="group w-full max-w-lg mx-auto relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Floating Accent Elements */}
      <div className="absolute -inset-4 opacity-30 group-hover:opacity-50 transition-opacity duration-500">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-indigo-500/20 rounded-full blur-xl"></div>
      </div>
      
      {/* Sleek Wrapper Card */}
      <div className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-slate-700/50 transition-all duration-500 group-hover:shadow-3xl group-hover:shadow-blue-500/10 dark:group-hover:shadow-blue-400/20 group-hover:scale-[1.02] group-hover:-translate-y-2">
        <motion.div whileHover="hovered" className="cursor-pointer">
          <StartupScreenMock startup={startup} />
          <StartupCardCopy startup={startup} formatCurrency={formatCurrency} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export const Investor3DCard = ({ investor }: Investor3DCardProps) => {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return "Not disclosed"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount)
  }

  return (
    <motion.div 
      className="group w-full max-w-lg mx-auto relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Floating Accent Elements */}
      <div className="absolute -inset-4 opacity-30 group-hover:opacity-50 transition-opacity duration-500">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-xl"></div>
      </div>
      
      {/* Sleek Wrapper Card */}
      <div className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-slate-700/50 transition-all duration-500 group-hover:shadow-3xl group-hover:shadow-green-500/10 dark:group-hover:shadow-green-400/20 group-hover:scale-[1.02] group-hover:-translate-y-2">
        <motion.div whileHover="hovered" className="cursor-pointer">
          <InvestorScreenMock investor={investor} />
          <InvestorCardCopy investor={investor} formatCurrency={formatCurrency} />
        </motion.div>
      </div>
    </motion.div>
  );
};

const StartupScreenMock = ({ startup }: { startup: Startup3DCardProps['startup'] }) => {
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
      className="w-full h-80 rounded-2xl p-4 bg-gradient-to-br from-blue-300 via-purple-300 to-indigo-300 dark:from-blue-800 dark:via-purple-800 dark:to-indigo-800"
    >
      {/* Main Card Container */}
      <div
        style={{ transform: "translateZ(80px)", transformStyle: "preserve-3d" }}
        className="w-full h-full bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-blue-500"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-purple-500"></div>
          <div className="absolute top-1/2 right-6 w-12 h-12 rounded-full bg-indigo-500"></div>
        </div>

        {/* Header with Avatar and Badge */}
        <div
          style={{
            transformStyle: "preserve-3d",
          }}
          className="flex items-start justify-between mb-4 relative z-10"
        >
          <div className="flex items-center gap-3">
            <div
              style={{ transform: "translateZ(40px)" }}
              className="relative"
            >
              <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                <AvatarImage
                  src={startup.logo || "/placeholder.svg"}
                  alt={startup.company_name}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                  {startup.company_name
                    .split(" ")
                    .map((word: string) => word[0])
                    .join("")
                    .substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              {startup.is_verified && (
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                  <Star className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div
              style={{ transform: "translateZ(20px)" }}
              className="flex flex-col gap-1"
            >
              {startup.is_featured && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs w-fit">
                  Featured
                </Badge>
              )}
              {startup.stage && (
                <Badge variant="outline" className="text-xs w-fit capitalize">
                  {startup.stage.replace("-", " ")}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{ transform: "translateZ(60px)" }}
          className="space-y-3 relative z-10"
        >
          <h3 className="font-bold text-xl text-gray-900 dark:text-white line-clamp-1">
            {startup.company_name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {startup.tagline || "Innovative startup seeking investment"}
          </p>
        </div>

        {/* Visual Elements */}
        <div
          style={{ transform: "translateZ(100px)" }}
          className="absolute bottom-6 right-6 grid grid-cols-2 gap-2"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <FiTrendingUp className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const InvestorScreenMock = ({ investor }: { investor: Investor3DCardProps['investor'] }) => {
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
      className="w-full h-80 rounded-2xl p-4 bg-gradient-to-br from-green-300 via-emerald-300 to-teal-300 dark:from-green-800 dark:via-emerald-800 dark:to-teal-800"
    >
      {/* Main Card Container */}
      <div
        style={{ transform: "translateZ(80px)", transformStyle: "preserve-3d" }}
        className="w-full h-full bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-green-500"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-emerald-500"></div>
          <div className="absolute top-1/2 right-6 w-12 h-12 rounded-full bg-teal-500"></div>
        </div>

        {/* Header with Avatar and Badge */}
        <div
          style={{
            transformStyle: "preserve-3d",
          }}
          className="flex items-start justify-between mb-4 relative z-10"
        >
          <div className="flex items-center gap-3">
            <div
              style={{ transform: "translateZ(40px)" }}
              className="relative"
            >
              <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                <AvatarImage
                  src={investor.users?.profile_picture || "/placeholder.svg"}
                  alt={investor.firm_name || `${investor.users?.first_name} ${investor.users?.last_name}`}
                />
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold">
                  {investor.firm_name
                    ? investor.firm_name
                        .split(" ")
                        .map((word: string) => word[0])
                        .join("")
                        .substring(0, 2)
                    : `${investor.users?.first_name?.[0] || ""}${investor.users?.last_name?.[0] || ""}`}
                </AvatarFallback>
              </Avatar>
              {investor.is_verified && (
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                  <Star className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div
              style={{ transform: "translateZ(20px)" }}
              className="flex flex-col gap-1"
            >
              {investor.is_featured && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs w-fit">
                  Featured
                </Badge>
              )}
              <Badge variant="outline" className="text-xs w-fit capitalize">
                {investor.type.replace("-", " ")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{ transform: "translateZ(60px)" }}
          className="space-y-3 relative z-10"
        >
          <h3 className="font-bold text-xl text-gray-900 dark:text-white line-clamp-1">
            {investor.firm_name || `${investor.users?.first_name} ${investor.users?.last_name}`}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {investor.bio || "Experienced investor seeking opportunities"}
          </p>
        </div>

        {/* Visual Elements */}
        <div
          style={{ transform: "translateZ(100px)" }}
          className="absolute bottom-6 right-6 grid grid-cols-2 gap-2"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <FiDollarSign className="h-6 w-6 text-white" />
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Building className="h-6 w-6 text-white" />
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <FiMapPin className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const StartupCardCopy = ({ 
  startup, 
  formatCurrency 
}: { 
  startup: Startup3DCardProps['startup'];
  formatCurrency: (amount: number | null) => string;
}) => {
  return (
    <div className="flex items-start mt-6 gap-4">
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
        }}
        className="flex-shrink-0"
      >
        <FiArrowRight className="text-2xl text-primary mt-1" />
      </motion.div>
      
      <motion.div
        variants={{
          hovered: {
            x: 0,
          },
        }}
        style={{
          x: -40,
        }}
        transition={{
          duration: 0.35,
        }}
        className="flex-1 space-y-4"
      >
        <div>
          <h4 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            {startup.company_name}
          </h4>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
            {startup.description || startup.tagline || "An innovative startup looking for investment opportunities."}
          </p>
        </div>

        {/* Key Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {startup.target_amount && (
            <div className="flex items-center gap-2">
              <FiDollarSign className="h-4 w-4 text-green-600" />
              <span className="text-gray-600 dark:text-gray-300">
                {formatCurrency(startup.target_amount)}
              </span>
            </div>
          )}
          
          {startup.location && (
            <div className="flex items-center gap-2">
              <FiMapPin className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600 dark:text-gray-300">
                {startup.location}
              </span>
            </div>
          )}

          {startup.industry && startup.industry.length > 0 && (
            <div className="col-span-2 flex items-center gap-2">
              <FiTrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                {startup.industry.slice(0, 2).join(", ")}
                {startup.industry.length > 2 && ` +${startup.industry.length - 2} more`}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Link href={`/startups/${startup.slug || startup.id}`} className="flex-1">
            <Button variant="outline" className="w-full text-sm">
              View Profile
            </Button>
          </Link>
          <Button size="sm" className="px-6">
            Connect
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const InvestorCardCopy = ({ 
  investor, 
  formatCurrency 
}: { 
  investor: Investor3DCardProps['investor'];
  formatCurrency: (amount: number | null) => string;
}) => {
  return (
    <div className="flex items-start mt-6 gap-4">
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
        }}
        className="flex-shrink-0"
      >
        <FiArrowRight className="text-2xl text-primary mt-1" />
      </motion.div>
      
      <motion.div
        variants={{
          hovered: {
            x: 0,
          },
        }}
        style={{
          x: -40,
        }}
        transition={{
          duration: 0.35,
        }}
        className="flex-1 space-y-4"
      >
        <div>
          <h4 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            {investor.firm_name || `${investor.users?.first_name} ${investor.users?.last_name}`}
          </h4>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
            {investor.bio || "Experienced investor looking for promising startups to support."}
          </p>
        </div>

        {/* Key Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2 flex items-center gap-2">
            <FiDollarSign className="h-4 w-4 text-green-600" />
            <span className="text-gray-600 dark:text-gray-300">
              {formatCurrency(investor.check_size_min ?? null)} - {formatCurrency(investor.check_size_max ?? null)}
            </span>
          </div>
          
          {investor.investment_stages && investor.investment_stages.length > 0 && (
            <div className="col-span-2 flex items-center gap-2">
              <FiTrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                {investor.investment_stages.slice(0, 2).join(", ")}
                {investor.investment_stages.length > 2 && ` +${investor.investment_stages.length - 2} more`}
              </span>
            </div>
          )}

          {investor.investment_geographies && investor.investment_geographies.length > 0 && (
            <div className="col-span-2 flex items-center gap-2">
              <FiMapPin className="h-4 w-4 text-purple-600" />
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                {investor.investment_geographies.slice(0, 2).join(", ")}
                {investor.investment_geographies.length > 2 && ` +${investor.investment_geographies.length - 2} more`}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Link href={`/investors/${investor.slug || investor.id}`} className="flex-1">
            <Button variant="outline" className="w-full text-sm">
              View Profile
            </Button>
          </Link>
          <Button size="sm" className="px-6">
            Contact
          </Button>
        </div>
      </motion.div>
    </div>
  );
}; 