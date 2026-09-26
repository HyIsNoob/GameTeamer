import React, { useState } from 'react';
import { TournamentPlayer, TournamentState, VALORANT_MAP_POOL } from '../../utils/tournamentTypes';
import { formatMatchSummaryDiscord } from '../../utils/tournamentLogic';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { FALLBACK_VALORANT_AGENTS } from '../../contexts/CatalogContext';
import { Trophy, Copy, Check, RotateCcw, Swords, Shield, Ban } from 'lucide-react';
import { motion } from 'framer-motion';

interface MatchSummaryModalProps {
  state: TournamentState;
  players: TournamentPlayer[];
  isHost: boolean;
  onResetMatch?: () => void;
}

export const MatchSummaryModal: React.FC<MatchSummaryModalProps> = ({
  state,
  players,
  isHost,
  onResetMatch
}) => {
  const [copied, setCopied] = useState(false);

  const alphaPlayers = players.filter((p) => p.team === 'ALPHA');
  const omegaPlayers = players.filter((p) => p.team === 'OMEGA');

  const handleCopy = () => {
    const summaryText = formatMatchSummaryDiscord(state, players);
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-neutral-900 to-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-950/40">
            <Trophy className="w-8 h-8 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-black uppercase tracking-widest border border-amber-500/30">
                Match Veto Completed
              </span>
              <span className="text-xs font-mono text-neutral-400">
                Format: <strong className="text-white">{state.settings.format}</strong>
              </span>
            </div>
            <h2 className="text-2xl font-black uppercase text-white tracking-tight mt-1">
              Official Match Briefing
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleCopy}
            className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider shadow-xl shadow-amber-950/50 transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Summary!' : 'Copy for Discord / Chat'}</span>
          </button>

          {isHost && onResetMatch && (
            <button
              onClick={onResetMatch}
              className="p-3 rounded-2xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title="Reset Tournament"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Decided Maps Showcase */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
          <span>Official Match Maps ({state.decidedMaps.length})</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {state.decidedMaps.map((m) => {
            const mapObj = VALORANT_MAP_POOL.find((item) => item.id === m.mapId);
            return (
              <motion.div
                key={m.mapId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-3xl overflow-hidden border border-amber-500/40 p-5 bg-neutral-900 shadow-xl min-h-[180px] flex flex-col justify-between"
              >
                {/* Background Artwork */}
                <div className="absolute inset-0 pointer-events-none">
                  {mapObj?.splash && (
                    <img
                      src={resolveAssetUrl(mapObj.splash)}
                      alt={m.mapName}
                      className="w-full h-full object-cover opacity-30"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-mono text-[9px] font-black uppercase">
                    Map #{m.orderIndex}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">
                    {m.pickedBy === 'DECIDER'
                      ? 'Decider Map'
                      : m.pickedBy === 'RANDOM'
                      ? 'Random Map'
                      : `Picked by ${m.pickedBy}`}
                  </span>
                </div>

                <div className="relative z-10 my-2">
                  <h4 className="text-2xl font-black uppercase text-white tracking-tight">
                    {m.mapName}
                  </h4>
                </div>

                {m.startingSides && (
                  <div className="relative z-10 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono font-bold">
                    <div className="flex items-center gap-1.5 text-sky-400">
                      {m.startingSides.alpha === 'ATTACK' ? <Swords className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                      <span>Alpha: {m.startingSides.alpha}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-400">
                      {m.startingSides.omega === 'ATTACK' ? <Swords className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                      <span>Omega: {m.startingSides.omega}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Banned Agents & Banned Maps Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Banned Agents */}
        <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <Ban className="w-3.5 h-3.5" />
            <span>Banned Agents ({state.agentBans.length})</span>
          </h4>
          {state.agentBans.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {state.agentBans.map((ban) => {
                const agentObj = FALLBACK_VALORANT_AGENTS.find((a) => a.id === ban.agentId);
                return (
                  <div
                    key={ban.agentId}
                    className="p-2.5 rounded-2xl bg-neutral-950 border border-rose-950/60 flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0">
                      {agentObj && (
                        <img
                          src={resolveAssetUrl(agentObj.image)}
                          alt={ban.agentName}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-[11px] font-black uppercase text-white truncate">
                        {ban.agentName}
                      </div>
                      <div className="text-[9px] font-mono text-rose-400 uppercase">
                        by {ban.bannedBy}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 italic">No agent bans configured for this match.</p>
          )}
        </div>

        {/* Banned Maps */}
        <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Ban className="w-3.5 h-3.5" />
            <span>Banned Maps ({state.bannedMapHistory.length})</span>
          </h4>
          {state.bannedMapHistory.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {state.bannedMapHistory.map((b) => (
                <span
                  key={b.mapId}
                  className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 font-bold uppercase"
                >
                  <span className="line-through text-neutral-500 mr-1.5">{b.mapId}</span>
                  <span className="text-[9px] text-rose-400">({b.team})</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 italic">No maps were banned (Random mode).</p>
          )}
        </div>
      </div>
    </div>
  );
};
