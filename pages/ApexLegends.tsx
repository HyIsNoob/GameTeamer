import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { getRandomLoadout, Loadout } from '../utils/apexLogic';
import { APEX_LEGENDS, APEX_WEAPONS } from '../utils/apexData';
import { soundManager } from '../utils/soundManager';
import LegendCard from '../components/apex/LegendCard';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Loader2, Volume2, VolumeX, History } from 'lucide-react';

// --- Types ---
interface PlayerState {
  id: string; // socket/client id
  name: string;
  slotIndex: number;
  excludedLegends?: string[]; // IDs they don't own/want
  online_at?: string;
}

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
    isSystem?: boolean;
}

interface GameState {
  mode: 'FULL' | 'LEGENDS' | 'ROLE';
  loadouts: { [userId: string]: Loadout };
  bans: { [userId: string]: string[] };
  permissions: { 
    allowOthersRerollMe: { [userId: string]: boolean };
    allowOthersDeploy: { [userId: string]: boolean };
  };
}

interface HistoryItem {
  timestamp: number;
  loadouts: { [userId: string]: Loadout };
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'info'} | null>(null);

  // --- Game State ---
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [myId, setMyId] = useState<string>('');
  const [gameState, setGameState] = useState<GameState>({
    mode: 'FULL',
    loadouts: {},
    bans: {},
    permissions: { 
      allowOthersRerollMe: {}, // Defaults to false
      allowOthersDeploy: {}    // Defaults to false
    }
  });

  const [isGlobalRolling, setIsGlobalRolling] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{type: 'REROLL' | 'DISBAND' | 'LEAVE', title: string, message: string} | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false); // Config modal for permissions
  
  // --- New Features State ---
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('apex_muted') === 'true');
  const [rollHistory, setRollHistory] = useState<HistoryItem[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
     if (showChat) {
         chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
     }
  }, [chatMessages, showChat]);

  useEffect(() => {
     soundManager.setMute(isMuted);
     localStorage.setItem('apex_muted', String(isMuted));
  }, [isMuted]);

  // --- Helpers ---
  const updateGameState = (newState: GameState, recordHistory: boolean = true) => {
      setGameState(newState);
      if (recordHistory) {
          setRollHistory(prev => [
            { timestamp: Date.now(), loadouts: newState.loadouts },
            ...prev
          ].slice(0, 5));
      }
      return newState;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!newMessage.trim() || !channel) return;

      const msg: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          sender: playerName || 'Unknown',
          text: newMessage.trim(),
          timestamp: Date.now()
      };

      // Optimistic update
      setChatMessages(prev => [...prev, msg]);
      setNewMessage('');

      await channel.send({ type: 'broadcast', event: 'CHAT', payload: msg });
  };

  const handleSetGameMode = (mode: 'FULL' | 'LEGENDS' | 'ROLE') => {
      const newState = { ...gameState, mode };
      setGameState(newState);
      channel?.send({ type: 'broadcast', event: 'GAME_UPDATE', payload: newState });
  };

  const handlePoolToggle = (legendId: string) => {
    const newExcludes = myExcludes.includes(legendId) 
       ? myExcludes.filter(id => id !== legendId)
       : [...myExcludes, legendId];
    setMyExcludes(newExcludes);
    localStorage.setItem('apex_user_excludes', JSON.stringify(newExcludes));
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
        setNotification({ message: "Please enter your nickname first.", type: 'error' });
        return;
    }
    const code = generateRoomId();
    setRoomId(code);
    setSetupMode('CREATE');
    await connectToRoom(code, 'CREATE');
  };
  
  const handleJoinClick = async () => {
     if(!roomId || !playerName.trim()) {
         setNotification({ message: "Please enter Room ID and Nickname.", type: 'error' });
         return;
     }
     setSetupMode('JOIN');
     await connectToRoom(roomId.toUpperCase(), 'JOIN');
  }

  const connectToRoom = async (code: string, mode: 'JOIN' | 'CREATE') => {
    setIsProcessing(true);
    localStorage.setItem('apex_player_name', playerName);

    if (channel) supabase.removeChannel(channel);

    const newChannel = supabase.channel(`apex-room:${code}`, {
      config: { presence: { key: code } }
    });
    
    // Generate my session ID (PERSISTENT)
    const storageKeyId = `apex_user_id_${code}`;
    let tempId = sessionStorage.getItem(storageKeyId);
    if (!tempId) {
       tempId = Math.random().toString(36).substring(7);
       sessionStorage.setItem(storageKeyId, tempId);
    }
    setMyId(tempId);

    newChannel
      .on('broadcast', { event: 'GAME_ROLL_START' }, () => {
          setIsGlobalRolling(true);
          soundManager.playStart();
      })
      .on('broadcast', { event: 'GAME_UPDATE' }, (payload) => {
        setGameState(prevState => {
           // Prevent ghost updates (sound/history) if data hasn't changed.
           // This often happens on tab wake-up or re-subscription.
           const isDifferent = JSON.stringify(prevState.loadouts) !== JSON.stringify(payload.payload.loadouts);
           
           if (isDifferent) {
              setIsGlobalRolling(false);
              setTimeout(() => soundManager.playSuccess(), 800);
              setRollHistory(prev => [
                  { timestamp: Date.now(), loadouts: payload.payload.loadouts },
                  ...prev
              ].slice(0, 5));
           }
           
           // Always update state to ensure synchronization, but side-effects (sound/history) are gated
           return payload.payload;
        });
      })
      .on('broadcast', { event: 'CHAT' }, (payload) => {
          setChatMessages(prev => [...prev, payload.payload]);
          if (!showChat) {
             // Only show notification if quite new
          }
      })
      .on('broadcast', { event: 'ROOM_CLOSED' }, () => {
        newChannel.unsubscribe();
        setNotification({ message: "Squad leader disbanded the lobby.", type: 'info' });
        setTimeout(() => window.location.reload(), 2000);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = newChannel.presenceState();
        const rawPlayers: any[] = [];
        Object.values(state).forEach((presences: any) => {
             presences.forEach((p: any) => rawPlayers.push(p));
        });
        
        // Sort by online_at to stabilize slots
        const sorted = rawPlayers.sort((a, b) => (a.online_at || '').localeCompare(b.online_at || ''));
        
        const mapped = sorted.map((p, idx) => ({
             id: p.userId,
             name: p.user_name,
             slotIndex: idx % 3,
             excludedLegends: p.excluded_ids || []
        }));
        
        setPlayers(mapped);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
           setConnectionStatus('CONNECTED');
           setNotification(null); // Clear any previous error notification on successful reconnect

           // Synchronize/Populate presence check
           await new Promise(r => setTimeout(r, 1200)); 
           
           const state = newChannel.presenceState();
           let userCount = 0;
           Object.values(state).forEach((p: any) => userCount += p.length);
           
           // JOIN VALIDATION: If I am joining but room is empty (meaning Host isn't there)
           // If userCount is 0, it means NO ONE is there (even me, since I haven't tracked).
           if (mode === 'JOIN' && userCount === 0) {
              newChannel.unsubscribe();
              setIsProcessing(false);
              setNotification({ message: `Room #${code} not found or inactive.`, type: 'error' });
              return;
           }

           const storageKey = `apex_join_time_${code}`;
           let joinTime = sessionStorage.getItem(storageKey);
           if (!joinTime) {
             joinTime = new Date().toISOString();
             sessionStorage.setItem(storageKey, joinTime);
           }

           await newChannel.track({
             user_name: playerName,
             userId: tempId,
             online_at: joinTime,
             excluded_ids: myExcludes
           });
           
           
           setView('LOBBY');
           setIsProcessing(false);
        } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
            // Do not immediately redirect or clear view, just warn. Auto-reconnect often works.
            setConnectionStatus('CONNECTING');
            setNotification({ message: "Connection lost. Reconnecting...", type: 'error' });
        }
      });

    setChannel(newChannel);
  };

  // --- Logic ---
  
  const getUnavailableLegendsForSlot = (targetUserId: string, currentLoadouts: any, currentBans: any) => {
     // 1. Slot's bans
     // 2. Slot's owner exclusions
     // 3. Other slots' CURRENT picks (to ensure uniqueness)
     
     const bans = currentBans[targetUserId] || [];
     
     const player = players.find(p => p.id === targetUserId);
     const excludes = player?.excludedLegends || [];
     
     const otherPicks = Object.keys(currentLoadouts)
        .filter(uid => uid !== targetUserId)
        .map(uid => currentLoadouts[uid]?.legend?.id)
        .filter(Boolean);
        
     return [...new Set([...bans, ...excludes, ...otherPicks])];
  };

const handleIndividualReroll = (userId: string) => {
    const player = players.find(p => p.id === userId);
    if (!player) return;

    const unavailableLegends = getUnavailableLegendsForSlot(player.id, gameState.loadouts, gameState.bans);
    const playerExcludes = player.excludedLegends || [];

    const newLoadout = getRandomLoadout(unavailableLegends, playerExcludes);
    

    const newState = {
      ...gameState,
      loadouts: { ...gameState.loadouts, [player.id]: newLoadout }
    };
    
    updateGameState(newState, true);
    channel?.send({ type: 'broadcast', event: 'GAME_UPDATE', payload: newState });
  };

  const handleDisbandRequest = () => {
     setConfirmModalData({
        type: 'DISBAND',
        title: 'DISBAND SQUAD?',
        message: 'This will disconnect all players and close the room.'
     });
  };
  
  const handleGlobalRerollRequest = () => {
     setConfirmModalData({
        type: 'REROLL',
        title: 'FULL SQUAD REROLL?',
        message: 'This will randomize loadouts for ALL players.'
     });
  };

  const handleBackClick = () => {
     setConfirmModalData({
        type: 'LEAVE',
        title: 'LEAVE SQUAD?',
        message: 'You will be removed from the team.'
     });
  }

  const executeAction = () => {
      if (!confirmModalData) return;
      const { type } = confirmModalData;
      setConfirmModalData(null);
      
      if (type === 'DISBAND') {
          channel?.send({ type: 'broadcast', event: 'ROOM_CLOSED', payload: {} });
          window.location.reload();
      } else if (type === 'LEAVE') {
          if (channel) {
             channel.unsubscribe();
             setChannel(null);
          }
          setView('SETUP');
          setConnectionStatus('DISCONNECTED');
          setPlayers([]);
          setRoomId(''); // Clear room code to truly reset
      } else if (type === 'REROLL') {
          channel?.send({ type: 'broadcast', event: 'GAME_ROLL_START', payload: {} });
          setIsGlobalRolling(true);
          soundManager.playStart();

          setTimeout(() => {
             const tempLoadouts: any = {};
             
             players.forEach(p => {
                 let loadout: Loadout;
                 
                 if (gameState.mode === 'ROLE') {
                     const roles = ['Assault', 'Skirmisher', 'Recon', 'Support', 'Controller'];
                     const randomRole = roles[Math.floor(Math.random() * roles.length)];
                     loadout = { role: randomRole };
                 } else {
                     // Check bans only if picking legends
                     const unavailable = getUnavailableLegendsForSlot(p.id, tempLoadouts, gameState.bans);
                     const fullLoadout = getRandomLoadout(unavailable, p.excludedLegends || []);
                     
                     if (gameState.mode === 'LEGENDS') {
                         loadout = { legend: fullLoadout.legend };
                     } else {
                         // FULL
                         loadout = fullLoadout;
                     }
                 }
                 
                 tempLoadouts[p.id] = loadout;
             });
             
             const newState = { ...gameState, loadouts: tempLoadouts };
             updateGameState(newState, true);
             channel?.send({ type: 'broadcast', event: 'GAME_UPDATE', payload: newState });
             setIsGlobalRolling(false);
             setTimeout(() => soundManager.playSuccess(), 800);
          }, 2500);
      }
  };

  const handleBan = (slotIndex: number, legendId: string) => {
     const player = players.find(p => p.slotIndex === slotIndex);
     if (!player) return;

     const currentBans = gameState.bans[player.id] || [];
     const newBans = [...currentBans, legendId];
     
     const newState = { 
        ...gameState, 
        bans: { ...gameState.bans, [player.id]: newBans } 
     };
     
     // Auto reroll this slot to clear bans
     const unavailableLegends = getUnavailableLegendsForSlot(player.id, gameState.loadouts, newState.bans);
     const playerExcludes = player.excludedLegends || [];
     
     newState.loadouts[player.id] = getRandomLoadout(unavailableLegends, playerExcludes);

     updateGameState(newState, true);
     channel?.send({ type: 'broadcast', event: 'GAME_UPDATE', payload: newState });
  };

  const handleTogglePermission = (type: 'REROLL' | 'DEPLOY') => {
     const mySlot = players.find(p => p.id === myId)?.slotIndex;
     if (mySlot === undefined || !myId) return;

     const newPerms = { ...gameState.permissions };
     
     if (type === 'REROLL') {
       newPerms.allowOthersRerollMe = {
          ...newPerms.allowOthersRerollMe,
          [myId]: !newPerms.allowOthersRerollMe?.[myId]
       };
     } else {
       newPerms.allowOthersDeploy = {
          ...newPerms.allowOthersDeploy,
          [myId]: !newPerms.allowOthersDeploy?.[myId]
       };
     }
     
     const newState = { ...gameState, permissions: newPerms };
     setGameState(newState);
     channel?.send({ type: 'broadcast', event: 'GAME_UPDATE', payload: newState });
  };
  
  const myPlayer = players.find(p => p.id === myId);
  const mySlot = myPlayer?.slotIndex;
  const isHost = mySlot === 0;
  
  const hostId = players.find(p => p.slotIndex === 0)?.id;
  const hostAllowDeploy = hostId ? (gameState.permissions?.allowOthersDeploy?.[hostId] || false) : false;
  const canIDeploy = isHost || hostAllowDeploy;

  // --- Render ---

  if (view === 'SETUP') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/30 via-gray-900 to-black pointer-events-none" />

        {/* Global Loading Overlay */}
       <AnimatePresence>
         {isProcessing && (
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center flex-col gap-4"
            >
               <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
               <p className="text-xl font-bold uppercase tracking-widest animate-pulse">Establishing Link...</p>
            </motion.div>
         )}
       </AnimatePresence>

       {/* Notification Toast/Modal */}
       <AnimatePresence>
          {notification && (
             <motion.div 
               initial={{ y: -100, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: -100, opacity: 0 }}
               className="fixed top-6 left-1/2 -translate-x-1/2 z-[90] bg-gray-800 border-l-4 border-red-500 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 min-w-[300px]"
             >
                <div className={`p-2 rounded-full ${notification.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                   {notification.type === 'error' ? '!' : 'i'}
                </div>
                <div className="flex-1">
                   <p className="font-bold text-sm uppercase">{notification.type === 'error' ? 'Connection Error' : 'System Update'}</p>
                   <p className="text-xs text-gray-400">{notification.message}</p>
                </div>
                <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-white">✕</button>
             </motion.div>
          )}
       </AnimatePresence>

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
                    disabled={isProcessing || !playerName || !roomId}
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
                    disabled={isProcessing || !playerName}
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
       <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-gray-900 to-black pointer-events-none -z-10" />
       
       {/* Global Loading Overlay */}
       <AnimatePresence>
         {isProcessing && (
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center flex-col gap-4"
            >
               <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
               <p className="text-xl font-bold uppercase tracking-widest animate-pulse">Establishing Link...</p>
            </motion.div>
         )}
       </AnimatePresence>

       {/* Notification Toast/Modal */}
       <AnimatePresence>
          {notification && (
             <motion.div 
               initial={{ y: -100, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: -100, opacity: 0 }}
               className="fixed top-6 left-1/2 -translate-x-1/2 z-[90] bg-gray-800 border-l-4 border-red-500 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 min-w-[300px]"
             >
                <div className={`p-2 rounded-full ${notification.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                   {notification.type === 'error' ? '!' : 'i'}
                </div>
                <div className="flex-1">
                   <p className="font-bold text-sm uppercase">{notification.type === 'error' ? 'Connection Error' : 'System Update'}</p>
                   <p className="text-xs text-gray-400">{notification.message}</p>
                </div>
                <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-white">✕</button>
             </motion.div>
          )}
       </AnimatePresence>

       {/* Header */}
       <header className="flex flex-col md:flex-row justify-between items-center mb-6 bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md gap-4">
          <div className="flex items-center gap-4">
            <button onClick={handleBackClick} className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white">
               <ArrowLeft size={24} />
            </button>
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
              
              {players.find(p => p.id === myId)?.slotIndex === 0 && (
                <button 
                  onClick={handleDisbandRequest}
                  className="px-4 py-3 bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-800 font-bold uppercase text-xs rounded-xl transition-all"
                >
                  Disband
                </button>
              )}

              <button 
                onClick={() => setShowHistoryModal(true)}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2"
                title="Roll History"
              >
                <History size={20} />
              </button>

              <button 
                onClick={() => setShowOptionsModal(true)}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Settings size={20} />
              </button>

              <button 
                onClick={handleGlobalRerollRequest}
                disabled={!canIDeploy}
                className={`px-6 py-3 font-black uppercase text-sm rounded-xl shadow-lg transition-all ${ canIDeploy ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:brightness-110 active:scale-95' : 'bg-gray-800 text-gray-500 cursor-not-allowed grayscale'}`}
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
             
             const canIRerollThisSlot = isMe || (player ? (gameState.permissions?.allowOthersRerollMe?.[player.id] === true) : false);

             return (
               <motion.div 
                  key={slotIndex} 
                  variants={{
                    hidden: { opacity: 0, y: 50 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className={`relative group transition-all duration-300 rounded-[2rem] ${isMe ? 'z-10 scale-[1.03] ring-2 ring-yellow-400/70 shadow-[0_0_50px_-10px_rgba(250,204,21,0.2)] my-2 lg:my-0' : 'opacity-90 hover:opacity-100'}`}
               >
                  {!isMe && <div className="absolute -inset-1 bg-gradient-to-b from-gray-700 to-gray-900 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>}
                  {isMe && <div className="absolute -inset-1 bg-gradient-to-b from-yellow-500/20 to-orange-500/20 rounded-[2rem] blur opacity-50 animate-pulse"></div>}
                  
                  <LegendCard 
                    playerIndex={slotIndex}
                    playerName={player?.name || `Waiting for Player...`}
                    loadout={player ? (gameState.loadouts[player.id] || null) : null}
                    onReroll={() => player && handleIndividualReroll(player.id)}
                    showReroll={!!player && canIRerollThisSlot}
                    onExclude={(id) => player && handleBan(slotIndex, id)}
                    isMe={isMe}
                    isRolling={isGlobalRolling}
                    isMuted={isMuted}
                    mode={gameState.mode}
                  />

                  {/* Empty Slot Indicator */}
                  {!player && (
                     <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-[2rem] flex items-center justify-center">
                        <div className="text-gray-500 font-bold uppercase tracking-widest text-sm border border-gray-600 px-4 py-2 rounded-full">
                           Open Slot {slotIndex + 1}
                        </div>
                     </div>
                  )}
               </motion.div>
             );
          })}
       </motion.main>

       {/* HISTORY MODAL */}
       {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
             <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                 <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                     <div>
                       <h2 className="text-xl font-bold uppercase flex items-center gap-2">
                           <History size={24} className="text-gray-400"/> Roll History
                       </h2>
                       <p className="text-xs text-gray-500 uppercase tracking-widest">Last 5 deploys</p>
                     </div>
                     <button onClick={() => setShowHistoryModal(false)} className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition-colors">✕</button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {rollHistory.length === 0 ? (
                        <div className="text-center py-20 text-gray-600 font-mono">NO DATA RECORDED</div>
                    ) : (
                        rollHistory.map((item, idx) => (
                           <div key={item.timestamp} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                               <div className="flex justify-between items-center mb-3">
                                   <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">#{idx + 1} • {new Date(item.timestamp).toLocaleTimeString()}</span>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  {[0,1,2].map(slot => {
                                      const p = players.find(pl => pl.slotIndex === slot);
                                      if (!p) return null;
                                      const l = item.loadouts[p.id];
                                      if (!l) return (
                                          <div key={slot} className="bg-gray-900/50 p-2 rounded-lg text-center text-xs text-gray-600">
                                              {p.name}: No Data
                                          </div>
                                      );
                                      return (
                                          <div key={slot} className="bg-gray-900 p-3 rounded-lg flex items-center gap-3 border border-gray-800">
                                              <img src={l.legend.icon ? `/icons/${l.legend.icon}` : `/legends/${l.legend.image}`} className="w-8 h-8 rounded bg-gray-800 object-cover" />
                                              <div className="overflow-hidden">
                                                  <div className="font-bold text-xs text-white uppercase truncate">{l.legend.name}</div>
                                                  <div className="text-[10px] text-gray-400 truncate">{l.primary.name} / {l.secondary.name}</div>
                                              </div>
                                          </div>
                                      );
                                  })}
                               </div>
                           </div>
                        ))
                    )}
                 </div>
             </div>
          </div>
       )}

       {/* OPTIONS MODAL */}
       {showOptionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold uppercase">Squad Options</h2>
                <button onClick={() => setShowOptionsModal(false)} className="text-gray-400 hover:text-white">✕</button>
             </div>
             
             <div className="space-y-4">
               {/* Mode Selection (Host Only) */}
               {isHost && (
                   <div className="bg-gray-800 p-4 rounded-xl border border-yellow-500/20">
                      <h3 className="font-bold text-white text-sm mb-3">Game Mode</h3>
                      <div className="grid grid-cols-3 gap-2">
                          <button 
                             onClick={() => handleSetGameMode('FULL')}
                             className={`p-2 rounded-lg text-xs font-bold uppercase transition-colors border ${gameState.mode === 'FULL' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'}`}
                          >
                             Full
                          </button>
                          <button 
                             onClick={() => handleSetGameMode('LEGENDS')}
                             className={`p-2 rounded-lg text-xs font-bold uppercase transition-colors border ${gameState.mode === 'LEGENDS' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'}`}
                          >
                             Legends
                          </button>
                          <button 
                             onClick={() => handleSetGameMode('ROLE')}
                             className={`p-2 rounded-lg text-xs font-bold uppercase transition-colors border ${gameState.mode === 'ROLE' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'}`}
                          >
                             Role
                          </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {gameState.mode === 'FULL' && "Randomizes everything: Legend and Weapons."}
                        {gameState.mode === 'LEGENDS' && "Randomizes Legend only. Weapons are free choice."}
                        {gameState.mode === 'ROLE' && "Randomizes Class Role only. You pick Legend & Guns."}
                      </p>
                   </div>
               )}

               {/* Toggle 0: Sound */}
               <div className="flex justify-between items-center bg-gray-800 p-4 rounded-xl">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                       {isMuted ? <VolumeX size={16}/> : <Volume2 size={16}/>} Sound Effects
                    </h3>
                    <p className="text-xs text-gray-500">Enable/Disable interface sounds.</p>
                  </div>
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${!isMuted ? 'bg-blue-500' : 'bg-gray-600'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${!isMuted ? 'translate-x-6' : ''}`} />
                  </button>
               </div>

               {/* Toggle 1: Allow others to reroll ME */}
               <div className="flex justify-between items-center bg-gray-800 p-4 rounded-xl">
                  <div>
                    <h3 className="font-bold text-white text-sm">Allow Team to Reroll Me</h3>
                    <p className="text-xs text-gray-500">Teammates can randomize your legend.</p>
                  </div>
                  <button 
                    onClick={() => handleTogglePermission('REROLL')}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${gameState.permissions?.allowOthersRerollMe?.[myId] ? 'bg-green-500' : 'bg-gray-600'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${gameState.permissions?.allowOthersRerollMe?.[myId] ? 'translate-x-6' : ''}`} />
                  </button>
               </div>

               {/* Toggle 2: HOST ONLY - Allow others to Deploy */}
               {isHost && (
                 <div className="flex justify-between items-center bg-gray-800 p-4 rounded-xl border border-red-900/30">
                    <div>
                      <h3 className="font-bold text-white text-sm">Grant Deploy Access</h3>
                      <p className="text-xs text-gray-500">Allow anyone to trigger global randomize.</p>
                    </div>
                    <button 
                      onClick={() => handleTogglePermission('DEPLOY')}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${gameState.permissions?.allowOthersDeploy?.[myId] ? 'bg-red-500' : 'bg-gray-600'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${gameState.permissions?.allowOthersDeploy?.[myId] ? 'translate-x-6' : ''}`} />
                    </button>
                 </div>
               )}
             </div>
          </div>
        </div>
       )}

       {/* CHAT WIDGET */}
       {!showChat ? (
          <button 
             onClick={() => setShowChat(true)}
             className="fixed bottom-6 right-6 z-40 bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-full shadow-2xl border border-white/10 transition-transform hover:scale-110 active:scale-95 group"
          >
             <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" hidden={!notification} />
             <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" hidden={!notification} />
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-blue-400 transition-colors"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </button>
       ) : (
          <motion.div 
             initial={{ opacity: 0, y: 20, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 20 }}
             className="fixed bottom-6 right-6 z-40 w-80 md:w-96 h-[450px] bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
             {/* Chat Header */}
             <div className="p-3 bg-gray-800/50 border-b border-gray-700 flex justify-between items-center cursor-pointer" onClick={() => setShowChat(false)}>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <h3 className="font-bold text-sm uppercase tracking-wide">Squad Comms</h3>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setShowChat(false); }} className="text-gray-400 hover:text-white p-1">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
             </div>
             
             {/* Messages */}
             <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {chatMessages.length === 0 && (
                   <div className="text-center text-gray-500 text-xs italic mt-10">No transmission detected.</div>
                )}
                {chatMessages.map(msg => {
                   const isMe = msg.sender === playerName;
                   return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                         <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                            isMe ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30' : 'bg-gray-800 text-gray-200 border border-gray-700'
                         }`}>
                            {!isMe && <span className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">{msg.sender}</span>}
                            <span>{msg.text}</span>
                         </div>
                         <span className="text-[9px] text-gray-600 mt-1 px-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                   )
                })}
                <div ref={chatEndRef} />
             </div>

             {/* Input */}
             <form onSubmit={handleSendMessage} className="p-3 bg-gray-800/50 border-t border-gray-700">
                <div className="flex gap-2">
                   <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type message..." 
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                   />
                   <button 
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white p-2 rounded-lg transition-colors"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                   </button>
                </div>
             </form>
          </motion.div>
       )}

       {/* CONFIRMATION MODAL */}
       {confirmModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 border-2 border-red-600 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-red-600/10 animate-pulse pointer-events-none" />
            
            <h3 className="text-2xl font-black text-white uppercase text-center mb-4 tracking-tighter">
              {confirmModalData.title}
            </h3>
            <p className="text-gray-400 text-center text-sm mb-8 font-mono">
              {confirmModalData.message}
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmModalData(null)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold uppercase rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeAction}
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
