import React, { useState } from 'react';
import {
  DecidedMap,
  TournamentState,
  TournamentTeam,
  VALORANT_MAP_POOL,
  ValorantMap,
  VetoActionType,
  VetoSide
} from '../../utils/tournamentTypes';
import { generateVetoSteps } from '../../utils/tournamentLogic';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { Ban, CheckCircle2, Shield, Swords, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MapVetoBoardProps {
  state: TournamentState;
  myTeam: TournamentTeam;
  isCaptain: boolean;
  isHost?: boolean;
  onAction: (action: { team: TournamentTeam; type: VetoActionType; targetMapId?: string; side?: VetoSide }) => void;
}

export const MapVetoBoard: React.FC<MapVetoBoardProps> = ({
  state,
  myTeam,
  isCaptain,
  isHost = false,
  onAction
}) => {
  const steps = generateVetoSteps(state.settings, state.settings.enabledMapIds, state.firstPickTeam || 'ALPHA');
  const currentStep = steps[state.currentVetoStepIndex];
  const isTeamTurn = Boolean(currentStep && currentStep.team === myTeam);
  // User can act if it is their team's turn, or if they are room Host (allows testing or admin bypass)
  const isMyTurn = Boolean(currentStep && (isTeamTurn || isHost));

  // Selected map state for side choice
  const [sideChoiceModal, setSideChoiceModal] = useState<boolean>(false);

  const activeMaps = VALORANT_MAP_POOL.filter((m) => state.settings.enabledMapIds.includes(m.id));

  const handleMapClick = (mapId: string) => {
    if (!isMyTurn || !currentStep) return;

    if (currentStep.type === 'BAN') {
      soundManager.playBanSlam();
      onAction({ team: currentStep.team, type: 'BAN', targetMapId: mapId });
    } else if (currentStep.type === 'PICK') {
      soundManager.playLockIn();
      onAction({ team: currentStep.team, type: 'PICK', targetMapId: mapId });
    }
  };

  const handleSideChoice = (side: VetoSide) => {
    if (!isMyTurn || currentStep?.type !== 'SIDE') return;
    soundManager.playLockIn();
    onAction({ team: currentStep.team, type: 'SIDE', side });
    setSideChoiceModal(false);
  };

  const getMapStatus = (mapId: string) => {
    const isBanned = state.bannedMapIds.includes(mapId);
    const banRecord = state.bannedMapHistory.find((b) => b.mapId === mapId);
    const decidedRecord = state.decidedMaps.find((d) => d.mapId === mapId);

    return { isBanned, banRecord, decidedRecord };
  };

  const currentDecidedMapForSide =
    currentStep?.type === 'SIDE' && state.decidedMaps.length > 0
      ? state.decidedMaps[state.decidedMaps.length - 1]
      : null;

  return (
    <div className="space-y-6">
      {/* Turn Banner */}
      <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border shadow-lg ${
              currentStep?.team === 'ALPHA'
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}
          >
            {currentStep ? (currentStep.type === 'BAN' ? '🚫' : currentStep.type === 'PICK' ? '⭐' : '⚔️') : '✔'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                Format: <strong className="text-white">{state.settings.format}</strong> (
                {state.settings.mode === 'VETO' ? 'Turn-based Veto' : 'Random Roll'})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                Bước {Math.min(state.currentVetoStepIndex + 1, steps.length)}/{steps.length}
              </span>
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight text-white mt-0.5">
              {currentStep ? currentStep.description : 'Map Veto Complete!'}
            </h2>
          </div>
        </div>

        {/* Turn Prompt */}
        <div>
          {isMyTurn ? (
            <div className="px-5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-black uppercase text-xs tracking-wider flex items-center gap-2 animate-pulse shadow-lg shadow-amber-950/40">
              <Sparkles className="w-4 h-4" />
              <span>
                {isTeamTurn
                  ? `LƯỢT CỦA BẠN (Team ${myTeam})`
                  : `HOST ADMIN (Cấm hộ Team ${currentStep?.team})`}
              </span>
            </div>
          ) : currentStep ? (
            <div className="px-5 py-2.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-neutral-400 font-bold uppercase text-xs tracking-wider">
              Đang chờ Team {currentStep.team} cấm / chọn...
            </div>
          ) : (
            <div className="px-5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase text-xs tracking-wider">
              Hoàn tất giai đoạn Veto
            </div>
          )}
        </div>
      </div>

      {/* Side Selection Modal for Decider / Picked Map */}
      <AnimatePresence>
        {currentStep?.type === 'SIDE' && isMyTurn && currentDecidedMapForSide && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border-2 border-amber-500/50 shadow-2xl space-y-4"
          >
            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                Captain Decision Required
              </span>
              <h3 className="text-xl font-black uppercase text-white tracking-tight">
                Choose Starting Side for {currentDecidedMapForSide.mapName}
              </h3>
              <p className="text-xs text-neutral-400">
                Team {myTeam}, select which side your team will start on in the first half of this map:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto pt-2">
              <button
                onClick={() => handleSideChoice('ATTACK')}
                className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 hover:bg-rose-950/60 hover:border-rose-500 text-rose-300 font-black uppercase tracking-wider text-xs transition-all flex flex-col items-center gap-2 group"
              >
                <Swords className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span>Start on ATTACK (Tấn Công)</span>
              </button>
              <button
                onClick={() => handleSideChoice('DEFENSE')}
                className="p-4 rounded-2xl bg-sky-950/30 border border-sky-500/40 hover:bg-sky-950/60 hover:border-sky-500 text-sky-300 font-black uppercase tracking-wider text-xs transition-all flex flex-col items-center gap-2 group"
              >
                <Shield className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span>Start on DEFENSE (Phòng Thủ)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Pool Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activeMaps.map((map) => {
          const { isBanned, banRecord, decidedRecord } = getMapStatus(map.id);
          const isDecider = decidedRecord?.pickedBy === 'DECIDER';
          const isAvailable = !isBanned && !decidedRecord;
          const canInteract = isMyTurn && isAvailable && currentStep?.type !== 'SIDE';

          return (
            <motion.div
              key={map.id}
              whileHover={canInteract ? { scale: 1.02 } : {}}
              className={`relative rounded-3xl overflow-hidden border transition-all min-h-[220px] flex flex-col justify-between p-5 ${
                isBanned
                  ? 'bg-neutral-950 border-neutral-900 opacity-50 grayscale'
                  : decidedRecord
                  ? 'bg-neutral-900 border-amber-500/60 shadow-xl shadow-amber-950/30 ring-1 ring-amber-500/40'
                  : canInteract
                  ? 'bg-neutral-900/90 border-neutral-700 hover:border-amber-400 cursor-pointer shadow-lg shadow-black/60'
                  : 'bg-neutral-900/60 border-neutral-800'
              }`}
              onClick={() => canInteract && handleMapClick(map.id)}
            >
              {/* Animated BANNED Stamp Overlay */}
              {isBanned && (
                <motion.div
                  initial={{ scale: 2.5, rotate: -25, opacity: 0 }}
                  animate={{ scale: 1, rotate: -12, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 220 }}
                  className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                >
                  <div className="px-5 py-2 border-4 border-rose-600 text-rose-500 font-black text-2xl uppercase tracking-widest rounded-2xl bg-black/85 rotate-[-12deg] shadow-[0_0_30px_rgba(244,63,94,0.8)] backdrop-blur-sm">
                    BANNED
                  </div>
                </motion.div>
              )}
              {/* Background Map Artwork */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <img
                  src={resolveAssetUrl(map.splash)}
                  alt={map.name}
                  className="w-full h-full object-cover opacity-30 transform hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
              </div>

              {/* Top Header on Card */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  {map.siteCount} Sites
                </span>

                {isBanned && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 text-rose-400 font-mono text-[9px] font-black uppercase flex items-center gap-1">
                    <Ban className="w-3 h-3" />
                    <span>Banned ({banRecord?.team})</span>
                  </span>
                )}

                {decidedRecord && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-black uppercase flex items-center gap-1 shadow-md ${
                      isDecider
                        ? 'bg-purple-500 text-white'
                        : 'bg-amber-500 text-black'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isDecider ? 'DECIDER MAP' : `MAP #${decidedRecord.orderIndex}`}</span>
                  </span>
                )}
              </div>

              {/* Center Map Name */}
              <div className="relative z-10 my-3">
                <h3 className="text-2xl font-black uppercase text-white tracking-tight drop-shadow-md">
                  {map.name}
                </h3>
                <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2 mt-0.5">
                  {map.description}
                </p>

                {decidedRecord?.startingSides && (
                  <div className="mt-2.5 flex items-center gap-2 text-[10px] font-mono font-bold">
                    <span className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800 text-sky-300">
                      Alpha: {decidedRecord.startingSides.alpha}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300">
                      Omega: {decidedRecord.startingSides.omega}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button at Bottom */}
              <div className="relative z-10 pt-2 border-t border-neutral-800/60">
                {canInteract ? (
                  <div
                    className={`w-full py-2 rounded-xl text-center font-black uppercase tracking-wider text-xs transition-all ${
                      currentStep.type === 'BAN'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
                        : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-950/50'
                    }`}
                  >
                    {currentStep.type === 'BAN' ? 'Ban Map' : 'Pick Map'}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span>STATUS</span>
                    <span className="font-bold text-neutral-400 uppercase">
                      {isBanned ? 'Eliminated' : decidedRecord ? 'Scheduled' : 'In Pool'}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
