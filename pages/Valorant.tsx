import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../utils/supabase';
import { useCatalog } from '../contexts/CatalogContext';
import { trackActiveRoom } from '../utils/roomActivity';
import { AgentAssignment, assignAgents, generateValorantRoomId, ValorantPlayer } from '../utils/valorantLogic';
import { AgentAssignmentCard } from '../components/valorant/AgentAssignmentCard';
import { ValorantPlayerCard } from '../components/valorant/ValorantPlayerCard';
import { soundManager } from '../utils/soundManager';
import {
  ArrowLeft,
  Share2,
  Users,
  Sparkles,
  Loader2,
  Volume2,
  VolumeX,
  Radio,
  LogOut,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Valorant: React.FC = () => {
  const { catalog } = useCatalog();

  // Setup state
  const [view, setView] = useState<'SETUP' | 'LOBBY'>('SETUP');
  const [setupMode, setSetupMode] = useState<'CREATE' | 'JOIN'>('CREATE');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('val_player_name') || '');
  const [roomId, setRoomId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'error' | 'info'; message: string } | null>(null);

  // Audio & Copy Link
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('val_muted') === 'true');
  const [copiedLink, setCopiedLink] = useState(false);

  // Connection & Game State
  const [channel, setChannel] = useState<any>(null);
  const [myId, setMyId] = useState('');
  const [players, setPlayers] = useState<ValorantPlayer[]>([]);
  const [assignments, setAssignments] = useState<Record<string, AgentAssignment>>({});
  const [isRolling, setIsRolling] = useState(false);

  const roomActivityCleanupRef = useRef<(() => Promise<void>) | null>(null);
  const assignmentsRef = useRef(assignments);
  assignmentsRef.current = assignments;

  useEffect(() => {
    soundManager.setMute(isMuted);
    localStorage.setItem('val_muted', String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    return () => {
      roomActivityCleanupRef.current?.();
    };
  }, []);

  // Pre-fill room code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setSetupMode('JOIN');
      setRoomId(code.toUpperCase());
    }
  }, []);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setNotification({ type: 'error', message: 'Please enter your nickname first.' });
      return;
    }
    const code = generateValorantRoomId();
    setRoomId(code);
    await connectToRoom(code, 'CREATE');
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomId.trim()) {
      setNotification({ type: 'error', message: 'Please enter both Room Code and Nickname.' });
      return;
    }
    await connectToRoom(roomId.trim().toUpperCase(), 'JOIN');
  };

  const connectToRoom = async (code: string, mode: 'CREATE' | 'JOIN') => {
    if (!isSupabaseConfigured) {
      setNotification({
        type: 'error',
        message: 'Supabase is not configured. Add credentials to .env.local.'
      });
      return;
    }

    setIsProcessing(true);
    localStorage.setItem('val_player_name', playerName.trim());

    if (channel) {
      supabase.removeChannel(channel);
    }

    const storageKey = `val_user_id_${code}`;
    let tempId = sessionStorage.getItem(storageKey);
    if (!tempId) {
      tempId = Math.random().toString(36).substring(7);
      sessionStorage.setItem(storageKey, tempId);
    }
    setMyId(tempId);

    const newChannel = supabase.channel(`valorant-room:${code}`, {
      config: { presence: { key: code } }
    });

    newChannel
      .on('broadcast', { event: 'VALORANT_ROLL' }, (payload) => {
        setIsRolling(true);
        soundManager.playStart();
        setTimeout(() => {
          setAssignments(payload.payload.assignments || {});
          setIsRolling(false);
          soundManager.playSuccess();
        }, 1200);
      })
      .on('broadcast', { event: 'ROOM_STATE_REQUEST' }, () => {
        if (Object.keys(assignmentsRef.current).length > 0) {
          newChannel.send({
            type: 'broadcast',
            event: 'ROOM_STATE',
            payload: { assignments: assignmentsRef.current }
          });
        }
      })
      .on('broadcast', { event: 'ROOM_STATE' }, (payload) => {
        if (payload.payload?.assignments) {
          setAssignments(payload.payload.assignments);
        }
      })
      .on('broadcast', { event: 'ROOM_CLOSED' }, () => {
        if (roomActivityCleanupRef.current) {
          roomActivityCleanupRef.current();
          roomActivityCleanupRef.current = null;
        }
        newChannel.unsubscribe();
        setNotification({ type: 'info', message: 'Squad host closed the lobby.' });
        setTimeout(() => setView('SETUP'), 2000);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = newChannel.presenceState();
        const rawPlayers: any[] = [];
        Object.values(state).forEach((items: any) => {
          items.forEach((p: any) => rawPlayers.push(p));
        });

        // Stable sort
        const sorted = rawPlayers.sort((a, b) => (a.online_at || '').localeCompare(b.online_at || ''));

        // Reject player 6+
        const myIndex = sorted.findIndex((p) => p.userId === tempId);
        if (myIndex >= 5) {
          newChannel.unsubscribe();
          setIsProcessing(false);
          setNotification({ type: 'error', message: 'This VALORANT lobby is full (5/5 players).' });
          setView('SETUP');
          return;
        }

        const mapped: ValorantPlayer[] = sorted.slice(0, 5).map((p, idx) => ({
          id: p.userId,
          name: p.user_name,
          onlineAt: p.online_at,
          slotIndex: idx
        }));

        setPlayers(mapped);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await new Promise((r) => setTimeout(r, 800));

          const state = newChannel.presenceState();
          let userCount = 0;
          Object.values(state).forEach((p: any) => (userCount += p.length));

          if (mode === 'JOIN' && userCount === 0) {
            newChannel.unsubscribe();
            setIsProcessing(false);
            setNotification({ type: 'error', message: `Lobby #${code} was not found or has expired.` });
            return;
          }

          const joinKey = `val_join_time_${code}`;
          let joinTime = sessionStorage.getItem(joinKey);
          if (!joinTime) {
            joinTime = new Date().toISOString();
            sessionStorage.setItem(joinKey, joinTime);
          }

          let instanceId = sessionStorage.getItem(`val_instance_${code}`);
          if (!instanceId) {
            instanceId = crypto.randomUUID();
            sessionStorage.setItem(`val_instance_${code}`, instanceId);
          }

          await newChannel.track({
            user_name: playerName.trim(),
            userId: tempId,
            online_at: joinTime,
            roomInstanceId: instanceId
          });

          // Track in anonymous room directory
          if (roomActivityCleanupRef.current) {
            await roomActivityCleanupRef.current();
          }
          const activityCleanup = await trackActiveRoom({
            game: 'VALORANT',
            roomInstanceId: instanceId,
            sessionId: tempId
          });
          roomActivityCleanupRef.current = activityCleanup;

          // Request state from existing players
          newChannel.send({ type: 'broadcast', event: 'ROOM_STATE_REQUEST', payload: {} });

          setView('LOBBY');
          setIsProcessing(false);
        } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
          setNotification({ type: 'error', message: 'Connection lost to lobby.' });
        }
      });

    setChannel(newChannel);
  };

  const handleRollRoulette = async () => {
    if (players.length !== 5) {
      setNotification({
        type: 'error',
        message: `Need exactly 5 players to roll (currently ${players.length}/5).`
      });
      return;
    }

    try {
      const activeAgents = catalog.valorantAgents.filter((a) => a.isActive !== false);
      const assignedList = assignAgents(players, activeAgents);

      const assignmentMap: Record<string, AgentAssignment> = {};
      assignedList.forEach((item) => {
        assignmentMap[item.playerId] = item;
      });

      // Broadcast to room
      await channel?.send({
        type: 'broadcast',
        event: 'VALORANT_ROLL',
        payload: {
          rollId: crypto.randomUUID(),
          assignments: assignmentMap,
          timestamp: Date.now()
        }
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to roll agents.' });
    }
  };

  const handleLeaveRoom = async () => {
    if (roomActivityCleanupRef.current) {
      await roomActivityCleanupRef.current();
      roomActivityCleanupRef.current = null;
    }
    if (channel) {
      await channel.unsubscribe();
      supabase.removeChannel(channel);
      setChannel(null);
    }
    setPlayers([]);
    setAssignments({});
    setView('SETUP');
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/valorant?code=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-rose-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-rose-950/25 via-neutral-950 to-neutral-950 pointer-events-none" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 pointer-events-none mix-blend-overlay" />

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className={`fixed top-5 right-5 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 min-w-[300px] text-xs font-bold ${
              notification.type === 'error'
                ? 'bg-rose-950/90 border-rose-800 text-rose-300'
                : 'bg-neutral-900/90 border-neutral-700 text-neutral-200'
            }`}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="p-1 hover:text-white">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2">
                <span>VALORANT Agent Roulette</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-mono">
                  5v5 Squad
                </span>
              </h1>
              {view === 'LOBBY' && (
                <p className="text-[10px] text-neutral-400 font-mono">Room Code: <strong className="text-rose-400">#{roomId}</strong></p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === 'LOBBY' && (
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Invite'}</span>
              </button>
            )}

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {view === 'LOBBY' && (
              <button
                onClick={handleLeaveRoom}
                className="p-2 rounded-xl border border-neutral-800 hover:bg-rose-500/10 hover:border-rose-500/30 text-neutral-400 hover:text-rose-400 transition-colors"
                title="Leave Lobby"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'SETUP' ? (
          <div className="max-w-md mx-auto py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-900/40">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black uppercase text-white tracking-tight">5-Player Agent Roulette</h2>
                <p className="text-xs text-neutral-400">Launch or join an online lobby to randomly assign 5 distinct Agents.</p>
              </div>

              {/* Mode Switcher */}
              <div className="flex p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                <button
                  onClick={() => setSetupMode('CREATE')}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                    setupMode === 'CREATE' ? 'bg-rose-600 text-white shadow-md' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Create Lobby
                </button>
                <button
                  onClick={() => setSetupMode('JOIN')}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                    setupMode === 'JOIN' ? 'bg-rose-600 text-white shadow-md' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Join Lobby
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Your Nickname
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your in-game name"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {setupMode === 'JOIN' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Room Code
                    </label>
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                      placeholder="e.g. A9B2X1"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white font-mono tracking-widest placeholder-neutral-600 focus:outline-none focus:border-rose-500 uppercase"
                    />
                  </div>
                )}

                <button
                  onClick={setupMode === 'CREATE' ? handleCreateRoom : handleJoinRoom}
                  disabled={isProcessing}
                  className="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-orange-500 text-white font-black uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>{setupMode === 'CREATE' ? 'Launch 5-Player Lobby' : 'Join Squad Lobby'}</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Squad Status Header */}
            <div className="bg-neutral-900/60 backdrop-blur-xl p-5 rounded-3xl border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg uppercase text-white">Squad Roster</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        players.length === 5
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {players.length}/5 Players Ready
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {players.length === 5
                      ? 'Lobby full! Anyone can trigger the squad roulette below.'
                      : `Waiting for ${5 - players.length} more players to join via room link.`}
                  </p>
                </div>
              </div>

              {/* Roll Trigger Button */}
              <button
                onClick={handleRollRoulette}
                disabled={players.length !== 5 || isRolling}
                className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-xl shadow-rose-900/40 hover:shadow-rose-700/60 transition-all flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                {isRolling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rolling 5 Unique Agents...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {players.length === 5
                        ? Object.keys(assignments).length > 0
                          ? 'Re-roll Squad Agents'
                          : 'Deploy Squad Roulette'
                        : `Waiting for 5 Players (${players.length}/5)`}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* 5-Slot Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[0, 1, 2, 3, 4].map((slotIdx) => {
                const player = players[slotIdx];
                if (!player) {
                  return <ValorantPlayerCard key={slotIdx} slotNumber={slotIdx + 1} />;
                }
                const assignment = assignments[player.id];
                return (
                  <AgentAssignmentCard
                    key={player.id}
                    assignment={assignment}
                    playerName={player.name}
                    isMe={player.id === myId}
                    slotNumber={slotIdx + 1}
                    isRolling={isRolling}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Valorant;
