import React, { useState } from 'react';
import { AgentBan, TournamentState, TournamentTeam } from '../../utils/tournamentTypes';
import { FALLBACK_VALORANT_AGENTS } from '../../contexts/CatalogContext';
import { ValorantAgent } from '../../utils/catalogTypes';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { Ban, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentBanBoardProps {
  state: TournamentState;
  myTeam: TournamentTeam;
  isCaptain: boolean;
  onBanAgent: (agentId: string, agentName: string) => void;
}

export const AgentBanBoard: React.FC<AgentBanBoardProps> = ({
  state,
  myTeam,
  isCaptain,
  onBanAgent
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [pendingAgent, setPendingAgent] = useState<ValorantAgent | null>(null);

  const currentTurnTeam = state.currentAgentBanTeam;
  const isMyTurn = isCaptain && currentTurnTeam === myTeam;

  const totalBansTarget = state.settings.bansPerTeam * 2;
  const alphaBans = state.agentBans.filter((b) => b.bannedBy === 'ALPHA');
  const omegaBans = state.agentBans.filter((b) => b.bannedBy === 'OMEGA');

  const filteredAgents = FALLBACK_VALORANT_AGENTS.filter((agent) => {
    if (selectedRole === 'ALL') return true;
    return agent.role.toUpperCase() === selectedRole;
  });

  const handleAgentClick = (agent: ValorantAgent) => {
    if (!isMyTurn) return;
    if (state.agentBans.some((b) => b.agentId === agent.id)) return;
    setPendingAgent(agent);
  };

  const handleConfirmBan = () => {
    if (!pendingAgent || !isMyTurn) return;
    onBanAgent(pendingAgent.id, pendingAgent.name);
    setPendingAgent(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Turn Banner */}
      <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border shadow-lg ${
              currentTurnTeam === 'ALPHA'
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}
          >
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                Agent Ban Phase ({state.settings.bansPerTeam} per team)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                {state.agentBans.length}/{totalBansTarget} Bans Locked
              </span>
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight text-white mt-0.5">
              {currentTurnTeam
                ? `Team ${currentTurnTeam} Captain: Ban an Agent`
                : 'Agent Bans Completed!'}
            </h2>
          </div>
        </div>

        {/* Turn Status */}
        <div>
          {isMyTurn ? (
            <div className="px-5 py-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black uppercase text-xs tracking-wider flex items-center gap-2 animate-pulse shadow-lg shadow-rose-950/40">
              <Sparkles className="w-4 h-4" />
              <span>YOUR TURN TO BAN (Team {myTeam})</span>
            </div>
          ) : currentTurnTeam ? (
            <div className="px-5 py-2.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-neutral-400 font-bold uppercase text-xs tracking-wider">
              Waiting for Team {currentTurnTeam} Captain...
            </div>
          ) : (
            <div className="px-5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase text-xs tracking-wider">
              Ready for Match
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {pendingAgent && isMyTurn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 rounded-3xl bg-neutral-900 border-2 border-rose-500/60 shadow-2xl space-y-4 max-w-md mx-auto"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-20 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex-shrink-0">
                <img
                  src={resolveAssetUrl(pendingAgent.image)}
                  alt={pendingAgent.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">
                  Confirm Agent Ban
                </span>
                <h3 className="text-xl font-black uppercase text-white tracking-tight">
                  Ban {pendingAgent.name}?
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Once confirmed, neither team will be allowed to pick {pendingAgent.name} in this match.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setPendingAgent(null)}
                className="flex-1 py-3 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBan}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-950/50 transition-all flex items-center justify-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                <span>Confirm Ban</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-neutral-500 ml-1" />
        {['ALL', 'DUELIST', 'INITIATOR', 'CONTROLLER', 'SENTINEL'].map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              selectedRole === role
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {filteredAgents.map((agent) => {
          const banRecord = state.agentBans.find((b) => b.agentId === agent.id);
          const isBanned = Boolean(banRecord);
          const canBan = isMyTurn && !isBanned;

          return (
            <motion.div
              key={agent.id}
              whileHover={canBan ? { scale: 1.03 } : {}}
              onClick={() => canBan && handleAgentClick(agent)}
              className={`relative rounded-2xl p-3 border flex flex-col items-center justify-between text-center overflow-hidden transition-all ${
                isBanned
                  ? 'bg-neutral-950 border-neutral-900 opacity-40 grayscale pointer-events-none'
                  : canBan
                  ? 'bg-neutral-900/80 border-neutral-800 hover:border-rose-500/80 cursor-pointer shadow-lg hover:shadow-rose-950/30'
                  : 'bg-neutral-900/50 border-neutral-800'
              }`}
            >
              {/* Artwork */}
              <div className="w-24 h-28 my-1 flex items-center justify-center relative">
                <img
                  src={resolveAssetUrl(agent.image)}
                  alt={agent.name}
                  className="max-h-full max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {isBanned && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Ban className="w-12 h-12 text-rose-500 opacity-80" />
                  </div>
                )}
              </div>

              {/* Name & Role */}
              <div className="w-full mt-1">
                <h4 className="text-xs font-black uppercase tracking-tight text-white truncate">
                  {agent.name}
                </h4>
                <span className="text-[9px] font-mono text-neutral-400 uppercase">
                  {agent.role}
                </span>
              </div>

              {/* Status footer */}
              <div className="w-full pt-1.5 mt-1 border-t border-neutral-800/80">
                {isBanned ? (
                  <span className="text-[9px] font-mono font-bold text-rose-400 uppercase">
                    Banned ({banRecord?.bannedBy})
                  </span>
                ) : canBan ? (
                  <span className="text-[9px] font-bold text-rose-400 uppercase group-hover:text-rose-300">
                    Click to Ban
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-neutral-600 uppercase">
                    Available
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
