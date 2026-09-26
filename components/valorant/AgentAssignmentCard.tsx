import React from 'react';
import { AgentAssignment } from '../../utils/valorantLogic';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { motion } from 'framer-motion';
import { Shield, Sparkles } from 'lucide-react';

interface AgentAssignmentCardProps {
  assignment?: AgentAssignment;
  playerName: string;
  isMe: boolean;
  slotNumber: number;
  isRolling?: boolean;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Duelist: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  Initiator: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  Controller: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  Sentinel: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' }
};

export const AgentAssignmentCard: React.FC<AgentAssignmentCardProps> = ({
  assignment,
  playerName,
  isMe,
  slotNumber,
  isRolling = false
}) => {
  const agent = assignment?.agent;
  const roleStyle = agent?.role ? ROLE_COLORS[agent.role] || ROLE_COLORS.Duelist : ROLE_COLORS.Duelist;

  return (
    <div
      className={`relative rounded-3xl p-5 border flex flex-col justify-between overflow-hidden transition-all min-h-[380px] ${
        isMe
          ? 'bg-neutral-900/90 border-rose-500/50 shadow-xl shadow-rose-950/30 ring-1 ring-rose-500/30'
          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
      }`}
    >
      {/* Background Accent Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-rose-950/10 via-transparent to-neutral-950 pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-xs font-black flex items-center justify-center">
            {slotNumber}
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-white truncate max-w-[130px]">
            {playerName}
          </span>
        </div>
        {isMe && (
          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[9px] font-black uppercase tracking-widest shadow-md shadow-rose-900/50">
            YOU
          </span>
        )}
      </div>

      {/* Artwork Area */}
      <div className="relative z-10 flex-1 my-3 flex flex-col items-center justify-center">
        {isRolling ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            className="w-24 h-24 rounded-full border-4 border-dashed border-rose-500/40 flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-rose-400 animate-pulse" />
          </motion.div>
        ) : agent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
            className="w-full flex flex-col items-center"
          >
            <div className="relative w-40 h-48 flex items-center justify-center">
              <img
                src={resolveAssetUrl(agent.image)}
                alt={agent.name}
                className="max-h-full max-w-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <h3 className="text-2xl font-black uppercase text-white tracking-tight drop-shadow-md mt-2">
              {agent.name}
            </h3>
            <span
              className={`mt-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
            >
              {agent.role}
            </span>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-600 space-y-2 py-8">
            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-neutral-800 flex items-center justify-center">
              <Shield className="w-8 h-8 opacity-40" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Ready to roll
            </span>
          </div>
        )}
      </div>

      {/* Card Footer Decoration */}
      <div className="relative z-10 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-neutral-500">
        <span>VAL-TAC #{slotNumber}</span>
        <span className="uppercase font-bold text-neutral-400">
          {agent ? 'Locked In' : 'Standby'}
        </span>
      </div>
    </div>
  );
};
