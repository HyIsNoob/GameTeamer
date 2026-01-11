import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loadout } from '../../utils/apexLogic';

interface LegendCardProps {
  playerIndex: number;
  playerName: string;
  loadout: Loadout | null;
  isCurrentUser: boolean;
  onReroll: () => void;
  onExclude: (legendId: string) => void;
  isRolling?: boolean;
}

const LegendCard: React.FC<LegendCardProps> = ({ 
  playerName, loadout, isCurrentUser, onReroll, onExclude, isRolling: externalRolling = false
}) => {
  const [internalRolling, setInternalRolling] = useState(false);

  useEffect(() => {
    if (loadout) {
      setInternalRolling(true);
      const timer = setTimeout(() => setInternalRolling(false), 600);
      return () => clearTimeout(timer);
    }
  }, [loadout]);

  const showRolling = externalRolling || internalRolling;

  return (
    <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700 shadow-2xl relative overflow-hidden flex flex-col items-center gap-4 min-h-[400px]">
       
       {/* Player Name Badge */}
       <div className="z-10 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-gray-600">
          <h3 className="text-xl font-bold text-white tracking-wider uppercase truncate max-w-[200px]">{playerName}</h3>
       </div>

       <AnimatePresence mode="wait">
         {(loadout || showRolling) ? (
             showRolling ? (
               <motion.div 
                 key="rolling"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="w-full flex-1 flex flex-col items-center justify-center z-10"
               >
                  <div className="flex flex-col items-center gap-4">
                     <motion.div 
                       animate={{ rotate: 360 }}
                       transition={{ repeat: Infinity, duration: 0.3, ease: "linear" }}
                       className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full"
                     />
                     <span className="text-red-500 font-black uppercase text-2xl tracking-tighter animate-pulse">
                        SEARCHING...
                     </span>
                  </div>
               </motion.div>
             ) : (
              <motion.div 
                key={loadout.legend.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0.4 }}
                className="w-full flex-1 flex flex-col items-center justify-between z-10 py-4"
              >
                 {/* Legend Info */}
                 <div className="text-center space-y-2">
                    <div className="w-32 h-32 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl shadow-lg shadow-red-500/20 flex items-center justify-center mb-2 mx-auto relative overflow-hidden group">
                       <img 
                          src={loadout.legend.image ? `/legends/${loadout.legend.image}` : `/legends/${loadout.legend.id}.png`}
                          alt={loadout.legend.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                             e.currentTarget.style.display = 'none';
                             e.currentTarget.parentElement?.querySelector('.placeholder-text')?.classList.remove('hidden');
                          }}
                       />
                       <span className="placeholder-text hidden text-5xl font-black text-white mix-blend-overlay absolute inset-0 flex items-center justify-center">
                         {loadout.legend.name.substring(0, 1)}
                       </span>
                       <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                        {loadout.legend.name}
                      </h2>
                      <div className="text-[10px] font-bold text-gray-400 bg-gray-900/80 px-3 py-1 rounded-full inline-block mt-1 uppercase tracking-widest border border-gray-700">
                        {loadout.legend.class}
                      </div>
                    </div>
                 </div>

                 {/* Weapons */}
                 <div className="w-full grid grid-cols-2 gap-3 mt-4">
                    {[loadout.primary, loadout.secondary].map((w, idx) => (
                       <motion.div 
                          key={w.id + idx}
                          initial={{ x: idx === 0 ? -20 : 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 + (idx * 0.1) }}
                          className="bg-gradient-to-b from-gray-700 to-gray-800 p-3 rounded-xl flex flex-col items-center border border-gray-600 shadow-lg relative overflow-hidden"
                       >
                          <img 
                              src={w.image ? `/weapons/${w.image}` : `/weapons/${w.id}.png`}
                              alt={w.name}
                              className="w-24 h-12 object-contain mb-1 z-10"
                              onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                          <span className="text-[9px] text-gray-400 font-bold uppercase mb-1 tracking-widest z-10">{idx === 0 ? 'Primary' : 'Secondary'}</span>
                          <span className="text-sm font-black text-white text-center leading-tight z-10 relative">{w.name}</span>
                          <div className={`mt-2 h-1 w-full rounded-full z-10 ${
                              w.ammo === 'Light' ? 'bg-orange-500' : 
                              w.ammo === 'Heavy' ? 'bg-teal-500' : 
                              w.ammo === 'Energy' ? 'bg-lime-500' : 
                              w.ammo === 'Sniper' ? 'bg-blue-500' : 
                              w.ammo === 'Shotgun' ? 'bg-red-700' : 'bg-red-500'
                          }`} />
                       </motion.div>
                    ))}
                 </div>

                 {/* Actions */}
                 {isCurrentUser && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="flex gap-2 w-full mt-6"
                    >
                       <button 
                          onClick={() => onExclude(loadout.legend.id)}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white text-[10px] font-bold py-3 rounded-xl transition-colors uppercase tracking-wider"
                       >
                         Avoid This
                       </button>
                       <button 
                          onClick={onReroll}
                          className="flex-[2] bg-white hover:bg-gray-200 text-black text-xs font-black py-3 rounded-xl shadow-lg shadow-white/10 transition-all active:scale-95 uppercase tracking-wider"
                       >
                         Reroll Loadout
                       </button>
                    </motion.div>
                 )}
              </motion.div>
             )
         ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-gray-500"
            >
               <div className="w-20 h-20 border-4 border-dashed border-gray-700 rounded-full flex items-center justify-center mb-4 animate-pulse">
                 ?
               </div>
               <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Waiting for Data...</p>
            </motion.div>
         )}
       </AnimatePresence>

       {/* Background Decoration */}
       <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100 via-gray-900 to-black pointer-events-none" />
       
       {/* Scanline Effect */}
       <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20" />
    </div>
  );
};

export default LegendCard;
