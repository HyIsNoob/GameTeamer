import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../utils/supabase';
import { soundManager } from '../utils/soundManager';
import { trackActiveRoom } from '../utils/roomActivity';
import {
  TournamentFormat,
  MapSelectionMode,
  TournamentPlayer,
  TournamentSettings,
  TournamentState,
  TournamentTeam,
  VetoActionType,
  VetoSide,
  createInitialTournamentState
} from '../utils/tournamentTypes';
import {
  executeVetoAction,
  executeAgentBan,
  randomizeTournamentMaps,
  recordMapScore
} from '../utils/tournamentLogic';
import { TournamentRosterView } from '../components/tournament/TournamentRosterView';
import { MapVetoBoard } from '../components/tournament/MapVetoBoard';
import { AgentBanBoard } from '../components/tournament/AgentBanBoard';
import { TournamentSettingsModal } from '../components/tournament/TournamentSettingsModal';
import { MatchSummaryModal } from '../components/tournament/MatchSummaryModal';
import { CoinFlipModal } from '../components/tournament/CoinFlipModal';
import { VictoryScreen } from '../components/tournament/VictoryScreen';
import {
  ArrowLeft,
  Settings2,
  Share2,
  Trophy,
  Swords,
  Users,
  Copy,
  Check,
  Volume2,
  VolumeX,
  LogOut,
  AlertCircle,
  Loader2,
  Sparkles,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const generateTournamentRoomId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const Tournament: React.FC = () => {
  // Setup state
  const [view, setView] = useState<'SETUP' | 'ROOM'>('SETUP');
  const [setupMode, setSetupMode] = useState<'CREATE' | 'JOIN'>('CREATE');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('tourney_player_name') || '');
  const [roomId, setRoomId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'error' | 'info'; message: string } | null>(null);

  // Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('tourney_muted') === 'true');
  const [copiedLink, setCopiedLink] = useState(false);

  // Connection & Game State
  const [channel, setChannel] = useState<any>(null);
  const [myId, setMyId] = useState('');
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [tournamentState, setTournamentState] = useState<TournamentState>(() =>
    createInitialTournamentState('TEMP', '')
  );

  const roomActivityCleanupRef = useRef<(() => Promise<void>) | null>(null);
  const tournamentStateRef = useRef(tournamentState);
  tournamentStateRef.current = tournamentState;

  useEffect(() => {
    soundManager.setMute(isMuted);
    localStorage.setItem('tourney_muted', String(isMuted));
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

  const handleCreateLobby = async () => {
    if (!playerName.trim()) {
      setNotification({ type: 'error', message: 'Please enter your nickname first.' });
      return;
    }
    const code = generateTournamentRoomId();
    setRoomId(code);
    await connectToRoom(code, 'CREATE');
  };

  const handleJoinLobby = async () => {
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
        message: 'Supabase is not configured. Please add project credentials in .env.local.'
      });
      return;
    }

    setIsProcessing(true);
    localStorage.setItem('tourney_player_name', playerName.trim());

    if (channel) {
      supabase.removeChannel(channel);
    }

    const storageKey = `tourney_user_id_${code}`;
    let tempId = sessionStorage.getItem(storageKey);
    if (!tempId) {
      tempId = Math.random().toString(36).substring(7);
      sessionStorage.setItem(storageKey, tempId);
    }
    setMyId(tempId);

    // Initial state
    if (mode === 'CREATE') {
      const initialState = createInitialTournamentState(code, tempId);
      setTournamentState(initialState);
      tournamentStateRef.current = initialState;
    }

    const newChannel = supabase.channel(`tournament-room:${code}`, {
      config: {
        broadcast: { self: true },
        presence: { key: code }
      }
    });

    newChannel
      .on('broadcast', { event: 'TOURNAMENT_STATE_UPDATE' }, (payload) => {
        const incomingState = payload.payload?.state;
        const senderId = payload.payload?.senderId;
        if (incomingState) {
          setTournamentState(incomingState);
          // Play sound
          if (incomingState.phase === 'MATCH_READY') {
            soundManager.playSuccess();
          } else if (senderId !== tempId) {
            soundManager.playTick();
          }
        }
      })
      .on('broadcast', { event: 'TOURNAMENT_STATE_REQUEST' }, () => {
        if (tournamentStateRef.current && tournamentStateRef.current.roomId === code) {
          newChannel.send({
            type: 'broadcast',
            event: 'TOURNAMENT_STATE_UPDATE',
            payload: { state: tournamentStateRef.current, senderId: tempId }
          });
        }
      })
      .on('broadcast', { event: 'LOBBY_CLOSED' }, () => {
        if (roomActivityCleanupRef.current) {
          roomActivityCleanupRef.current();
          roomActivityCleanupRef.current = null;
        }
        newChannel.unsubscribe();
        setNotification({ type: 'info', message: 'Tournament host closed the lobby.' });
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

        // Max 10 players
        const myIndex = sorted.findIndex((p) => p.userId === tempId);
        if (myIndex >= 10) {
          newChannel.unsubscribe();
          setIsProcessing(false);
          setNotification({ type: 'error', message: 'This tournament room is full (10/10 players).' });
          setView('SETUP');
          return;
        }

        // Map into Alpha & Omega
        const alphaList: TournamentPlayer[] = [];
        const omegaList: TournamentPlayer[] = [];

        sorted.slice(0, 10).forEach((p, idx) => {
          const preferredTeam: TournamentTeam = p.team || (idx < 5 ? 'ALPHA' : 'OMEGA');
          if (preferredTeam === 'ALPHA' && alphaList.length < 5) {
            alphaList.push({
              id: p.userId,
              name: p.user_name,
              team: 'ALPHA',
              slotIndex: alphaList.length,
              isCaptain: p.isCaptain !== undefined ? p.isCaptain : alphaList.length === 0,
              onlineAt: p.online_at
            });
          } else if (omegaList.length < 5) {
            omegaList.push({
              id: p.userId,
              name: p.user_name,
              team: 'OMEGA',
              slotIndex: omegaList.length,
              isCaptain: p.isCaptain !== undefined ? p.isCaptain : omegaList.length === 0,
              onlineAt: p.online_at
            });
          } else if (alphaList.length < 5) {
            alphaList.push({
              id: p.userId,
              name: p.user_name,
              team: 'ALPHA',
              slotIndex: alphaList.length,
              isCaptain: p.isCaptain !== undefined ? p.isCaptain : alphaList.length === 0,
              onlineAt: p.online_at
            });
          }
        });

        // Ensure each team has at least one captain if there are players in that team
        if (alphaList.length > 0 && !alphaList.some((p) => p.isCaptain)) {
          alphaList[0].isCaptain = true;
        }
        if (omegaList.length > 0 && !omegaList.some((p) => p.isCaptain)) {
          omegaList[0].isCaptain = true;
        }

        const mapped = [...alphaList, ...omegaList];
        setPlayers(mapped);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await new Promise((r) => setTimeout(r, 600));

          const state = newChannel.presenceState();
          let userCount = 0;
          Object.values(state).forEach((p: any) => (userCount += p.length));

          if (mode === 'JOIN' && userCount === 0) {
            newChannel.unsubscribe();
            setIsProcessing(false);
            setNotification({ type: 'error', message: `Tournament #${code} was not found or has expired.` });
            return;
          }

          const joinKey = `tourney_join_time_${code}`;
          let joinTime = sessionStorage.getItem(joinKey);
          if (!joinTime) {
            joinTime = new Date().toISOString();
            sessionStorage.setItem(joinKey, joinTime);
          }

          let instanceId = sessionStorage.getItem(`tourney_instance_${code}`);
          if (!instanceId) {
            instanceId = crypto.randomUUID();
            sessionStorage.setItem(`tourney_instance_${code}`, instanceId);
          }

          // Initial track
          await newChannel.track({
            user_name: playerName.trim(),
            userId: tempId,
            team: 'ALPHA',
            online_at: joinTime,
            roomInstanceId: instanceId
          });

          // Track in active rooms dashboard
          if (roomActivityCleanupRef.current) {
            await roomActivityCleanupRef.current();
          }
          const activityCleanup = await trackActiveRoom({
            game: 'VALORANT',
            roomInstanceId: instanceId,
            sessionId: tempId
          });
          roomActivityCleanupRef.current = activityCleanup;

          // Request state from existing host
          newChannel.send({ type: 'broadcast', event: 'TOURNAMENT_STATE_REQUEST', payload: {} });

          setView('ROOM');
          setIsProcessing(false);
        } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
          setNotification({ type: 'error', message: 'Connection lost to tournament room.' });
        }
      });

    setChannel(newChannel);
  };

  const handleSwitchTeam = async (targetTeam: TournamentTeam) => {
    if (!channel || !myId) return;
    const myPlayer = players.find((p) => p.id === myId);
    if (!myPlayer) return;

    soundManager.playTick();

    const joinKey = `tourney_join_time_${roomId}`;
    const joinTime = sessionStorage.getItem(joinKey) || new Date().toISOString();
    const instanceId = sessionStorage.getItem(`tourney_instance_${roomId}`) || crypto.randomUUID();

    const otherPlayersInTargetTeam = players.filter((p) => p.team === targetTeam && p.id !== myId);
    const willBeCaptain = otherPlayersInTargetTeam.length === 0;

    await channel.track({
      user_name: playerName.trim(),
      userId: myId,
      team: targetTeam,
      isCaptain: willBeCaptain,
      online_at: joinTime,
      roomInstanceId: instanceId
    });
  };

  const handleSetCaptain = async (targetPlayerId: string, team: TournamentTeam) => {
    // Host sets captain
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.team === team) {
          return { ...p, isCaptain: p.id === targetPlayerId };
        }
        return p;
      })
    );
  };

  const broadcastStateUpdate = (newState: TournamentState) => {
    setTournamentState(newState);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'TOURNAMENT_STATE_UPDATE',
        payload: { state: newState, senderId: myId }
      });
    }
  };

  const handleStartVeto = () => {
    soundManager.playStart();
    const coinWinner: TournamentTeam = Math.random() > 0.5 ? 'ALPHA' : 'OMEGA';
    const newState: TournamentState = {
      ...tournamentState,
      phase: 'COIN_FLIP',
      firstPickTeam: coinWinner,
      timestamp: Date.now()
    };
    broadcastStateUpdate(newState);
  };

  const handleCoinFlipComplete = () => {
    const firstTeam = tournamentState.firstPickTeam || 'ALPHA';
    if (tournamentState.settings.mode === 'RANDOM') {
      soundManager.playStart();
      const randomMaps = randomizeTournamentMaps(
        tournamentState.settings.format,
        tournamentState.settings.enabledMapIds
      );

      const nextPhase = tournamentState.settings.bansPerTeam > 0 ? 'AGENT_BAN' : 'MATCH_READY';
      // Fair rule: Team that would ban map first has opponent ban agent first!
      const nextAgentBanTeam: TournamentTeam = firstTeam === 'ALPHA' ? 'OMEGA' : 'ALPHA';

      const newState: TournamentState = {
        ...tournamentState,
        phase: nextPhase,
        decidedMaps: randomMaps,
        currentAgentBanTeam: nextPhase === 'AGENT_BAN' ? nextAgentBanTeam : null,
        timestamp: Date.now()
      };
      broadcastStateUpdate(newState);
    } else {
      soundManager.playStart();
      const newState: TournamentState = {
        ...tournamentState,
        phase: 'MAP_VETO',
        currentVetoStepIndex: 0,
        timestamp: Date.now()
      };
      broadcastStateUpdate(newState);
    }
  };

  const handleRecordScore = (mapId: string, alphaScore: number, omegaScore: number) => {
    try {
      soundManager.playLockIn();
      const updatedState = recordMapScore(tournamentState, mapId, alphaScore, omegaScore);
      broadcastStateUpdate(updatedState);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi lưu điểm.' });
    }
  };

  const handleDeclareWinner = (winner: TournamentTeam) => {
    soundManager.playVictory();
    const updatedState: TournamentState = {
      ...tournamentState,
      phase: 'VICTORY',
      matchWinner: winner,
      timestamp: Date.now()
    };
    broadcastStateUpdate(updatedState);
  };

  const handleVetoAction = (action: {
    team: TournamentTeam;
    type: VetoActionType;
    targetMapId?: string;
    side?: VetoSide;
  }) => {
    try {
      soundManager.playTick();
      const updatedState = executeVetoAction(tournamentState, action);
      broadcastStateUpdate(updatedState);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Action failed.' });
    }
  };

  const handleAgentBanAction = (agentId: string, agentName: string) => {
    const currentTeam = tournamentState.currentAgentBanTeam;
    if (!currentTeam) return;

    const isAuthorized = Boolean(
      isHost ||
      myPlayer?.team === currentTeam ||
      myPlayer?.isCaptain
    );
    if (!isAuthorized) {
      setNotification({
        type: 'error',
        message: `Chỉ thành viên Team ${currentTeam} (hoặc Host) mới có quyền cấm tướng.`
      });
      return;
    }

    try {
      soundManager.playStart();
      const updatedState = executeAgentBan(tournamentState, agentId, agentName, currentTeam);
      broadcastStateUpdate(updatedState);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to ban agent.' });
    }
  };

  const handleResetMatch = () => {
    soundManager.playStart();
    const freshState = createInitialTournamentState(roomId, tournamentState.hostId);
    broadcastStateUpdate(freshState);
  };

  const handleSaveSettings = (newSettings: TournamentSettings) => {
    const updatedState: TournamentState = {
      ...tournamentState,
      settings: newSettings,
      timestamp: Date.now()
    };
    broadcastStateUpdate(updatedState);
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
    setView('SETUP');
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/tournament?code=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const myPlayer = players.find((p) => p.id === myId);
  const isHost = tournamentState.hostId === myId || (players.length > 0 && players[0].id === myId);
  const myCaptainOfCurrentTurn = players.find(
    (p) => p.team === tournamentState.currentAgentBanTeam && p.isCaptain
  );
  const isMyCaptainTurn = Boolean(
    myPlayer?.isCaptain &&
      ((tournamentState.phase === 'MAP_VETO' &&
        tournamentState.currentAgentBanTeam === myPlayer.team) ||
        (tournamentState.phase === 'AGENT_BAN' &&
          tournamentState.currentAgentBanTeam === myPlayer.team))
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-rose-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 pointer-events-none" />
      <div className="fixed inset-0 bg-[url('/noise.svg')] opacity-15 pointer-events-none mix-blend-overlay" />

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
                <span>VALORANT 5v5 Custom Match</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-mono">
                  Scrim & Tournament Veto
                </span>
              </h1>
              {view === 'ROOM' && (
                <p className="text-[10px] text-neutral-400 font-mono">
                  Room Code: <strong className="text-amber-400">#{roomId}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === 'ROOM' && (
              <>
                {isHost && (
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
                    title="Lobby Rules & Map Settings"
                  >
                    <Settings2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </button>
                )}

                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Invite'}</span>
                </button>
              </>
            )}

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {view === 'ROOM' && (
              <button
                onClick={handleLeaveRoom}
                className="p-2 rounded-xl border border-neutral-800 hover:bg-rose-500/10 hover:border-rose-500/30 text-neutral-400 hover:text-rose-400 transition-colors"
                title="Leave Room"
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/40">
                  <Swords className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black uppercase text-white tracking-tight">
                  5v5 Custom & Veto Lobby
                </h2>
                <p className="text-xs text-neutral-400">
                  Host an official 10-player scrimmage with map veto, side pick, and captain agent bans.
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="flex p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                <button
                  onClick={() => setSetupMode('CREATE')}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                    setupMode === 'CREATE'
                      ? 'bg-amber-500 text-black font-black shadow-md'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Create Lobby
                </button>
                <button
                  onClick={() => setSetupMode('JOIN')}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                    setupMode === 'JOIN'
                      ? 'bg-amber-500 text-black font-black shadow-md'
                      : 'text-neutral-500 hover:text-white'
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
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
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
                      placeholder="e.g. T4B7X9"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white font-mono tracking-widest placeholder-neutral-600 focus:outline-none focus:border-amber-500 uppercase"
                    />
                  </div>
                )}

                <button
                  onClick={setupMode === 'CREATE' ? handleCreateLobby : handleJoinLobby}
                  disabled={isProcessing}
                  className="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-400 hover:to-rose-500 text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>{setupMode === 'CREATE' ? 'Launch Custom Lobby' : 'Join Custom Lobby'}</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Phase Sub-views */}
            {tournamentState.phase === 'LOBBY' && (
              <div className="space-y-6">
                {/* Lobby Control Bar */}
                <div className="bg-neutral-900/60 backdrop-blur-xl p-5 rounded-3xl border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg uppercase text-white">
                          5v5 Team Staging
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300">
                          {players.length}/10 Players
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">
                        {isHost
                          ? 'Review team rosters & match rules, then begin the tournament.'
                          : 'Waiting for Host to launch the veto phase.'}
                      </p>
                    </div>
                  </div>

                  {isHost && (
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-4 py-3 rounded-2xl border border-neutral-700 hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-200 transition-colors flex items-center gap-2"
                      >
                        <Settings2 className="w-4 h-4" />
                        <span>Settings</span>
                      </button>

                      <button
                        onClick={handleStartVeto}
                        className="flex-1 md:flex-initial px-8 py-3.5 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-400 hover:to-rose-500 text-black font-black uppercase tracking-wider text-xs rounded-2xl shadow-xl shadow-amber-950/40 hover:shadow-amber-700/60 transition-all flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>
                          {tournamentState.settings.mode === 'RANDOM'
                            ? `Roll Maps (${tournamentState.settings.format})`
                            : `Start Veto (${tournamentState.settings.format})`}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 5v5 Rosters */}
                <TournamentRosterView
                  players={players}
                  myId={myId}
                  isHost={isHost}
                  phase={tournamentState.phase}
                  onSwitchTeam={handleSwitchTeam}
                  onSetCaptain={handleSetCaptain}
                />
              </div>
            )}

            {/* Map Veto Phase */}
            {tournamentState.phase === 'MAP_VETO' && (
              <div className="space-y-8">
                <MapVetoBoard
                  state={tournamentState}
                  myTeam={myPlayer?.team || 'ALPHA'}
                  isCaptain={Boolean(myPlayer?.isCaptain)}
                  isHost={isHost}
                  onAction={handleVetoAction}
                />
                <TournamentRosterView
                  players={players}
                  myId={myId}
                  isHost={isHost}
                  phase={tournamentState.phase}
                  onSwitchTeam={handleSwitchTeam}
                  onSetCaptain={handleSetCaptain}
                />
              </div>
            )}

            {/* Agent Ban Phase */}
            {tournamentState.phase === 'AGENT_BAN' && (
              <div className="space-y-8">
                <AgentBanBoard
                  state={tournamentState}
                  myTeam={myPlayer?.team || 'ALPHA'}
                  isCaptain={Boolean(myPlayer?.isCaptain)}
                  isHost={isHost}
                  onBanAgent={handleAgentBanAction}
                />
                <TournamentRosterView
                  players={players}
                  myId={myId}
                  isHost={isHost}
                  phase={tournamentState.phase}
                  onSwitchTeam={handleSwitchTeam}
                  onSetCaptain={handleSetCaptain}
                />
              </div>
            )}

            {/* Match Ready / Summary Phase */}
            {tournamentState.phase === 'MATCH_READY' && (
              <div className="space-y-8">
                <MatchSummaryModal
                  state={tournamentState}
                  players={players}
                  isHost={isHost}
                  onResetMatch={handleResetMatch}
                  onRecordScore={handleRecordScore}
                  onDeclareWinner={handleDeclareWinner}
                />
                <TournamentRosterView
                  players={players}
                  myId={myId}
                  isHost={isHost}
                  phase={tournamentState.phase}
                  onSwitchTeam={handleSwitchTeam}
                  onSetCaptain={handleSetCaptain}
                />
              </div>
            )}

            {/* Victory / Champions Screen */}
            {tournamentState.phase === 'VICTORY' && (
              <div className="space-y-8">
                <VictoryScreen
                  state={tournamentState}
                  players={players}
                  isHost={isHost}
                  onRematch={handleResetMatch}
                />
                <TournamentRosterView
                  players={players}
                  myId={myId}
                  isHost={isHost}
                  phase={tournamentState.phase}
                  onSwitchTeam={handleSwitchTeam}
                  onSetCaptain={handleSetCaptain}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Coin Flip Modal */}
      <CoinFlipModal
        isOpen={tournamentState.phase === 'COIN_FLIP'}
        winnerTeam={tournamentState.firstPickTeam || 'ALPHA'}
        isHost={isHost}
        onComplete={handleCoinFlipComplete}
      />

      {/* Settings Modal */}
      <TournamentSettingsModal
        settings={tournamentState.settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default Tournament;
