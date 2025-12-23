import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface TeamResult {
  id: number;
  members: string[];
}

interface Props {
  teams: TeamResult[];
  gameColor: string;
}

const TeamDisplay: React.FC<Props> = ({ teams, gameColor }) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  // Map text color to background color for badges
  const getBadgeColor = (textClass: string) => {
    if (textClass.includes('red')) return 'bg-red-100 text-red-700';
    if (textClass.includes('cyan')) return 'bg-cyan-100 text-cyan-700';
    if (textClass.includes('rose')) return 'bg-rose-100 text-rose-700';
    if (textClass.includes('yellow')) return 'bg-yellow-100 text-yellow-700';
    if (textClass.includes('orange')) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-200 text-gray-700';
  };

  const badgeClass = getBadgeColor(gameColor);
  
  // Extract the color name for border effects (e.g., "red-500" from "text-red-500")
  const colorBase = gameColor.replace('text-', '');

  const handleCopy = (team: TeamResult) => {
    // Format: "Team 1: Alice, Bob, Charlie"
    const textToCopy = `Team ${team.id}: ${team.members.join(', ')}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(team.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      exit="exit"
      className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full overflow-y-auto pr-1 pb-4"
    >
      {teams.map((team) => (
        <motion.div
          key={team.id}
          variants={item}
          className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex flex-col hover:shadow-lg hover:shadow-gray-200/50 hover:bg-white transition-all duration-300 group relative overflow-hidden"
        >
          {/* Success/Ready Flash Animation on Entry */}
          <motion.div 
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
            className={`absolute inset-0 border-2 border-${colorBase} rounded-2xl pointer-events-none z-20`}
            style={{ boxShadow: `inset 0 0 20px rgba(0,0,0,0.05)` }}
          />
          
          {/* Subtle Flash Animation on Entry (Sweep) */}
          <motion.div 
            initial={{ opacity: 0.5, left: "-100%" }}
            animate={{ opacity: 0, left: "100%" }}
            transition={{ duration: 0.8, ease: "easeInOut", delay: 0.1 }}
            className="absolute top-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none z-10 skew-x-12"
          />

          {/* Header */}
          <div className="flex justify-between items-start mb-4 relative z-0">
             <div className="flex items-center gap-2">
                <span className={`text-xs font-black tracking-widest uppercase px-2 py-1 rounded-md ${badgeClass}`}>
                  Team {team.id}
                </span>
                
                {/* Visual Indicator Dot */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className={`w-2 h-2 rounded-full bg-${colorBase}`}
                />
             </div>
             
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase hidden sm:inline-block">
                  {team.members.length} Players
                </span>
                
                <button 
                  onClick={() => handleCopy(team)}
                  className="relative p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all focus:outline-none"
                  title="Copy Team Members"
                  aria-label={`Copy Team ${team.id} members`}
                >
                  <AnimatePresence mode="wait">
                    {copiedId === team.id ? (
                      <motion.svg 
                        key="check"
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        exit={{ scale: 0 }}
                        xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </motion.svg>
                    ) : (
                      <motion.svg 
                        key="copy"
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        exit={{ scale: 0 }}
                        xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </button>
             </div>
          </div>

          {/* Members */}
          <ul className="space-y-2 flex-grow relative z-0">
            {team.members.map((member, mIdx) => (
              <li key={mIdx} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-indigo-400 transition-colors" />
                <span className="text-sm font-bold text-gray-700">
                  {member}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TeamDisplay;