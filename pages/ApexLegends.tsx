import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { getRandomLoadout, Loadout } from '../utils/apexLogic';
import { APEX_LEGENDS, APEX_WEAPONS } from '../utils/apexData';
import LegendCard from '../components/apex/LegendCard';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

// --- Types ---
interface PlayerState {
  id: string; // socket/client id
  name: string;
  slotIndex: number;
  excludedLegends?: string[]; // IDs they don't own/want
}

interface GameState {
  loadouts: { [slotIndex: number]: Loadout };
  bans: { [slotIndex: number]: string[] };
}

const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const ApexLegends: React.FC = () => {
  // --- Setup State ---
  const [setupMode, setSetupMode] = useState<'JOIN' | 'CREATE'>('CREATE');
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [poolTab, setPoolTab] = useState<'LEGENDS' | 'WEAPONS'>('LEGENDS');
  const [myExcludes, setMyExcludes] = useState<string[]>(() => {
    const s = localStorage.getItem('apex_user_excludes');
    return s ? JSON.parse(s) : [];
  });
  
  // --- Connection State ---
  const [view, setView] = useState<'SETUP' | 'LOBBY'>('SETUP');
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('apex_player_name') || '');
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [channel, setChannel] = useState<any>(null); // RealtimeChannel

  // --- Game State ---
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [myId, setMyId] = useState<string>('');
  const [gameState, setGameState] = useState<GameState>({
    loadouts: {},
    bans: {}
  });

  const [isGlobalRolling, setIsGlobalRolling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // --- Helpers ---
  const handlePoolToggle = (legendId: string) => {
    const newExcludes = myExcludes.includes(legendId) 
       ? myExcludes.filter(id => id !== legendId)
       : [...myExcludes, legendId];
    setMyExcludes(newExcludes);
    localStorage.setItem('apex_user_excludes', JSON.stringify(newExcludes));
  };

  const handleCreateRoom = () => {
    const code = generateRoomId();
    setRoomId(code);
    joinRoom(code);
  };
  
  const handleJoinClick = () => {
     if(!roomId) return;
     joinRoom(roomId.toUpperCase());
  }

  const joinRoom = async (code: string) => {
    if (!playerName) return;
    localStorage.setItem('apex_player_name', playerName);
    setConnectionStatus('CONNECTING');

    // Create channel
    const newChannel = supabase.channel(`apex-room:${code}`, {
      config: { presence: { key: code } }
    });
    
    // Generate my session ID
    const tempId = Math.random().toString(36).substring(7);
    setMyId(tempId);

    newChannel
      .on('broadcast', { event: 'GAME_ROLL_START' }, (payload) => {
        setIsGlobalRolling(true);
        // Safety timeout
        setTimeout(() => setIsGlobalRolling(false), 5000);
      })
      .on('broadcast', { event: 'GAME_UPDATE' }, (payload) => {
        setGameState(payload.payload);
        setIsGlobalRolling(false);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = newChannel.presenceState();
        const rawPlayers: any[] = [];
        Object.values(state).forEach((presences: any) => {
             presences.forEach((p: any) => rawPlayers.push(p));
        });
        
        // Map to our structure
        // We recalculate slots based on join order "online_at" to be stable
        // This fixes the "SLOT 2 / SLOT 3" issue by dynamically assigning slots based on who is present
        const sorted = rawPlayers.sort((a, b) => (a.online_at || '').localeCompare(b.online_at || ''));
        
        const mapped = sorted.map((p, idx) => ({
             id: p.userId,
             name: p.user_name,
             slotIndex: idx % 3, // Simple cyclical assignment, 0,1,2,0..
             excludedLegends: p.excluded_ids || []
        }));
        
        setPlayers(mapped);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
           setConnectionStatus('CONNECTED');
           setView('LOBBY');
           
           // Track my presence
           await newChannel.track({
             user_name: playerName,
             userId: tempId,
             online_at: new Date().toISOString(),
             excluded_ids: myExcludes
           });
        }
      });

    setChannel(newChannel);
  };

  // --- Logic ---
  
  const getUnavailableLegendsForSlot = (targetSlot: number, currentLoadouts: any, currentBans: any) => {
     // 1. Slot's bans
     // 2. Slot's owner exclusions
     // 3. Other slots' CURRENT picks (to ensure uniqueness)
     
     const bans = currentBans[targetSlot] || [];
     
     const playerAtSlot = players.find(p => p.slotIndex === targetSlot);
     const excludes = playerAtSlot?.excludedLegends || [];
     
     const otherPicks = Object.keys(currentLoadouts)
        .map(Number)
        .filter(slot => slot !== targetSlot)
        .map(slot => currentLoadouts[slot]?.legend?.id)
        .filter(Boolean);
        
     return [...new Set([...bans, ...excludes, ...otherPicks])];
  };

  const handleRandomize = (slotIndex: number) => {
    const unavailableLegends = getUnavailableLegendsForSlot(slotIndex, gameState.loadouts, gameState.bans);
    
    // Get player specific excludes (for weapons)
    const playerAtSlot = players.find(p => p.slotIndex === slotIndex);
    const playerExcludes = playerAtSlot?.excludedLegends || [];

    const newLoadout = getRandomLoadout(unavailableLegends, playerExcludes);
    
    // Check if newLoadout is valid? getRandomLoadout handles fallback

    const newState = {
      ...gameState,
      loadouts: { ...gameState.loadouts, [slotIndex]: newLoadout }
    };
    
    setGameState(newState);
    channel?.send({ type: 'broadcast', event: 'GAME_UPDATE', payload: newState });
  };

  const handleGlobalRerollRequest = () => {
     setShowConfirmModal(true);
  };

  const executeGlobalReroll = () => {
    setShowConfirmModal(false);
    
    // 1. Notify everyone to start rolling animation
    channel?.send({ type: 'broadcast', event: 'GAME_ROLL_START', payload: {} });
    setIsGlobalRolling(true);

    // 2. Wait for animation duration (syncs the "reveal" roughly)
    setTimeout(() => {
      // Pick logic
      const slots = [0, 1, 2];
      const tempLoadouts: any = {};
      const newBans = gameState.bans; // Keep existing bans

      slots.forEach(slot => {
          const unavailableLegends = getUnavailableLegendsForSlot(slot, tempLoadouts, newBans);
          
          const playerAtSlot = players.find(p => p.slotIndex === slot);
          const playerExcludes = playerAtSlot?.excludedLegends || [];

          const loadout = getRandomLoadout(unavailableLegends, playerExcludes);
          tempLoadouts[slot] = loadout;
      });
      
      const newState = { ...gameState, loadouts: tempLoadouts };
      setGameState(newState);
      channel?.send({ type: 'broadcast', event: 'GAME_UPDATE', payload: newState });
      setIsGlobalRolling(false);
    }, 2000); // 2 Seconds of "Searching..."
  };
  
  const handleBan = (slotIndex: number, legendId: string) => {
     // Classic Ban Logic
     const currentBans = gameState.bans[slotIndex] || [];
     const newBans = [...currentBans, legendId];
     
     const newState = { 
        ...gameState, 
        bans: { ...gameState.bans, [slotIndex]: newBans } 
     };
     
     // Auto reroll this slot to clear bans
     const unavailableLegends = getUnavailableLegendsForSlot(slotIndex, gameState.loadouts, newState.bans);
     const playerAtSlot = players.find(p => p.slotIndex === slotIndex);
     const playerExcludes = playerAtSlot?.excludedLegends || [];
     
     newState.loadouts[slotIndex] = getRandomLoadout(unavailableLegends, playerExcludes);

     setGameState(newState);
     channel?.send({ type: 'broadcast', event: 'GAME_UPDATE', payload: newState });
  };

  // --- Render ---

  if (view === 'SETUP') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/30 via-gray-900 to-black pointer-events-none" />

        <motion.div 
           initial={{ scale: 0.9, opacity: 0, y: 20 }}
           animate={{ scale: 1, opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative"
        >
           <h1 className="text-4xl font-black text-center mb-6 uppercase tracking-tighter">
             Apex <span className="text-red-500">Online</span>
           </h1>

           {/* Name Input */}
           <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase ml-2 mb-1 block">Your Callsign</label>
                <input 
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-red-500 transition-colors text-lg"
                  placeholder="Enter Name..."
                />
           </div>

           {/* Pool Config Toggle */}
           <button 
             onClick={() => setShowPoolModal(true)}
             className="w-full mb-6 py-2 px-4 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-500 text-xs font-bold text-gray-400 uppercase tracking-widest transition-all flex justify-between items-center"
           >
             <span>Config Owned Legends</span>
             <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px]">
               {APEX_LEGENDS.length - myExcludes.length} Available
             </span>
           </button>

           {/* Tabs */}
           <div className="flex bg-black/40 p-1 rounded-xl mb-6">
              <button 
                onClick={() => setSetupMode('CREATE')}
                className={`flex-1 py-2 text-sm font-bold uppercase rounded-lg transition-all ${setupMode === 'CREATE' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Create Room
              </button>
              <button 
                onClick={() => setSetupMode('JOIN')}
                className={`flex-1 py-2 text-sm font-bold uppercase rounded-lg transition-all ${setupMode === 'JOIN' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Join Room
              </button>
           </div>

           {setupMode === 'JOIN' ? (
              <div className="space-y-4">
                 <input 
                    value={roomId}
                    onChange={e => setRoomId(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white text-center font-mono text-xl tracking-widest uppercase outline-none focus:border-red-500 transition-colors"
                    placeholder="CODE"
                    maxLength={10}
                 />
                 <button 
                    onClick={handleJoinClick}
                    disabled={!playerName || !roomId}
                    className="w-full bg-white text-black hover:bg-gray-200 font-black uppercase py-4 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    Join Squad
                 </button>
              </div>
           ) : (
              <div className="space-y-4">
                 <div className="text-center text-gray-500 text-sm py-4 bg-black/20 rounded-xl border border-dashed border-gray-700">
                    A secure channel will be generated for your squad.
                 </div>
                 <button 
                    onClick={handleCreateRoom}
                    disabled={!playerName}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase py-4 rounded-xl shadow-lg shadow-red-900/40 transition-transform active:scale-95 disabled:opacity-50"
                 >
                    Launch Lobby
                 </button>
              </div>
           )}

           <Link to="/" className="block text-center text-xs font-bold text-gray-600 hover:text-gray-400 mt-6">
                BACK TO LOCAL
           </Link>
        </motion.div>

        {/* Modal for Pool */}
        {showPoolModal && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl h-[80vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950">
                   <h2 className="text-xl font-bold uppercase">Pool Configuration</h2>
                   <button onClick={() => setShowPoolModal(false)} className="bg-gray-800 p-2 rounded-full hover:bg-gray-700">✕</button>
                </div>
                
                <div className="p-4 bg-red-900/10 border-b border-red-900/20 text-red-200 text-xs text-center">
                    Select items to <span className="font-bold">EXCLUDE</span> from the randomizer.
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                     {['Assault', 'Skirmisher', 'Recon', 'Support', 'Controller'].map((role) => (
                        <div key={role}>
                          <div className="flex items-center gap-2 mb-3">
                             <div className={`w-2 h-2 rounded-full ${
                                role === 'Assault' ? 'bg-red-500' :
                                role === 'Skirmisher' ? 'bg-orange-400' :
                                role === 'Recon' ? 'bg-blue-400' :
                                role === 'Support' ? 'bg-teal-400' : 'bg-purple-500'
                             }`} />
                             <h3 className="text-gray-300 font-black uppercase text-xs tracking-[0.2em]">{role}</h3>
                             <div className="h-px bg-gray-800 flex-1" />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                             {APEX_LEGENDS.filter(l => l.class === role).map(leg => {
                                const isExcluded = myExcludes.includes(leg.id);
                                return (
                                  <motion.button 
                                    key={leg.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handlePoolToggle(leg.id)}
                                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left relative overflow-hidden group ${
                                       !isExcluded 
                                          ? 'bg-gray-800 border-gray-700 text-white hover:border-gray-500' 
                                          : 'bg-black/40 border-gray-800 text-gray-500 grayscale opacity-50'
                                    }`}
                                  >
                                     <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${
                                        role === 'Assault' ? 'bg-red-500' :
                                        role === 'Skirmisher' ? 'bg-orange-400' :
                                        role === 'Recon' ? 'bg-blue-400' :
                                        role === 'Support' ? 'bg-teal-400' : 'bg-purple-500'
                                     }`} />
                                     
                                     <img 
                                        src={leg.icon ? `/icons/${leg.icon}` : (leg.image ? `/legends/${leg.image}` : `/legends/${leg.id}.png`)} 
                                        className="w-10 h-10 bg-black/50 rounded-md"
                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                     />
                                     <span className="font-bold text-xs uppercase truncate">{leg.name}</span>
                                     
                                     {isExcluded && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                                           <span className="text-[10px] font-bold text-red-500 uppercase border border-red-500 px-1 rounded">Banned</span>
                                        </div>
                                     )}
                                  </motion.button>
                                );
                             })}
                          </div>
                        </div>
                     ))}
                </div>
                <div className="p-6 border-t border-gray-800 bg-gray-950 flex justify-end">
                   <button onClick={() => setShowPoolModal(false)} className="px-8 py-3 bg-white text-black font-bold uppercase rounded-xl">
                      Save & Close
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // --- LOBBY VIEW ---

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 lg:p-6 flex flex-col font-sans">
       {/* Background */}
       <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-gray-900 to-black pointer-events-none -z-10" />
       
       {/* Header */}
       <header className="flex flex-col md:flex-row justify-between items-center mb-6 bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white">
               <ArrowLeft size={24} />
            </Link>
            <div>
               <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <span className="text-gray-500">#</span>{roomId}
               </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold uppercase rounded-full border border-green-500/30 flex items-center gap-2">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                 {players.length} Active
              </span>
              <button 
                onClick={handleGlobalRerollRequest}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-black uppercase text-sm rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                Deploy Team Randomizer
              </button>
          </div>
       </header>

       {/* Grid - Animated */}
       <motion.main 
          initial="hidden"
          animate="visible"
          variants={{
             visible: { transition: { staggerChildren: 0.15 } }
          }}
          className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto w-full items-start"
       >
          {[0, 1, 2].map((slotIndex) => {
             // Find player in this slot
             const player = players.find(p => p.slotIndex === slotIndex);
             const isMe = !!(player && myId && player.id === myId);
             const isOccupied = !!player;
             
             return (
               <motion.div 
                  key={slotIndex} 
                  variants={{
                    hidden: { opacity: 0, y: 50 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="relative group"
               >
                  <div className="absolute -inset-1 bg-gradient-to-b from-gray-700 to-gray-900 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <LegendCard 
                    playerIndex={slotIndex}
                    playerName={player?.name || `Waiting for Player...`}
                    loadout={gameState.loadouts[slotIndex] || null}
                    isCurrentUser={isMe} 
                    onReroll={() => handleRandomize(slotIndex)}
                    onExclude={(id) => handleBan(slotIndex, id)}
                    isRolling={isGlobalRolling}
                  />
                  {!isOccupied && (
                     <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] rounded-[2rem] flex items-center justify-center">
                        <div className="text-gray-500 font-bold uppercase tracking-widest text-sm border border-gray-600 px-4 py-2 rounded-full">
                           Open Slot {slotIndex + 1}
                        </div>
                     </div>
                  )}
               </motion.div>
             );
          })}
       </motion.main>
       
       <footer className="mt-6 text-center text-gray-600 text-[10px] font-mono uppercase tracking-widest">
          SQd-ASSEMBLER v2.0 // SYNC_MODE: ACTIVE // {roomId}
       </footer>

       {/* CONFIRMATION MODAL */}
       {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 border-2 border-red-600 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-red-600/10 animate-pulse pointer-events-none" />
            
            <h3 className="text-2xl font-black text-white uppercase text-center mb-4 tracking-tighter">
              Full Squad Reroll?
            </h3>
            <p className="text-gray-400 text-center text-sm mb-8 font-mono">
              This action will randomize loadouts for ALL players. Current selections will be lost.
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold uppercase rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeGlobalReroll}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase rounded-xl shadow-lg shadow-red-900/50 transition-transform active:scale-95"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
       )}
    </div>
  );
};

export default ApexLegends;
