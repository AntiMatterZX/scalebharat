import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { 
  Database, 
  HardDrive, 
  Zap, 
  Shield, 
  Brain, 
  Cpu, 
  Globe,
  Check,
  Square,
  ArrowRight
} from 'lucide-react';
import type { HTMLMotionProps } from 'framer-motion';

const Features = () => {
  const featureCards = [
    {
      title: "Postgres Database",
      icon: <Database className="h-6 w-6" />,
      description: "Every project is a full postgres database, the world's most trusted relational database.",
      features: ["100% portable", "Built-in Auth with RLS", "Easy to extend"],
      completed: [false, false, false],
      color: "bg-blue-100 text-blue-800",
      cols: "col-span-12 md:col-span-6"
    },
    {
      title: "Storage",
      icon: <HardDrive className="h-6 w-6" />,
      description: "Store, organize, and serve large files, from videos to images.",
      features: [],
      completed: [false, true, true, true, true, false, false, false, false, false, false],
      color: "bg-green-100 text-green-800",
      cols: "col-span-12 md:col-span-6"
    },
    {
      title: "Realtime",
      icon: <Zap className="h-6 w-6" />,
      description: "Build multiplayer experiences with real-time data synchronization.",
      features: ["Authentication"],
      credentials: [
        "31691998@mail.com    alox166198",
        "2345678@mail.com    menemaster8000"
      ],
      color: "bg-yellow-100 text-yellow-800",
      cols: "col-span-12 md:col-span-4"
    },
    {
      title: "Vector",
      icon: <Brain className="h-6 w-6" />,
      description: "Integrate your favorite ML-models to store, index and search vector embeddings.",
      features: ["OpenAI", "Hugging Face"],
      completed: [false, false],
      color: "bg-pink-100 text-pink-800",
      cols: "col-span-12 md:col-span-4"
    },
    {
      title: "Edge Functions",
      icon: <Cpu className="h-6 w-6" />,
      description: "Easily write custom code without deploying or scaling servers.",
      features: ["superbase functions server"],
      completed: [false],
      color: "bg-indigo-100 text-indigo-800",
      cols: "col-span-12 md:col-span-4"
    },
    {
      title: "Data APIs",
      icon: <Globe className="h-6 w-6" />,
      description: "Instant ready-to-use Restful APIs.",
      features: ["counters", "containers", "sites", "stores", "country_sedes", "oceans"],
      completed: [false, false, false, false, false, false],
      color: "bg-teal-100 text-teal-800",
      cols: "col-span-12"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 px-4 py-16 text-zinc-900 dark:text-zinc-100 transition-all duration-300">
      <motion.div
        initial="initial"
        animate="animate"
        transition={{
          staggerChildren: 0.05,
        }}
        className="mx-auto grid max-w-6xl grid-flow-dense grid-cols-12 gap-6"
      >
        {/* Header Block */}
        <Block className="col-span-12">
          <h1 className="mb-2 text-3xl font-extrabold leading-tight text-primary dark:text-emerald-300">Postgres Database</h1>
          <p className="text-zinc-600 dark:text-zinc-300">
            Every project is a full postgres database, the world's most trusted relational database.
          </p>
        </Block>

        {/* Feature Cards */}
        {featureCards.map((feature, index) => (
          <FeatureBlock key={index} feature={feature} />
        ))}

        {/* Shipping Tool Block */}
        <Block className="col-span-12 text-center">
          <h3 className="text-lg font-medium mb-2">Shipping Tool</h3>
          <p className="text-zinc-600 dark:text-zinc-300 mb-1">
            Screenshot copied to cloud. Select here to mark up on the webpage.
          </p>
          <p className="text-zinc-600 dark:text-zinc-300">
            Use one or all. Best of breed products. Integrated as a platform.
          </p>
        </Block>
      </motion.div>
    </div>
  );
};

const Block: React.FC<HTMLMotionProps<'div'>> = ({ className, ...rest }) => {
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
      className={twMerge(
        "rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 p-8 shadow-md transition-all duration-200",
        className
      )}
      {...rest}
    />
  );
};

type Feature = {
  title: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
  completed?: boolean[];
  credentials?: string[];
  color: string;
  cols: string;
};

const FeatureBlock = ({ feature }: { feature: Feature }) => {
  return (
    <motion.div
      whileHover={{
        rotate: feature.cols.includes('col-span-12') ? "0.5deg" : "1.5deg",
        scale: 1.02,
        y: -5,
      }}
      className={twMerge(
        "rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 p-8 shadow-md hover:shadow-lg transition-all duration-200",
        feature.cols
      )}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <div className="flex items-start gap-4">
        <div className={`${feature.color} dark:bg-opacity-20 p-3 rounded-lg flex items-center justify-center transition-all duration-200`}>
          {feature.icon}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold mb-1 text-primary dark:text-emerald-300">{feature.title}</h2>
          <p className="text-zinc-600 dark:text-zinc-300 mb-3">{feature.description}</p>
          
          {feature.features.map((item, idx) => (
            <div key={idx} className="flex items-center text-sm text-zinc-600 mb-2">
              {feature.completed && feature.completed[idx] ? (
                <Check className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Square className="h-4 w-4 mr-2 border border-zinc-300 rounded" />
              )}
              <span>{item}</span>
            </div>
          ))}
          
          {feature.credentials && (
            <div className="mt-3 space-y-2">
              {feature.credentials.map((cred, idx) => (
                <div key={idx} className="text-xs bg-zinc-100 p-2 rounded font-mono">
                  {cred}
                </div>
              ))}
            </div>
          )}
          
          {feature.title === "Storage" && feature.completed && (
            <div className="mt-4 grid grid-cols-5 gap-2">
              {feature.completed.map((completed, idx) => (
                <div key={idx} className="h-2 rounded-sm bg-zinc-200">
                  {completed && <div className="h-full w-full bg-green-500 rounded-sm"></div>}
                </div>
              ))}
            </div>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-zinc-400 mt-1" />
      </div>
    </motion.div>
  );
};

export default Features;