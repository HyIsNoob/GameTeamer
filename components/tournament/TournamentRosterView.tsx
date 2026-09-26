import React from 'react';
import { TournamentPlayer, TournamentTeam } from '../../utils/tournamentTypes';
import { Crown, Shield, User, ArrowRightLeft, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface TournamentRosterViewProps {
  players: TournamentPlayer[];
  myId: string;
  isHost: boolean;
  phase: string;
  onSwitchTeam: (targetTeam: TournamentTeam) => void;
  onSetCaptain?: (playerId: string, team: TournamentTeam) => void;
}

export const TournamentRosterView: React.FC<TournamentRosterViewProps> = ({
  players,
  myId,
  isHost,
  phase,
  onSwitchTeam,
  onSetCaptain
}) => {
  const alphaPlayers = players.filter((p) => p.team === 'ALPHA').sort((a, b) => a.slotIndex - b.slotIndex);
  const omegaPlayers = players.filter((p) => p.team === 'OMEGA').sort((a, b) => a.slotIndex - b.slotIndex);

  const myPlayer = players.find((p) => p.id === myId);
  const myTeam = myPlayer?.team || 'ALPHA';

  const renderTeamColumn = (team: TournamentTeam, teamPlayers: TournamentPlayer[]) => {
    const isAlpha = team === 'ALPHA';
    const accentColor = isAlpha ? 'sky' : 'rose';
    const teamTitle = isAlpha ? 'TEAM ALPHA' : 'TEAM OMEGA';
    const sideBadge = isAlpha ? 'DEF / ATK' : 'ATK / DEF';

    return (
      <div
        className={`flex-1 rounded-3xl p-6 border backdrop-blur-xl flex flex-col justify-between ${
          isAlpha
            ? 'bg-neutral-900/70 border-sky-500/20 shadow-xl shadow-sky-950/20'
            : 'bg-neutral-900/70 border-rose-500/20 shadow-xl shadow-rose-950/20'
        }`}
      >
        <div>
          {/* Team Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border ${
                  isAlpha
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                {isAlpha ? 'A' : 'Ω'}
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <span>{teamTitle}</span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isAlpha ? 'bg-sky-500/20 text-sky-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {teamPlayers.length}/5
                  </span>
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono">Role: {sideBadge}</p>
              </div>
            </div>

            {/* Switch to this team button */}
            {phase === 'LOBBY' && myTeam !== team && teamPlayers.length < 5 && (
              <button
                onClick={() => onSwitchTeam(team)}
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  isAlpha
                    ? 'border-sky-500/40 text-sky-400 hover:bg-sky-500/10'
                    : 'border-rose-500/40 text-rose-400 hover:bg-rose-500/10'
                }`}
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>Join {isAlpha ? 'Alpha' : 'Omega'}</span>
              </button>
            )}
          </div>

          {/* 5 Slots */}
          <div className="mt-4 space-y-2.5">
            {[0, 1, 2, 3, 4].map((slotIndex) => {
              const player = teamPlayers[slotIndex];
              const isCaptain = player?.isCaptain || slotIndex === 0;
              const isCurrentMe = player?.id === myId;

              if (player) {
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: isAlpha ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      isCurrentMe
                        ? isAlpha
                          ? 'bg-sky-950/40 border-sky-500/60 shadow-md shadow-sky-950/40'
                          : 'bg-rose-950/40 border-rose-500/60 shadow-md shadow-rose-950/40'
                        : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-mono font-bold flex items-center justify-center">
                        {slotIndex + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase text-white tracking-wide truncate max-w-[140px]">
                            {player.name}
                          </span>
                          {isCurrentMe && (
                            <span
                              className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                                isAlpha ? 'bg-sky-500 text-black' : 'bg-rose-500 text-white'
                              }`}
                            >
                              YOU
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCaptain ? (
                        <div
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                            isAlpha
                              ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                              : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>CAPTAIN</span>
                        </div>
                      ) : (
                        isHost &&
                        phase === 'LOBBY' && (
                          <button
                            onClick={() => onSetCaptain?.(player.id, team)}
                            className="text-[9px] text-neutral-500 hover:text-white px-2 py-0.5 rounded border border-neutral-800 hover:border-neutral-600 transition-colors"
                          >
                            Set Captain
                          </button>
                        )
                      )}
                    </div>
                  </motion.div>
                );
              }

              // Empty Slot
              return (
                <div
                  key={slotIndex}
                  className="p-3 rounded-2xl border border-dashed border-neutral-800/60 bg-neutral-950/20 flex items-center justify-between text-neutral-600"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-neutral-900/50 border border-neutral-800/50 text-neutral-700 text-xs font-mono font-bold flex items-center justify-center">
                      {slotIndex + 1}
                    </span>
                    <span className="text-xs font-mono uppercase tracking-wider text-neutral-600">
                      Empty Slot
                    </span>
                  </div>
                  <User className="w-3.5 h-3.5 opacity-30" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {renderTeamColumn('ALPHA', alphaPlayers)}
      {renderTeamColumn('OMEGA', omegaPlayers)}
    </div>
  );
};
