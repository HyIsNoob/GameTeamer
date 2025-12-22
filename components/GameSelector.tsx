import React from 'react';
import { GAMES, GamePreset } from '../constants';
import { motion } from 'framer-motion';

interface Props {
  selected: GamePreset;
  onSelect: (game: GamePreset) => void;
}

const GameSelector: React.FC<Props> = ({ selected, onSelect }) => {
  
  const renderIcon = (id: string, isSelected: boolean) => {
    const colorClass = isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-600';
    
    switch (id) {
      case 'apex':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={`w-8 h-8 ${colorClass}`}>
            <path d="M12 2L2 19h20L12 2zm0 4l6.5 11h-13L12 6z" />
            <path d="M12 9l-2.5 5h5L12 9z" />
          </svg>
        );
      case 'lol':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-8 h-8 ${colorClass}`}>
             <path d="M6 4v16a1 1 0 0 0 1 1h10" />
             <path d="M14 8l-2-2-2 2" />
          </svg>
        );
      case 'valo':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={`w-8 h-8 ${colorClass}`}>
            <path d="M2 4.5L10 20l4-7.5L2 4.5z" />
            <path d="M22 4.5L16 16l-3.5-6.5L22 4.5z" />
          </svg>
        );
      case 'cs2':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-8 h-8 ${colorClass}`}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="6" x2="12" y2="18" />
            <line x1="6" y1="12" x2="18" y2="12" />
          </svg>
        );
      case 'overwatch':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={`w-8 h-8 ${colorClass}`}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <path d="M4.5 9.5l7.5 7.5 7.5-7.5" stroke="currentColor" strokeWidth="2.5" fill="none"/>
            <path d="M12 2v7.5" stroke="currentColor" strokeWidth="2.5" />
          </svg>
        );
      default: // custom
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-8 h-8 ${colorClass}`}>
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        );
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {GAMES.map((game) => {
        const isSelected = selected.id === game.id;
        
        return (
          <motion.button
            key={game.id}
            onClick={() => onSelect(game)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              group relative p-4 flex flex-col items-center justify-center gap-3 rounded-2xl transition-all overflow-hidden h-28
              ${isSelected 
                ? 'bg-gray-900 shadow-xl ring-2 ring-gray-900' 
                : 'bg-white border border-gray-100 hover:border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            {renderIcon(game.id, isSelected)}
            
            <div className={`text-[10px] font-extrabold tracking-widest uppercase ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}>
              {game.name}
            </div>
            
            {isSelected && (
              <motion.div 
                layoutId="activeGameIndicator"
                className={`absolute bottom-0 left-0 h-1 w-full ${game.color.replace('text-', 'bg-')}`} 
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default GameSelector;