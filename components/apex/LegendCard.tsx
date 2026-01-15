import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loadout } from '../../utils/apexLogic';
import { soundManager } from '../../utils/soundManager';

interface LegendCardProps {
  playerIndex: number;
  playerName: string;
  loadout: Loadout | null;
  showReroll: boolean;
  isMe: boolean;
  onReroll: () => void;
  onExclude?: (id: string) => void;
  isRolling?: boolean;
  isMuted?: boolean;
  mode?: 'FULL' | 'LEGENDS' | 'ROLE';
}

const CASINO_NAMES = ["WRAITH", "GIBRALTAR", "LIFELINE", "PATHFINDER", "OCTANE", "WATTSON", "CRYPTO", "REVENANT", "LOBA", "RAMPART", "HORIZON", "FUSE", "VALKYRIE", "SEER", "ASH", "MAD MAGGIE", "NEWCASTLE", "VANTAGE", "CATALYST", "BALLISTIC", "CONDUIT"];
const CASINO_WEAPONS = ["R-301", "FLATLINE", "HEMLOCK", "R-99", "CAR", "VOLT", "NEMESIS", "HAVOC", "L-STAR", "SPITFIRE", "RAMPAGE", "DEVOTION", "MASTIFF", "EVA-8", "PEACEKEEPER", "MOZAMBIQUE", "WINGMAN", "P2020", "RE-45", "SENTINEL", "CHARGE RIFLE", "LONGBOW", "KRABER", "TRIPLE TAKE", "30-30", "G7 SCOUT", "BOCEK"];
const CASINO_ROLES = ["ASSAULT", "SKIRMISHER", "RECON", "SUPPORT", "CONTROLLER"];

const LegendCard: React.FC<LegendCardProps> = ({ 
  playerName, loadout, showReroll, isMe, onReroll, onExclude, isRolling: externalRolling = false, isMuted = false, mode = 'FULL'
}) => {
  const [internalRolling, setInternalRolling] = useState(false);
  const [casinoName, setCasinoName] = useState(CASINO_NAMES[0]);
  const [casinoRole, setCasinoRole] = useState(CASINO_ROLES[0]);
  const [casinoWeapon1, setCasinoWeapon1] = useState(CASINO_WEAPONS[0]);
  const [casinoWeapon2, setCasinoWeapon2] = useState(CASINO_WEAPONS[0]);
  
  // Keep track of the previous JSON-stringified loadout to prevent ghost rolls
  const prevLoadoutRef = React.useRef<string>("");

  // Sync mute state
  useEffect(() => {
     soundManager.setMute(isMuted);
  }, [isMuted]);

  useEffect(() => {
    // Only trigger internal rolling animation if the loadout content actually changed
    // AND it's not the initial mount (unless we want animation on load, but ghost roll issue suggests we don't want replay)
    if (loadout) {
       const currentStr = JSON.stringify(loadout);
       if (currentStr !== prevLoadoutRef.current) {
          prevLoadoutRef.current = currentStr;
          
          setInternalRolling(true);
          const timer = setTimeout(() => setInternalRolling(false), 800); // 800ms impact delay
          return () => clearTimeout(timer);
       }
    } else {
        prevLoadoutRef.current = "";
    }
  }, [loadout]);

  const showRolling = externalRolling || internalRolling;

  // Casino Text Effect
  useEffect(() => {
     if (showRolling) {
       const interval = setInterval(() => {
          setCasinoName(CASINO_NAMES[Math.floor(Math.random() * CASINO_NAMES.length)]);
          setCasinoRole(CASINO_ROLES[Math.floor(Math.random() * CASINO_ROLES.length)]);
          setCasinoWeapon1(CASINO_WEAPONS[Math.floor(Math.random() * CASINO_WEAPONS.length)]);
          setCasinoWeapon2(CASINO_WEAPONS[Math.floor(Math.random() * CASINO_WEAPONS.length)]);
          if (!isMuted) soundManager.playTick(); 
       }, 50);
       return () => clearInterval(interval);
     }
  }, [showRolling, isMuted]);

  return (
    <div className={`bg-gray-800 rounded-[2rem] p-6 border border-gray-700 shadow-2xl relative overflow-hidden flex flex-col items-center gap-4 min-h-[400px] transition-all duration-300 ${!isMe ? 'hover:scale-[1.02]' : ''}`}>
       
       {/* Player Name Badge */}
       <div className="z-10 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-gray-600 shadow-lg">
          <h3 className="text-lg font-bold text-white tracking-wider uppercase truncate max-w-[150px]">{playerName}</h3>
       </div>

       <AnimatePresence mode="wait">
         {(loadout || showRolling) ? (
             showRolling ? (
               <motion.div 
                 key="rolling"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0, scale: 2, filter: "blur(10px)" }}
                 className="w-full flex-1 flex flex-col items-center justify-between z-10 py-2"
               >
                  <div className="flex flex-col items-center gap-2 flex-1 justify-center">
                     <div className="relative">
                        <motion.div 
                           animate={{ rotateX: 360 }}
                           transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
                           className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 uppercase tracking-tighter filter drop-shadow-glow"
                        >
                           {mode === 'ROLE' ? casinoRole : casinoName}
                        </motion.div>
                     </div>
                     <span className="text-yellow-500/50 font-mono text-[10px] animate-pulse">
                        decryption_sequence_active...
                     </span>
                  </div>

                   {/* Rolling Weapons */}
                   {mode === 'FULL' && (
                     <div className="w-full grid grid-cols-2 gap-3 mt-2">
                      {[casinoWeapon1, casinoWeapon2].map((w, idx) => (
                           <div key={idx} className="bg-gray-800/50 p-3 rounded-xl flex flex-col items-center border border-gray-700/50">
                               <div className="w-28 h-14 mb-2 flex items-center justify-center opacity-30">
                                   <div className="w-8 h-8 rounded-full border-2 border-gray-600 border-t-white animate-spin" />
                               </div>
                               <span className="text-[10px] text-gray-600 font-bold uppercase mb-0.5 tracking-widest">{idx===0 ? 'Primary' : 'Secondary'}</span>
                               <span className="text-sm font-black text-gray-500 animate-pulse truncate max-w-full">{w}</span>
                               <div className="mt-2 h-1 w-full bg-gray-800 rounded-full" />
                           </div>
                      ))}
                  </div>                   )}               </motion.div>
             ) : (

              <motion.div 
                key={loadout?.legend?.id || 'role'}
                initial={{ opacity: 0, scale: 0.5, filter: "brightness(2)" }}
                animate={{ opacity: 1, scale: 1, filter: "brightness(1)" }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                className="w-full flex-1 flex flex-col items-center justify-between z-10 py-2"
              >
                 {/* Legend Info OR Role Info */}
                 {mode === 'ROLE' && loadout?.role ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
                        <div className={`w-36 h-36 rounded-full flex items-center justify-center border-4 border-yellow-500 shadow-xl bg-gradient-to-br from-gray-700 to-black`}>
                             <span className="text-5xl">🛡️</span>
                        </div>
                        <div className="text-center">
                            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
                                {loadout.role}
                            </h2>
                            <p className="text-yellow-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Assigned Class</p>
                        </div>
                    </div>
                 ) : (
                   <div className="text-center space-y-1 relative">
                    <motion.div 
                      key={loadout?.legend?.id + "-glow"}
                      initial={{ opacity: 0, scale: 1.5 }}
                      animate={{ opacity: 0, scale: 2 }}

                      className="absolute inset-0 bg-white blur-xl rounded-full pointer-events-none" 
                    />
                    
                    <div className="w-36 h-40 bg-gradient-to-b from-gray-700 to-black rounded-3xl shadow-2xl flex items-center justify-center mb-2 mx-auto relative overflow-hidden ring-4 ring-black/40 group">
                       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-50" />
                       <img 
                          src={loadout?.legend.image ? `/legends/${loadout.legend.image}` : `/legends/${loadout?.legend.id}.png`}
                          alt={loadout?.legend.name}
                          className="w-[110%] h-[110%] object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                             e.currentTarget.style.display = 'none';
                             e.currentTarget.parentElement?.querySelector('.placeholder-text')?.classList.remove('hidden');
                          }}
                       />
                       <span className="placeholder-text hidden text-5xl font-black text-white mix-blend-overlay absolute inset-0 flex items-center justify-center">
                         {loadout?.legend.name.substring(0, 1)}
                       </span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-lg">
                        {loadout?.legend.name}
                      </h2>
                      <div className="text-[9px] font-bold text-gray-400 bg-gray-900 px-2 py-0.5 rounded-full inline-block mt-1 uppercase tracking-widest border border-gray-700 shadow-inner">
                        {loadout?.legend.class}
                      </div>
                    </div>
                 </div>
                 )}

                 {/* Weapons - Only for FULL mode */}
                 {mode === 'FULL' && (
                 <div className="w-full grid grid-cols-2 gap-3 mt-2">
                    {[loadout?.primary, loadout?.secondary].map((w, idx) => (
                       <motion.div 
                          key={(w?.id || 'unknown') + idx}
                          initial={{ x: idx === 0 ? -50 : 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 + (idx * 0.1), type: "spring" }}
                          className="bg-gray-900/80 p-3 rounded-xl flex flex-col items-center border border-gray-700 shadow-xl relative overflow-hidden group hover:border-gray-500 transition-colors"
                       >
                          <img 
                              src={w?.image ? `/weapons/${w.image}` : `/weapons/${w?.id || ''}.png`}
                              alt={w?.name}
                              className="w-28 h-14 object-contain mb-1 z-10 drop-shadow-md group-hover:scale-110 transition-transform"
                              onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                          <span className="text-[10px] text-gray-500 font-bold uppercase mb-0.5 tracking-widest z-10">{idx === 0 ? 'Primary' : 'Secondary'}</span>
                          <span className="text-sm font-black text-gray-200 text-center leading-tight z-10 relative">{w?.name}</span>
                          <div className={`mt-2 h-1 w-full rounded-full z-10 opacity-80 ${
                              w?.ammo === 'Light' ? 'bg-orange-500' : 
                              w?.ammo === 'Heavy' ? 'bg-teal-500' : 
                              w?.ammo === 'Energy' ? 'bg-lime-500' : 
                              w?.ammo === 'Sniper' ? 'bg-blue-500' : 
                              w?.ammo === 'Shotgun' ? 'bg-red-700' : 'bg-red-500'
                          }`} />
                       </motion.div>
                    ))}
                 </div>
                 )}

                 {/* Actions */}
                 {showReroll && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="flex gap-2 w-full mt-4"
                    >
                       {/* Avoid Button - Only for ME */}
                       {isMe && mode !== 'ROLE' && (
                         <button 
                            className="flex-1 bg-gray-700 hover:bg-red-900/50 hover:text-red-200 hover:border-red-800 border border-transparent text-gray-400 text-[9px] font-bold py-2 rounded-xl transition-all uppercase tracking-wider"
                            onClick={() => onExclude && loadout?.legend && onExclude(loadout.legend.id)}
                         >
                           Avoid
                         </button>
                       )}
                       <button  
                          onClick={onReroll}
                          className="flex-[2] bg-white hover:bg-gray-200 text-black text-[10px] font-black py-2 rounded-xl shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-all active:scale-95 uppercase tracking-wider hover:-translate-y-0.5"
                       >
                         Reroll
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
