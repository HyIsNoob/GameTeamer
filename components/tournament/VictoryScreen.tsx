import React, { useEffect } from 'react';
import { TournamentPlayer, TournamentState, TournamentTeam } from '../../utils/tournamentTypes';
import { soundManager } from '../../utils/soundManager';
import { Trophy, Crown, Sparkles, Swords, Shield, RotateCcw, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface VictoryScreenProps {
  state: TournamentState;
  players: TournamentPlayer[];
  isHost: boolean;
  onRematch: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  state,
  players,
  isHost,
  onRematch
}) => {
  const winner = state.matchWinner || 'ALPHA';
  const isAlpha = winner === 'ALPHA';

  const winningPlayers = players.filter((p) => p.team === winner);
  const losingPlayers = players.filter((p) => p.team !== winner);

  const alphaWins = state.mapScores.filter((s) => s.winner === 'ALPHA').length;
  const omegaWins = state.mapScores.filter((s) => s.winner === 'OMEGA').length;

  useEffect(() => {
    soundManager.playVictory();
  }, []);

  return (
    <div className="relative rounded-3xl overflow-hidden p-8 md:p-12 border-2 shadow-2xl bg-neutral-950 text-center space-y-8">
      {/* Background radial aura */}
      <div
        className={`absolute inset-0 opacity-25 pointer-events-none ${
          isAlpha
            ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-500 via-neutral-950 to-neutral-950'
            : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500 via-neutral-950 to-neutral-950'
        }`}
      />

      {/* Floating golden particles / confetti effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * 800 - 400,
              y: -50,
              opacity: 1,
              scale: Math.random() * 0.8 + 0.5
            }}
            animate={{
              y: 700,
              rotate: Math.random() * 360,
              opacity: 0
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeOut'
            }}
            className={`absolute top-0 left-1/2 w-3 h-3 rounded-full ${
              i % 3 === 0 ? 'bg-amber-400' : i % 3 === 1 ? (isAlpha ? 'bg-sky-400' : 'bg-rose-400') : 'bg-white'
            } shadow-[0_0_15px_rgba(255,255,255,0.8)]`}
          />
        ))}
      </div>

      {/* Grand Trophy & Crown */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 140 }}
          className="relative"
        >
          <div
            className={`w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl border-2 ${
              isAlpha
                ? 'bg-gradient-to-tr from-sky-600 via-sky-400 to-blue-700 border-sky-300 shadow-sky-500/50'
                : 'bg-gradient-to-tr from-rose-600 via-red-500 to-orange-600 border-rose-300 shadow-rose-500/50'
            }`}
          >
            <Trophy className="w-16 h-16 text-white drop-shadow-xl" />
          </div>
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute -top-4 -right-4 w-10 h-10 rounded-xl bg-amber-400 border border-yellow-200 text-black flex items-center justify-center shadow-lg"
          >
            <Crown className="w-6 h-6 fill-current" />
          </motion.div>
        </motion.div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tournament Champions</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h1
            className={`text-4xl md:text-6xl font-black uppercase tracking-tight drop-shadow-2xl ${
              isAlpha
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-300 to-white'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-300 to-white'
            }`}
          >
            TEAM {winner} VICTORY!
          </h1>
          <p className="text-xs md:text-sm font-mono text-neutral-400">
            Series Finished: <strong className="text-sky-400">Team Alpha {alphaWins}</strong> -{' '}
            <strong className="text-rose-400">{omegaWins} Team Omega</strong> ({state.settings.format})
          </p>
        </div>
      </div>

      {/* Champions 5-Player Roster */}
      <div className="relative z-10 max-w-2xl mx-auto space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
          Championship Roster
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {winningPlayers.map((player) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center ${
                isAlpha
                  ? 'bg-sky-950/40 border-sky-500/40 shadow-lg shadow-sky-950/30'
                  : 'bg-rose-950/40 border-rose-500/40 shadow-lg shadow-rose-950/30'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center mb-1 text-amber-400">
                {player.isCaptain ? <Crown className="w-4 h-4" /> : <Shield className="w-3.5 h-3.5 text-neutral-400" />}
              </div>
              <span className="text-xs font-black uppercase text-white truncate max-w-[90px]">
                {player.name}
              </span>
              <span className="text-[9px] font-mono text-neutral-400 uppercase">
                {player.isCaptain ? 'Captain' : 'Champion'}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Match breakdown breakdown */}
      <div className="relative z-10 max-w-xl mx-auto p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs font-mono space-y-2">
        <div className="text-neutral-400 uppercase font-bold text-[10px] tracking-wider">
          Map Score Summary
        </div>
        <div className="space-y-1.5">
          {state.mapScores.map((score) => {
            const mapObj = state.decidedMaps.find((m) => m.mapId === score.mapId);
            return (
              <div key={score.mapId} className="flex items-center justify-between text-neutral-300">
                <span>Map #{score.orderIndex} ({mapObj?.mapName || score.mapId.toUpperCase()}):</span>
                <span className="font-bold">
                  <span className={score.winner === 'ALPHA' ? 'text-sky-400' : 'text-neutral-500'}>
                    Alpha {score.alphaScore}
                  </span>{' '}
                  -{' '}
                  <span className={score.winner === 'OMEGA' ? 'text-rose-400' : 'text-neutral-500'}>
                    {score.omegaScore} Omega
                  </span>{' '}
                  ({score.winner} WIN)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Controls */}
      <div className="relative z-10 flex items-center justify-center gap-4 pt-4">
        {isHost && (
          <button
            onClick={onRematch}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-400 hover:to-rose-500 text-black font-black uppercase text-xs tracking-wider shadow-xl shadow-amber-950/40 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-black" />
            <span>Start Rematch / New Tournament</span>
          </button>
        )}
      </div>
    </div>
  );
};
