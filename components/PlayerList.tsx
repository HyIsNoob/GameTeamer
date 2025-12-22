import React from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

interface Props {
  players: string[];
  onRemove: (index: number) => void;
  onReorder: (newOrder: string[]) => void;
}

const PlayerList: React.FC<Props> = ({ players, onRemove, onReorder }) => {
  if (players.length === 0) {
    return (
      <div className="py-8 text-center text-gray-300 font-bold text-xs uppercase tracking-widest border-2 border-dashed border-gray-100 rounded-2xl">
        No Operatives Added
      </div>
    );
  }

  return (
    <Reorder.Group 
      axis="y" 
      values={players} 
      onReorder={onReorder}
      className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar p-1"
    >
      <AnimatePresence initial={false}>
        {players.map((player, idx) => (
          <Reorder.Item
            key={player} // Key must be the value itself for Reorder to work (requires unique names)
            value={player}
            initial={{ opacity: 0, x: -10, scale: 0.95, backgroundColor: "#e0e7ff" }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              scale: 1,
              backgroundColor: ["#e0e7ff", "#f9fafb"]
            }}
            exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
            whileDrag={{ 
              scale: 1.02, 
              boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
              zIndex: 50
            }}
            transition={{ duration: 0.3 }}
            className="group flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-transparent hover:border-gray-200 transition-colors cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-3 pointer-events-none">
              <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400 shadow-sm">
                {idx + 1}
              </div>
              <span className="font-bold text-sm text-gray-700 truncate max-w-[150px] md:max-w-[200px]">
                {player}
              </span>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent drag start when clicking remove
                onRemove(idx);
              }}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              aria-label="Remove player"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </Reorder.Item>
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
};

export default PlayerList;