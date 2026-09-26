import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../utils/supabase';
import { ActiveRoomSummary, calculateRoomStats, GlobalRoomStats, summarizeActiveRooms } from '../../utils/roomActivity';
import { Radio, Users, Crosshair, RefreshCw, Activity, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export const ActiveRoomsDashboard: React.FC = () => {
  const [activeRooms, setActiveRooms] = useState<ActiveRoomSummary[]>([]);
  const [stats, setStats] = useState<GlobalRoomStats>({
    totalRooms: 0,
    totalPlayers: 0,
    apexRooms: 0,
    apexPlayers: 0,
    valorantRooms: 0,
    valorantPlayers: 0
  });
  const [channelStatus, setChannelStatus] = useState<'CONNECTING' | 'SUBSCRIBED' | 'DISCONNECTED'>('CONNECTING');

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase.channel('gameteamer:active-rooms');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const summaries = summarizeActiveRooms(state as any);
        setActiveRooms(summaries);
        setStats(calculateRoomStats(summaries));
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel.presenceState();
        const summaries = summarizeActiveRooms(state as any);
        setActiveRooms(summaries);
        setStats(calculateRoomStats(summaries));
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState();
        const summaries = summarizeActiveRooms(state as any);
        setActiveRooms(summaries);
        setStats(calculateRoomStats(summaries));
      });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setChannelStatus('SUBSCRIBED');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setChannelStatus('DISCONNECTED');
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between bg-neutral-900/60 backdrop-blur-md p-4 rounded-2xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Realtime Room Directory</h2>
            <p className="text-[11px] text-neutral-400">
              Live presence monitoring via Supabase Realtime • Status:{' '}
              <span className={channelStatus === 'SUBSCRIBED' ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {channelStatus}
              </span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-neutral-400">
            {stats.totalRooms} Rooms Online
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Rooms</span>
            <Layers className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-black text-white">{stats.totalRooms}</div>
          <p className="text-[10px] text-neutral-500 mt-1">Across all games</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Online Players</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-white">{stats.totalPlayers}</div>
          <p className="text-[10px] text-neutral-500 mt-1">Active connected sessions</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Apex Legends</span>
            <Crosshair className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-black text-red-400">{stats.apexRooms}</div>
          <p className="text-[10px] text-neutral-500 mt-1">{stats.apexPlayers} players in squad lobbies</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">VALORANT</span>
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400">{stats.valorantRooms}</div>
          <p className="text-[10px] text-neutral-500 mt-1">{stats.valorantPlayers} players in roulette lobbies</p>
        </motion.div>
      </div>

      {/* Live Rooms Table / Grid */}
      <div className="bg-neutral-900/60 backdrop-blur-md rounded-2xl border border-neutral-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">Open Lobbies</h3>
          <span className="text-xs font-mono text-neutral-500">Auto-refreshes in realtime</span>
        </div>

        {activeRooms.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 space-y-2">
            <Users className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-bold uppercase tracking-wider">No Active Rooms Online</p>
            <p className="text-[11px] text-neutral-600">When players launch Apex or VALORANT lobbies, they will appear here live.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeRooms.map((room) => (
              <div
                key={`${room.game}:${room.roomInstanceId}`}
                className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      room.game === 'APEX'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {room.game === 'APEX' ? 'APX' : 'VAL'}
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-white uppercase">
                      Lobby #{room.roomInstanceId.slice(0, 8)}
                    </span>
                    <p className="text-[10px] text-neutral-500">{room.game === 'APEX' ? 'Apex Loadout Room' : '5-Player Agent Lobby'}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-800 text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-neutral-400" />
                    {room.playerCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
