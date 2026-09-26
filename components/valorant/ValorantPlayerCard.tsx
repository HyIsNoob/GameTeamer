import React from 'react';
import { UserPlus } from 'lucide-react';

interface ValorantPlayerCardProps {
  slotNumber: number;
}

export const ValorantPlayerCard: React.FC<ValorantPlayerCardProps> = ({ slotNumber }) => {
  return (
    <div className="relative rounded-3xl p-5 border border-dashed border-neutral-800 bg-neutral-950/40 flex flex-col justify-between items-center min-h-[380px] text-neutral-600">
      <div className="w-full flex items-center justify-between">
        <span className="w-6 h-6 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-600 font-mono text-xs font-bold flex items-center justify-center">
          {slotNumber}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-600">Empty Slot</span>
      </div>

      <div className="flex flex-col items-center justify-center space-y-3 py-10">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-center">
          <UserPlus className="w-7 h-7 text-neutral-700 animate-pulse" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Waiting for agent...</p>
        <p className="text-[10px] text-neutral-600">Share room link to invite</p>
      </div>

      <div className="w-full pt-3 border-t border-neutral-900 flex items-center justify-between text-[10px] font-mono text-neutral-700">
        <span>SLOT {slotNumber}</span>
        <span>OPEN</span>
      </div>
    </div>
  );
};
